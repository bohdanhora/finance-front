"use client";

import * as React from "react";
import Cookies from "js-cookie";

import { Button } from "components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { DEFAULT_LOCALE, LANG_COOKIES_NAME, normalizeLocale } from "constants/index";
import { useTranslations } from "next-intl";
import { LanguagesIcon } from "lucide-react";

/**
 * A year, so the choice survives closing the browser on a phone, and an
 * explicit root path: written from /statistics the cookie used to be scoped to
 * that page, so the dashboard kept rendering the old language.
 */
const COOKIE_OPTIONS = { path: "/", expires: 365, sameSite: "lax" } as const;

export const LangugaeDropdown = () => {
    const [language, setLanguage] = React.useState(DEFAULT_LOCALE);
    const router = useRouter();
    const t = useTranslations("navbar");

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
                <Button variant="ghost" size="icon" aria-label={t("lang")}>
                    <LanguagesIcon />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
                <DropdownMenuRadioGroup value={language} onValueChange={changeLanguage}>
                    <DropdownMenuRadioItem value="ru">{t("ru")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en">{t("en")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="ua">{t("ua")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
