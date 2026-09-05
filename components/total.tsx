"use client";

import { AmountDelta, AnimatedMoney } from "./animated-number";
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

    const store = useStore();
    const bankStore = useBankStore();

    const userCurrency = store.userCurrency;
    const conversionCurrency = bankStore.currency === CURRENCY.EUR ? CURRENCY.EUR : CURRENCY.USD;
    const conversionRate = conversionCurrency === CURRENCY.EUR ? bankStore.eur?.rateBuy : bankStore.usd?.rateBuy;
    const converted = conversionRate ? store.totalAmount / conversionRate : null;

    return (
        <header
            data-tour="balance"
            className="border-border bg-card relative w-full scroll-mt-24 overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-20 -left-16 size-48 rounded-full bg-indigo-500/[0.07] blur-3xl"
            />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-[0.7rem] font-medium tracking-[0.14em] uppercase">
                        {t("currentBalance")}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h1 className="text-[2.5rem] leading-none font-semibold tracking-tight tabular-nums sm:text-5xl">
                            <AnimatedMoney
                                highlight
                                value={store.totalAmount}
                                symbol={getCurrencySymbol(userCurrency)}
                                symbolClassName="text-muted-foreground font-normal"
                            />
                        </h1>
                        <SetTotalDialog />
                        <AmountDelta value={store.totalAmount} symbol={getCurrencySymbol(userCurrency)} />
                    </div>

                    {userCurrency === CURRENCY.UAH && converted !== null && (
                        <p className="text-muted-foreground mt-2 text-sm tabular-nums">
                            <AnimatedMoney
                                prefix="≈ "
                                value={converted}
                                symbol={getCurrencySymbol(conversionCurrency)}
                            />
                        </p>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2" data-tour="actions">
                    <IncomeDialogComponent />
                    <ExpenseDialogComponent />
                </div>
            </div>
        </header>
    );
};
