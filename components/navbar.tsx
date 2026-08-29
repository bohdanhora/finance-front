"use client";

import { useEffect, useState } from "react";
import { useGetCurrencyQuery } from "api/bank";
import useBankStore from "store/bank";
import { LangugaeDropdown } from "./language-dropdown";
import { CurrencyDropdown } from "./currency-dropdown";
import { findCurrency } from "lib/utils";
import { CURRENCY, ISO4217Codes } from "constants/index";
import { Loader } from "./loader";
import { BarChart3, HelpCircle, LayoutDashboard, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { useLogoutMutation } from "api/auth";
import Cookies from "js-cookie";
import { Routes } from "constants/routes";
import { useRouter } from "next/navigation";
import useStore from "store/general";
import { clearCookies } from "lib/logout";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ThemeSwitch } from "./theme-switch";
import { TOUR_START_EVENT } from "./onboarding/tour";
import { twMerge } from "tailwind-merge";

export const Navbar = () => {
    const { data: currency } = useGetCurrencyQuery();
    const queryClient = useQueryClient();

    const router = useRouter();
    const pathname = usePathname();

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [buy, setBuy] = useState(0);

    const store = useBankStore();
    const generalStore = useStore();
    const tNav = useTranslations("navbar");
    const tTour = useTranslations("tour");

    const userCurrency = generalStore.userCurrency;

    const { mutateAsync: logoutAsync, isPending: logoutPending } = useLogoutMutation();

    const logout = async () => {
        const userId = Cookies.get("userId") || "";
        try {
            setIsRedirecting(true);
            await logoutAsync({ userId });
            clearCookies();
            queryClient.clear();
            generalStore.setAllToDefaults();
            router.replace(Routes.LOGIN);
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setIsRedirecting(false);
        }
    };

    useEffect(() => {
        if (!currency) return;

        const usdObj = findCurrency(currency, ISO4217Codes.USD) || null;
        const eurObj = findCurrency(currency, ISO4217Codes.EUR) || null;

        store.setUsd(usdObj);
        store.setEur(eurObj);
    }, [currency]);

    useEffect(() => {
        if (store.currency === CURRENCY.EUR) {
            setBuy(store.eur?.rateBuy || 0);
            return;
        }
        if (store.currency === CURRENCY.USD) {
            setBuy(store.usd?.rateBuy || 0);
            return;
        }
        setBuy(0);
    }, [store.currency, store.usd, store.eur]);

    if (isRedirecting) {
        return <Loader />;
    }

    return (
        <>
            {logoutPending && <Loader />}
            <nav className="sticky top-0 z-40 flex w-full items-center justify-between gap-1 border-b border-black/10 bg-white/70 px-2 py-2.5 shadow-sm backdrop-blur-xl sm:gap-2 sm:px-6 sm:py-3 dark:border-white/10 dark:bg-black/60">
                <span className="flex shrink-0 items-center gap-2.5">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/25">
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
                    <span className="hidden text-sm font-semibold tracking-tight sm:inline">Finance</span>
                </span>

                <nav className="border-border bg-muted/60 flex shrink-0 items-center gap-1 rounded-xl border p-1">
                    {[
                        { href: Routes.HOME, label: tNav("dashboard"), Icon: LayoutDashboard },
                        { href: Routes.STATISTICS, label: tNav("statistics"), Icon: BarChart3 },
                    ].map(({ href, label, Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                aria-current={active ? "page" : undefined}
                                data-tour={href === Routes.STATISTICS ? "statistics" : undefined}
                                className={twMerge(
                                    "flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                                    active
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Icon size={15} />
                                <span className="hidden sm:inline">{label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="flex shrink-0 items-center gap-x-0.5 sm:gap-x-1.5">
                    {userCurrency === CURRENCY.UAH && buy > 0 && (
                        <p className="hidden text-sm text-black/60 sm:block dark:text-white/60">
                            {`1 ${store.currency === CURRENCY.USD ? "$" : "€"} = ${buy} ₴`}
                        </p>
                    )}
                    {userCurrency === CURRENCY.UAH && <CurrencyDropdown />}

                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label={tTour("replay")}
                        title={tTour("replay")}
                        onClick={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
                    >
                        <HelpCircle />
                    </Button>
                    <LangugaeDropdown />
                    <ThemeSwitch />
                    <Button
                        disabled={logoutPending}
                        variant="ghost"
                        size="icon"
                        aria-label={tNav("logout")}
                        onClick={logout}
                    >
                        <LogOutIcon />
                    </Button>
                </div>
            </nav>
        </>
    );
};
