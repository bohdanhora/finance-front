/** Every string the PDF prints. Built from next-intl so the report follows the app language. */
export type ReportLabels = {
    title: string;
    periodLabel: string;
    generatedAt: string;
    amountsIn: string;
    page: string;
    of: string;
    nothingHere: string;

    summary: {
        heading: string;
        balance: string;
        income: string;
        expense: string;
        net: string;
        savings: string;
        essentialsRemaining: string;
        transactionCount: string;
        averageExpense: string;
        largestExpense: string;
        rateMissing: string;
    };

    categories: {
        heading: string;
        category: string;
        amount: string;
        share: string;
        other: string;
    };

    dynamics: {
        heading: string;
        income: string;
        expense: string;
        net: string;
    };

    essentials: {
        heading: string;
        subheading: string;
        payment: string;
        plan: string;
        paid: string;
        planned: string;
        remaining: string;
        no: string;
    };

    savings: {
        heading: string;
        total: string;
        cash: string;
        card: string;
        breakdown: string;
        goals: string;
        saved: string;
        monthly: string;
        deadline: string;
        daysLeft: string;
    };

    transactions: {
        heading: string;
        date: string;
        category: string;
        description: string;
        amount: string;
    };
};
