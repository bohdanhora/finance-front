"use client";

import { useEffect, useState } from "react";
import { useGetCurrencyQuery } from "api/bank";
import useBankStore from "store/bank";
import { LangugaeDropdown } from "./language-dropdown";
import { CurrencyDropdown } from "./currency-dropdown";
import { findCurrency } from "lib/utils";
import { CURRENCY, ISO4217Codes } from "constants/index";
import { Loader } from "./loader";
import { BarChart3, Calculator, HelpCircle, LayoutDashboard, LogOutIcon, PiggyBank } from "lucide-react";
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
import { getCurrencySymbol } from "lib/currency";
import { ChoooseCurrency } from "./dialogs/choose-currency";
import { CALCULATOR_TOGGLE_EVENT } from "./calculator/desktop-calculator";

export const Navbar = () => {
    const { data: currency } = useGetCurrencyQuery();
    const queryClient = useQueryClient();

    const router = useRouter();
    const pathname = usePathname();

    const [isRedirecting, setIsRedirecting] = useState(false);
    const [buy, setBuy] = useState(0);

    const store = useBankStore();
    const setUsd = useBankStore((state) => state.setUsd);
    const setEur = useBankStore((state) => state.setEur);
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

        setUsd(usdObj);
        setEur(eurObj);
    }, [currency, setEur, setUsd]);

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
            <header className="sticky top-0 z-40 w-full border-b border-black/10 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-black/75">
                <div className="mx-auto grid min-h-14 w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6">
                    <Link
                        href={Routes.HOME}
                        className="flex w-fit shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-md shadow-indigo-500/20">
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
                    </Link>

                    <nav className="border-border bg-muted/40 col-start-2 flex min-w-0 items-center gap-0.5 justify-self-center rounded-xl border p-1 min-[1040px]:absolute min-[1040px]:left-1/2 min-[1040px]:-translate-x-1/2">
                        {[
                            { href: Routes.HOME, label: tNav("dashboard"), Icon: LayoutDashboard },
                            { href: Routes.STATISTICS, label: tNav("statistics"), Icon: BarChart3 },
                            { href: Routes.SAVINGS, label: tNav("savings"), Icon: PiggyBank },
                        ].map(({ href, label, Icon }) => {
                            const active = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={active ? "page" : undefined}
                                    data-tour={href === Routes.STATISTICS ? "statistics" : undefined}
                                    className={twMerge(
                                        "flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-medium transition-colors lg:px-3",
                                        active
                                            ? "bg-background text-indigo-600 shadow-sm dark:text-indigo-300"
                                            : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                                    )}
                                >
                                    <Icon size={15} />
                                    <span className="hidden md:inline">{label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="col-start-3 flex min-w-0 shrink-0 items-center justify-self-end gap-0.5">
                        <Button
                            variant="ghost"
                            className="h-9 gap-1.5 rounded-lg px-2"
                            aria-label={tNav("currency")}
                            title={tNav("currency")}
                            onClick={() => window.dispatchEvent(new Event("finance:open-currency-selection"))}
                        >
                            <span className="flex size-6 items-center justify-center rounded-md bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                                {getCurrencySymbol(userCurrency)}
                            </span>
                            <span className="hidden text-xs font-semibold uppercase sm:inline">{userCurrency}</span>
                        </Button>
                        {userCurrency === CURRENCY.UAH && (
                            <div className="hidden sm:block">
                                <CurrencyDropdown rate={buy} />
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden lg:inline-flex"
                            aria-label={tNav("calculator")}
                            title={tNav("calculator")}
                            onClick={() => window.dispatchEvent(new Event(CALCULATOR_TOGGLE_EVENT))}
                        >
                            <Calculator />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden xl:inline-flex"
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
                </div>
            </header>
            <ChoooseCurrency />
        </>
    );
};
