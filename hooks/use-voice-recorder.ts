"use client";

import { useCallback, useEffect, useRef } from "react";

type Session = { recorder: MediaRecorder; stream: MediaStream; chunks: Blob[] };

const release = (session: Session | null) => session?.stream.getTracks().forEach((track) => track.stop());

export const useVoiceRecorder = () => {
    const sessionRef = useRef<Session | null>(null);

    useEffect(
        () => () => {
            const session = sessionRef.current;
            sessionRef.current = null;
            if (session?.recorder.state === "recording") session.recorder.stop();
            release(session);
        },
        [],
    );

    const start = useCallback(async () => {
        if (sessionRef.current || typeof MediaRecorder === "undefined" || !navigator.mediaDevices) return false;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
            });
            const recorder = new MediaRecorder(stream);
            const session: Session = { recorder, stream, chunks: [] };
            recorder.ondataavailable = (event) => {
                if (event.data.size) session.chunks.push(event.data);
            };
            recorder.start();
            sessionRef.current = session;
            return true;
        } catch {
            return false;
        }
    }, []);

    const stop = useCallback(
        () =>
            new Promise<Blob | null>((resolve) => {
                const session = sessionRef.current;
                sessionRef.current = null;
                if (!session || session.recorder.state !== "recording") {
                    release(session);
                    resolve(null);
                    return;
                }

                session.recorder.onstop = () => {
                    release(session);
                    const type = session.recorder.mimeType || session.chunks[0]?.type || "audio/webm";
                    resolve(session.chunks.length ? new Blob(session.chunks, { type }) : null);
                };
                session.recorder.stop();
            }),
        [],
    );

    const cancel = useCallback(() => {
        const session = sessionRef.current;
        sessionRef.current = null;
        if (session?.recorder.state === "recording") {
            session.recorder.onstop = null;
            session.recorder.stop();
        }
        release(session);
    }, []);

    const active = useCallback(() => Boolean(sessionRef.current), []);

    return { start, stop, cancel, active };
};
