"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "lib/utils";
import useStore from "store/general";
import useBankStore from "store/bank";
import { CURRENCY } from "constants/index";
import { useTranslations } from "next-intl";
import { IncomeDialogComponent } from "./dialogs/income";
import { ExpenseDialogComponent } from "./dialogs/expense";
import { SetTotalDialog } from "./dialogs/set-new-total";
import { getCurrencySymbol } from "lib/currency";

export const Total = () => {
    const t = useTranslations("total");

    const [toDollar, setToDollar] = useState(0);
    const [toEuro, setToEuro] = useState(0);

    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = store.userCurrency;

    const converted =
        bankStore.currency === CURRENCY.USD ? `${formatCurrency(toDollar)} $` : `${formatCurrency(toEuro)} €`;

    useEffect(() => {
        if (bankStore.usd?.rateBuy) {
            setToDollar(store.totalAmount / bankStore.usd.rateBuy);
        }

        if (bankStore.eur?.rateBuy) {
            setToEuro(store.totalAmount / bankStore.eur.rateBuy);
        }
    }, [store.totalAmount, bankStore.usd?.rateBuy, bankStore.eur?.rateBuy]);

    return (
        <header
            data-tour="balance"
            className="border-border bg-card w-full scroll-mt-24 rounded-3xl border p-6 shadow-sm sm:p-8"
        >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-[0.7rem] font-medium tracking-[0.14em] uppercase">
                        {t("currentBalance")}
                    </p>

                    <div className="mt-2 flex items-center gap-1">
                        <h1 className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl md:text-6xl">
                            {formatCurrency(store.totalAmount)}{" "}
                            <span className="text-muted-foreground font-normal">{getCurrencySymbol(userCurrency)}</span>
                        </h1>
                        <SetTotalDialog />
                    </div>

                    {userCurrency === CURRENCY.UAH && (
                        <p className="text-muted-foreground mt-2 text-sm tabular-nums">{`≈ ${converted}`}</p>
                    )}
                </div>

                <div className="flex flex-wrap gap-2" data-tour="actions">
                    <IncomeDialogComponent />
                    <ExpenseDialogComponent />
                </div>
            </div>
        </header>
    );
};
