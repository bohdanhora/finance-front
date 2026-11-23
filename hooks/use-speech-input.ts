"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlternative = { transcript: string };
type SpeechResult = { isFinal: boolean; length: number; [index: number]: SpeechAlternative };
type SpeechResultEvent = { resultIndex: number; results: { length: number; [index: number]: SpeechResult } };
type SpeechErrorEvent = { error: string };

type Recognition = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: SpeechResultEvent) => void) | null;
    onerror: ((event: SpeechErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
};

type RecognitionConstructor = new () => Recognition;

const SPEECH_LOCALES: Record<string, string> = { en: "en-US", ru: "ru-RU", ua: "uk-UA" };

export type SpeechError = "denied" | "noSpeech" | "failed";

const recognitionClass = (): RecognitionConstructor | null => {
    if (typeof window === "undefined") return null;
    const scope = window as unknown as {
        SpeechRecognition?: RecognitionConstructor;
        webkitSpeechRecognition?: RecognitionConstructor;
    };
    return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
};

const joinText = (base: string, addition: string) => {
    const left = base.trimEnd();
    const right = addition.trim();
    if (!right) return base;
    return left ? `${left} ${right}` : right.charAt(0).toUpperCase() + right.slice(1);
};

export const useSpeechInput = ({ locale, onText }: { locale: string; onText: (text: string) => void }) => {
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const [error, setError] = useState<SpeechError | null>(null);

    const recognitionRef = useRef<Recognition | null>(null);
    const stoppedRef = useRef(false);
    const quickEndsRef = useRef(0);
    const onTextRef = useRef(onText);
    onTextRef.current = onText;

    useEffect(() => {
        setSupported(Boolean(recognitionClass()));
        return () => {
            stoppedRef.current = true;
            recognitionRef.current?.abort();
        };
    }, []);

    const stop = useCallback(() => {
        stoppedRef.current = true;
        recognitionRef.current?.stop();
    }, []);

    const listen = useCallback(
        (base: string, restart: boolean) => {
            const Speech = recognitionClass();
            if (!Speech) return;

            const recognition = new Speech();
            recognition.lang = SPEECH_LOCALES[locale] ?? "en-US";
            recognition.continuous = true;
            recognition.interimResults = true;

            let settled = base;

            recognition.onresult = (event) => {
                let interim = "";
                for (let index = event.resultIndex; index < event.results.length; index += 1) {
                    const result = event.results[index];
                    const transcript = result[0]?.transcript ?? "";
                    if (result.isFinal) settled = joinText(settled, transcript);
                    else interim += transcript;
                }
                onTextRef.current(joinText(settled, interim));
            };

            let fatal = false;
            const startedAt = Date.now();

            recognition.onerror = (event) => {
                if (event.error === "aborted") return;
                if (event.error === "no-speech") {
                    if (!settled.trim()) setError("noSpeech");
                    return;
                }
                fatal = true;
                setError(event.error === "not-allowed" || event.error === "service-not-allowed" ? "denied" : "failed");
            };

            recognition.onend = () => {
                recognitionRef.current = null;
                onTextRef.current(settled);
                quickEndsRef.current = Date.now() - startedAt < 1000 ? quickEndsRef.current + 1 : 0;
                if (!stoppedRef.current && !fatal && quickEndsRef.current < 3) {
                    listenRef.current(settled, true);
                    return;
                }
                setListening(false);
            };

            if (!restart) setError(null);
            try {
                recognition.start();
                recognitionRef.current = recognition;
                setListening(true);
            } catch {
                setListening(false);
                setError("failed");
            }
        },
        [locale],
    );

    const listenRef = useRef(listen);
    listenRef.current = listen;

    const start = useCallback(
        (base: string) => {
            if (recognitionRef.current) return;
            stoppedRef.current = false;
            quickEndsRef.current = 0;
            listen(base, false);
        },
        [listen],
    );

    return { supported, listening, error, start, stop, clearError: () => setError(null) };
};
