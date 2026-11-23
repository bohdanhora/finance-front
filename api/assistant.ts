import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

import {
    ASSISTANT_FALLBACK_BETA,
    type AssistantErrorKind,
    type AssistantProvider,
    supportsEffort,
    supportsFallbacks,
    usableModels,
} from "lib/assistant/providers";
import { AssistantMessage } from "lib/assistant/storage";
import { ASSISTANT_TOOLS, AssistantToolData, runAssistantTool } from "lib/assistant/tools";

const MAX_TOKENS = 16000;
const MAX_ROUNDS = 8;

export class AssistantError extends Error {
    kind: AssistantErrorKind;

    constructor(kind: AssistantErrorKind, message?: string) {
        super(message || kind);
        this.kind = kind;
        this.name = "AssistantError";
    }
}

const classify = (error: unknown): AssistantError => {
    if (error instanceof AssistantError) return error;

    const status = (error as { status?: number })?.status;

    if (status === 401 || status === 403) return new AssistantError("auth");
    if (status === 429) return new AssistantError("rate");
    if (error instanceof Anthropic.APIConnectionError || error instanceof OpenAI.APIConnectionError) {
        return new AssistantError("network");
    }
    if (status && status >= 400) return new AssistantError("unknown", (error as Error).message);

    return new AssistantError("network", error instanceof Error ? error.message : undefined);
};

export type AssistantConnection = {
    provider: AssistantProvider;
    apiKey: string;
    model: string;
    baseURL?: string;
};

const anthropicClient = (connection: AssistantConnection) =>
    new Anthropic({
        apiKey: connection.apiKey,
        ...(connection.baseURL ? { baseURL: connection.baseURL } : {}),
        dangerouslyAllowBrowser: true,
    });

const leanFetch: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);

    [...headers.keys()].forEach((name) => {
        if (name.toLowerCase().startsWith("x-stainless")) headers.delete(name);
    });

    return fetch(input, { ...init, headers });
};

const openaiClient = (connection: AssistantConnection) =>
    new OpenAI({
        apiKey: connection.apiKey,
        ...(connection.baseURL ? { baseURL: connection.baseURL } : {}),
        dangerouslyAllowBrowser: true,
        fetch: leanFetch,
    });

const assertKeyWorks = async (connection: AssistantConnection) => {
    const endpoint = `${(connection.baseURL || "").replace(/\/$/, "")}/key`;
    const answer = await leanFetch(endpoint, { headers: { Authorization: `Bearer ${connection.apiKey}` } });

    if (answer.ok) return;

    throw new AssistantError(answer.status === 429 ? "rate" : "auth");
};

export const listAssistantModels = async (connection: AssistantConnection): Promise<string[]> => {
    try {
        if (connection.provider.kind === "anthropic") {
            const answer = await anthropicClient(connection).models.list({ limit: 50 });
            return usableModels(
                answer.data.map((model) => model.id),
                connection.provider.models,
            );
        }

        if (connection.provider.id === "openrouter") {
            await assertKeyWorks(connection);
        }

        const answer = await openaiClient(connection).models.list();
        return usableModels(
            answer.data.map((model) => model.id),
            connection.provider.models,
        );
    } catch (error) {
        throw classify(error);
    }
};

type StreamOptions = {
    connection: AssistantConnection;
    instructions: string;
    snapshot: string;
    messages: AssistantMessage[];
    signal: AbortSignal;
    tools?: AssistantToolData;
    noToolsInstructions?: string;
    onText: (text: string) => void;
    onWorking?: (working: boolean) => void;
};

type Reply = {
    push: (chunk: string) => void;
    rollback: () => void;
    commit: () => void;
};

const toTurns = (messages: AssistantMessage[]) =>
    messages
        .filter((message) => !message.failed && message.content.trim().length > 0)
        .map((message) => ({ role: message.role, content: message.content }));

const anthropicTools = (): Anthropic.Beta.BetaTool[] =>
    ASSISTANT_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters as Anthropic.Beta.BetaTool.InputSchema,
    }));

const openaiTools = (): OpenAI.Chat.Completions.ChatCompletionTool[] =>
    ASSISTANT_TOOLS.map((tool) => ({
        type: "function" as const,
        function: { name: tool.name, description: tool.description, parameters: tool.parameters },
    }));

const parseArguments = (raw: string): unknown => {
    try {
        return raw ? JSON.parse(raw) : {};
    } catch {
        return null;
    }
};

