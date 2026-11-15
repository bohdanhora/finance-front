"use client";

import { useTranslations } from "next-intl";

import { Brand } from "components/brand";
import { LangugaeDropdown } from "components/language-dropdown";
import { ThemeSwitch } from "components/theme-switch";

const FEATURES = ["featureBalance", "featureBudget", "featureSavings"] as const;

export const AuthSectionWrapper = ({ children, title }: { children: React.ReactNode; title: string }) => {
    const t = useTranslations("auth");

    return (
        <section className="auth-shell grid w-full lg:grid-cols-2">
            <aside className="glow-stage border-rule hidden flex-col justify-between overflow-hidden border-r p-10 lg:flex xl:p-14">
                <Brand />

                <div>
                    <p className="font-display text-hero glow-text leading-none font-light tracking-tight">Finance</p>
                </div>

                <ul className="flex flex-col gap-3">
                    {FEATURES.map((key) => (
                        <li key={key} className="text-ink-muted flex items-center gap-3 text-sm">
                            <span className="tick" />
                            {t(key)}
                        </li>
                    ))}
                </ul>
            </aside>

            <div className="flex min-h-full flex-col lg:px-10 lg:py-10 xl:px-16">
                <div className="flex items-center justify-between">
                    <Brand className="lg:invisible" />
                    <div className="flex items-center">
                        <LangugaeDropdown />
                        <ThemeSwitch />
                    </div>
                </div>

                <div className="auth-card mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
                    <h1 className="font-display text-3xl leading-tight font-medium tracking-tight">{title}</h1>
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </section>
    );
};
