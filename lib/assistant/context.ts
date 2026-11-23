import dayjs from "dayjs";

import { CURRENCY, TransactionEnum } from "../../constants/index";
import { byCategory, filterByMonth, listMonths, monthTotals, toMonthKey } from "../statistics";
import { getSavingsBalance, getSavingsNativeBalance } from "../savings";
import { summarizeEssentials, summarizeExpectedIncomes } from "../month-plan";
import { payCycleOf, SafeToSpend, safeToSpend, scopeBudget, SHARED_SCOPE } from "../pay-cycle";
import { cushionOf, limitsInCycle, subscriptionsOf } from "../health";
import { roundMoney } from "../money";
import {
    Card,
    EssentialType,
    ExpectedIncome,
    MonthSnapshot,
    SavingsGoal,
    SavingsOperation,
    SavingsStorage,
    StreakRecord,
    TransactionType,
} from "../../types/transactions";

export const DEFAULT_TRANSACTION_LIMIT = 40;
const HISTORY_MONTHS = 24;

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

export type AssistantCard = Pick<Card, "id" | "name" | "balance"> &
    Partial<Pick<Card, "creditLimit" | "personal" | "createdAt">>;

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
    defaultEssentials?: EssentialType[];
    expectedIncomes: ExpectedIncome[];
    monthHistory?: MonthSnapshot[];
    transactions: TransactionType[];
    savingsGoals: SavingsGoal[];
    savingsOperations: SavingsOperation[];
    streak: StreakRecord | null;
    rates: { usdToUah: number; eurToUah: number };
    bank?: AssistantBankContext | null;
    transactionLimit?: number;
    cards?: AssistantCard[];
    hiddenCategories?: string[];
    hiddenTransactions?: string[];
    categoryLimits?: Record<string, number>;
};

const money = (value: number) => roundMoney(value).toFixed(2);

const line = (rows: string[]) => rows.filter(Boolean).join("\n");

const block = (title: string, rows: string[]) => {
    const body = rows.filter(Boolean);
    return body.length ? line([`## ${title}`, ...body, ""]) : "";
};

export const cardLabel = (cards: Pick<Card, "id" | "name">[], id?: string) => {
    const index = id ? cards.findIndex((card) => card.id === id) : 0;
    const position = index < 0 ? 0 : index;
    const card = cards[position];
    if (!card) return "";
    return card.name.trim() || `Card ${position + 1}`;
};

const foreign = (item: { currency?: CURRENCY; currencyAmount?: number }) =>
    item.currency && item.currency !== CURRENCY.UAH && item.currencyAmount
        ? ` (${money(item.currencyAmount)} ${item.currency.toUpperCase()})`
        : "";

const essentialRows = (items: EssentialType[], incomes: ExpectedIncome[]) =>
    items.map((item) => {
        const details = [
            item.day ? `due day ${item.day}` : "",
            item.category ? `category ${item.category}` : "",
            item.fundedBy
                ? `paid from ${incomes.find((income) => income.id === item.fundedBy)?.title ?? "an income"}`
                : "",
            item.carriedFrom ? `carried over from ${item.carriedFrom}` : "",
        ].filter(Boolean);
        const status = item.checked
            ? `[paid] ${item.title}: planned ${money(item.amount)}, paid ${money(item.paidAmount ?? item.amount)}`
            : `[due] ${item.title}: ${money(item.amount)}${foreign(item)}`;
        return `- ${status}${details.length ? ` | ${details.join(", ")}` : ""}`;
    });

const essentialsBlock = (title: string, items: EssentialType[], incomes: ExpectedIncome[]) => {
    if (items.length === 0) return "";
    const summary = summarizeEssentials(items);
    return block(title, [
        ...essentialRows(items, incomes),
        `Planned total: ${money(summary.planned)}, already paid: ${money(summary.paid)}, still to pay: ${money(summary.outstanding)}`,
    ]);
};

const cardsBlock = (input: AssistantContextInput) => {
    const cards = input.cards ?? [];
    if (cards.length === 0) return block("Balance", [`Current balance: ${money(input.totalAmount)}`]);

    const own = cards.reduce((total, card) => total + Math.max(0, card.balance), 0);
    const debt = cards.reduce((total, card) => total + Math.max(0, -card.balance), 0);

    return block("Balance and cards", [
        `Current balance: ${money(input.totalAmount)} (net sum of all cards)`,
        `Own money on cards: ${money(own)}${debt > 0 ? `, credit card debt: ${money(debt)}` : ""}`,
        ...cards.map((card) => {
            const limit = card.creditLimit ?? 0;
            const parts = [
                limit > 0
                    ? `credit card, limit ${money(limit)}, ${card.balance < 0 ? `debt ${money(-card.balance)}, credit left ${money(limit + card.balance)}` : `own money ${money(card.balance)}, no debt`}`
                    : `balance ${money(card.balance)}`,
                card.personal ? "personal (left out of the shared budget)" : "",
            ].filter(Boolean);
            return `- ${cardLabel(cards, card.id)}: ${parts.join(", ")}`;
        }),
    ]);
};

