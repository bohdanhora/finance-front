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
import { ChevronDown } from "lucide-react";
import { formatCurrency } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";

/** Same reasoning as the language cookie: root path, and it has to outlive the tab. */
const COOKIE_OPTIONS = { path: "/", expires: 365, sameSite: "lax" } as const;

type CurrencyDropdownProps = {
    rate?: number;
};

export const CurrencyDropdown = ({ rate = 0 }: CurrencyDropdownProps) => {
    const store = useBankStore();
    const setStoreCurrency = useBankStore((state) => state.setCurrency);
    const [currency, setCurrency] = React.useState("");
    const router = useRouter();
    const t = useTranslations("navbar");
    const selectedCurrency = store.currency === CURRENCY.EUR ? CURRENCY.EUR : CURRENCY.USD;

    React.useEffect(() => {
        const cookieCurrency = Cookies.get(CURRENCY_COOKIES_NAME);

        if (cookieCurrency) {
            setStoreCurrency(cookieCurrency);
            setCurrency(cookieCurrency);
        } else {
            setStoreCurrency(CURRENCY.USD);
            setCurrency(CURRENCY.USD);
            Cookies.set(CURRENCY_COOKIES_NAME, CURRENCY.USD, COOKIE_OPTIONS);
            router.refresh();
        }
    }, [router, setStoreCurrency]);

    const changeCurrency = (newCurrency: string) => {
        setStoreCurrency(newCurrency);
        setCurrency(newCurrency);

        Cookies.set(CURRENCY_COOKIES_NAME, newCurrency, COOKIE_OPTIONS);
        router.refresh();
    };

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-9 gap-1.5 rounded-xl px-2 data-[state=open]:bg-indigo-500/10"
                    aria-label={t("currency")}
                    title={
                        rate > 0
                            ? `1 ${getCurrencySymbol(selectedCurrency)} = ${formatCurrency(rate)} ${getCurrencySymbol(CURRENCY.UAH)}`
                            : t("currency")
                    }
                >
                    <span className="text-sm font-semibold">{getCurrencySymbol(selectedCurrency)}</span>
                    {rate > 0 && (
                        <span className="hidden whitespace-nowrap text-xs font-medium tabular-nums min-[1280px]:inline">
                            {formatCurrency(rate)}
                        </span>
                    )}
                    <ChevronDown className="text-muted-foreground size-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-40 rounded-xl p-1.5">
                <DropdownMenuRadioGroup value={currency} onValueChange={changeCurrency}>
                    <DropdownMenuRadioItem value={CURRENCY.USD}>{t("usd")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={CURRENCY.EUR}>{t("eur")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
