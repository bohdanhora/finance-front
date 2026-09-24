import dayjs from "dayjs";

import { CURRENCY, TransactionEnum } from "../../constants/index";
import { byCategory, byMonth, filterByMonth, monthResult, monthTotals, toMonthKey } from "../statistics";
import { getSavingsBalance, getSavingsNativeBalance } from "../savings";
import { summarizeEssentials, summarizeExpectedIncomes } from "../month-plan";
import {
    EssentialType,
    ExpectedIncome,
    SavingsGoal,
    SavingsOperation,
    SavingsStorage,
    StreakRecord,
    TransactionType,
} from "../../types/transactions";

export const DEFAULT_TRANSACTION_LIMIT = 100;

export type AssistantBankAccount = {
    label: string;
    currency: string;
    balance: number;
    creditLimit: number;
};

export type AssistantBankJar = {
    title: string;
    currency: string;
    balance: number;
    goal?: number;
};

export type AssistantBankContext = {
    name: string;
    accounts: AssistantBankAccount[];
    jars: AssistantBankJar[];
    statement?: {
        days: number;
        currency: string;
        spent: number;
        received: number;
        cashback: number;
        count: number;
        topCategories: Array<{ category: string; amount: number }>;
    };
};

export type AssistantContextInput = {
    today?: Date;
    currency: CURRENCY;
    totalAmount: number;
    totalIncome: number;
    totalSpend: number;
    nextMonthTotalAmount: number;
    percentage: number;
    essentials: EssentialType[];
    nextMonthEssentials: EssentialType[];
    expectedIncomes: ExpectedIncome[];
    transactions: TransactionType[];
    savingsGoals: SavingsGoal[];
    savingsOperations: SavingsOperation[];
    streak: StreakRecord | null;
    rates: { usdToUah: number; eurToUah: number };
    bank?: AssistantBankContext | null;
    transactionLimit?: number;
    cards?: { name: string; balance: number; creditLimit?: number }[];
};

const money = (value: number) => value.toFixed(2);

const line = (rows: string[]) => rows.filter(Boolean).join("\n");

const essentialsBlock = (title: string, items: EssentialType[]) => {
    if (items.length === 0) return "";

    const summary = summarizeEssentials(items);
    const rows = items.map((item) =>
        item.checked
            ? `- [paid] ${item.title}: planned ${money(item.amount)}, paid ${money(item.paidAmount ?? item.amount)}`
            : `- [due] ${item.title}: ${money(item.amount)}`,
    );

    return line([
        `## ${title}`,
        ...rows,
        `Planned total: ${money(summary.planned)}, already paid: ${money(summary.paid)}, still to pay: ${money(summary.outstanding)}`,
        "",
    ]);
};

const savingsBlock = (input: AssistantContextInput) => {
    const { savingsOperations, savingsGoals, currency, rates } = input;

    if (savingsOperations.length === 0 && savingsGoals.length === 0) return "";

    const total = getSavingsBalance(savingsOperations, currency, rates);
    const cash = getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CASH);
    const card = getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CARD);
    const native = [CURRENCY.UAH, CURRENCY.USD, CURRENCY.EUR]
        .map((code) => `${code.toUpperCase()} ${money(getSavingsNativeBalance(savingsOperations, code))}`)
        .join(", ");

    const goals = savingsGoals.map((goal) => {
        const deadline = goal.targetDate ? `, deadline ${dayjs(goal.targetDate).format("YYYY-MM-DD")}` : "";
        const monthly = goal.monthlyContribution > 0 ? `, monthly plan ${money(goal.monthlyContribution)}` : "";
        return `- ${goal.name}: target ${money(goal.targetAmount)} ${goal.currency.toUpperCase()}${monthly}${deadline}`;
    });

    return line([
        "## Savings",
        `Total in ${currency.toUpperCase()}: ${total === null ? "unknown (no exchange rate)" : money(total)}`,
        `Cash: ${cash === null ? "unknown" : money(cash)}, on cards: ${card === null ? "unknown" : money(card)}`,
        `Actual amounts per currency: ${native}`,
        goals.length > 0 ? "Goals:" : "No savings goals yet.",
        ...goals,
        "",
    ]);
};

const bankBlock = (bank?: AssistantBankContext | null) => {
    if (!bank) return "";

    const accounts = bank.accounts.map(
        (account) =>
            `- ${account.label} (${account.currency}): own money ${money(account.balance - account.creditLimit)}${
                account.creditLimit > 0 ? `, credit limit ${money(account.creditLimit)}` : ""
            }`,
    );

    const jars = bank.jars.map(
        (jar) => `- ${jar.title} (${jar.currency}): ${money(jar.balance)}${jar.goal ? ` of ${money(jar.goal)}` : ""}`,
    );

    const statement = bank.statement
        ? [
              `Card operations for the last ${bank.statement.days} days (${bank.statement.currency}): spent ${money(bank.statement.spent)}, received ${money(bank.statement.received)}, cashback ${money(bank.statement.cashback)}, ${bank.statement.count} operations`,
              bank.statement.topCategories.length > 0
                  ? `Where it went: ${bank.statement.topCategories
                        .map((item) => `${item.category} ${money(item.amount)}`)
                        .join(", ")}`
                  : "",
          ]
        : ["No card statement has been loaded in this session."];

    return line([
        "## Monobank (read-only mirror, does not affect the budget)",
        `Client: ${bank.name || "unknown"}`,
        accounts.length > 0 ? "Accounts:" : "No accounts.",
        ...accounts,
        ...(jars.length > 0 ? ["Jars:", ...jars] : []),
        ...statement,
        "",
    ]);
};

