"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { twMerge } from "lib/tw";

export type NavItem = {
    href: string;
    label: string;
    Icon: LucideIcon;
    anchor?: string;
};

export const MobileNav = ({ items }: { items: NavItem[] }) => {
    const pathname = usePathname();

    return (
        <nav className="bg-paper/80 border-rule pb-safe fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-xl sm:hidden">
            <div className="flex w-full items-stretch">
                {items.map(({ href, label, Icon, anchor }) => {
                    const active = pathname === href;

                    return (
                        <Link
                            key={href}
                            href={href}
                            aria-current={active ? "page" : undefined}
                            data-tour={anchor}
                            className={twMerge(
                                "relative flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1.5 transition-colors",
                                active ? "text-ink" : "text-ink-faint",
                            )}
                        >
                            {active && <span className="bg-accent shadow-glow absolute top-0 h-0.5 w-8 rounded-full" />}
                            <Icon className={twMerge("size-5", active && "text-accent")} strokeWidth={1.75} />
                            <span className="w-full truncate px-1 text-center text-2xs">{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
