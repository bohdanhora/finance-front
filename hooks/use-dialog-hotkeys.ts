"use client";

import { useEffect } from "react";

const HOTKEYS: Record<string, string> = {
    Minus: "expense",
    NumpadSubtract: "expense",
    Equal: "income",
    NumpadAdd: "income",
    KeyT: "transfer",
};

const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export const useDialogHotkeys = () => {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
            if (isTyping(event.target) || document.querySelector("[role=dialog]")) return;
            const action = HOTKEYS[event.code];
            if (!action) return;
            const trigger = document.querySelector<HTMLButtonElement>(`[data-hotkey="${action}"]`);
            if (!trigger) return;
            event.preventDefault();
            trigger.click();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);
};