export const buildAccountSnapshot = (input: AssistantContextInput): string => {
    const today = input.today ?? new Date();
    const month = toMonthKey(today);
    const symbol = input.currency.toUpperCase();
    const limit = input.transactionLimit ?? DEFAULT_TRANSACTION_LIMIT;

    const transactions = input.transactions.filter(
        (transaction) => transaction.transactionType !== TransactionEnum.TRANSFER,
    );
    const inMonth = filterByMonth(transactions, month);
    const totals = monthTotals(inMonth);
    const result = monthResult(inMonth);
    const categories = byCategory(inMonth).slice(0, 12);
    const months = byMonth(transactions, month, 6);
    const incomes = summarizeExpectedIncomes(input.expectedIncomes);
    const essentials = summarizeEssentials(input.essentials);

    const daysInMonth = dayjs(today).daysInMonth();
    const daysLeft = Math.max(daysInMonth - dayjs(today).date() + 1, 1);
    const toSave = (input.totalAmount * input.percentage) / 100;

    const recent = [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
        .map(
            (transaction) =>
                `${dayjs(transaction.date).format("YYYY-MM-DD")} | ${transaction.transactionType} | ${
                    transaction.categorie || "other"
                } | ${money(transaction.value)} | ${transaction.description || "-"}`,
        );

    return line([
        "# Finance account snapshot",
        `Today: ${dayjs(today).format("YYYY-MM-DD")} (current month ${month}, ${daysLeft} days left including today)`,
        `Account currency: ${symbol}. Every amount below is in this currency unless stated otherwise.`,
        "",
        "## Balance right now",
        `Current balance: ${money(input.totalAmount)}`,
        input.cards && input.cards.length > 1
            ? `Balance by card: ${input.cards.map((card) => `${card.name} ${money(card.balance)}`).join(", ")}`
            : "",
        input.cards?.some((card) => (card.creditLimit ?? 0) > 0)
            ? `Credit cards (a negative balance is debt owed to the bank, the unused limit is not the user's money): ${input.cards
                  .filter((card) => (card.creditLimit ?? 0) > 0)
                  .map(
                      (card) =>
                          `${card.name} limit ${money(card.creditLimit ?? 0)}, ${
                              card.balance < 0 ? `debt ${money(-card.balance)}` : `own money ${money(card.balance)}`
                          }`,
                  )
                  .join("; ")}`
            : "",
        `Income recorded this month: ${money(input.totalIncome)}`,
        `Spending recorded this month: ${money(input.totalSpend)}`,
        `Savings percent set by the user: ${input.percentage}% (that is ${money(toSave)} of the current balance)`,
        `Money still to receive this month: ${money(incomes.pending)}`,
        `Bills still to pay this month: ${money(essentials.outstanding)}`,
        `Projected free money after the remaining bills: ${money(input.totalAmount + incomes.pending - essentials.outstanding)}`,
        `Daily budget if the balance is spread over the ${daysLeft} days left: ${money(input.totalAmount / daysLeft)}`,
        `Prepared starting amount for next month: ${money(input.nextMonthTotalAmount)}`,
        input.streak ? `Daily streak: ${input.streak.current} days, best ${input.streak.best}` : "",
        "",
        essentialsBlock("Essential payments this month", input.essentials),
        essentialsBlock("Essential payments prepared for next month", input.nextMonthEssentials),
        input.expectedIncomes.length > 0
            ? line([
                  "## Expected income this month",
                  ...input.expectedIncomes.map((income) =>
                      income.received
                          ? `- [received] ${income.title}: planned ${money(income.amount)}, received ${money(income.receivedAmount ?? income.amount)}`
                          : `- [waiting] ${income.title}: ${money(income.amount)} around day ${income.day}`,
                  ),
                  `Planned ${money(incomes.planned)}, received ${money(incomes.received)}, still on the way ${money(incomes.pending)}`,
                  "",
              ])
            : "",
        savingsBlock(input),
        line([
            "## This month so far",
            `Transactions: ${totals.count} (${inMonth.filter((item) => item.transactionType === TransactionEnum.EXPENSE).length} expenses)`,
            `Income ${money(totals.income)}, expenses ${money(totals.expense)}, result ${money(result.net)}`,
            `Average expense ${money(totals.averageExpense)}, largest expense ${totals.largestExpense ? `${money(totals.largestExpense.value)} (${totals.largestExpense.description || totals.largestExpense.categorie})` : "none"}`,
            categories.length > 0 ? "By category:" : "",
            ...categories.map(
                (slice) => `- ${slice.name}: ${money(slice.value)} (${slice.percent}% of the month expenses)`,
            ),
            "",
        ]),
        months.length > 0
            ? line([
                  "## Last months",
                  ...months.map(
                      (point) =>
                          `- ${point.month}: income ${money(point.income)}, expenses ${money(point.expense)}, result ${money(point.income - point.expense)}`,
                  ),
                  "",
              ])
            : "",
        bankBlock(input.bank),
        line([
            `## Recent transactions (newest first, up to ${limit})`,
            "date | type | category | amount | description",
            ...recent,
        ]),
    ]);
};
