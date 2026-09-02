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
    X,
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
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
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
import { calculateSavingsPace, convertSavingsCurrency, getSavingsBalance, getSavingsNativeBalance } from "lib/savings";
import { getCurrencySymbol } from "lib/currency";
import { GetDataProvider } from "providers/get-data";
import { PrivateProvider } from "providers/auth";
import useBankStore from "store/bank";
import useStore from "store/general";
import { SavingsGoal, SavingsOperationType, SavingsStorage } from "types/transactions";

type DeleteTarget =
    | {
          kind: "goal";
          id: string;
          label: string;
          currency: CURRENCY;
          targetAmount: number;
      }
    | {
          kind: "operation";
          id: string;
          label: string;
          linkedToBalance?: boolean;
      }
    | null;

type GoalDeletionMode = "delete-only" | "purchased";

type PurchaseDeductionDraft = {
    id: string;
    storage: SavingsStorage;
    currency: CURRENCY;
    amount: string;
};

const SAVINGS_CURRENCIES = [CURRENCY.UAH, CURRENCY.USD, CURRENCY.EUR] as const;

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
    const [goalDeletionMode, setGoalDeletionMode] = useState<GoalDeletionMode>("delete-only");
    const [purchaseDeductions, setPurchaseDeductions] = useState<PurchaseDeductionDraft[]>([]);

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

    const nativeSummary = useMemo(() => {
        const byStorage = (storage?: SavingsStorage) =>
            Object.fromEntries(
                SAVINGS_CURRENCIES.map((currency) => [
                    currency,
                    getSavingsNativeBalance(store.savingsOperations, currency, storage),
                ]),
            ) as Record<CURRENCY, number>;

        return {
            saved: byStorage(),
            card: byStorage(SavingsStorage.CARD),
            cash: byStorage(SavingsStorage.CASH),
        };
    }, [store.savingsOperations]);

    const displayMoney = (value: number | null) =>
        value === null ? t("ratesUnavailable") : `${formatCurrency(value)} ${getCurrencySymbol(store.userCurrency)}`;
    const nativeMoney = (value: number, currency: CURRENCY) =>
        `${formatCurrency(value)} ${getCurrencySymbol(currency)}`;
    const currencyBreakdown = (balances: Record<CURRENCY, number>) => (
        <div className="mt-3 border-t border-border/60 pt-2.5">
            <p className="mb-1.5 text-[0.62rem] font-semibold tracking-[0.08em] uppercase">{t("actualByCurrency")}</p>
            <div className="grid grid-cols-3 gap-1.5">
                {SAVINGS_CURRENCIES.map((currency) => {
                    const amount = Math.max(balances[currency], 0);

                    return (
                        <div
                            key={currency}
                            title={nativeMoney(amount, currency)}
                            className="bg-muted/55 min-w-0 rounded-lg px-2 py-1.5"
                        >
                            <p className="text-[0.62rem] font-semibold tracking-wide uppercase">{currency}</p>
                            <p className="text-foreground truncate text-xs font-semibold">
                                {nativeMoney(amount, currency)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    const hasConvertedCurrencies = (balances: Record<CURRENCY, number>) =>
        SAVINGS_CURRENCIES.some(
            (currency) => currency !== store.userCurrency && Math.abs(balances[currency]) > Number.EPSILON,
        );
    const summaryValue = (value: number | null, balances: Record<CURRENCY, number>) => {
        const formatted = displayMoney(value);
        return value !== null && hasConvertedCurrencies(balances) ? `≈ ${formatted}` : formatted;
    };
    const summaryDetails = (hint: string, balances: Record<CURRENCY, number>) => (
        <>
            <p>{hint}</p>
            {currencyBreakdown(balances)}
        </>
    );

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

    const openGoalDelete = (goal: SavingsGoal) => {
        const preferredStorage =
            nativeSummary.card[goal.currency] >= goal.targetAmount ||
            nativeSummary.card[goal.currency] >= nativeSummary.cash[goal.currency]
                ? SavingsStorage.CARD
                : SavingsStorage.CASH;
        setGoalDeletionMode("delete-only");
        setPurchaseDeductions([
            {
                id: crypto.randomUUID(),
                storage: preferredStorage,
                currency: goal.currency,
                amount: String(goal.targetAmount),
            },
        ]);
        setDeleteTarget({
            kind: "goal",
            id: goal.id,
            label: goal.name,
            currency: goal.currency,
            targetAmount: goal.targetAmount,
        });
    };

    const closeDeleteDialog = () => {
        setDeleteTarget(null);
        setGoalDeletionMode("delete-only");
        setPurchaseDeductions([]);
    };

    const getPurchaseBalance = (deduction: Pick<PurchaseDeductionDraft, "storage" | "currency">) =>
        nativeSummary[deduction.storage === SavingsStorage.CARD ? "card" : "cash"][deduction.currency];
    const getDeductionTotal = (deduction: PurchaseDeductionDraft) =>
        purchaseDeductions
            .filter((item) => item.storage === deduction.storage && item.currency === deduction.currency)
            .reduce((total, item) => total + (Number(item.amount) || 0), 0);
    const isDeductionInvalid = (deduction: PurchaseDeductionDraft) => {
        const amount = Number(deduction.amount);
        return !Number.isFinite(amount) || amount <= 0 || getDeductionTotal(deduction) > getPurchaseBalance(deduction);
    };
    const hasInvalidDeductionAmount = (deduction: PurchaseDeductionDraft) => {
        const amount = Number(deduction.amount);
        return !Number.isFinite(amount) || amount <= 0;
    };
    const invalidPurchase =
        goalDeletionMode === "purchased" &&
        (purchaseDeductions.length === 0 || purchaseDeductions.some(isDeductionInvalid));

    const updateDeduction = (id: string, update: Partial<PurchaseDeductionDraft>) => {
        setPurchaseDeductions((current) =>
            current.map((deduction) => (deduction.id === id ? { ...deduction, ...update } : deduction)),
        );
    };

    const addPurchaseSource = () => {
        const combinations = [SavingsStorage.CARD, SavingsStorage.CASH].flatMap((storage) =>
            SAVINGS_CURRENCIES.map((currency) => ({ storage, currency })),
        );
        const unused = combinations.find(
            (combination) =>
                !purchaseDeductions.some(
                    (item) => item.storage === combination.storage && item.currency === combination.currency,
                ),
        );
        const fallbackCurrency = deleteTarget?.kind === "goal" ? deleteTarget.currency : CURRENCY.UAH;

        setPurchaseDeductions((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                storage: unused?.storage ?? SavingsStorage.CASH,
                currency: unused?.currency ?? fallbackCurrency,
                amount: "",
            },
        ]);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            const response =
                deleteTarget.kind === "goal"
                    ? await deleteGoal({
                          id: deleteTarget.id,
                          data:
                              goalDeletionMode === "purchased"
                                  ? {
                                        purchasedWithSavings: true,
                                        deductions: purchaseDeductions.map((deduction) => ({
                                            storage: deduction.storage,
                                            currency: deduction.currency,
                                            amount: Number(deduction.amount),
                                        })),
                                        date: new Date().toISOString(),
                                    }
                                  : { purchasedWithSavings: false },
                      })
                    : await deleteOperation(deleteTarget.id);
            store.setSavingsGoals(response.updatedGoals);
            store.setSavingsOperations(response.updatedOperations);
            if (response.updatedTransactions) store.setTransactions(response.updatedTransactions);
            if (response.updatedTotals) {
                store.setTotalAmount(response.updatedTotals.totalAmount);
                store.setTotalIncome(response.updatedTotals.totalIncome);
                store.setTotalSpend(response.updatedTotals.totalSpend);
            }
            toast.success(
                deleteTarget.kind === "goal" && goalDeletionMode === "purchased"
                    ? t("goalPurchased")
                    : deleteTarget.kind === "goal"
                      ? t("goalDeleted")
                      : t("operationDeleted"),
            );
            closeDeleteDialog();
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
                                value={summaryValue(summary.saved, nativeSummary.saved)}
                                secondary={summaryDetails(t("sharedPoolHint"), nativeSummary.saved)}
                                hint={t("equivalentIn", { currency: store.userCurrency.toUpperCase() })}
                            />
                            <StatCard
                                label={t("card")}
                                value={summaryValue(summary.card, nativeSummary.card)}
                                secondary={summaryDetails(t("bankHint"), nativeSummary.card)}
                            />
                            <StatCard
                                label={t("cash")}
                                value={summaryValue(summary.cash, nativeSummary.cash)}
                                secondary={summaryDetails(t("cashHint"), nativeSummary.cash)}
                            />
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
                                                            onClick={() => openGoalDelete(goal)}
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
                                                        {operation.type !== SavingsOperationType.TRANSFER
                                                            ? ` · ${t(
                                                                  operation.linkedTransactionId
                                                                      ? "mainBalanceLinked"
                                                                      : "outsideBalanceLinked",
                                                              )}`
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
                                                            linkedToBalance: Boolean(operation.linkedTransactionId),
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

                <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && closeDeleteDialog()}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{t("deleteTitle")}</DialogTitle>
                            <DialogDescription>
                                {deleteTarget?.kind === "goal"
                                    ? t("deleteGoalWarning", { name: deleteTarget.label })
                                    : t(
                                          deleteTarget?.linkedToBalance
                                              ? "deleteOperationWarning"
                                              : "deleteExternalOperationWarning",
                                      )}
                            </DialogDescription>
                        </DialogHeader>
                        {deleteTarget?.kind === "goal" && (
                            <div className="space-y-4">
                                <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
                                    {(["delete-only", "purchased"] as const).map((mode) => (
                                        <button
                                            key={mode}
                                            type="button"
                                            role="radio"
                                            aria-checked={goalDeletionMode === mode}
                                            onClick={() => setGoalDeletionMode(mode)}
                                            className={twMerge(
                                                "rounded-xl border p-3 text-left transition-colors",
                                                goalDeletionMode === mode
                                                    ? "border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/10"
                                                    : "border-border hover:bg-muted/60",
                                            )}
                                        >
                                            <span className="block text-sm font-semibold">
                                                {t(mode === "purchased" ? "purchasedWithSavings" : "deleteOnly")}
                                            </span>
                                            <span className="text-muted-foreground mt-1 block text-xs">
                                                {t(
                                                    mode === "purchased"
                                                        ? "purchasedWithSavingsHint"
                                                        : "deleteOnlyHint",
                                                )}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {goalDeletionMode === "purchased" && (
                                    <div className="bg-muted/45 space-y-3 rounded-xl border p-3.5">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold">{t("purchaseBreakdown")}</p>
                                                <p className="text-muted-foreground mt-0.5 text-xs">
                                                    {t("purchaseGoalAmount", {
                                                        amount: nativeMoney(
                                                            deleteTarget.targetAmount,
                                                            deleteTarget.currency,
                                                        ),
                                                    })}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="whitespace-nowrap"
                                                onClick={addPurchaseSource}
                                            >
                                                <Plus />
                                                {t("addPurchaseSource")}
                                            </Button>
                                        </div>

                                        <div className="space-y-2.5">
                                            {purchaseDeductions.map((deduction, index) => {
                                                const deductionInvalid = isDeductionInvalid(deduction);
                                                const available = Math.max(getPurchaseBalance(deduction), 0);

                                                return (
                                                    <div
                                                        key={deduction.id}
                                                        className="bg-background/70 rounded-xl border p-3"
                                                    >
                                                        <div className="grid items-end gap-2 sm:grid-cols-[1fr_0.8fr_1fr_auto]">
                                                            <div className="space-y-1.5">
                                                                <Label>{t("purchaseSource")}</Label>
                                                                <Select
                                                                    value={deduction.storage}
                                                                    onValueChange={(value: SavingsStorage) =>
                                                                        updateDeduction(deduction.id, {
                                                                            storage: value,
                                                                        })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value={SavingsStorage.CARD}>
                                                                            {t("card")}
                                                                        </SelectItem>
                                                                        <SelectItem value={SavingsStorage.CASH}>
                                                                            {t("cash")}
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label>{t("purchaseCurrency")}</Label>
                                                                <Select
                                                                    value={deduction.currency}
                                                                    onValueChange={(value: CURRENCY) =>
                                                                        updateDeduction(deduction.id, {
                                                                            currency: value,
                                                                        })
                                                                    }
                                                                >
                                                                    <SelectTrigger className="w-full uppercase">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {SAVINGS_CURRENCIES.map((currency) => (
                                                                            <SelectItem key={currency} value={currency}>
                                                                                {currency.toUpperCase()}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1.5">
                                                                <Label htmlFor={`goal-purchase-amount-${deduction.id}`}>
                                                                    {t("purchaseAmount")}
                                                                </Label>
                                                                <Input
                                                                    id={`goal-purchase-amount-${deduction.id}`}
                                                                    inputMode="decimal"
                                                                    value={deduction.amount}
                                                                    aria-invalid={deductionInvalid}
                                                                    onChange={(event) => {
                                                                        const value = event.target.value.replace(
                                                                            ",",
                                                                            ".",
                                                                        );
                                                                        if (
                                                                            value === "" ||
                                                                            /^(0|[1-9]\d*)(\.\d{0,2})?$/.test(value)
                                                                        ) {
                                                                            updateDeduction(deduction.id, {
                                                                                amount: value,
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            {purchaseDeductions.length > 1 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    aria-label={t("removePurchaseSource")}
                                                                    className="text-muted-foreground hover:text-rose-500"
                                                                    onClick={() =>
                                                                        setPurchaseDeductions((current) =>
                                                                            current.filter(
                                                                                (item) => item.id !== deduction.id,
                                                                            ),
                                                                        )
                                                                    }
                                                                >
                                                                    <X />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <p
                                                            className={twMerge(
                                                                "mt-2 text-xs",
                                                                deductionInvalid
                                                                    ? "text-rose-500"
                                                                    : "text-muted-foreground",
                                                            )}
                                                        >
                                                            {hasInvalidDeductionAmount(deduction)
                                                                ? t("enterPurchaseAmount")
                                                                : deductionInvalid
                                                                  ? t("notEnoughForPurchase", {
                                                                        amount: nativeMoney(
                                                                            available,
                                                                            deduction.currency,
                                                                        ),
                                                                    })
                                                                  : t("availableForPurchase", {
                                                                        amount: nativeMoney(
                                                                            available,
                                                                            deduction.currency,
                                                                        ),
                                                                    })}
                                                        </p>
                                                        <span className="sr-only">
                                                            {t("purchaseSourceNumber", { number: index + 1 })}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">{t("cancel")}</Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                disabled={deletePending || invalidPurchase}
                                onClick={confirmDelete}
                            >
                                {deleteTarget?.kind === "goal" && goalDeletionMode === "purchased"
                                    ? t("deleteAndDeduct")
                                    : t("delete")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default SavingsPage;
