"use client";

import dayjs from "dayjs";
import {
    ArrowDownToLine,
    ArrowLeftRight,
    ArrowUpFromLine,
    Banknote,
    CalendarClock,
    CalendarDays,
    CreditCard,
    Pencil,
    PiggyBank,
    Plus,
    Target,
    Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

import { useDeleteSavingsGoal, useDeleteSavingsOperation } from "api/main";
import { Navbar } from "components/navbar";
import { SavingsGoalDialog } from "components/savings/goal-dialog";
import { SavingsOperationDialog } from "components/savings/operation-dialog";
import { StatCard } from "components/stat-card";
import { Button } from "components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "components/ui/dialog";
import { Section, StatGrid } from "components/wrappers/section";
import { CURRENCY } from "constants/index";
import { formatCurrency } from "lib/utils";
import { calculateSavingsPace, convertSavingsCurrency, getGoalSaved, getStorageBalance } from "lib/savings";
import { getCurrencySymbol } from "lib/currency";
import { GetDataProvider } from "providers/get-data";
import { PrivateProvider } from "providers/auth";
import useBankStore from "store/bank";
import useStore from "store/general";
import { SavingsGoal, SavingsOperationType, SavingsStorage } from "types/transactions";

type DeleteTarget = {
    kind: "goal" | "operation";
    id: string;
    label: string;
} | null;

const SavingsPage = () => {
    const t = useTranslations("savings");
    const store = useStore();
    const bank = useBankStore();
    const { mutateAsync: deleteGoal, isPending: deletingGoal } = useDeleteSavingsGoal();
    const { mutateAsync: deleteOperation, isPending: deletingOperation } = useDeleteSavingsOperation();

    const [goalDialogOpen, setGoalDialogOpen] = useState(false);
    const [operationDialogOpen, setOperationDialogOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [operationGoalId, setOperationGoalId] = useState<string>();
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const usdToUah = bank.usd?.rateBuy ?? 0;
    const eurToUah = bank.eur?.rateBuy ?? 0;

    const summary = useMemo(() => {
        const convertPairs = (pairs: Array<{ amount: number; currency: CURRENCY }>) => {
            const converted = pairs.map(({ amount, currency }) =>
                convertSavingsCurrency(amount, currency, store.userCurrency, {
                    usdToUah,
                    eurToUah,
                }),
            );
            return converted.some((value) => value === null)
                ? null
                : (converted as number[]).reduce((total, value) => total + value, 0);
        };

        const saved = store.savingsGoals.map((goal) => ({
            amount: getGoalSaved(store.savingsOperations, goal.id),
            currency: goal.currency,
        }));
        const target = store.savingsGoals.map((goal) => ({
            amount: goal.targetAmount,
            currency: goal.currency,
        }));
        const remaining = store.savingsGoals.map((goal) => ({
            amount: Math.max(goal.targetAmount - getGoalSaved(store.savingsOperations, goal.id), 0),
            currency: goal.currency,
        }));
        const monthly = store.savingsGoals.map((goal) => {
            const savedAmount = getGoalSaved(store.savingsOperations, goal.id);
            const pace = calculateSavingsPace(
                Math.max(goal.targetAmount - savedAmount, 0),
                goal.targetDate,
            );

            return {
                amount: pace && !pace.isOverdue ? pace.monthlyAmount : goal.monthlyContribution,
                currency: goal.currency,
            };
        });
        const cash = store.savingsGoals.map((goal) => ({
            amount: getStorageBalance(store.savingsOperations, SavingsStorage.CASH, goal.id),
            currency: goal.currency,
        }));
        const card = store.savingsGoals.map((goal) => ({
            amount: getStorageBalance(store.savingsOperations, SavingsStorage.CARD, goal.id),
            currency: goal.currency,
        }));

        return {
            saved: convertPairs(saved),
            target: convertPairs(target),
            remaining: convertPairs(remaining),
            monthly: convertPairs(monthly),
            cash: convertPairs(cash),
            card: convertPairs(card),
        };
    }, [eurToUah, store.savingsGoals, store.savingsOperations, store.userCurrency, usdToUah]);

    const displayMoney = (value: number | null) =>
        value === null ? t("ratesUnavailable") : `${formatCurrency(value)} ${getCurrencySymbol(store.userCurrency)}`;
    const nativeMoney = (value: number, currency: CURRENCY) =>
        `${formatCurrency(value)} ${getCurrencySymbol(currency)}`;

    const storageTotal = (summary.cash ?? 0) + (summary.card ?? 0);
    const cashShare = storageTotal > 0 && summary.cash !== null ? (summary.cash / storageTotal) * 100 : 0;
    const recentOperations = [...store.savingsOperations]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

    const openNewGoal = () => {
        setEditingGoal(null);
        setGoalDialogOpen(true);
    };

    const openEditGoal = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setGoalDialogOpen(true);
    };

    const openOperation = (goalId?: string) => {
        setOperationGoalId(goalId);
        setOperationDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const response =
                deleteTarget.kind === "goal"
                    ? await deleteGoal(deleteTarget.id)
                    : await deleteOperation(deleteTarget.id);
            store.setSavingsGoals(response.updatedGoals);
            store.setSavingsOperations(response.updatedOperations);
            toast.success(deleteTarget.kind === "goal" ? t("goalDeleted") : t("operationDeleted"));
            setDeleteTarget(null);
        } catch {
            // The shared API error handler already shows the server message.
        }
    };

    const deletePending = deletingGoal || deletingOperation;

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />

                <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-24 sm:px-6">
                    <div className="rise-stagger flex w-full flex-col gap-10">
                        <header className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                                    <PiggyBank className="size-5" />
                                    <span className="text-xs font-semibold tracking-[0.12em] uppercase">
                                        {t("eyebrow")}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
                                <p className="text-muted-foreground mt-1 max-w-2xl text-sm">{t("subtitle")}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="secondary"
                                    disabled={store.savingsGoals.length === 0}
                                    onClick={() => openOperation()}
                                >
                                    <ArrowDownToLine />
                                    {t("addOperation")}
                                </Button>
                                <Button onClick={openNewGoal}>
                                    <Plus />
                                    {t("newGoal")}
                                </Button>
                            </div>
                        </header>

                        <StatGrid>
                            <StatCard label={t("saved")} value={displayMoney(summary.saved)} />
                            <StatCard label={t("target")} value={displayMoney(summary.target)} />
                            <StatCard label={t("remaining")} value={displayMoney(summary.remaining)} />
                            <StatCard
                                label={t("monthlyPlan")}
                                value={displayMoney(summary.monthly)}
                                secondary={
                                    store.savingsGoals.length > 0
                                        ? t("goalsCount", { count: store.savingsGoals.length })
                                        : undefined
                                }
                            />
                        </StatGrid>

                        <Section title={t("whereStored")}>
                            <div className="border-border bg-card grid gap-5 rounded-2xl border p-5 shadow-sm sm:grid-cols-2 sm:p-6">
                                <div className="flex items-center gap-4">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                                        <Banknote className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase">
                                            {t("cash")}
                                        </p>
                                        <p className="mt-0.5 text-xl font-semibold tabular-nums">
                                            {displayMoney(summary.cash)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300">
                                        <CreditCard className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-muted-foreground text-xs font-medium uppercase">
                                            {t("card")}
                                        </p>
                                        <p className="mt-0.5 text-xl font-semibold tabular-nums">
                                            {displayMoney(summary.card)}
                                        </p>
                                    </div>
                                </div>
                                {storageTotal > 0 && summary.cash !== null && summary.card !== null && (
                                    <div className="sm:col-span-2">
                                        <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                                            <span className="bg-emerald-500" style={{ width: `${cashShare}%` }} />
                                            <span className="bg-indigo-500" style={{ width: `${100 - cashShare}%` }} />
                                        </div>
                                        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
                                            <span>{t("cashShare", { value: Math.round(cashShare) })}</span>
                                            <span>{t("cardShare", { value: Math.round(100 - cashShare) })}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Section>

                        <Section
                            title={t("goals")}
                            actions={
                                <Button variant="secondary" size="sm" onClick={openNewGoal}>
                                    <Plus />
                                    {t("newGoal")}
                                </Button>
                            }
                        >
                            {store.savingsGoals.length === 0 ? (
                                <div className="border-border bg-card flex flex-col items-center rounded-2xl border border-dashed px-6 py-14 text-center">
                                    <Target className="mb-4 size-8 text-indigo-500" />
                                    <h2 className="font-semibold">{t("emptyGoalsTitle")}</h2>
                                    <p className="text-muted-foreground mt-1 max-w-md text-sm">{t("emptyGoalsHint")}</p>
                                    <Button className="mt-5" onClick={openNewGoal}>
                                        <Plus />
                                        {t("createFirstGoal")}
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2">
                                    {store.savingsGoals.map((goal) => {
                                        const saved = getGoalSaved(store.savingsOperations, goal.id);
                                        const savingsPace = calculateSavingsPace(
                                            Math.max(goal.targetAmount - saved, 0),
                                            goal.targetDate,
                                        );
                                        const monthlyContribution =
                                            savingsPace && !savingsPace.isOverdue
                                                ? savingsPace.monthlyAmount
                                                : goal.monthlyContribution;
                                        const progress =
                                            goal.targetAmount > 0
                                                ? Math.min((saved / goal.targetAmount) * 100, 100)
                                                : 0;
                                        const hasOperations = store.savingsOperations.some(
                                            (operation) => operation.goalId === goal.id,
                                        );

                                        return (
                                            <article
                                                key={goal.id}
                                                className="border-border bg-card rounded-2xl border p-5 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold">{goal.name}</h3>
                                                        <p className="text-muted-foreground mt-1 text-xs">
                                                            {t("savedOf", {
                                                                saved: nativeMoney(saved, goal.currency),
                                                                target: nativeMoney(goal.targetAmount, goal.currency),
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={t("editGoal")}
                                                            onClick={() => openEditGoal(goal)}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={t("delete")}
                                                            className="hover:bg-rose-500/10 hover:text-rose-500"
                                                            onClick={() =>
                                                                setDeleteTarget({
                                                                    kind: "goal",
                                                                    id: goal.id,
                                                                    label: goal.name,
                                                                })
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="bg-muted mt-4 h-2 overflow-hidden rounded-full">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width]"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <div className="mt-2 flex items-center justify-between text-xs">
                                                    <span className="font-medium">{Math.round(progress)}%</span>
                                                    <span className="text-muted-foreground">
                                                        {nativeMoney(
                                                            Math.max(goal.targetAmount - saved, 0),
                                                            goal.currency,
                                                        )}{" "}
                                                        {t("left")}
                                                    </span>
                                                </div>

                                                <div
                                                    className={twMerge(
                                                        "text-muted-foreground mt-4 grid gap-2 border-t pt-4 text-xs",
                                                        savingsPace && !savingsPace.isOverdue
                                                            ? "sm:grid-cols-3"
                                                            : "sm:grid-cols-2",
                                                    )}
                                                >
                                                    {savingsPace && !savingsPace.isOverdue && (
                                                        <span className="flex items-center gap-2">
                                                            <CalendarDays className="size-3.5" />
                                                            {t("perDay", {
                                                                amount: nativeMoney(
                                                                    savingsPace.dailyAmount,
                                                                    goal.currency,
                                                                ),
                                                            })}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-2">
                                                        <ArrowDownToLine className="size-3.5" />
                                                        {t("perMonth", {
                                                            amount: nativeMoney(
                                                                monthlyContribution,
                                                                goal.currency,
                                                            ),
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-2 sm:justify-end">
                                                        <CalendarClock className="size-3.5" />
                                                        {goal.targetDate
                                                            ? dayjs(goal.targetDate).format("DD.MM.YYYY")
                                                            : t("noDeadline")}
                                                    </span>
                                                </div>

                                                <Button
                                                    variant="secondary"
                                                    className="mt-4 w-full"
                                                    onClick={() => openOperation(goal.id)}
                                                >
                                                    <Plus />
                                                    {t("addMoneyMovement")}
                                                </Button>

                                                <SavingsGoalDialog
                                                    open={goalDialogOpen && editingGoal?.id === goal.id}
                                                    goal={editingGoal}
                                                    currencyLocked={hasOperations}
                                                    onOpenChange={setGoalDialogOpen}
                                                />
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>

                        <Section title={t("recentActivity")}>
                            {recentOperations.length === 0 ? (
                                <div className="border-border bg-card rounded-2xl border px-5 py-10 text-center">
                                    <p className="font-medium">{t("noOperations")}</p>
                                    <p className="text-muted-foreground mt-1 text-sm">{t("noOperationsHint")}</p>
                                </div>
                            ) : (
                                <ul className="border-border bg-card divide-border divide-y rounded-2xl border shadow-sm">
                                    {recentOperations.map((operation) => {
                                        const goal = store.savingsGoals.find(({ id }) => id === operation.goalId);
                                        const isDeposit = operation.type === SavingsOperationType.DEPOSIT;
                                        const isWithdrawal = operation.type === SavingsOperationType.WITHDRAWAL;
                                        const Icon = isDeposit
                                            ? ArrowDownToLine
                                            : isWithdrawal
                                              ? ArrowUpFromLine
                                              : ArrowLeftRight;

                                        return (
                                            <li
                                                key={operation.id}
                                                className="flex items-center gap-3 px-4 py-3.5 sm:px-5"
                                            >
                                                <span
                                                    className={twMerge(
                                                        "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                                        isDeposit &&
                                                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                                                        isWithdrawal &&
                                                            "bg-rose-500/10 text-rose-600 dark:text-rose-300",
                                                        !isDeposit &&
                                                            !isWithdrawal &&
                                                            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
                                                    )}
                                                >
                                                    <Icon className="size-4" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {operation.note || t(operation.type)}
                                                    </p>
                                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                        {goal?.name ?? t("deletedGoal")} · {t(operation.storage)}
                                                        {operation.destinationStorage
                                                            ? ` → ${t(operation.destinationStorage)}`
                                                            : ""}{" "}
                                                        · {dayjs(operation.date).format("DD.MM.YYYY")}
                                                    </p>
                                                </div>
                                                <span
                                                    className={twMerge(
                                                        "shrink-0 text-sm font-semibold tabular-nums",
                                                        isDeposit && "text-emerald-600 dark:text-emerald-300",
                                                        isWithdrawal && "text-rose-600 dark:text-rose-300",
                                                    )}
                                                >
                                                    {isDeposit ? "+" : isWithdrawal ? "−" : ""}
                                                    {nativeMoney(operation.amount, operation.currency)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    aria-label={t("delete")}
                                                    className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            kind: "operation",
                                                            id: operation.id,
                                                            label: operation.note || t(operation.type),
                                                        })
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Section>
                    </div>
                </main>

                <SavingsGoalDialog
                    open={goalDialogOpen && editingGoal === null}
                    goal={null}
                    currencyLocked={false}
                    onOpenChange={setGoalDialogOpen}
                />
                <SavingsOperationDialog
                    open={operationDialogOpen}
                    goals={store.savingsGoals}
                    initialGoalId={operationGoalId}
                    onOpenChange={setOperationDialogOpen}
                />

                <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle>{t("deleteTitle")}</DialogTitle>
                            <DialogDescription>
                                {deleteTarget?.kind === "goal"
                                    ? t("deleteGoalWarning", { name: deleteTarget.label })
                                    : t("deleteOperationWarning")}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("cancel")}</Button>
                            </DialogClose>
                            <Button variant="destructive" disabled={deletePending} onClick={confirmDelete}>
                                {t("delete")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default SavingsPage;
