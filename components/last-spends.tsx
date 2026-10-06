"use client";

import { useCallback, useState, useMemo } from "react";

import { TransactionType, UpdateTransactionPayload } from "types/transactions";
import { createDateString, formatCurrency } from "lib/utils";
import { TransactionEnum } from "constants/index";
import useStore from "store/general";

import { ArrowLeftRight, Download, Pencil, Search, Trash2, X } from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { twMerge } from "lib/tw";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import Cookies from "js-cookie";
import { useClearData, useDeleteTransaction, useUpdateTransaction } from "api/main";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { EditTransactionDialog } from "./dialogs/edit-transaction";
import { ExportReportDialog } from "./dialogs/export-report";
import { getCurrencySymbol } from "lib/currency";
import { CategoryIcon } from "components/categories/category-icon";
import { getCategoryLabel } from "constants/categories";
import { cardIdOf, findCardById, isTransfer, transactionsForCard, transferDirection } from "lib/cards";
import { CardSwatch, useCardName } from "components/cards/card-face";

export const LastSpends = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;

    const userId = Cookies.get("userId") || "";

    const t = useTranslations("transactions");
    const tCategory = useTranslations("categories");
    const tErr = useTranslations("errors");
    const tCards = useTranslations("cards");
    const cardName = useCardName();
    const categoryLabel = useCallback((category: string) => getCategoryLabel(category, tCategory), [tCategory]);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [clearTotalsChck, setClearTotalsChck] = useState<CheckedState>(false);
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);

    const [editingTx, setEditingTx] = useState<TransactionType | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const { mutateAsync: clearDataMutation, isPending: clearDataPending } = useClearData();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();
    const { mutateAsync: updateTransaction } = useUpdateTransaction();

    const ITEMS_PER_PAGE = 10;

    const cardTransactions = useMemo(
        () => transactionsForCard(store.transactions, store.selectedCardId, store.cards),
        [store.cards, store.selectedCardId, store.transactions],
    );
    const showCardColumn = store.cards.length > 1;

    const transferLabel = useCallback(
        (tx: TransactionType) =>
            `${cardName(findCardById(store.cards, tx.cardId))} → ${cardName(findCardById(store.cards, tx.toCardId))}`,
        [cardName, store.cards],
    );

    const filteredTransactions = useMemo(() => {
        return cardTransactions.filter((tx: TransactionType) => {
            if (isTransfer(tx)) {
                const normalized = searchTerm.toLocaleLowerCase();
                return (
                    selectedCategory === "all" &&
                    (tx.description.toLocaleLowerCase().includes(normalized) ||
                        transferLabel(tx).toLocaleLowerCase().includes(normalized))
                );
            }
            const matchesCategory = selectedCategory === "all" || tx.categorie === selectedCategory;
            const normalizedSearch = searchTerm.toLocaleLowerCase();
            const matchesSearch =
                tx.description.toLocaleLowerCase().includes(normalizedSearch) ||
                categoryLabel(tx.categorie).toLocaleLowerCase().includes(normalizedSearch);
            return matchesCategory && matchesSearch;
        });
    }, [cardTransactions, categoryLabel, searchTerm, selectedCategory, transferLabel]);

    const uniqueCategories = [
        ...new Set(cardTransactions.filter((tx) => !isTransfer(tx)).map((tx) => tx.categorie)),
    ].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b)));
    const essentialPaymentTransactionIds = useMemo(
        () =>
            new Set(
                [...store.essentialsArray, ...store.nextMonthEssentialsArray]
                    .map((item) => item.paymentTransactionId)
                    .filter((id): id is string => Boolean(id)),
            ),
        [store.essentialsArray, store.nextMonthEssentialsArray],
    );

    const totalForCategory = useMemo(() => {
        if (selectedCategory === "all") return null;

        return cardTransactions
            .filter((tx) => !isTransfer(tx) && tx.categorie === selectedCategory)
            .reduce((acc, tx) => acc + tx.value, 0);
    }, [cardTransactions, selectedCategory]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setCurrentPage(1);
    };

    const clearDataHandle = async () => {
        if (!userId) {
            toast.error(tErr("noUserId"));
            return;
        }
        const res = await clearDataMutation({ clearTotals: Boolean(clearTotalsChck) });

        if (res.clearedTransactions) {
            store.setTransactions([]);
        }

        if (res.clearedTotals) {
            store.setTotalAmount(0);
            store.setTotalIncome(0);
            store.setTotalSpend(0);
            store.setNextMonthTotalAmount(0);
            if (res.essentialsArray) store.setEssentialsArray(res.essentialsArray);
            if (res.nextMonthEssentialsArray) store.setNextMonthEssentialsArray(res.nextMonthEssentialsArray);
            if (res.expectedIncomes) store.setExpectedIncomes(res.expectedIncomes);
        }
        if (res.updatedSavingsOperations) {
            store.setSavingsOperations(res.updatedSavingsOperations);
        }
        if (res.updatedCards) store.setCards(res.updatedCards);

        if (clearTotalsChck) {
            localStorage.removeItem("currency");
        }

        if (res.message) {
            toast.success(res.message);
        }

        setClearTotalsChck(false);
        setClearDialogOpen(false);
    };

    const paginatedTransactions = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return filteredTransactions.slice(start, end);
    }, [filteredTransactions, currentPage]);

    const handleDeleteTransaction = async (transactionId: string) => {
        const res = await deleteTransaction({ transactionId: transactionId });
        if (res.updatedItems) {
            store.setTransactions(res.updatedItems);
        }

        store.applyServerUpdate(res);
        store.setSavingsOperations(res.updatedSavingsOperations);

        if (res.message) {
            toast.success(res.message);
        }
    };

    if (!cardTransactions.length) {
        return (
            <div className="border-rule border border-dashed px-4 py-10 text-center">
                <p className="text-sm font-medium">{t("noSpends")}</p>
                <p className="text-ink-faint mx-auto mt-1.5 max-w-sm text-sm">{t("noTransactionsHint")}</p>
            </div>
        );
    }

    const symbol = getCurrencySymbol(userCurrency);
    const rows = paginatedTransactions.map((tx, index) => {
        const day = createDateString(new Date(tx.date));
        const previous = paginatedTransactions[index - 1];
        return { tx, day, showDay: !previous || createDateString(new Date(previous.date)) !== day };
    });

    return (
        <div className="w-full">
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search className="text-ink-faint pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                        type="search"
                        enterKeyHint="search"
                        placeholder={t("searchPlaceholder")}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="min-w-0 flex-1 md:w-48 md:flex-none">
                            <SelectValue placeholder={t("allCategories")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("all")}</SelectItem>
                            {uniqueCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {categoryLabel(cat)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        onClick={() => setReportDialogOpen(true)}
                        className="h-11 sm:h-10"
                        aria-label={t("exportPdf")}
                        title={t("exportPdf")}
                    >
                        <Download className="size-3.5" />
                        <span className="hidden lg:inline">{t("exportPdf")}</span>
                    </Button>
                    <ExportReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
                    <Dialog
                        open={clearDialogOpen}
                        onOpenChange={(nextOpen) => {
                            if (!nextOpen) setClearTotalsChck(false);
                            setClearDialogOpen(nextOpen);
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="ghost"
                                className="hover:bg-signal-wash hover:text-signal h-11 sm:h-10"
                                aria-label={t("clearDataTitle")}
                                title={t("clearDataTitle")}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t("clearDataConfirmation")}</DialogTitle>
                                <DialogDescription>{t("clearDataWarning")}</DialogDescription>
                            </DialogHeader>
                            <label className="border-rule flex cursor-pointer items-start gap-3 border p-3">
                                <Checkbox
                                    id="clearTotals"
                                    checked={clearTotalsChck}
                                    className="mt-0.5"
                                    onCheckedChange={(checked) => setClearTotalsChck(checked)}
                                />
                                <span className="text-sm leading-relaxed">{t("clearTotalsLabel")}</span>
                            </label>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">{t("cancel")}</Button>
                                </DialogClose>
                                <Button variant="destructive" disabled={clearDataPending} onClick={clearDataHandle}>
                                    {t("clearDataTitle")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {totalForCategory !== null && (
                <p className="border-rule mt-3 flex items-baseline justify-between gap-3 border-b pb-3">
                    <span className="label">
                        {t("total")} · {categoryLabel(selectedCategory)}
                    </span>
                    <span className="figure text-lg">
                        {selectedCategory === TransactionEnum.INCOME ? "+" : "-"}
                        {formatCurrency(totalForCategory)} <span className="text-ink-faint">{symbol}</span>
                    </span>
                </p>
            )}

            <ul className="mt-4">
                {rows.map(({ tx, day, showDay }) => {
                    const transfer = isTransfer(tx);
                    const income = !transfer && tx.transactionType === TransactionEnum.INCOME;
                    const locked = essentialPaymentTransactionIds.has(tx.id) || Boolean(tx.savingsOperationId);
                    const editable = !transfer && !locked;
                    const deletable = transfer || !essentialPaymentTransactionIds.has(tx.id);
                    const sign = transfer
                        ? { in: "+", out: "-", between: "" }[transferDirection(tx, store.selectedCardId, store.cards)]
                        : income
                          ? "+"
                          : "-";
                    const cardSkin = findCardById(store.cards, transfer ? tx.cardId : cardIdOf(tx, store.cards))?.skin;

                    return (
                        <li key={tx.id}>
                            {showDay && <p className="label border-rule-strong mt-5 border-b pb-1.5">{day}</p>}
                            <div className="group border-rule hover:bg-surface flex items-center gap-2 border-b py-2.5 pl-1 transition-colors">
                                <button
                                    type="button"
                                    disabled={!editable}
                                    onClick={() => {
                                        setEditingTx(tx);
                                        setEditOpen(true);
                                    }}
                                    aria-label={editable ? t("edit") : undefined}
                                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                                >
                                    <span
                                        className={twMerge(
                                            "border-rule flex size-9 shrink-0 items-center justify-center border",
                                            income && "border-accent text-accent",
                                        )}
                                    >
                                        {transfer ? (
                                            <ArrowLeftRight className="size-4" />
                                        ) : (
                                            <CategoryIcon category={tx.categorie} className="size-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm">
                                            {transfer
                                                ? tx.description || transferLabel(tx)
                                                : tx.description || categoryLabel(tx.categorie)}
                                        </span>
                                        <span className="text-ink-faint mt-0.5 flex min-w-0 items-center gap-1.5 font-mono text-3xs uppercase">
                                            {(showCardColumn || transfer) && (
                                                <CardSwatch skin={cardSkin} className="size-2" />
                                            )}
                                            <span className="truncate">
                                                {transfer ? tCards("betweenCards") : categoryLabel(tx.categorie)}
                                            </span>
                                            {editable && (
                                                <Pencil className="size-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                                            )}
                                        </span>
                                    </span>
                                    <span
                                        className={twMerge(
                                            "shrink-0 text-right font-mono text-sm tabular-nums",
                                            income && "text-accent",
                                            transfer && "text-ink-muted",
                                        )}
                                    >
                                        {sign}
                                        {formatCurrency(tx.value)} <span className="text-ink-faint">{symbol}</span>
                                    </span>
                                </button>
                                {deletable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        aria-label={t("delete")}
                                        className="text-ink-faint hover:bg-signal-wash hover:text-signal inline-flex size-9 shrink-0 items-center justify-center transition-colors md:size-8 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                ) : (
                                    <span className="size-9 shrink-0 md:size-8" />
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            {filteredTransactions.length === 0 && (
                <p className="text-ink-faint border-rule border-b py-8 text-center text-sm">{t("noMatchingTx")}</p>
            )}

            {totalPages > 1 && (
                <Pagination className="mt-5">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="px-3 font-mono text-xs tabular-nums">
                                {String(currentPage).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
            <EditTransactionDialog
                transaction={editingTx}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSubmit={async (data) => {
                    if (!editingTx) return;

                    const payload: UpdateTransactionPayload = {
                        transactionId: editingTx.id,
                        value: Number(data.value),
                        categorie: data.categories,
                        date: data.date.toISOString(),
                        description: data.description || "",
                        transactionType: editingTx.transactionType,
                        savingsStorage: data.categories === "savings" ? data.savingsStorage : undefined,
                        savingsCurrency: data.categories === "savings" ? data.savingsCurrency : undefined,
                        savingsAmount: data.savingsAmount,
                        cardId: data.cardId,
                    };

                    const res = await updateTransaction(payload);

                    store.setTransactions(res.updatedItems);
                    store.applyServerUpdate(res);
                    store.setSavingsOperations(res.updatedSavingsOperations);

                    toast.success(res.message);

                    setEditOpen(false);
                }}
            />
        </div>
    );
};