const streamFromAnthropic = async (options: StreamOptions, reply: Reply) => {
    const { connection, instructions, snapshot, messages, signal, tools } = options;
    const client = anthropicClient(connection);
    const model = connection.model;
    const turns = toTurns(messages) as Anthropic.Beta.BetaMessageParam[];

    const base = {
        model,
        max_tokens: MAX_TOKENS,
        system: [
            { type: "text" as const, text: instructions, cache_control: { type: "ephemeral" as const } },
            { type: "text" as const, text: snapshot, cache_control: { type: "ephemeral" as const } },
        ],
        ...(supportsEffort(model) ? { output_config: { effort: "medium" as const } } : {}),
        ...(tools ? { tools: anthropicTools() } : {}),
    };

    let withFallbacks = supportsFallbacks(model);

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const request = {
            ...base,
            ...(tools && round === MAX_ROUNDS - 1 ? { tool_choice: { type: "none" as const } } : {}),
            messages: turns,
        };

        const run = async (fallbacks: boolean) => {
            const stream = client.beta.messages.stream(
                fallbacks ? { ...request, betas: [ASSISTANT_FALLBACK_BETA], fallbacks: "default" } : request,
                { signal },
            );

            for await (const event of stream) {
                if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                    reply.push(event.delta.text);
                }
            }

            return stream.finalMessage();
        };

        let final: Anthropic.Beta.BetaMessage;
        try {
            final = await run(withFallbacks);
        } catch (error) {
            if (signal.aborted) return;
            if (!(error instanceof Anthropic.BadRequestError) || !withFallbacks) throw error;
            withFallbacks = false;
            reply.rollback();
            final = await run(false);
        }

        if (final.stop_reason === "refusal") throw new AssistantError("refusal");

        const calls = final.content.filter((item): item is Anthropic.Beta.BetaToolUseBlock => item.type === "tool_use");

        if (!tools || final.stop_reason !== "tool_use" || calls.length === 0) {
            reply.commit();
            return;
        }

        reply.rollback();
        options.onWorking?.(true);

        turns.push({ role: "assistant", content: final.content as Anthropic.Beta.BetaContentBlockParam[] });
        turns.push({
            role: "user",
            content: calls.map((call) => ({
                type: "tool_result" as const,
                tool_use_id: call.id,
                content: runAssistantTool(call.name, call.input, tools),
            })),
        });
    }
};

const streamFromOpenAI = async (options: StreamOptions, reply: Reply) => {
    const { connection, instructions, snapshot, messages, signal } = options;
    const client = openaiClient(connection);
    const turns: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: `${instructions}\n\n${snapshot}` },
        ...toTurns(messages),
    ];

    let tools = options.tools;

    for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const last = round === MAX_ROUNDS - 1;
        const calls = new Map<number, { id: string; name: string; arguments: string }>();

        const run = async () => {
            const stream = await client.chat.completions.create(
                {
                    model: connection.model,
                    stream: true,
                    messages: turns,
                    ...(tools ? { tools: openaiTools(), ...(last ? { tool_choice: "none" as const } : {}) } : {}),
                },
                { signal },
            );

            for await (const chunk of stream) {
                const delta = chunk.choices?.[0]?.delta;
                if (!delta) continue;
                if (delta.content) reply.push(delta.content);
                delta.tool_calls?.forEach((part) => {
                    const call = calls.get(part.index) ?? { id: "", name: "", arguments: "" };
                    if (part.id) call.id = part.id;
                    if (part.function?.name) call.name += part.function.name;
                    if (part.function?.arguments) call.arguments += part.function.arguments;
                    calls.set(part.index, call);
                });
            }
        };

        try {
            await run();
        } catch (error) {
            if (signal.aborted) return;
            const status = (error as { status?: number })?.status;
            if (!tools || round > 0 || (status !== 400 && status !== 404 && status !== 422)) throw error;
            tools = undefined;
            turns[0] = {
                role: "system",
                content: `${options.noToolsInstructions ?? instructions}\n\n${snapshot}`,
            };
            reply.rollback();
            calls.clear();
            await run();
        }

        const pending = [...calls.values()].filter((call) => call.name);

        if (!tools || pending.length === 0) {
            reply.commit();
            return;
        }

        const data = tools;
        reply.rollback();
        options.onWorking?.(true);

        const executed = pending.map((call, index) => ({ ...call, id: call.id || `call_${round}_${index}` }));
        turns.push({
            role: "assistant",
            content: null,
            tool_calls: executed.map((call) => ({
                id: call.id,
                type: "function" as const,
                function: { name: call.name, arguments: call.arguments || "{}" },
            })),
        });
        executed.forEach((call) => {
            const input = parseArguments(call.arguments);
            turns.push({
                role: "tool",
                tool_call_id: call.id,
                content:
                    input === null
                        ? JSON.stringify({ error: "Arguments were not valid JSON." })
                        : runAssistantTool(call.name, input, data),
            });
        });
    }
};

export const streamAssistantReply = async (options: StreamOptions): Promise<string> => {
    let committed = "";
    let current = "";

    const show = () => options.onText(committed + current);

    const reply: Reply = {
        push: (chunk) => {
            if (current === "") options.onWorking?.(false);
            current += chunk;
            show();
        },
        rollback: () => {
            current = "";
            show();
        },
        commit: () => {
            committed += current;
            current = "";
        },
    };

    try {
        if (options.connection.provider.kind === "anthropic") {
            await streamFromAnthropic(options, reply);
        } else {
            await streamFromOpenAI(options, reply);
        }

        reply.commit();
        return committed;
    } catch (error) {
        if (options.signal.aborted) return committed + current;
        throw classify(error);
    } finally {
        options.onWorking?.(false);
    }
};
