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
            <aside className="bg-ink text-paper dark:bg-surface dark:text-ink dark:border-rule hidden flex-col justify-between p-10 lg:flex dark:border-r xl:p-14">
                <Brand markClassName="bg-paper dark:bg-ink" />

                <div>
                    <p className="font-display text-hero leading-none font-medium tracking-tight uppercase">
                        Finance
                        <span className="caret caret-blink" aria-hidden="true" />
                    </p>
                </div>

                <ol className="border-t border-current">
                    {FEATURES.map((key, index) => (
                        <li key={key} className="flex gap-4 border-b border-current/25 py-4">
                            <span className="text-accent w-6 shrink-0 font-mono text-xs">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm">{t(key)}</span>
                        </li>
                    ))}
                </ol>
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
                    <h1 className="font-display text-3xl leading-tight font-medium tracking-tight uppercase">
                        {title}
                    </h1>
                    <div className="border-rule-strong mt-8 border-t pt-8">{children}</div>
                </div>
            </div>
        </section>
    );
};
