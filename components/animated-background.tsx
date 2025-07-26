"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "next-themes";

// @ts-expect-error: vanta type definitions are not available
import CELLS from "vanta/dist/vanta.cells.min";

type VantaEffect = {
    destroy: () => void;
};

const VantaBackground = () => {
    const vantaRef = useRef<HTMLDivElement>(null);
    const [vantaEffect, setVantaEffect] = useState<VantaEffect | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (vantaEffect) {
            vantaEffect.destroy();
            setVantaEffect(null);
        }

        if (vantaRef.current) {
            const isDark =
                theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

            const newEffect = CELLS({
                el: vantaRef.current,
                THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: 1.0,
                color1: isDark ? 0xffffff : 0x222222,
                color2: isDark ? 0x000000 : 0xffffff,
                size: 0.9,
                speed: 1.6,
            });

            setVantaEffect(newEffect);
        }

        return () => {
            if (vantaEffect) vantaEffect.destroy();
        };
    }, [theme]);

    return <div ref={vantaRef} style={styles.vanta} />;
};

const styles: { vanta: React.CSSProperties } = {
    vanta: {
        position: "fixed",
        width: "100%",
        height: "100%",
        top: 0,
        left: 0,
        zIndex: -1,
        pointerEvents: "none",
    },
};

export default VantaBackground;
