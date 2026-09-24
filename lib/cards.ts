import { TransactionEnum } from "../constants/index";
import { Card, TransactionType } from "../types/transactions";
import { roundMoney } from "./money";

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

export const creditLimitOf = (card: Pick<Card, "creditLimit">) => roundMoney(Math.max(0, card.creditLimit ?? 0));

export const isCreditCard = (card: Pick<Card, "creditLimit">) => creditLimitOf(card) > 0;

export const availableOnCard = (card: Card) => roundMoney(card.balance + creditLimitOf(card));

export const creditUsedOf = (card: Card) => roundMoney(Math.max(0, -card.balance));

export const ownMoneyOf = (card: Card) => roundMoney(Math.max(0, card.balance));

export const balanceFromAvailable = (available: number, creditLimit: number) =>
    roundMoney(available - Math.max(0, creditLimit));

export type CreditSummary = {
    own: number;
    debt: number;
    limit: number;
    creditLeft: number;
    hasCredit: boolean;
};

export const creditSummary = (cards: Card[]): CreditSummary => {
    const own = roundMoney(cards.reduce((total, card) => total + ownMoneyOf(card), 0));
    const debt = roundMoney(cards.reduce((total, card) => total + creditUsedOf(card), 0));
    const limit = roundMoney(cards.reduce((total, card) => total + creditLimitOf(card), 0));

    return {
        own,
        debt,
        limit,
        creditLeft: roundMoney(Math.max(0, limit - debt)),
        hasCredit: limit > 0 || debt > 0,
    };
};

export const cardsForFilter = (filter: string, cards: Card[]) => {
    const card = findCardById(cards, resolveCardFilter(filter, cards));
    return card ? [card] : cards;
};

export const spendableOnCard = (cards: Card[], cardId: string | null | undefined, totalAmount: number) => {
    const card = findCardById(cards, cardId);
    return card ? availableOnCard(card) : totalAmount;
};
