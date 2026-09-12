"use client";

import { useEffect, useState } from "react";

import { MONOBANK_TOKEN_EVENT, readMonobankToken } from "lib/monobank";

export const useMonobankToken = () => {
    const [token, setToken] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const sync = () => setToken(readMonobankToken());

        sync();
        setReady(true);

        window.addEventListener(MONOBANK_TOKEN_EVENT, sync);
        window.addEventListener("storage", sync);

        return () => {
            window.removeEventListener(MONOBANK_TOKEN_EVENT, sync);
            window.removeEventListener("storage", sync);
        };
    }, []);

    return { token, ready, connected: Boolean(token) };
};
