"use client";

import { useState, useMemo, JSX } from "react";

import { TransactionType, UpdateTransactionPayload } from "types/transactions";
import { createDateString, formatCurrency } from "lib/utils";
import { TransactionEnum } from "constants/index";
import useStore from "store/general";

import {
    ShoppingBasketIcon,
    SparklesIcon,
    HouseIcon,
    UtensilsIcon,
    SmilePlusIcon,
    HamburgerIcon,
    CarTaxiFrontIcon,
    BanknoteIcon,
    GiftIcon,
    ShirtIcon,
    HandshakeIcon,
    BanknoteArrowUp,
    Pencil,
    X,
} from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { twMerge } from "tailwind-merge";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import Cookies from "js-cookie";
import { useClearData, useDeleteTransaction, useExportPdf, useUpdateTransaction } from "api/main";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { CheckedState } from "@radix-ui/react-checkbox";
import { EditTransactionDialog } from "./dialogs/edit-transaction";
import { getCurrencySymbol } from "lib/currency";

const categoriesIcons = (category: string) => {
    const map: Record<string, JSX.Element> = {
        groceries: <ShoppingBasketIcon className="h-4 w-4" />,
        cosmetics: <SparklesIcon className="h-4 w-4" />,
        home: <HouseIcon className="h-4 w-4" />,
        restaurant: <UtensilsIcon className="h-4 w-4" />,
        entertainment: <SmilePlusIcon className="h-4 w-4" />,
        delivery: <HamburgerIcon className="h-4 w-4" />,
        transport: <CarTaxiFrontIcon className="h-4 w-4" />,
        credit: <BanknoteIcon className="h-4 w-4" />,
        gifts: <GiftIcon className="h-4 w-4" />,
        clothing: <ShirtIcon className="h-4 w-4" />,
        essentials: <HandshakeIcon className="h-4 w-4" />,
        income: <BanknoteArrowUp className="h-4 w-4" />,
    };
    return map[category] ?? null;
};

