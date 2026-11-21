"use client";

import { usePlanMeta } from "./essential-plan-fields";
import { paydayStatus } from "lib/month-plan";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { twMerge } from "lib/tw";

import { EssentialsType } from "constants/index";
import { getCurrencySymbol } from "lib/currency";
import { formatMonthKey } from "lib/date-locale";
import { formatCurrency } from "lib/utils";
import { getCategoryLabel } from "constants/categories";
import useStore from "store/general";
import { EssentialType } from "types/transactions";
import { AnimatedMoney } from "./animated-number";
import { EssentialPaymentDialog } from "./dialogs/essential-payment";
import { Checkbox } from "./ui/checkbox";
import { RowMenu } from "./row-menu";
import { requestListAction } from "lib/list-actions";
import { toMoneyInput } from "lib/money";
import { isForeignAmount } from "lib/foreign-amount";
import { CalendarArrowUpIcon, CircleCheckIcon, LayoutTemplateIcon, Undo2Icon } from "lucide-react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useNewEssential, useRemoveEssential } from "api/main";

export const SegmentBar = ({ done, total }: { done: number; total: number }) => (
    <div className="flex h-1.5 w-full gap-0.5" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
            <span
                key={index}
                className={twMerge(
                    "h-full flex-1 rounded-full transition-colors duration-500",
                    index < done ? "bg-accent" : "bg-wash",
                )}
            />
        ))}
    </div>
);

