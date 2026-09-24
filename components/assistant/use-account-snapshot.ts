"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AssistantBankContext, buildAccountSnapshot } from "lib/assistant/context";
import { accountLabel, currencyNameByCode, fromMinorUnits, summarizeStatement } from "lib/monobank";
import useBankStore from "store/bank";
import useStore from "store/general";
import { MonobankClientInfo, MonobankStatementItem } from "types/monobank";

const DAY = 24 * 60 * 60;

export const useAccountSnapshot = () => {
    const queryClient = useQueryClient();

    return useCallback(() => {
        const store = useStore.getState();
        const bankStore = useBankStore.getState();

        const info = queryClient
            .getQueriesData<MonobankClientInfo>({ queryKey: ["monobank", "client-info"] })
            .map(([, data]) => data)
            .find(Boolean);

        const statementEntry = queryClient
            .getQueriesData<MonobankStatementItem[]>({ queryKey: ["monobank", "statement"] })
            .filter(([, data]) => Array.isArray(data))
            .pop();

        let bank: AssistantBankContext | null = null;

        if (info) {
            const accounts = info.accounts || [];
            const mainCurrency = accounts[0]?.currencyCode ?? 980;

            bank = {
                name: info.name || "",
                accounts: accounts.map((account) => ({
                    label: accountLabel(account),
                    currency: currencyNameByCode(account.currencyCode),
                    balance: fromMinorUnits(account.balance),
                    creditLimit: fromMinorUnits(account.creditLimit),
                })),
                jars: (info.jars || []).map((jar) => ({
                    title: jar.title,
                    currency: currencyNameByCode(jar.currencyCode),
                    balance: fromMinorUnits(jar.balance),
                    goal: jar.goal ? fromMinorUnits(jar.goal) : undefined,
                })),
            };

            if (statementEntry) {
                const [key, items] = statementEntry;
                const from = Number(key[4]);
                const to = Number(key[5]);
                const summary = summarizeStatement(items || []);

                bank.statement = {
                    days: Number.isFinite(to - from) ? Math.max(Math.round((to - from) / DAY), 1) : 31,
                    currency: currencyNameByCode(items?.[0]?.currencyCode ?? mainCurrency),
                    spent: summary.spent,
                    received: summary.received,
                    cashback: summary.cashback,
                    count: summary.count,
                    topCategories: summary.byCategory
                        .slice(0, 8)
                        .map((total) => ({ category: total.category, amount: total.amount })),
                };
            }
        }

        return buildAccountSnapshot({
            currency: store.userCurrency,
            totalAmount: store.totalAmount,
            totalIncome: store.totalIncome,
            totalSpend: store.totalSpend,
            nextMonthTotalAmount: store.nextMonthTotalAmount,
            percentage: store.percentage,
            essentials: store.essentialsArray,
            nextMonthEssentials: store.nextMonthEssentialsArray,
            expectedIncomes: store.expectedIncomes,
            transactions: store.transactions,
            cards: store.cards.map((card, index) => ({
                name: card.name.trim() || (card.skin === "default" ? `Card ${index + 1}` : card.skin),
                balance: card.balance,
                creditLimit: card.creditLimit ?? 0,
            })),
            savingsGoals: store.savingsGoals,
            savingsOperations: store.savingsOperations,
            streak: store.streak,
            rates: { usdToUah: bankStore.usd?.rateBuy ?? 0, eurToUah: bankStore.eur?.rateBuy ?? 0 },
            bank,
        });
    }, [queryClient]);
};