const budgetOf = (input: AssistantContextInput, today: Date) => {
    const cards = input.cards ?? [];
    if (cards.length === 0) return null;

    const scope = scopeBudget(
        {
            cards,
            incomes: input.expectedIncomes,
            bills: {
                current: input.essentials,
                next: input.nextMonthEssentials,
                template: input.defaultEssentials ?? [],
            },
            transactions: input.transactions,
        },
        SHARED_SCOPE,
    );
    return safeToSpend({ scope, today });
};

const payCycleBlock = (input: AssistantContextInput, result: SafeToSpend | null) => {
    if (!result) return "";
    const cards = input.cards ?? [];
    const { cycle } = result;
    const after = result.afterPayday;
    const personal = cards.filter((card) => card.personal);

    return block("Pay cycle budget (the Overview page shows these exact figures)", [
        cycle.anchored
            ? `Cycle: ${cycle.start.format("YYYY-MM-DD")} to the next payday ${cycle.end.format("YYYY-MM-DD")}, ${cycle.daysLeft} days left`
            : `No recurring salary, so the cycle is the calendar month, ${cycle.daysLeft} days left`,
        personal.length
            ? `Scope: shared money, without personal cards ${personal.map((card) => cardLabel(cards, card.id)).join(", ")} and incomes routed to them`
            : "",
        `Own money ${money(result.own)} + income still due before payday ${money(result.incoming)} - unpaid bills due before payday ${money(result.bills)} = safe to spend ${money(result.available)}`,
        `Per day until payday: ${money(result.perDay)}. Spent today on flexible purchases: ${money(result.spentToday)}, left for today: ${money(result.leftToday)}`,
        `Flexible spending this cycle: ${money(result.spentInCycle)}. Typical pace: ${money(result.typical.perDay)} per day over the last ${result.typical.days} days${result.typical.bigCount ? `, not counting ${result.typical.bigCount} big one-off purchases worth ${money(result.typical.bigTotal)}` : ""}`,
        result.debt > 0
            ? `Credit card debt ${money(result.debt)} is a note here, it is not subtracted from safe to spend.`
            : "",
        after
            ? `After payday: safe to spend ${money(result.available)} + salary ${money(after.salary)} - paying off all credit cards ${money(after.debt)} = ${money(after.left)}. At the typical pace that becomes ${money(after.atPace)} by payday.`
            : "",
        result.runsOutOn ? `At the typical pace the money runs out on ${result.runsOutOn.format("YYYY-MM-DD")}.` : "",
    ]);
};

const incomesBlock = (input: AssistantContextInput) => {
    if (input.expectedIncomes.length === 0) return "";
    const summary = summarizeExpectedIncomes(input.expectedIncomes);
    const cards = input.cards ?? [];

    return block("Expected income this month", [
        ...input.expectedIncomes.map((income) => {
            const details = [
                income.recurring ? "monthly" : "one-off",
                income.cardId ? `to ${cardLabel(cards, income.cardId)}` : "",
            ].filter(Boolean);
            const status = income.received
                ? `[received] ${income.title}: planned ${money(income.amount)}, received ${money(income.receivedAmount ?? income.amount)}`
                : `[waiting] ${income.title}: ${money(income.amount)}${foreign(income)} around day ${income.day}`;
            return `- ${status} | ${details.join(", ")}`;
        }),
        `Planned ${money(summary.planned)}, received ${money(summary.received)}, still on the way ${money(summary.pending)}`,
    ]);
};

