"use client";

import * as React from "react";
import Cookies from "js-cookie";
import { HelpCircle, Languages, LogOut, MoreHorizontal, Settings2 } from "lucide-react";
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
import { Routes } from "constants/routes";

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
                    className="data-[state=open]:bg-wash data-[state=open]:text-ink"
                    aria-label={t("menu")}
                    title={t("menu")}
                >
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-60">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Languages className="size-3.5" />
                    {t("lang")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={language} onValueChange={changeLanguage}>
                    <DropdownMenuRadioItem value="ru">
                        {t("ru")}
                        <span className="text-ink-faint ml-auto font-mono text-2xs">RU</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en">
                        {t("en")}
                        <span className="text-ink-faint ml-auto font-mono text-2xs">EN</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ua">
                        {t("ua")}
                        <span className="text-ink-faint ml-auto font-mono text-2xs">UA</span>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>

                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem onSelect={() => router.push(Routes.SETTINGS)}>
                    <Settings2 />
                    {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => window.dispatchEvent(new Event(TOUR_START_EVENT))}>
                    <HelpCircle />
                    {tTour("replay")}
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" disabled={logoutPending} onSelect={() => void onLogout()}>
                    <LogOut />
                    {t("logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
