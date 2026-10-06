"use client";

import { useState } from "react";
import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { CategoryIcon } from "components/categories/category-icon";
import { Button } from "components/ui/button";
import { getCategoryLabel } from "constants/categories";
import { categoryByMcc, currencySymbolByCode, fromMinorUnits, operationConversion } from "lib/monobank";
import { formatCurrency } from "lib/utils";
import { MonobankStatementItem } from "types/monobank";

const PAGE_SIZE = 100;

export const StatementList = ({
    items,
    accountCurrency,
}: {
    items: MonobankStatementItem[];
    accountCurrency: number;
}) => {
    const t = useTranslations("monobank");
    const tCat = useTranslations("categories");
    const [visible, setVisible] = useState(PAGE_SIZE);

    const symbol = currencySymbolByCode(accountCurrency);
    const hidden = items.length - visible;

    return (
        <div className="flex flex-col gap-3">
            <ul className="border-rule-strong border-t">
                {items.slice(0, visible).map((item) => {
                    const category = categoryByMcc(item.mcc);
                    const income = item.amount >= 0;
                    const cashback = fromMinorUnits(item.cashbackAmount || 0);
                    const conversion = operationConversion(item, accountCurrency);
                    const operationSymbol = conversion ? currencySymbolByCode(conversion.currencyCode) : "";

                    return (
                        <li key={item.id} className="border-rule flex items-center gap-3 border-b py-3 pl-1">
                            <span
                                className={twMerge(
                                    "border-rule flex size-9 shrink-0 items-center justify-center border",
                                    income && "border-accent text-accent",
                                )}
                            >
                                <CategoryIcon category={income ? "income" : category} className="size-4" />
                            </span>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm break-words">{item.description}</p>
                                <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
                                    {getCategoryLabel(income ? "income" : category, tCat)} ·{" "}
                                    {dayjs.unix(item.time).format("DD/MM/YY HH:mm")}
                                    {item.hold ? ` · ${t("hold")}` : ""}
                                </p>
                                {item.comment && (
                                    <p className="text-ink-faint mt-0.5 text-xs break-words">{item.comment}</p>
                                )}
                            </div>

                            <div className="shrink-0 text-right">
                                <p className={twMerge("font-mono text-sm tabular-nums", income && "text-accent")}>
                                    {income ? "+" : "-"}
                                    {formatCurrency(fromMinorUnits(Math.abs(item.amount)))} {symbol}
                                </p>
                                {conversion && (
                                    <p className="text-ink-faint font-mono text-3xs tabular-nums">
                                        {t("converted", {
                                            amount: `${formatCurrency(conversion.amount)} ${operationSymbol}`,
                                            rate:
                                                conversion.unit === "account"
                                                    ? `1 ${symbol} = ${formatCurrency(conversion.rate)} ${operationSymbol}`
                                                    : `1 ${operationSymbol} = ${formatCurrency(conversion.rate)} ${symbol}`,
                                        })}
                                    </p>
                                )}
                                {cashback > 0 && (
                                    <p className="text-accent font-mono text-3xs tabular-nums">
                                        {t("cashbackEarned", { amount: `${formatCurrency(cashback)} ${symbol}` })}
                                    </p>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {hidden > 0 && (
                <Button
                    variant="outline"
                    className="self-center"
                    onClick={() => setVisible((count) => count + PAGE_SIZE)}
                >
                    {t("showMore", { count: Math.min(hidden, PAGE_SIZE) })}
                </Button>
            )}
        </div>
    );
};
