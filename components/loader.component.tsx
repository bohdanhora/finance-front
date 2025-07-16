"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const Loader = () => {
    const [mounted, setMounted] = useState(false);
    const elRef = useRef<HTMLDivElement | null>(null);

    if (!elRef.current && typeof window !== "undefined") {
        elRef.current = document.createElement("div");
        elRef.current.setAttribute("id", "global-loader");
    }

    useEffect(() => {
        setMounted(true);

        const loaderEl = elRef.current!;
        document.body.appendChild(loaderEl);

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.removeChild(loaderEl);
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    if (!mounted || !elRef.current) return null;

    return createPortal(
        <div className="fixed top-0 left-0 z-[9999] w-full h-screen flex justify-center items-center bg-white dark:bg-black">
            <div className="loader border-t-2 rounded-full border-gray-500 bg-gray-300 animate-spin aspect-square w-8 flex justify-center items-center" />
        </div>,
        elRef.current,
    );
};
