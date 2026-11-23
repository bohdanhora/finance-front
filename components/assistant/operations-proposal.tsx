"use client";

import dayjs from "dayjs";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Check, Minus, Plus } from "lucide-react";
import { twMerge } from "lib/tw";

import { Button } from "components/ui/button";
import { getCategoryLabel } from "constants/categories";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency } from "lib/utils";
import { OperationsProposal as Proposal } from "lib/assistant/storage";
import useStore from "store/general";
import { useCardName } from "components/cards/card-face";

const ICONS = { expense: Minus, income: Plus, transfer: ArrowLeftRight } as const;

export const OperationsProposal = ({
    proposal,
    onConfirm,
    onCancel,
}: {
    proposal: Proposal;
    onConfirm: () => void;
    onCancel: () => void;
}) => {
    const t = useTranslations("assistant.operations");
    const tCategories = useTranslations("categories");
    const cards = useStore((state) => state.cards);
    const currency = useStore((state) => state.userCurrency);
    const cardName = useCardName();
    const symbol = getCurrencySymbol(currency);

    const nameOf = (id?: string) => {
        const card = cards.find((item) => item.id === id) ?? (id ? undefined : cards[0]);
        return card ? cardName(card) : "";
    };

    const open = proposal.status === "pending" || proposal.status === "failed";
    const total = (type: "expense" | "income") =>
        proposal.operations.filter((item) => item.type === type).reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="border-rule bg-surface mt-2 w-full max-w-5/6 rounded-2xl border p-3">
            <p className="label">{t("title", { count: proposal.operations.length })}</p>
            <ul className="mt-2 text-sm">
                {proposal.operations.map((item, index) => {
                    const Icon = ICONS[item.type];
                    const done = proposal.done.includes(index);
                    return (
                        <li
                            key={index}
                            className="border-rule flex items-center gap-2.5 border-t py-2 first:border-t-0"
                        >
                            <span
                                className={twMerge(
                                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                                    item.type === "income" ? "bg-accent-wash text-good" : "bg-wash text-ink-muted",
                                )}
                            >
                                {done ? <Check className="text-good size-3.5" /> : <Icon className="size-3.5" />}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate">
                                    {item.description ||
                                        (item.type === "transfer"
                                            ? t("transfer")
                                            : getCategoryLabel(item.category, tCategories))}
                                </span>
                                <span className="text-ink-faint block truncate text-xs">
                                    {[
                                        item.type === "expense" ? getCategoryLabel(item.category, tCategories) : "",
                                        item.type === "transfer"
                                            ? `${nameOf(item.cardId)} → ${nameOf(item.toCardId)}`
                                            : cards.length > 1
                                              ? nameOf(item.cardId)
                                              : "",
                                        dayjs(item.date).format("DD.MM"),
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </span>
                            </span>
                            <span
                                className={twMerge(
                                    "shrink-0 font-mono text-xs tabular-nums",
                                    item.type === "income" && "text-good",
                                )}
                            >
                                {item.type === "income" ? "+" : item.type === "expense" ? "-" : ""}
                                {formatCurrency(item.amount)} {symbol}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {proposal.operations.length > 1 && (
                <p className="text-ink-muted border-rule flex justify-between border-t pt-2 text-xs">
                    <span>{t("total")}</span>
                    <span className="font-mono tabular-nums">
                        {total("expense") > 0 && `-${formatCurrency(total("expense"))} ${symbol}`}
                        {total("expense") > 0 && total("income") > 0 && " / "}
                        {total("income") > 0 && `+${formatCurrency(total("income"))} ${symbol}`}
                    </span>
                </p>
            )}
            {open ? (
                <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="accent" className="flex-1" onClick={onConfirm}>
                        {proposal.status === "failed" ? t("retry") : t("confirm")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onCancel}>
                        {t("cancel")}
                    </Button>
                </div>
            ) : (
                <p className={twMerge("mt-2 text-xs", proposal.status === "added" ? "text-good" : "text-ink-faint")}>
                    {t(`status.${proposal.status}`)}
                </p>
            )}
            {proposal.status === "failed" && <p className="text-signal mt-2 text-xs">{t("failed")}</p>}
        </div>
    );
};
