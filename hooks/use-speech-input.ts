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
    const onTextRef = useRef(onText);
    onTextRef.current = onText;

    useEffect(() => {
        setSupported(Boolean(recognitionClass()));
        return () => recognitionRef.current?.abort();
    }, []);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const start = useCallback(
        (base: string) => {
            const Speech = recognitionClass();
            if (!Speech || recognitionRef.current) return;

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

            recognition.onerror = (event) => {
                if (event.error === "aborted") return;
                if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("denied");
                else if (event.error === "no-speech") setError("noSpeech");
                else setError("failed");
            };

            recognition.onend = () => {
                recognitionRef.current = null;
                setListening(false);
                onTextRef.current(settled);
            };

            setError(null);
            try {
                recognition.start();
                recognitionRef.current = recognition;
                setListening(true);
            } catch {
                setError("failed");
            }
        },
        [locale],
    );

    return { supported, listening, error, start, stop, clearError: () => setError(null) };
};
