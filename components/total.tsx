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
import { useSetTotalAmount } from "api/main";

export const Total = () => {
    const t = useTranslations("total");

    const [toDollar, setToDollar] = useState(0);
    const [toEuro, setToEuro] = useState(0);

    const store = useStore();

    const bankStore = useBankStore();

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
        <header className="flex flex-col items-center justify-center gap-10 bg-white/80 dark:bg-black/80 rounded-xl py-5 px-10">
            <div className="text-center">
                <h1 className="md:text-xl text-sm mb-10 font-medium ">{t("currentBalance")}</h1>
                <h2 className="md:text-9xl text-4xl font-medium">
                    {formatCurrency(store.totalAmount)} ₴
                    <SetTotalDialog />
                </h2>
                <p className="md:text-lg text-sm font-medium">≈</p>
                <p className="md:text-lg text-sm font-medium">{converted}</p>
            </div>
            <div className="flex items-center justify-center gap-x-20">
                <IncomeDialogComponent />
                <ExpenseDialogComponent />
            </div>
        </header>
    );
};