const savingsBlock = (input: AssistantContextInput, today: Date) => {
    const { savingsOperations, savingsGoals, currency, rates } = input;
    if (savingsOperations.length === 0 && savingsGoals.length === 0) return "";

    const total = getSavingsBalance(savingsOperations, currency, rates);
    const cash = getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CASH);
    const card = getSavingsBalance(savingsOperations, currency, rates, SavingsStorage.CARD);
    const native = [CURRENCY.UAH, CURRENCY.USD, CURRENCY.EUR]
        .map((code) => ({ code, amount: getSavingsNativeBalance(savingsOperations, code) }))
        .filter((item) => item.amount !== 0)
        .map((item) => `${item.code.toUpperCase()} ${money(item.amount)}`)
        .join(", ");

    const goals = savingsGoals.map((goal) => {
        const deadline = goal.targetDate ? `, deadline ${dayjs(goal.targetDate).format("YYYY-MM-DD")}` : "";
        const days = goal.targetDate ? dayjs(goal.targetDate).diff(dayjs(today).startOf("day"), "day") : null;
        const monthly = goal.monthlyContribution > 0 ? `, monthly plan ${money(goal.monthlyContribution)}` : "";
        return `- ${goal.name}: target ${money(goal.targetAmount)} ${goal.currency.toUpperCase()}${monthly}${deadline}${days !== null ? ` (${days} days away)` : ""}${goal.note ? ` | note: ${goal.note}` : ""}`;
    });

    return block("Savings", [
        `Savings pool in ${currency.toUpperCase()}: ${total === null ? "unknown (no exchange rate)" : money(total)}`,
        `Cash: ${cash === null ? "unknown" : money(cash)}, on cards: ${card === null ? "unknown" : money(card)}`,
        native ? `Actual holdings per currency: ${native}` : "",
        `Operations recorded: ${savingsOperations.length}`,
        goals.length > 0
            ? "Goals (wishes to compare against the pool, never money reserved from the budget):"
            : "No savings goals.",
        ...goals,
    ]);
};

const healthBlock = (input: AssistantContextInput, today: Date) => {
    const cycle = payCycleOf(input.expectedIncomes, today);
    const saved = getSavingsBalance(input.savingsOperations, input.currency, input.rates) ?? 0;
    const template = input.defaultEssentials ?? [];
    const cushion = cushionOf({ template, current: input.essentials, transactions: input.transactions, saved, today });
    const subscriptions = subscriptionsOf({
        template,
        current: input.essentials,
        transactions: input.transactions,
        today,
    });

    const limits = Object.keys(input.categoryLimits ?? {}).length
        ? limitsInCycle({
              transactions: input.transactions,
              limits: input.categoryLimits ?? {},
              start: cycle.start,
              daysElapsed: cycle.daysElapsed,
              daysTotal: cycle.daysTotal,
              today,
          })
        : [];

    return block("Financial health (Statistics page)", [
        cushion.monthlyNeed > 0
            ? `Safety cushion: savings ${money(cushion.saved)} cover ${cushion.months} months of basic needs (${money(cushion.monthlyNeed)} a month = bills ${money(cushion.bills)} + groceries and pharmacy ${money(cushion.living)}). Target 3 to 6 months, ${money(cushion.target.min)} to ${money(cushion.target.max)}.`
            : "",
        subscriptions.items.length
            ? `Subscriptions: ${subscriptions.items.map((item) => `${item.title} ${money(item.monthly)}`).join(", ")}; ${money(subscriptions.monthly)} a month, ${money(subscriptions.yearly)} a year`
            : "",
        ...limits.map(
            (item) =>
                `- Limit ${item.category}: spent ${money(item.spent)} of ${money(item.limit)} this cycle, expected by today ${money(item.expected)}, ${item.status}`,
        ),
    ]);
};

const historyBlock = (transactions: TransactionType[], month: string) => {
    const months = listMonths(transactions)
        .filter((key) => key <= month)
        .slice(-HISTORY_MONTHS);
    if (months.length === 0) return "";

    return block("Month by month (calendar months, transfers excluded)", [
        ...months.map((key) => {
            const inMonth = filterByMonth(transactions, key);
            const totals = monthTotals(inMonth);
            const top = byCategory(inMonth)
                .slice(0, 4)
                .map((slice) => `${slice.name} ${money(slice.value)}`)
                .join(", ");
            return `- ${key}: income ${money(totals.income)}, expenses ${money(totals.expense)}, result ${money(totals.income - totals.expense)}, ${totals.count} records${top ? ` | top: ${top}` : ""}`;
        }),
    ]);
};

