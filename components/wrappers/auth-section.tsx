import { LangugaeDropdown } from "components/language-dropdown";
import { ThemeSwitch } from "components/theme-switch";

export const AuthSectionWrapper = ({
    children,
    title,
    subtitle,
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}) => {
    return (
        <section className="auth-shell flex w-full items-center justify-center">
            <div className="relative w-full max-w-md">
                <div className="auth-halo" aria-hidden="true" />

                <div className="auth-card relative overflow-hidden rounded-3xl border border-white/40 bg-white/85 shadow-[0_20px_60px_-15px_rgb(0_0_0_/_0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/70 dark:shadow-[0_20px_60px_-15px_rgb(0_0_0_/_0.8)]">
                    {/* hairline highlight along the top edge */}
                    <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent"
                        aria-hidden="true"
                    />

                    <div className="p-6 font-poppins sm:p-9">
                        <div className="mb-9 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-500/25">
                                    <svg
                                        width="19"
                                        height="19"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="white"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 17.5 9 11l4 4 7.5-7.5" />
                                        <path d="M15 7h6v6" />
                                    </svg>
                                </span>
                                <span className="text-sm font-semibold tracking-tight">Finance</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <LangugaeDropdown />
                                <ThemeSwitch />
                            </div>
                        </div>

                        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight text-balance">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2.5 text-sm leading-relaxed font-light text-black/55 dark:text-white/55">
                                {subtitle}
                            </p>
                        )}

                        <div className="mt-8">{children}</div>
                    </div>
                </div>
            </div>
        </section>
    );
};
