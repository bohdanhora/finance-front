"use client";

import * as React from "react";
import Cookies from "js-cookie";
import { HelpCircle, Languages, LogOut, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { DEFAULT_LOCALE, LANG_COOKIES_NAME, normalizeLocale } from "constants/index";
import { TOUR_START_EVENT } from "components/onboarding/tour";

const COOKIE_OPTIONS = { path: "/", expires: 365, sameSite: "lax" } as const;

type NavbarActionsMenuProps = {
    logoutPending: boolean;
    onLogout: () => Promise<void>;
};

export const NavbarActionsMenu = ({ logoutPending, onLogout }: NavbarActionsMenuProps) => {
    const [language, setLanguage] = React.useState(DEFAULT_LOCALE);
    const router = useRouter();
    const t = useTranslations("navbar");
    const tTour = useTranslations("tour");

    React.useEffect(() => {
        const cookieLocale = Cookies.get(LANG_COOKIES_NAME);

        if (cookieLocale && normalizeLocale(cookieLocale) === cookieLocale) {
            setLanguage(cookieLocale);
            return;
        }

        const locale = normalizeLocale(cookieLocale || navigator.language);
        setLanguage(locale);
        Cookies.set(LANG_COOKIES_NAME, locale, COOKIE_OPTIONS);
        router.refresh();
    }, [router]);

    const changeLanguage = (newLanguage: string) => {
        setLanguage(newLanguage);
        Cookies.set(LANG_COOKIES_NAME, newLanguage, COOKIE_OPTIONS);
        router.refresh();
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl data-[state=open]:bg-indigo-500/10 data-[state=open]:text-indigo-600 dark:data-[state=open]:text-indigo-300"
                    aria-label={t("menu")}
                    title={t("menu")}
                >
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                sideOffset={10}
                className="bg-popover text-popover-foreground w-56 rounded-2xl border-border/80 p-1.5 shadow-[0_20px_60px_-18px_rgba(0,0,0,0.55)]"
            >
                <DropdownMenuLabel className="text-muted-foreground flex items-center gap-2 px-2.5 py-2 text-xs font-semibold uppercase tracking-[0.08em]">
                    <Languages className="size-3.5" />
                    {t("lang")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={language} onValueChange={changeLanguage}>
                    <DropdownMenuRadioItem
                        value="ru"
                        className="rounded-xl focus:bg-indigo-500/10 dark:focus:bg-indigo-500/10"
                    >
                        {t("ru")}
                        <span className="text-muted-foreground ml-auto text-xs font-semibold">RU</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                        value="en"
                        className="rounded-xl focus:bg-indigo-500/10 dark:focus:bg-indigo-500/10"
                    >
                        {t("en")}
                        <span className="text-muted-foreground ml-auto text-xs font-semibold">EN</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem
                        value="ua"
                        className="rounded-xl focus:bg-indigo-500/10 dark:focus:bg-indigo-500/10"
                    >
                        {t("ua")}
                        <span className="text-muted-foreground ml-auto text-xs font-semibold">UA</span>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem
                    className="rounded-xl px-2.5 py-2"
                    onSelect={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}
                >
                    <HelpCircle />
                    {tTour("replay")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    variant="destructive"
                    disabled={logoutPending}
                    className="rounded-xl px-2.5 py-2"
                    onSelect={() => void onLogout()}
                >
                    <LogOut />
                    {t("logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
