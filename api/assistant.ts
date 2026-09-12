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

const MAX_TOKENS = 8000;

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
    onText: (chunk: string) => void;
};

const toTurns = (messages: AssistantMessage[]) =>
    messages
        .filter((message) => !message.failed && message.content.trim().length > 0)
        .map((message) => ({ role: message.role, content: message.content }));

const streamFromAnthropic = async (options: StreamOptions, push: (chunk: string) => void) => {
    const { connection, instructions, snapshot, messages, signal } = options;
    const client = anthropicClient(connection);
    const model = connection.model;

    const request = {
        model,
        max_tokens: MAX_TOKENS,
        system: [
            { type: "text" as const, text: instructions, cache_control: { type: "ephemeral" as const } },
            { type: "text" as const, text: snapshot, cache_control: { type: "ephemeral" as const } },
        ],
        ...(supportsEffort(model) ? { output_config: { effort: "medium" as const } } : {}),
        messages: toTurns(messages) as Anthropic.MessageParam[],
    };

    const run = async (withFallbacks: boolean) => {
        const stream = withFallbacks
            ? client.beta.messages.stream(
                  { ...request, betas: [ASSISTANT_FALLBACK_BETA], fallbacks: "default" },
                  { signal },
              )
            : client.messages.stream(request, { signal });

        for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                push(event.delta.text);
            }
        }

        const final = await stream.finalMessage();

        if (final.stop_reason === "refusal") {
            throw new AssistantError("refusal");
        }
    };

    try {
        await run(supportsFallbacks(model));
    } catch (error) {
        if (signal.aborted) return;

        if (error instanceof Anthropic.BadRequestError) {
            await run(false);
            return;
        }

        throw error;
    }
};

const streamFromOpenAI = async (options: StreamOptions, push: (chunk: string) => void) => {
    const { connection, instructions, snapshot, messages, signal } = options;

    const stream = await openaiClient(connection).chat.completions.create(
        {
            model: connection.model,
            stream: true,
            messages: [{ role: "system" as const, content: `${instructions}\n\n${snapshot}` }, ...toTurns(messages)],
        },
        { signal },
    );

    for await (const chunk of stream) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) push(text);
    }
};

export const streamAssistantReply = async (options: StreamOptions): Promise<string> => {
    let answer = "";

    const push = (chunk: string) => {
        answer += chunk;
        options.onText(chunk);
    };

    try {
        if (options.connection.provider.kind === "anthropic") {
            await streamFromAnthropic(options, push);
        } else {
            await streamFromOpenAI(options, push);
        }

        return answer;
    } catch (error) {
        if (options.signal.aborted) return answer;
        throw classify(error);
    }
};
