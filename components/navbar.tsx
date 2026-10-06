"use client";

import { useEffect, useState } from "react";
import { useGetCurrencyQuery } from "api/bank";
import useBankStore from "store/bank";
import { CurrencyDropdown } from "./currency-dropdown";
import { findCurrency } from "lib/utils";
import { CURRENCY, ISO4217Codes } from "constants/index";
import { Loader } from "./loader";
import { BarChart3, Calculator, CreditCard, LayoutDashboard, PiggyBank } from "lucide-react";
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
import { twMerge } from "lib/tw";
import { getCurrencySymbol } from "lib/currency";
import { ChoooseCurrency } from "./dialogs/choose-currency";
import { AssistantChat } from "./assistant/assistant-chat";
import { useMonobankToken } from "hooks/use-monobank-token";
import { CALCULATOR_TOGGLE_EVENT } from "./calculator/desktop-calculator";
import { NavbarActionsMenu } from "./navbar-actions-menu";
import { MobileNav, type NavItem } from "./mobile-nav";
import { useIsMobile } from "hooks/use-is-mobile";
import { StreakBadge } from "./streak/streak-badge";
import { Brand } from "./brand";

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
    const { connected: monobankConnected } = useMonobankToken();
    const isMobile = useIsMobile();

    const userCurrency = generalStore.userCurrency;

    const { mutateAsync: logoutAsync, isPending: logoutPending } = useLogoutMutation();

    const logout = async () => {
        const refreshToken = Cookies.get("refreshToken");
        setIsRedirecting(true);
        try {
            await logoutAsync({ refreshToken });
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            clearCookies();
            queryClient.clear();
            generalStore.setAllToDefaults();
            router.replace(Routes.LOGIN);
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

    const navItems: NavItem[] = [
        { href: Routes.HOME, label: tNav("dashboard"), Icon: LayoutDashboard },
        { href: Routes.STATISTICS, label: tNav("statistics"), Icon: BarChart3, anchor: "statistics" },
        { href: Routes.SAVINGS, label: tNav("savings"), Icon: PiggyBank, anchor: "savings" },
        ...(monobankConnected ? [{ href: Routes.MONOBANK, label: tNav("monobank"), Icon: CreditCard }] : []),
    ];

    if (isRedirecting) {
        return <Loader />;
    }

    return (
        <>
            {logoutPending && <Loader />}
            <header className="bg-paper border-rule-strong sticky top-0 z-40 w-full border-b">
                <div className="shell flex h-14 items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Link href={Routes.HOME} aria-label="Finance" className="shrink-0">
                            <Brand wordmarkClassName="hidden sm:inline" />
                        </Link>
                        <StreakBadge />
                    </div>

                    {isMobile === false && (
                        <nav aria-label={tNav("menu")} className="flex h-full min-w-0 items-stretch">
                            {navItems.map(({ href, label, anchor }, index) => {
                                const active = pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        aria-current={active ? "page" : undefined}
                                        data-tour={anchor}
                                        className={twMerge(
                                            "relative flex items-center gap-1.5 px-3 font-mono text-2xs tracking-wide uppercase transition-colors",
                                            active ? "text-ink" : "text-ink-faint hover:text-ink",
                                        )}
                                    >
                                        <span className={active ? "text-accent" : undefined}>
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        {label}
                                        {active && <span className="bg-accent absolute inset-x-3 -bottom-px h-0.5" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}

                    <div className="flex shrink-0 items-center">
                        <div className="border-rule flex h-9 items-stretch border">
                            <button
                                type="button"
                                aria-label={tNav("currency")}
                                title={tNav("currency")}
                                onClick={() => window.dispatchEvent(new Event("finance:open-currency-selection"))}
                                className="hover:bg-wash flex items-center gap-1.5 px-2.5 font-mono text-2xs uppercase transition-colors"
                            >
                                <span className="text-accent">{getCurrencySymbol(userCurrency)}</span>
                                <span className="hidden sm:inline">{userCurrency}</span>
                            </button>
                            {userCurrency === CURRENCY.UAH && (
                                <div className="border-rule hidden border-l sm:flex">
                                    <CurrencyDropdown rate={buy} />
                                </div>
                            )}
                        </div>

                        <div className="ml-2 flex items-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="hidden lg:inline-flex"
                                aria-label={tNav("calculator")}
                                title={tNav("calculator")}
                                onClick={() => window.dispatchEvent(new Event(CALCULATOR_TOGGLE_EVENT))}
                            >
                                <Calculator className="size-4" />
                            </Button>
                            <ThemeSwitch />
                            <NavbarActionsMenu logoutPending={logoutPending} onLogout={logout} />
                        </div>
                    </div>
                </div>
            </header>
            {isMobile && <MobileNav items={navItems} />}
            <ChoooseCurrency />
            <AssistantChat />
        </>
    );
};