export const ChecklistShell = ({
    title,
    status,
    actions,
    children,
}: {
    title: React.ReactNode;
    status?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="min-w-0">
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h3 className="label text-ink">{title}</h3>
            {actions && <div className="-my-1 flex flex-wrap items-center gap-1.5">{actions}</div>}
        </div>
        {status && <div className="mt-1 text-sm tabular-nums">{status}</div>}
        <div className="mt-3">{children}</div>
    </div>
);

export const ChecklistEmpty = ({ children }: { children: React.ReactNode }) => (
    <p className="border-rule text-ink-faint rounded-2xl border border-dashed px-4 py-6 text-center text-sm">
        {children}
    </p>
);

export const EssentialsChecklist = ({
    nextMonth = false,
    actions,
}: {
    nextMonth?: boolean;
    actions?: React.ReactNode;
}) => {
    const t = useTranslations("possible");
    const tMenu = useTranslations("rowMenu");
    const tDialogs = useTranslations("dialogs");
    const tCategories = useTranslations("categories");
    const planMeta = usePlanMeta();
    const locale = useLocale();
    const store = useStore();
    const [selectedEssential, setSelectedEssential] = useState<EssentialType | null>(null);
    const { mutateAsync: newEssentialAsync } = useNewEssential();
    const { mutateAsync: removeEssentialAsync } = useRemoveEssential();

    const items = nextMonth ? store.nextMonthEssentialsArray : store.essentialsArray;
    const symbol = getCurrencySymbol(store.userCurrency);

    const paidCount = items.filter((item) => item.checked).length;
    const outstanding = items.reduce((sum, item) => (item.checked ? sum : sum + item.amount), 0);
    const planOnly = nextMonth;

    const type = nextMonth ? EssentialsType.NEXT_MONTH : EssentialsType.THIS_MONTH;
    const ordered = [...items].sort((a, b) => (a.day ?? 32) - (b.day ?? 32));

    const sameTitle = (list: EssentialType[], item: EssentialType) =>
        list.some((other) => other.title.trim().toLowerCase() === item.title.trim().toLowerCase());

    const planCopy = (item: EssentialType): EssentialType => ({
        id: uuidv4(),
        title: item.title,
        amount: item.amount,
        checked: false,
        ...(item.category ? { category: item.category } : {}),
        ...(item.currency && item.currencyAmount
            ? { currency: item.currency, currencyAmount: item.currencyAmount }
            : {}),
        ...(item.day ? { day: item.day } : {}),
        ...(item.fundedBy ? { fundedBy: item.fundedBy } : {}),
    });

    const addToTemplate = async (item: EssentialType) => {
        try {
            const res = await newEssentialAsync({ type: EssentialsType.DEFAULT, item: planCopy(item) });
            store.setDefaultEssentialsArray(res.updatedItems);
            toast.success(t("addedToTemplate"));
        } catch (error) {
            console.error(error);
            toast.error(tDialogs("occurred"));
        }
    };

    const moveToNextMonth = async (item: EssentialType) => {
        try {
            const added = await newEssentialAsync({ type: EssentialsType.NEXT_MONTH, item: planCopy(item) });
            store.setNextMonthEssentialsArray(added.updatedItems);
            const removed = await removeEssentialAsync({ type: EssentialsType.THIS_MONTH, id: item.id });
            store.setEssentialsArray(removed.updatedItems);
            toast.success(t("movedToNextMonth"));
        } catch (error) {
            console.error(error);
            toast.error(tDialogs("occurred"));
        }
    };

    const planActions = (item: EssentialType) => [
        ...(!nextMonth && !item.checked
            ? [
                  {
                      key: "next-month",
                      label: t("moveToNextMonth"),
                      icon: <CalendarArrowUpIcon />,
                      onSelect: () => moveToNextMonth(item),
                  },
              ]
            : []),
        ...(sameTitle(store.defaultEssentialsArray, item)
            ? []
            : [
                  {
                      key: "template",
                      label: t("addToTemplate"),
                      icon: <LayoutTemplateIcon />,
                      onSelect: () => addToTemplate(item),
                  },
              ]),
    ];

    if (!items.length) {
        return (
            <ChecklistShell title={t("essentialsTitle")} actions={actions}>
                <ChecklistEmpty>{t("noEssentials")}</ChecklistEmpty>
            </ChecklistShell>
        );
    }

    return (
        <ChecklistShell
            title={
                planOnly
                    ? t("plannedPayments", { total: items.length })
                    : t("essentialsProgress", { paid: paidCount, total: items.length })
            }
            actions={actions}
            status={
                planOnly ? (
                    <span className="flex flex-col gap-1">
                        <span>
                            <span className="text-ink-muted">{t("plannedTotal")}: </span>
                            <span className="font-medium">
                                <AnimatedMoney value={outstanding} symbol={symbol} />
                            </span>
                        </span>
                        <span className="text-ink-faint font-mono text-2xs">{t("payFromMonthStart")}</span>
                    </span>
                ) : outstanding > 0 ? (
                    <span>
                        <span className="text-ink-muted">{t("stillToPay")}: </span>
                        <span className="font-medium">
                            <AnimatedMoney value={outstanding} symbol={symbol} />
                        </span>
                    </span>
                ) : (
                    <span className="text-good">{t("allPaid")}</span>
                )
            }
        >
            {!planOnly && <SegmentBar done={paidCount} total={items.length} />}

            <ul className="border-rule mt-3 border-t">
                {ordered.map((item) => (
                    <RowMenu
                        key={item.id}
                        title={item.title}
                        actions={[
                            ...(planOnly && !item.checked
                                ? []
                                : [
                                      {
                                          key: "pay",
                                          label: item.checked ? tMenu("undoPayment") : tMenu("markPaid"),
                                          icon: item.checked ? <Undo2Icon /> : <CircleCheckIcon />,
                                          onSelect: () => setSelectedEssential(item),
                                      },
                                  ]),
                            ...planActions(item),
                        ]}
                        onEdit={
                            item.checked
                                ? undefined
                                : () =>
                                      requestListAction(
                                          nextMonth ? "nextMonthEssentials" : "essentials",
                                          "edit",
                                          item.id,
                                      )
                        }
                        onRemove={
                            item.checked
                                ? undefined
                                : () =>
                                      requestListAction(
                                          nextMonth ? "nextMonthEssentials" : "essentials",
                                          "remove",
                                          item.id,
                                      )
                        }
                        copyValue={toMoneyInput(item.checked ? (item.paidAmount ?? item.amount) : item.amount)}
                    >
                        <li className="border-rule data-[state=open]:bg-surface border-b">
                            <label
                                className={twMerge(
                                    "hover:bg-surface flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors",
                                    planOnly && !item.checked && "cursor-default",
                                )}
                            >
                                {planOnly && !item.checked ? (
                                    <span
                                        className="flex size-4 shrink-0 items-center justify-center"
                                        aria-hidden="true"
                                    >
                                        <span className="bg-ink-faint size-1.5 rounded-full" />
                                    </span>
                                ) : (
                                    <Checkbox
                                        checked={item.checked}
                                        onCheckedChange={() => setSelectedEssential(item)}
                                    />
                                )}
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={twMerge(
                                            "block truncate text-sm transition-colors",
                                            item.checked && "text-ink-faint line-through",
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                    {(item.category || item.day || item.fundedBy) && (
                                        <span className="text-ink-faint mt-0.5 block text-xs">
                                            {getCategoryLabel(item.category || "essentials", tCategories)}
                                            {planMeta(item)}
                                        </span>
                                    )}
                                    {!planOnly &&
                                        !item.checked &&
                                        item.day &&
                                        paydayStatus(item.day) !== "upcoming" && (
                                            <span
                                                className={twMerge(
                                                    "mt-0.5 block text-xs",
                                                    paydayStatus(item.day) === "late" ? "text-signal" : "text-accent",
                                                )}
                                            >
                                                {paydayStatus(item.day) === "late"
                                                    ? t("billOverdue", { day: item.day })
                                                    : t("billDueToday")}
                                            </span>
                                        )}
                                    {item.carriedFrom && !item.checked && (
                                        <span className="text-signal mt-0.5 block text-xs">
                                            {t("carriedFrom", { month: formatMonthKey(item.carriedFrom, locale) })}
                                        </span>
                                    )}
                                </span>
                                <span className="shrink-0 text-right">
                                    <span
                                        className={twMerge(
                                            "block font-mono text-xs tabular-nums transition-colors",
                                            item.checked ? "text-ink-faint" : "text-ink",
                                        )}
                                    >
                                        {isForeignAmount(item, store.userCurrency)
                                            ? `${formatCurrency(item.currencyAmount)} ${getCurrencySymbol(item.currency)}`
                                            : `${formatCurrency(item.checked ? (item.paidAmount ?? item.amount) : item.amount)} ${symbol}`}
                                    </span>
                                    {!item.checked && isForeignAmount(item, store.userCurrency) && (
                                        <span className="text-ink-faint block font-mono text-3xs tabular-nums">
                                            ≈ {formatCurrency(item.amount)} {symbol}
                                        </span>
                                    )}
                                    {item.checked && isForeignAmount(item, store.userCurrency) && (
                                        <span className="text-ink-faint block font-mono text-3xs tabular-nums">
                                            {t("paidEquivalent", {
                                                amount: formatCurrency(item.paidAmount ?? item.amount),
                                                currency: symbol,
                                            })}
                                        </span>
                                    )}
                                    {item.checked &&
                                        !isForeignAmount(item, store.userCurrency) &&
                                        item.paidAmount !== undefined &&
                                        item.paidAmount !== item.amount && (
                                            <span className="text-ink-faint block font-mono text-3xs tabular-nums">
                                                {t("plannedAmount", {
                                                    amount: formatCurrency(item.amount),
                                                    currency: symbol,
                                                })}
                                            </span>
                                        )}
                                </span>
                            </label>
                        </li>
                    </RowMenu>
                ))}
            </ul>
            <EssentialPaymentDialog
                essential={selectedEssential}
                type={type}
                open={Boolean(selectedEssential)}
                onOpenChange={(open) => {
                    if (!open) setSelectedEssential(null);
                }}
            />
        </ChecklistShell>
    );
};
