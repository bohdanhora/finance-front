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
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { CURRENCY, CURRENCY_COOKIES_NAME } from "constants/index";
import { useTranslations } from "next-intl";
import useBankStore from "store/bank";
import { DollarSign, EuroIcon } from "lucide-react";

/** Same reasoning as the language cookie: root path, and it has to outlive the tab. */
const COOKIE_OPTIONS = { path: "/", expires: 365, sameSite: "lax" } as const;

export const CurrencyDropdown = () => {
    const store = useBankStore();
    const [currency, setCurrency] = React.useState("");
    const router = useRouter();
    const t = useTranslations("navbar");

    React.useEffect(() => {
        const cookieCurrency = Cookies.get(CURRENCY_COOKIES_NAME);

        if (cookieCurrency) {
            store.setCurrency(cookieCurrency);
            setCurrency(cookieCurrency);
        } else {
            store.setCurrency(CURRENCY.USD);
            setCurrency(CURRENCY.USD);
            Cookies.set(CURRENCY_COOKIES_NAME, CURRENCY.USD, COOKIE_OPTIONS);
            router.refresh();
        }
    }, [router]);

    const changeCurrency = (newCurrency: string) => {
        store.setCurrency(newCurrency);
        setCurrency(newCurrency);

        Cookies.set(CURRENCY_COOKIES_NAME, newCurrency, COOKIE_OPTIONS);
        router.refresh();
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t("currency")}>
                    {store.currency === CURRENCY.USD ? <DollarSign /> : <EuroIcon />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit">
                <DropdownMenuRadioGroup value={currency} onValueChange={changeCurrency}>
                    <DropdownMenuRadioItem value={CURRENCY.USD}>{t("usd")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={CURRENCY.EUR}>{t("eur")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
