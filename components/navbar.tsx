"use client";

import { useEffect, useState } from "react";
import { useGetCurrencyQuery } from "api/bank";
import useBankStore from "store/bank";
import { CurrencyDropdown } from "./currency-dropdown";
import { findCurrency } from "lib/utils";
import { CURRENCY, ISO4217Codes } from "constants/index";
import { Loader } from "./loader";
import { BarChart3, Calculator, LayoutDashboard, PiggyBank } from "lucide-react";
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
import { twMerge } from "tailwind-merge";
import { getCurrencySymbol } from "lib/currency";
import { ChoooseCurrency } from "./dialogs/choose-currency";
import { CALCULATOR_TOGGLE_EVENT } from "./calculator/desktop-calculator";
import { NavbarActionsMenu } from "./navbar-actions-menu";

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
            <header className="sticky top-0 z-40 w-full border-b border-black/8 bg-white/75 shadow-[0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-2xl dark:border-white/8 dark:bg-zinc-950/75 dark:shadow-none">
                <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 sm:px-5 lg:px-6">
                    <Link
                        href={Routes.HOME}
                        aria-label="Finance"
                        className="flex w-fit shrink-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
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
                        <span className="hidden text-sm font-bold tracking-[-0.02em] xl:inline">Finance</span>
                    </Link>

                    <nav className="border-border/70 bg-card/65 col-start-2 flex min-w-0 items-center gap-1 justify-self-center rounded-2xl border p-1 shadow-sm shadow-black/5 ring-1 ring-white/40 dark:ring-white/5">
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
                                    aria-label={label}
                                    aria-current={active ? "page" : undefined}
                                    data-tour={href === Routes.STATISTICS ? "statistics" : undefined}
                                    className={twMerge(
                                        "relative flex h-9 items-center gap-2 rounded-xl px-2.5 text-sm font-medium transition-all duration-200 sm:px-3",
                                        active
                                            ? "bg-gradient-to-b from-white to-indigo-50 text-indigo-700 shadow-sm ring-1 ring-black/5 dark:from-white/12 dark:to-indigo-500/10 dark:text-indigo-300 dark:ring-white/10"
                                            : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                                    )}
                                >
                                    <Icon className="size-4" />
                                    <span className="hidden lg:inline">{label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="col-start-3 flex min-w-0 items-center justify-self-end gap-1.5">
                        <div className="border-border/70 bg-card/65 flex items-center rounded-2xl border p-0.5 shadow-sm shadow-black/5 ring-1 ring-white/40 dark:ring-white/5">
                            <Button
                                variant="ghost"
                                className="h-9 gap-1.5 rounded-xl px-2"
                                aria-label={tNav("currency")}
                                title={tNav("currency")}
                                onClick={() => window.dispatchEvent(new Event("finance:open-currency-selection"))}
                            >
                                <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-300">
                                    {getCurrencySymbol(userCurrency)}
                                </span>
                                <span className="hidden text-xs font-bold uppercase sm:inline">{userCurrency}</span>
                            </Button>
                            {userCurrency === CURRENCY.UAH && (
                                <>
                                    <span className="bg-border hidden h-5 w-px sm:block" aria-hidden="true" />
                                    <div className="hidden sm:block">
                                        <CurrencyDropdown rate={buy} />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="border-border/70 bg-card/65 flex items-center rounded-2xl border p-0.5 shadow-sm shadow-black/5 ring-1 ring-white/40 dark:ring-white/5">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden rounded-xl lg:inline-flex"
                                aria-label={tNav("calculator")}
                                title={tNav("calculator")}
                                onClick={() => window.dispatchEvent(new Event(CALCULATOR_TOGGLE_EVENT))}
                            >
                                <Calculator />
                            </Button>
                            <ThemeSwitch />
                            <NavbarActionsMenu logoutPending={logoutPending} onLogout={logout} />
                        </div>
                    </div>
                </div>
            </header>
            <ChoooseCurrency />
        </>
    );
};
