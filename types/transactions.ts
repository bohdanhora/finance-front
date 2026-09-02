import { CURRENCY, EssentialsType, TransactionEnum } from "../constants/index";

export enum SavingsStorage {
    CASH = "cash",
    CARD = "card",
}

export enum SavingsOperationType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    TRANSFER = "transfer",
}

export type SavingsGoal = {
    id: string;
    name: string;
    targetAmount: number;
    currency: CURRENCY;
    monthlyContribution: number;
    targetDate?: string;
    createdAt: string;
};

export type SavingsOperation = {
    id: string;
    /** Legacy movements can still point at the goal they were created from. */
    goalId?: string;
    type: SavingsOperationType;
    storage: SavingsStorage;
    destinationStorage?: SavingsStorage;
    amount: number;
    currency: CURRENCY;
    date: string;
    note?: string;
    linkedTransactionId?: string;
    balanceAmount?: number;
};

export type SavingsGoalPayload = {
    item: SavingsGoal;
};

export type DeleteSavingsGoalPayload = {
    purchasedWithSavings: boolean;
    deductions?: Array<{
        storage: SavingsStorage;
        currency: CURRENCY;
        amount: number;
    }>;
    date?: string;
};

export type DeleteSavingsGoalRequest = {
    id: string;
    data: DeleteSavingsGoalPayload;
};

export type SavingsOperationPayload = {
    item: SavingsOperation;
    affectsMainBalance?: boolean;
    balanceAmount?: number;
};

export type SavingsMutationResponse = {
    message: string;
    updatedGoals: SavingsGoal[];
    updatedOperations: SavingsOperation[];
    updatedTransactions?: TransactionType[];
    updatedTotals?: TransactionTotals;
};

export type TransactionTotals = {
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
};

export type TransactionType = {
    transactionType: TransactionEnum;
    description: string;
    value: number;
    date: string;
    categorie: string;
    id: string;
    savingsStorage?: SavingsStorage;
    savingsCurrency?: CURRENCY;
    savingsOperationId?: string;
};

export type EssentialType = {
    id: string;
    amount: number;
    title: string;
    checked: boolean;
    paidAmount?: number;
    paidAt?: string;
    paymentTransactionId?: string;
};

export type TotalAmountPayload = {
    totalAmount: number;
};

export type TotalAmountResponseType = {
    message: string;
    totalAmount: number;
};

export type NextMonthTotalAmountPayload = {
    nextMonthTotalAmount: number;
};

export type NextMonthTotalAmountResponseType = {
    message: string;
    nextMonthTotalAmount: number;
};

export type EssentialPaymentsPayload = {
    type: EssentialsType;
    items: EssentialType[] | [];
};

export type EssentialPaymentsResponseType = {
    message: string;
    updatedItems: EssentialType[] | [];
};

export type NewTransactionPaymentsPayload = {
    transactionType: TransactionEnum;
    id: string;
    value: number;
    date: Date;
    categorie: string;
    description: string;
    savingsStorage?: SavingsStorage;
    savingsCurrency?: CURRENCY;
};

export type NewTransactionResponseType = {
    message: string;
    updatedTotals: {
        totalAmount: number;
        totalIncome: number;
        totalSpend: number;
    };
    updatedItems: TransactionType[] | [];
    updatedSavingsOperations: SavingsOperation[];
};

export type CheckedEssentialItemType = {
    id: string;
    checked: boolean;
    actualAmount?: number;
};

export type CheckedEssentialPayload = {
    type: EssentialsType;
    item: CheckedEssentialItemType;
};

export type CheckedEssentialResponseType = {
    message: string;
    updatedItems: EssentialType[] | [];
    updatedTotals: {
        totalAmount: number;
        totalIncome: number;
        totalSpend: number;
    };
    updatedTransactions: TransactionType[] | [];
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

export type NewEssentialPayload = {
    type: EssentialsType;
    item: EssentialType;
};

export type NewEssentialResponseType = {
    message: string;
    addedItem: EssentialType;
    updatedItems: EssentialType[] | [];
};

export type UpdateEssentialPayload = {
    type: EssentialsType;
    item: EssentialType;
};

export type UpdateEssentialResponseType = {
    message: string;
    updatedItem: EssentialType;
    updatedItems: EssentialType[] | [];
};

export type RequestEmailCodePayload = {
    email: string;
};

export type RequestEmailCodeResponseType = {
    message: string;
};

export type AllTransactionsInfoResponse = {
    userId: string;
    currency?: CURRENCY;
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
    nextMonthTotalAmount: number;
    savePercent: number;
    lastProcessedMonth: string;

    defaultEssentialsArray: EssentialType[] | [];
    essentialsArray: EssentialType[] | [];
    nextMonthEssentialsArray: EssentialType[] | [];
    transactions: TransactionType[] | [];
    savingsGoals: SavingsGoal[] | [];
    savingsOperations: SavingsOperation[] | [];
};

export type ChangeCurrencyPayload = {
    fromCurrency?: CURRENCY;
    toCurrency: CURRENCY;
    conversionRate?: number;
};

export type ChangeCurrencyResponse = {
    message: string;
    updatedInfo: AllTransactionsInfoResponse;
};

export type ClearDataPayload = {
    clearTotals: boolean;
};

export type ClearDataResponseType = {
    message: string;
    clearedTransactions: boolean;
    clearedTotals: boolean;
    essentialsArray?: EssentialType[];
    nextMonthEssentialsArray?: EssentialType[];
    updatedSavingsOperations?: SavingsOperation[];
};

export type SavePercentPayload = {
    percent: number;
};

export type SavePercentResponseType = {
    message: string;
    percent: number;
};

export type DeleteTransactionPayload = {
    transactionId: string;
};

export type DeleteTransactionResponseType = {
    message: string;
    deletedTransactionId: string;
    updatedTotals: {
        totalAmount: number;
        totalIncome: number;
        totalSpend: number;
    };
    updatedItems: TransactionType[];
    updatedSavingsOperations: SavingsOperation[];
};

export type UpdateTransactionPayload = {
    transactionId: string;
    value: number;
    transactionType?: TransactionEnum;
    categorie?: string;
    date?: string;
    description?: string;
    savingsStorage?: SavingsStorage;
    savingsCurrency?: CURRENCY;
};

export type UpdateTransactionResponseType = {
    message: string;
    updatedTransaction: TransactionType;
    updatedTotals: {
        totalAmount: number;
        totalIncome: number;
        totalSpend: number;
    };
    updatedItems: TransactionType[];
    updatedSavingsOperations: SavingsOperation[];
};
