"use client";

import dayjs from "dayjs";
import {
    ArrowDownToLine,
    ArrowLeftRight,
    ArrowUpFromLine,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
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
import { Section } from "components/wrappers/section";
import { CURRENCY } from "constants/index";
import { formatCurrency } from "lib/utils";
import { calculateSavingsPace, convertSavingsCurrency, getSavingsBalance } from "lib/savings";
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
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

    const usdToUah = bank.usd?.rateBuy ?? 0;
    const eurToUah = bank.eur?.rateBuy ?? 0;
    const rates = useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);

    const summary = useMemo(() => {
        return {
            saved: getSavingsBalance(store.savingsOperations, store.userCurrency, rates),
            cash: getSavingsBalance(store.savingsOperations, store.userCurrency, rates, SavingsStorage.CASH),
            card: getSavingsBalance(store.savingsOperations, store.userCurrency, rates, SavingsStorage.CARD),
        };
    }, [rates, store.savingsOperations, store.userCurrency]);

    const displayMoney = (value: number | null) =>
        value === null ? t("ratesUnavailable") : `${formatCurrency(value)} ${getCurrencySymbol(store.userCurrency)}`;
    const nativeMoney = (value: number, currency: CURRENCY) =>
        `${formatCurrency(value)} ${getCurrencySymbol(currency)}`;

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

    const openOperation = () => setOperationDialogOpen(true);

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const response =
                deleteTarget.kind === "goal"
                    ? await deleteGoal(deleteTarget.id)
                    : await deleteOperation(deleteTarget.id);
            store.setSavingsGoals(response.updatedGoals);
            store.setSavingsOperations(response.updatedOperations);
            if (response.updatedTransactions) store.setTransactions(response.updatedTransactions);
            if (response.updatedTotals) {
                store.setTotalAmount(response.updatedTotals.totalAmount);
                store.setTotalIncome(response.updatedTotals.totalIncome);
                store.setTotalSpend(response.updatedTotals.totalSpend);
            }
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
                                <Button variant="secondary" onClick={() => openOperation()}>
                                    <ArrowDownToLine />
                                    {t("addOperation")}
                                </Button>
                                <Button onClick={openNewGoal}>
                                    <Plus />
                                    {t("newGoal")}
                                </Button>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <StatCard
                                label={t("saved")}
                                value={displayMoney(summary.saved)}
                                secondary={t("sharedPoolHint")}
                            />
                            <StatCard label={t("card")} value={displayMoney(summary.card)} secondary={t("bankHint")} />
                            <StatCard label={t("cash")} value={displayMoney(summary.cash)} secondary={t("cashHint")} />
                        </div>

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
                                        const sharedSavings = getSavingsBalance(
                                            store.savingsOperations,
                                            goal.currency,
                                            rates,
                                        );
                                        const saved = Math.max(sharedSavings ?? 0, 0);
                                        const covered = Math.min(saved, goal.targetAmount);
                                        const missing = Math.max(goal.targetAmount - saved, 0);
                                        const afterPurchase = Math.max(saved - goal.targetAmount, 0);
                                        const canAfford = sharedSavings !== null && saved >= goal.targetAmount;
                                        const savingsPace = calculateSavingsPace(missing, goal.targetDate);
                                        const monthlyContribution =
                                            savingsPace && !savingsPace.isOverdue
                                                ? savingsPace.monthlyAmount
                                                : goal.monthlyContribution;
                                        const progress =
                                            goal.targetAmount > 0
                                                ? Math.min((covered / goal.targetAmount) * 100, 100)
                                                : 0;
                                        const comparisonCurrency =
                                            goal.currency === CURRENCY.UAH
                                                ? bank.currency === CURRENCY.UAH
                                                    ? CURRENCY.USD
                                                    : (bank.currency as CURRENCY)
                                                : CURRENCY.UAH;
                                        const convertedTarget = convertSavingsCurrency(
                                            goal.targetAmount,
                                            goal.currency,
                                            comparisonCurrency,
                                            rates,
                                        );

                                        return (
                                            <article
                                                key={goal.id}
                                                className="border-border bg-card rounded-2xl border p-5 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold">{goal.name}</h3>
                                                        <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                                                            {nativeMoney(goal.targetAmount, goal.currency)}
                                                        </p>
                                                        {convertedTarget !== null && (
                                                            <p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                                                                ≈ {nativeMoney(convertedTarget, comparisonCurrency)}
                                                            </p>
                                                        )}
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

                                                <div
                                                    className={twMerge(
                                                        "mt-4 flex items-start gap-3 rounded-xl border p-3.5",
                                                        canAfford
                                                            ? "border-emerald-500/20 bg-emerald-500/[0.07]"
                                                            : "border-indigo-500/20 bg-indigo-500/[0.06]",
                                                    )}
                                                >
                                                    <CheckCircle2
                                                        className={twMerge(
                                                            "mt-0.5 size-4 shrink-0",
                                                            canAfford
                                                                ? "text-emerald-600 dark:text-emerald-300"
                                                                : "text-indigo-600 dark:text-indigo-300",
                                                        )}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium">
                                                            {sharedSavings === null
                                                                ? t("ratesUnavailable")
                                                                : canAfford
                                                                  ? t("canAfford")
                                                                  : t("savingsCover", {
                                                                        amount: nativeMoney(covered, goal.currency),
                                                                        percent: Math.round(progress),
                                                                    })}
                                                        </p>
                                                        {sharedSavings !== null && (
                                                            <p className="text-muted-foreground mt-0.5 text-xs">
                                                                {canAfford
                                                                    ? t("afterPurchase", {
                                                                          amount: nativeMoney(
                                                                              afterPurchase,
                                                                              goal.currency,
                                                                          ),
                                                                      })
                                                                    : t("stillNeeded", {
                                                                          amount: nativeMoney(missing, goal.currency),
                                                                      })}
                                                            </p>
                                                        )}
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
                                                            amount: nativeMoney(monthlyContribution, goal.currency),
                                                        })}
                                                    </span>
                                                    <span className="flex items-center gap-2 sm:justify-end">
                                                        <CalendarClock className="size-3.5" />
                                                        {goal.targetDate
                                                            ? dayjs(goal.targetDate).format("DD.MM.YYYY")
                                                            : t("noDeadline")}
                                                    </span>
                                                </div>
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
                                                        {t("sharedSavings")} · {t(operation.storage)}
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

                <SavingsGoalDialog open={goalDialogOpen} goal={editingGoal} onOpenChange={setGoalDialogOpen} />
                <SavingsOperationDialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen} />

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
