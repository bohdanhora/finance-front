"use client";

import { ThemeProvider } from "next-themes";

export function ProviderTheme({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
        </ThemeProvider>
    );
}
