export type MonobankAccount = {
    id: string;
    sendId: string;
    balance: number;
    creditLimit: number;
    type: string;
    currencyCode: number;
    cashbackType?: string;
    maskedPan: string[];
    iban: string;
};

export type MonobankJar = {
    id: string;
    sendId: string;
    title: string;
    description?: string;
    currencyCode: number;
    balance: number;
    goal?: number;
};

export type MonobankClientInfo = {
    clientId: string;
    name: string;
    webHookUrl?: string;
    permissions: string;
    accounts: MonobankAccount[];
    jars?: MonobankJar[];
};

export type MonobankStatementItem = {
    id: string;
    time: number;
    description: string;
    mcc: number;
    originalMcc: number;
    amount: number;
    operationAmount: number;
    currencyCode: number;
    commissionRate: number;
    cashbackAmount: number;
    balance: number;
    hold: boolean;
    receiptId?: string;
    comment?: string;
    counterName?: string;
};
