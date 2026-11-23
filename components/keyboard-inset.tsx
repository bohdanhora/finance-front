"use client";

import { useEffect } from "react";

const TYPING_TAGS = ["INPUT", "TEXTAREA"];

export const KeyboardInset = () => {
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const root = document.documentElement;
        let previousInset = 0;
        let previousHeight = 0;

        const revealFocusedField = () => {
            const active = document.activeElement as HTMLElement | null;
            if (!active || !TYPING_TAGS.includes(active.tagName)) return;

            requestAnimationFrame(() => active.scrollIntoView({ block: "center", behavior: "smooth" }));
        };

        const update = () => {
            const height = Math.round(viewport.height);
            if (height !== previousHeight) {
                root.style.setProperty("--visual-height", `${height}px`);
                previousHeight = height;
            }

            const raw = window.innerHeight - viewport.height - viewport.offsetTop;
            const inset = raw < 80 ? 0 : Math.round(raw);
            if (inset === previousInset) return;

            root.style.setProperty("--keyboard-inset", `${inset}px`);
            if (inset > 0) revealFocusedField();
            previousInset = inset;
        };

        update();
        viewport.addEventListener("resize", update);
        viewport.addEventListener("scroll", update);

        return () => {
            viewport.removeEventListener("resize", update);
            viewport.removeEventListener("scroll", update);
            root.style.setProperty("--keyboard-inset", "0px");
            root.style.removeProperty("--visual-height");
        };
    }, []);

    return null;
};
