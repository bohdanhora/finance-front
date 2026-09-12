"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export type NavItem = {
    href: string;
    label: string;
    Icon: LucideIcon;
    anchor?: string;
};

export const MobileNav = ({ items }: { items: NavItem[] }) => {
    const pathname = usePathname();

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/8 bg-white/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl sm:hidden dark:border-white/10 dark:bg-zinc-950/85">
            <div className="mx-auto flex w-full max-w-md items-stretch justify-around gap-1 px-2 py-1.5">
                {items.map(({ href, label, Icon, anchor }) => {
                    const active = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            data-tour={anchor}
                            className={twMerge(
                                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl py-1 text-[0.66rem] font-medium transition-colors duration-200",
                                active ? "text-indigo-600 dark:text-indigo-300" : "text-muted-foreground",
                            )}
                        >
                            <span
                                className={twMerge(
                                    "flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-200",
                                    active && "bg-indigo-500/12",
                                )}
                            >
                                <Icon className="size-[1.1rem]" />
                            </span>
                            <span className="w-full truncate text-center">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
