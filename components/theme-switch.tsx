"use client";

import { FiSun, FiMoon } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "ui/button";

export const ThemeSwitch = () => {
    const [mounted, setMounted] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();
    const t = useTranslations("navbar");

    useEffect(() => setMounted(true), []);

    // Same footprint as the real button, so the navbar does not jump on mount.
    if (!mounted) {
        return <span className="size-9 shrink-0" aria-hidden="true" />;
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            aria-label={t("theme")}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
            {resolvedTheme === "dark" ? <FiSun /> : <FiMoon />}
        </Button>
    );
};
