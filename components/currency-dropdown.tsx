"use client";

import * as React from "react";

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

export function CurrencyDropdown() {
    const store = useBankStore();
    const [currency, setCurrency] = React.useState("");
    const router = useRouter();
    const t = useTranslations("navbar");

    React.useEffect(() => {
        const cookieCurrency = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${CURRENCY_COOKIES_NAME}=`))
            ?.split("=")[1];

        if (cookieCurrency) {
            store.setCurrency(cookieCurrency);
            setCurrency(cookieCurrency);
        } else {
            store.setCurrency(CURRENCY.USD);
            setCurrency(CURRENCY.USD);
            document.cookie = `${CURRENCY_COOKIES_NAME}=${CURRENCY.USD};`;
            router.refresh();
        }
    }, [router]);

    const changeCurrency = (newCurrency: string) => {
        store.setCurrency(newCurrency);
        setCurrency(newCurrency);

        document.cookie = `${CURRENCY_COOKIES_NAME}=${newCurrency};`;
        router.refresh();
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">{store.currency === CURRENCY.USD ? <DollarSign /> : <EuroIcon />}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit">
                <DropdownMenuRadioGroup value={currency} onValueChange={changeCurrency}>
                    <DropdownMenuRadioItem value={CURRENCY.USD}>{t("usd")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={CURRENCY.EUR}>{t("eur")}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
