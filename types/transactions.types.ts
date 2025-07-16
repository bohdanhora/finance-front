import { EssentialsType, TransactionEnum } from "constants/index";

export type TransactionType = {
    transactionType: TransactionEnum;
    description: string;
    value: number;
    date: string;
    categorie: string;
    id: string;
};

export type EssentialType = {
    id: string;
    amount: number;
    title: string;
    checked: boolean;
};

export type TotalAmountPayload = {
    totalAmount: number;
};

export type TotalAmountResponseType = {
    message: string;
    totalAmount: number;
};

export type TotalAmountErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type NextMonthTotalAmountPayload = {
    nextMonthTotalAmount: number;
};

export type NextMonthTotalAmountResponseType = {
    message: string;
    nextMonthTotalAmount: number;
};

export type NextMonthTotalAmountErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type EssentialPaymentsPayload = {
    type: EssentialsType;
    items: EssentialType[] | [];
};

export type EssentialPaymentsResponseType = {
    message: string;
    updatedItems: EssentialType[] | [];
};

export type EssentialPaymentsErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type NewTransactionPaymentsPayload = {
    transactionType: TransactionEnum;
    id: string;
    value: number;
    date: Date;
    categorie: string;
    description: string;
};

export type NewTransactionResponseType = {
    message: string;
    updatedTotals: {
        totalAmount: number;
        totalIncome: number;
        totalSpend: number;
    };
    updatedItems: TransactionType[] | [];
};

export type NewTransactionErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type CheckedEssentialItemType = {
    id: string;
    checked: boolean;
};

export type CheckedEssentialPayload = {
    type: EssentialsType;
    item: CheckedEssentialItemType;
};

export type CheckedEssentialResponseType = {
    message: string;
    updatedItems: EssentialType[] | [];
};

export type CheckedEssentialErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type RemoveEssentialPayload = {
    type: EssentialsType;
    id: string;
};

export type RemoveEssentialResponseType = {
    message: string;
    removedId: string;
    updatedItems: EssentialType[] | [];
};

export type RemoveEssentialErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type NewEssentialPayload = {
    type: EssentialsType;
    item: EssentialType;
};

export type NewEssentialResponseType = {
    message: string;
    addedItem: EssentialType;
    updatedItems: EssentialType[] | [];
};

export type RequestEmailCodePayload = {
    email: string;
};

export type RequestEmailCodeResponseType = {
    message: string;
};

export type NewEssentialErrorResponse = {
    error: string;
    message: string;
    statusCode: number;
};

export type AllTransactionsInfoResponse = {
    userId: string;
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
    nextMonthTotalAmount: number;

    defaultEssentialsArray: EssentialType[] | [];
    essentialsArray: EssentialType[] | [];
    nextMonthEssentialsArray: EssentialType[] | [];
    transactions: TransactionType[] | [];
};
