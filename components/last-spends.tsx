"use client";

import { useState, useMemo, JSX, useEffect } from "react";

import { TransactionType } from "types/transactions";
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
} from "lucide-react";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { twMerge } from "tailwind-merge";
import { ContentWrapper } from "./wrappers/container";
import { useTranslations } from "next-intl";
import { Button } from "./ui/button";
import Cookies from "js-cookie";
import { useClearData, useDeleteTransaction, useExportPdf } from "api/main";
import { toast } from "react-toastify";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { CheckedState } from "@radix-ui/react-checkbox";

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

    const userId = Cookies.get("userId") || "";

    const t = useTranslations("transactions");
    const tCategory = useTranslations("categories");
    const tErr = useTranslations("errors");

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [clearTotalsChck, setClearTotalsChck] = useState<CheckedState>(false);

    const { mutateAsync: exportPdfMutation, isPending: exportPdfPending } = useExportPdf();
    const { mutateAsync: clearDataMutation } = useClearData();
    const { mutateAsync: deleteTransaction } = useDeleteTransaction();

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
        return <ContentWrapper>{t("noSpends")}</ContentWrapper>;
    }

    return (
        <ContentWrapper className="w-full">
            <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                {totalForCategory !== null && (
                    <p className="text-base">
                        {t("total")}:
                        <span className="font-bold pl-1">
                            {selectedCategory === tCategory("income") ? "+" : "-"}
                            {formatCurrency(totalForCategory)}
                        </span>
                        <span>₴</span>
                    </p>
                )}
                <div className="flex flex-col items-center gap-2 w-full justify-end md:flex-row">
                    <Dialog>
                        <DialogTrigger className="border w-full md:w-fit cursor-pointer border-gray-500 px-4 h-9 text-gray-800 bg-transparent rounded-lg hover:bg-gray-500 hover:text-white dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-400 dark:hover:text-black">
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
                    <Button onClick={exportPdfHandle} className="w-full md:w-fit">
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

            <Table className="w-full border-separate border-spacing-y-1">
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
                                "group relative border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                                tx.transactionType === TransactionEnum.INCOME ? "bg-green-500/20" : "bg-red-500/20",
                            )}
                        >
                            <TableCell className="font-medium relative">
                                {tx.transactionType !== TransactionEnum.INCOME ? "-" : "+"} {formatCurrency(tx.value)}
                                <button
                                    onClick={() => console.log("edit", tx.id)}
                                    className="ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 hover:text-blue-700"
                                >
                                    ✏️
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
                                    className="opacity-0 text-xs group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                >
                                    ❌
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
        </ContentWrapper>
    );
};
