import { create } from "zustand";
import { StoreType } from "types/stores";
import { CURRENCY } from "constants/index";
import { ALL_CARDS } from "lib/cards";

const SELECTED_CARD_KEY = "finance:selected-card";

const readSelectedCard = () => {
    try {
        return (typeof window !== "undefined" && window.localStorage.getItem(SELECTED_CARD_KEY)) || ALL_CARDS;
    } catch {
        return ALL_CARDS;
    }
};

const writeSelectedCard = (cardId: string) => {
    try {
        window.localStorage.setItem(SELECTED_CARD_KEY, cardId);
    } catch {}
};

const useStore = create<StoreType>((set) => ({
    totalAmount: 0,
    totalIncome: 0,
    totalSpend: 0,
    nextMonthTotalAmount: 0,
    percentage: 0,
    userCurrency: CURRENCY.UAH,
    currencyInitialized: false,

    defaultEssentialsArray: [],
    essentialsArray: [],
    nextMonthEssentialsArray: [],
    expectedIncomes: [],
    monthHistory: [],
    transactions: [],
    savingsGoals: [],
    savingsOperations: [],
    streak: null,
    cards: [],
    selectedCardId: readSelectedCard(),

    setTotalAmount: (totalAmount) =>
        set(() => ({
            totalAmount: totalAmount,
        })),
    setPercentage: (percentage) =>
        set(() => ({
            percentage: percentage,
        })),
    setTotalIncome: (totalIncome) =>
        set(() => ({
            totalIncome: totalIncome,
        })),
    setTotalSpend: (totalSpend) =>
        set(() => ({
            totalSpend: totalSpend,
        })),
    setUserCurrency: (userCurrency) =>
        set(() => ({
            userCurrency: userCurrency,
        })),
    setCurrencyInitialized: (currencyInitialized) =>
        set(() => ({
            currencyInitialized,
        })),
    setNextMonthTotalAmount: (nextMonthTotalAmount) =>
        set(() => ({
            nextMonthTotalAmount: nextMonthTotalAmount,
        })),

    setDefaultEssentialsArray: (defaultEssentialsArray) =>
        set(() => ({
            defaultEssentialsArray: defaultEssentialsArray,
        })),
    setEssentialsArray: (essentialsArray) =>
        set(() => ({
            essentialsArray: essentialsArray,
        })),
    setNextMonthEssentialsArray: (nextMonthEssentialsArray) =>
        set(() => ({
            nextMonthEssentialsArray: nextMonthEssentialsArray,
        })),
    setExpectedIncomes: (expectedIncomes) =>
        set(() => ({
            expectedIncomes,
        })),
    setTransactions: (transactions) =>
        set(() => ({
            transactions: transactions,
        })),
    setSavingsGoals: (savingsGoals) =>
        set(() => ({
            savingsGoals,
        })),
    setSavingsOperations: (savingsOperations) =>
        set(() => ({
            savingsOperations,
        })),
    setStreak: (streak) =>
        set(() => ({
            streak,
        })),
    setCards: (cards) =>
        set(() => ({
            cards,
        })),
    setSelectedCardId: (selectedCardId) => {
        writeSelectedCard(selectedCardId);
        set(() => ({ selectedCardId }));
    },
    applyServerUpdate: ({ updatedTotals, updatedCards, totalAmount }) =>
        set(() => ({
            ...(updatedTotals ?? {}),
            ...(typeof totalAmount === "number" ? { totalAmount } : {}),
            ...(updatedCards ? { cards: updatedCards } : {}),
        })),
    setAllToDefaults: () =>
        set(() => ({
            totalAmount: 0,
            totalIncome: 0,
            totalSpend: 0,
            nextMonthTotalAmount: 0,
            percentage: 0,
            userCurrency: CURRENCY.UAH,
            currencyInitialized: false,

            defaultEssentialsArray: [],
            essentialsArray: [],
            nextMonthEssentialsArray: [],
            expectedIncomes: [],
            monthHistory: [],
            transactions: [],
            savingsGoals: [],
            savingsOperations: [],
            streak: null,
            cards: [],
        })),
}));
export default useStore;