export const LastSpends = () => {
    const store = useStore();
    const userCurrency = store.userCurrency;

    const userId = Cookies.get("userId") || "";

    const t = useTranslations("transactions");
    const tCategory = useTranslations("categories");
    const tErr = useTranslations("errors");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [clearTotalsChck, setClearTotalsChck] = useState<CheckedState>(false);

    const [editingTx, setEditingTx] = useState<TransactionType | null>(null);
    const [editOpen, setEditOpen] = useState(false);

    const { mutateAsync: exportPdfMutation, isPending: exportPdfPending } = useExportPdf();
    const { mutateAsync: clearDataMutation } = useClearData();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();
    const { mutateAsync: updateTransaction } = useUpdateTransaction();

    const ITEMS_PER_PAGE = 10;

    const filteredTransactions = useMemo(() => {
        return store.transactions.filter((tx: TransactionType) => {
            const matchesCategory = selectedCategory === "all" || tCategory(tx.categorie) === selectedCategory;
            const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, selectedCategory, store.transactions]);

    const uniqueCategories = [...new Set(store.transactions.map((tx) => tCategory(tx.categorie)))];

    const totalForCategory = useMemo(() => {
        if (selectedCategory === "all") return null;

        return store.transactions
            .filter((tx) => tCategory(tx.categorie) === selectedCategory)
            .reduce((acc, tx) => acc + tx.value, 0);
    }, [selectedCategory, store.transactions]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleCategoryChange = (val: string) => {
        setSelectedCategory(val);
        setCurrentPage(1);
    };

    const exportPdfHandle = () => {
        if (!userId) {
            toast.error(tErr("noUserId"));
            return;
        }
        exportPdfMutation(userId);
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
        }

        if (clearTotalsChck) {
            localStorage.removeItem("currency");
        }

        if (res.message) {
            toast.success(res.message);
        }
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

        if (res.updatedTotals) {
            store.setTotalAmount(res.updatedTotals.totalAmount);
            store.setTotalIncome(res.updatedTotals.totalIncome);
            store.setTotalSpend(res.updatedTotals.totalSpend);
        }

        if (res.message) {
            toast.success(res.message);
        }
    };

    if (!store.transactions.length) {
        return (
            <div className="border-border bg-card w-full rounded-2xl border p-8 text-center shadow-sm">
                <p className="text-sm font-medium">{t("noSpends")}</p>
                <p className="text-muted-foreground mt-1.5 text-sm">{t("noTransactionsHint")}</p>
            </div>
        );
    }

    return (
        <div className="border-border bg-card w-full rounded-2xl border p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {totalForCategory !== null && (
                    <p className="text-base">
                        {t("total")}:
                        <span className="font-bold pl-1">
                            {selectedCategory === tCategory("income") ? "+" : "-"}
                            {formatCurrency(totalForCategory)}
                        </span>
                        <span>{getCurrencySymbol(userCurrency)}</span>
                    </p>
                )}
                <div className="flex flex-col items-center gap-2 w-full justify-end md:flex-row">
                    <Dialog>
                        <DialogTrigger className="border-border text-muted-foreground hover:text-foreground h-9 w-full cursor-pointer rounded-lg border px-4 text-sm text-nowrap transition-colors hover:bg-black/[0.04] md:w-fit dark:hover:bg-white/[0.06]">
                            {t("clearDataTitle")}
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle> {t("clearDataConfirmation")}</DialogTitle>
                                <DialogDescription>{t("clearDataWarning")}</DialogDescription>
                            </DialogHeader>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="clearTotals"
                                    className="cursor-pointer"
                                    onCheckedChange={(checked) => setClearTotalsChck(checked)}
                                />
                                <Label htmlFor="clearTotals" className="text-sm cursor-pointer">
                                    {t("clearTotalsLabel")}
                                </Label>
                            </div>
                            <Button onClick={clearDataHandle}>{t("clearDataTitle")}</Button>
                        </DialogContent>
                    </Dialog>
                    <Button variant="secondary" onClick={exportPdfHandle} className="w-full md:w-fit">
                        {exportPdfPending ? t("exporting") : t("exportPdf")}
                    </Button>
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full md:w-fit"
                    />
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="w-full md:w-fit">
                            <SelectValue placeholder={t("allCategories")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t("all")}</SelectItem>
                            {uniqueCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Table className="w-full border-separate border-spacing-y-1.5">
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("amount")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("date")}</TableHead>
                        <TableHead>{t("category")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedTransactions.map((tx) => (
                        <TableRow
                            key={tx.id}
                            className={twMerge(
                                "group relative border-b-0 transition-colors",
                                "[&>td:first-child]:rounded-l-lg [&>td:last-child]:rounded-r-lg",
                                tx.transactionType === TransactionEnum.INCOME
                                    ? "bg-emerald-500/[0.08] hover:bg-emerald-500/[0.16]"
                                    : "bg-black/[0.03] hover:bg-black/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]",
                            )}
                        >
                            <TableCell className="relative font-medium">
                                <span
                                    className={twMerge(
                                        "tabular-nums",
                                        tx.transactionType === TransactionEnum.INCOME
                                            ? "text-emerald-600 dark:text-emerald-400"
                                            : "text-rose-600 dark:text-rose-400",
                                    )}
                                >
                                    {tx.transactionType !== TransactionEnum.INCOME ? "-" : "+"}{" "}
                                    {formatCurrency(tx.value)}
                                </span>
                                <button
                                    onClick={() => {
                                        setEditingTx(tx);
                                        setEditOpen(true);
                                    }}
                                    aria-label={t("edit")}
                                    className="ml-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-md align-middle text-black/40 transition-all hover:bg-black/5 hover:text-indigo-600 md:size-6 md:opacity-0 md:group-hover:opacity-100 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-indigo-400"
                                >
                                    <Pencil size={13} />
                                </button>
                            </TableCell>

                            <TableCell>{tx.description}</TableCell>
                            <TableCell>{createDateString(new Date(tx.date))}</TableCell>

                            <TableCell className="flex items-center gap-2">
                                {categoriesIcons(tx.categorie)}
                                <span className="uppercase text-xs">{tCategory(tx.categorie)}</span>
                            </TableCell>

                            <TableCell className="text-right">
                                <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    aria-label={t("delete")}
                                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md text-black/40 transition-all hover:bg-rose-500/10 hover:text-rose-600 md:size-7 md:opacity-0 md:group-hover:opacity-100 dark:text-white/40 dark:hover:text-rose-400"
                                >
                                    <X size={14} />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {filteredTransactions.length === 0 && <p className="text-center text-sm italic">{t("noMatchingTx")}</p>}

            {totalPages > 1 && (
                <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-sm px-2">
                                {currentPage} / {totalPages}
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
                    };

                    const res = await updateTransaction(payload);

                    store.setTransactions(res.updatedItems);
                    store.setTotalAmount(res.updatedTotals.totalAmount);
                    store.setTotalIncome(res.updatedTotals.totalIncome);
                    store.setTotalSpend(res.updatedTotals.totalSpend);

                    toast.success(res.message);

                    setEditOpen(false);
                }}
            />
        </div>
    );
};
