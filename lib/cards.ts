import { TransactionEnum } from "../constants/index";
import { Card, TransactionType } from "../types/transactions";

export const ALL_CARDS = "all";

export const isTransfer = (transaction: TransactionType) => transaction.transactionType === TransactionEnum.TRANSFER;

export const cardIdOf = (transaction: TransactionType, cards: Card[]) => transaction.cardId ?? cards[0]?.id;

export const findCardById = (cards: Card[], cardId?: string | null) =>
    cardId ? (cards.find((card) => card.id === cardId) ?? null) : null;

export const resolveCardFilter = (filter: string, cards: Card[]) =>
    filter !== ALL_CARDS && findCardById(cards, filter) ? filter : ALL_CARDS;

export const defaultCardId = (filter: string, cards: Card[]) => findCardById(cards, filter)?.id ?? cards[0]?.id ?? "";

export const transactionsForCard = (transactions: TransactionType[], filter: string, cards: Card[]) => {
    const active = resolveCardFilter(filter, cards);
    if (active === ALL_CARDS) return transactions;

    return transactions.filter(
        (transaction) => cardIdOf(transaction, cards) === active || transaction.toCardId === active,
    );
};

export const statisticsTransactions = (transactions: TransactionType[], filter: string, cards: Card[]) =>
    transactionsForCard(transactions, filter, cards).filter((transaction) => !isTransfer(transaction));

export type TransferDirection = "in" | "out" | "between";

export const transferDirection = (transaction: TransactionType, filter: string, cards: Card[]): TransferDirection => {
    const active = resolveCardFilter(filter, cards);
    if (active === ALL_CARDS) return "between";
    return transaction.toCardId === active ? "in" : "out";
};

export const balanceForFilter = (filter: string, cards: Card[], totalAmount: number) => {
    const card = findCardById(cards, resolveCardFilter(filter, cards));
    return card ? card.balance : totalAmount;
};