const planHistoryBlock = (history: MonthSnapshot[] = []) => {
    const recent = [...history].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    if (recent.length === 0) return "";

    return block("Plan and reality of closed months", [
        ...recent.map((snapshot) => {
            const bills = summarizeEssentials(snapshot.essentials);
            const incomes = summarizeExpectedIncomes(snapshot.expectedIncomes);
            return `- ${snapshot.month}: bills planned ${money(bills.planned)}, paid ${money(bills.paid)}, left unpaid ${money(bills.outstanding)}; income planned ${money(incomes.planned)}, received ${money(incomes.received)}`;
        }),
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

    return block("Monobank (read-only mirror, does not affect the budget)", [
        `Client: ${bank.name || "unknown"}`,
        accounts.length > 0 ? "Accounts:" : "No accounts.",
        ...accounts,
        ...(jars.length > 0 ? ["Jars:", ...jars] : []),
        ...statement,
    ]);
};

export const buildAccountSnapshot = (input: AssistantContextInput): string => {
    const today = input.today ?? new Date();
    const month = toMonthKey(today);
    const symbol = input.currency.toUpperCase();
    const limit = input.transactionLimit ?? DEFAULT_TRANSACTION_LIMIT;
    const cards = input.cards ?? [];
    const hidden = new Set(input.hiddenTransactions ?? []);

    const transactions = input.transactions.filter(
        (transaction) => transaction.transactionType !== TransactionEnum.TRANSFER,
    );
    const inMonth = filterByMonth(transactions, month);
    const totals = monthTotals(inMonth);
    const categories = byCategory(inMonth).slice(0, 12);
    const daysLeft = Math.max(dayjs(today).daysInMonth() - dayjs(today).date() + 1, 1);
    const dates = input.transactions.map((transaction) => dayjs(transaction.date).valueOf());

    const recent = [...input.transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
        .map(
            (transaction) =>
                `${dayjs(transaction.date).format("YYYY-MM-DD")} | ${transaction.transactionType} | ${
                    transaction.categorie || "other"
                } | ${money(transaction.value)} | ${transaction.description || "-"}${
                    cards.length > 1
                        ? ` | ${
                              transaction.transactionType === TransactionEnum.TRANSFER
                                  ? `${cardLabel(cards, transaction.cardId)} -> ${cardLabel(cards, transaction.toCardId)}`
                                  : cardLabel(cards, transaction.cardId)
                          }`
                        : ""
                }${hidden.has(transaction.id) ? " | hidden from statistics" : ""}`,
        );

    return line([
        "# Finance account snapshot",
        `Today: ${dayjs(today).format("YYYY-MM-DD, dddd")} (current month ${month}, ${daysLeft} days left including today)`,
        `Account currency: ${symbol}. Every amount below is in this currency unless stated otherwise.`,
        input.rates.usdToUah > 0
            ? `Exchange rates: 1 USD = ${input.rates.usdToUah} UAH, 1 EUR = ${input.rates.eurToUah} UAH`
            : "",
        `History: ${input.transactions.length} transactions${dates.length ? ` from ${dayjs(Math.min(...dates)).format("YYYY-MM-DD")} to ${dayjs(Math.max(...dates)).format("YYYY-MM-DD")}` : ""}. Use query_transactions for anything beyond the summary below.`,
        "",
        cardsBlock(input),
        payCycleBlock(input, budgetOf(input, today)),
        block("This calendar month", [
            `Income ${money(totals.income)}, expenses ${money(totals.expense)}, result ${money(totals.income - totals.expense)}, ${totals.count} records`,
            `Average expense ${money(totals.averageExpense)}, largest ${totals.largestExpense ? `${money(totals.largestExpense.value)} (${totals.largestExpense.description || totals.largestExpense.categorie})` : "none"}`,
            ...categories.map((slice) => `- ${slice.name}: ${money(slice.value)} (${slice.percent}%)`),
        ]),
        essentialsBlock("Essential payments this month", input.essentials, input.expectedIncomes),
        incomesBlock(input),
        block("Next month plan", [
            `Prepared starting amount: ${money(input.nextMonthTotalAmount)}`,
            `Next month savings percent: ${input.percentage}%`,
        ]),
        essentialsBlock("Essential payments prepared for next month", input.nextMonthEssentials, input.expectedIncomes),
        (input.defaultEssentials ?? []).length
            ? block("Recurring bill template", [
                  ...(input.defaultEssentials ?? []).map(
                      (item) =>
                          `- ${item.title}: ${money(item.amount)}${item.day ? `, day ${item.day}` : ""}${item.category ? `, ${item.category}` : ""}`,
                  ),
              ])
            : "",
        savingsBlock(input, today),
        healthBlock(input, today),
        (input.hiddenCategories ?? []).length || hidden.size
            ? block("Statistics preferences", [
                  (input.hiddenCategories ?? []).length
                      ? `Categories hidden from statistics: ${(input.hiddenCategories ?? []).join(", ")}`
                      : "",
                  hidden.size ? `${hidden.size} transactions are hidden from statistics.` : "",
              ])
            : "",
        historyBlock(transactions, month),
        planHistoryBlock(input.monthHistory),
        input.streak ? `Daily streak: ${input.streak.current} days, best ${input.streak.best}\n` : "",
        bankBlock(input.bank),
        line([
            `## Latest transactions (newest first, ${Math.min(limit, input.transactions.length)} of ${input.transactions.length})`,
            `date | type | category | amount | description${cards.length > 1 ? " | card" : ""}`,
            ...recent,
        ]),
    ]);
};
