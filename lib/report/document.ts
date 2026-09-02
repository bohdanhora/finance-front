import type { Content, ContentTable, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";

import { CURRENCY, TransactionEnum } from "../../constants/index";
import { ReportLabels } from "./labels";
import { REPORT_COLORS, REPORT_PAGE } from "./theme";
import { ReportModel, ReportSection } from "./types";

export type ReportFormatters = {
    amount: (value: number) => string;
    /** Amount with its ISO code, for figures that stand on their own. */
    money: (value: number, currency?: CURRENCY) => string;
    date: (value: string) => string;
    month: (monthKey: string) => string;
    percent: (value: number) => string;
    categoryLabel: (key: string) => string;
};

type BuildArgs = {
    model: ReportModel;
    labels: ReportLabels;
    sections: ReportSection[];
    formatters: ReportFormatters;
};

const { contentWidth, margin } = REPORT_PAGE;

const rule = (width = contentWidth): Content => ({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: width, y2: 0, lineWidth: 0.7, lineColor: REPORT_COLORS.rule }],
    margin: [0, 0, 0, 10],
});

const heading = (text: string): Content => ({
    stack: [{ text, style: "sectionHeading" }, rule()],
    margin: [0, 20, 0, 0],
});

const muted = (text: string): Content => ({ text, style: "muted", margin: [0, 2, 0, 0] });

/** A rounded progress bar. `percent` is clamped, so a 120% goal still draws inside its track. */
const bar = (percent: number, width: number, color = REPORT_COLORS.accent): Content => {
    const filled = Math.max(0, Math.min(percent, 100)) / 100;

    return {
        canvas: [
            { type: "rect", x: 0, y: 0, w: width, h: 7, r: 3.5, color: REPORT_COLORS.track },
            ...(filled > 0
                ? [{ type: "rect" as const, x: 0, y: 0, w: Math.max(width * filled, 3), h: 7, r: 3.5, color }]
                : []),
        ],
        margin: [0, 4, 0, 0],
    };
};

type StatCard = { label: string; value: string; tone?: "accent" | "expense" | "ink" };

/** Cards are separate one-cell tables so the surface gaps between them stay real. */
const statCards = (cards: StatCard[], perRow = 3): Content[] => {
    const rows: Content[] = [];

    for (let index = 0; index < cards.length; index += perRow) {
        const slice = cards.slice(index, index + perRow);
        const filler = Array.from({ length: perRow - slice.length }, () => null);

        rows.push({
            columns: [
                ...slice.map((card) => ({
                    table: {
                        widths: ["*"],
                        body: [
                            [
                                {
                                    stack: [
                                        { text: card.label, style: "cardLabel" },
                                        {
                                            text: card.value,
                                            style: "cardValue",
                                            color:
                                                card.tone === "accent"
                                                    ? REPORT_COLORS.accent
                                                    : card.tone === "expense"
                                                      ? REPORT_COLORS.expense
                                                      : REPORT_COLORS.ink,
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                    layout: {
                        hLineWidth: () => 0,
                        vLineWidth: () => 0,
                        fillColor: () => REPORT_COLORS.surface,
                        paddingLeft: () => 12,
                        paddingRight: () => 12,
                        paddingTop: () => 10,
                        paddingBottom: () => 10,
                    },
                })),
                ...filler.map(() => ({ text: "" })),
            ],
            columnGap: 10,
            margin: [0, 0, 0, 10],
        });
    }

    return rows;
};

const tableLayout = (zebra = false) => ({
    hLineWidth: (rowIndex: number) => (rowIndex === 1 ? 0.7 : 0),
    vLineWidth: () => 0,
    hLineColor: () => REPORT_COLORS.rule,
    fillColor: (rowIndex: number) => {
        if (rowIndex === 0) return null;
        return zebra && rowIndex % 2 === 0 ? REPORT_COLORS.zebra : null;
    },
    paddingLeft: (columnIndex: number) => (columnIndex === 0 ? 0 : 6),
    paddingRight: () => 6,
    paddingTop: () => 5,
    paddingBottom: () => 5,
});

const headerCell = (text: string, alignment: "left" | "right" = "left"): TableCell => ({
    text,
    style: "tableHeader",
    alignment,
});

const documentHeader = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content => ({
    table: {
        widths: ["*"],
        body: [
            [
                {
                    columns: [
                        {
                            stack: [
                                { text: labels.title, style: "docTitle" },
                                { text: labels.periodLabel, style: "docSubtitle" },
                            ],
                        },
                        {
                            width: "auto",
                            stack: [
                                {
                                    text: `${labels.generatedAt}: ${formatters.date(model.generatedAt)}`,
                                    style: "docMeta",
                                },
                                {
                                    text: `${labels.amountsIn} ${model.currency.toUpperCase()}`,
                                    style: "docMeta",
                                },
                            ],
                            alignment: "right",
                        },
                    ],
                },
            ],
        ],
    },
    layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        fillColor: () => REPORT_COLORS.accent,
        paddingLeft: () => 18,
        paddingRight: () => 18,
        paddingTop: () => 16,
        paddingBottom: () => 16,
    },
});

const summarySection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    const { summary } = model;

    const cards: StatCard[] = [
        { label: labels.summary.balance, value: formatters.money(summary.balance) },
        { label: labels.summary.income, value: formatters.money(summary.income), tone: "accent" },
        { label: labels.summary.expense, value: formatters.money(summary.expense), tone: "expense" },
        {
            label: labels.summary.net,
            value: formatters.money(summary.net),
            tone: summary.net < 0 ? "expense" : "ink",
        },
        {
            label: labels.summary.savings,
            value: summary.savingsTotal === null ? labels.summary.rateMissing : formatters.money(summary.savingsTotal),
        },
        { label: labels.summary.essentialsRemaining, value: formatters.money(summary.essentialsRemaining) },
    ];

    const facts = [
        `${labels.summary.transactionCount}: ${summary.transactionCount}`,
        `${labels.summary.averageExpense}: ${formatters.money(summary.averageExpense)}`,
        summary.largestExpense
            ? `${labels.summary.largestExpense}: ${formatters.money(summary.largestExpense.value)} - ${formatters.categoryLabel(summary.largestExpense.categorie)}`
            : null,
    ].filter((fact): fact is string => Boolean(fact));

    return [heading(labels.summary.heading), ...statCards(cards), muted(facts.join("   ·   "))];
};

const categoriesSection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    if (!model.categories.length) {
        return [heading(labels.categories.heading), muted(labels.nothingHere)];
    }

    const barWidth = 120;
    const largest = model.categories[0].amount || 1;

    const body: TableCell[][] = [
        [
            headerCell(labels.categories.category),
            headerCell(""),
            headerCell(labels.categories.amount, "right"),
            headerCell(labels.categories.share, "right"),
        ],
        ...model.categories.map((row) => [
            {
                text: row.folded ? labels.categories.other : formatters.categoryLabel(row.key),
                style: "cell",
            },
            bar((row.amount / largest) * 100, barWidth),
            { text: formatters.amount(row.amount), style: "cell", alignment: "right" as const },
            { text: formatters.percent(row.percent), style: "cellMuted", alignment: "right" as const },
        ]),
    ];

    const table: ContentTable = {
        table: { headerRows: 1, widths: ["*", barWidth, 80, 44], body },
        layout: tableLayout(),
    };

    return [heading(labels.categories.heading), table];
};

/** Grouped bars drawn as vectors, so the chart stays crisp at any zoom and in print. */
const dynamicsChart = (model: ReportModel): Content | null => {
    const peak = Math.max(...model.dynamics.flatMap((row) => [row.income, row.expense]), 0);
    if (peak <= 0) return null;

    const height = 110;
    const slot = contentWidth / model.dynamics.length;
    const barWidth = 16;
    const gap = 5;

    const canvas = model.dynamics.flatMap((row, index) => {
        const center = slot * index + slot / 2;
        const left = center - barWidth - gap / 2;

        return [
            {
                type: "rect" as const,
                x: left,
                y: height - Math.max((row.income / peak) * height, row.income > 0 ? 3 : 0),
                w: barWidth,
                h: Math.max((row.income / peak) * height, row.income > 0 ? 3 : 0),
                r: 3,
                color: REPORT_COLORS.accent,
            },
            {
                type: "rect" as const,
                x: left + barWidth + gap,
                y: height - Math.max((row.expense / peak) * height, row.expense > 0 ? 3 : 0),
                w: barWidth,
                h: Math.max((row.expense / peak) * height, row.expense > 0 ? 3 : 0),
                r: 3,
                color: REPORT_COLORS.expense,
            },
        ];
    });

    return {
        canvas: [
            ...canvas,
            {
                type: "line",
                x1: 0,
                y1: height + 1,
                x2: contentWidth,
                y2: height + 1,
                lineWidth: 0.7,
                lineColor: REPORT_COLORS.rule,
            },
        ],
        margin: [0, 4, 0, 6],
    };
};

const legend = (labels: ReportLabels): Content => ({
    columns: [
        {
            width: "auto",
            canvas: [{ type: "rect", x: 0, y: 3, w: 8, h: 8, r: 2, color: REPORT_COLORS.accent }],
        },
        { width: "auto", text: labels.dynamics.income, style: "muted", noWrap: true, margin: [5, 0, 14, 0] },
        {
            width: "auto",
            canvas: [{ type: "rect", x: 0, y: 3, w: 8, h: 8, r: 2, color: REPORT_COLORS.expense }],
        },
        { width: "auto", text: labels.dynamics.expense, style: "muted", noWrap: true, margin: [5, 0, 0, 0] },
        { text: "" },
    ],
    margin: [0, 0, 0, 4],
});

const dynamicsSection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    const chart = dynamicsChart(model);

    if (!chart) {
        return [heading(labels.dynamics.heading), muted(labels.nothingHere)];
    }

    const body: TableCell[][] = [
        [
            headerCell(""),
            headerCell(labels.dynamics.income, "right"),
            headerCell(labels.dynamics.expense, "right"),
            headerCell(labels.dynamics.net, "right"),
        ],
        ...model.dynamics.map((row) => [
            { text: formatters.month(row.month), style: "cell" },
            { text: formatters.amount(row.income), style: "cell", alignment: "right" as const },
            { text: formatters.amount(row.expense), style: "cell", alignment: "right" as const },
            {
                text: formatters.amount(row.net),
                style: "cell",
                alignment: "right" as const,
                color: row.net < 0 ? REPORT_COLORS.expense : REPORT_COLORS.ink,
            },
        ]),
    ];

    return [
        heading(labels.dynamics.heading),
        legend(labels),
        chart,
        {
            columns: model.dynamics.map((row) => ({
                text: formatters.month(row.month),
                style: "axisLabel",
                alignment: "center" as const,
            })),
            margin: [0, 0, 0, 12],
        },
        { table: { headerRows: 1, widths: ["*", 100, 100, 100], body }, layout: tableLayout(true) },
    ];
};

const essentialsSection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    const { essentials } = model;

    if (!essentials.items.length) {
        return [heading(labels.essentials.heading), muted(labels.nothingHere)];
    }

    const body: TableCell[][] = [
        [
            headerCell(labels.essentials.payment),
            headerCell(labels.essentials.plan, "right"),
            headerCell(labels.essentials.paid, "right"),
        ],
        ...essentials.items.map((item) => [
            { text: item.title, style: "cell" },
            { text: formatters.amount(item.amount), style: "cell", alignment: "right" as const },
            {
                text: item.checked ? formatters.amount(item.paidAmount ?? item.amount) : labels.essentials.no,
                style: item.checked ? "cell" : "cellMuted",
                alignment: "right" as const,
            },
        ]),
    ];

    return [
        heading(labels.essentials.heading),
        muted(labels.essentials.subheading),
        { table: { headerRows: 1, widths: ["*", 110, 110], body }, layout: tableLayout(true), margin: [0, 8, 0, 10] },
        ...statCards(
            [
                { label: labels.essentials.planned, value: formatters.money(essentials.planned) },
                { label: labels.essentials.paid, value: formatters.money(essentials.paid), tone: "accent" },
                {
                    label: labels.essentials.remaining,
                    value: formatters.money(essentials.remaining),
                    tone: "expense",
                },
            ],
            3,
        ),
    ];
};

const savingsSection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    const { savings } = model;
    const missingRate = labels.summary.rateMissing;

    const content: Content[] = [
        heading(labels.savings.heading),
        ...statCards([
            {
                label: labels.savings.total,
                value: savings.total === null ? missingRate : formatters.money(savings.total),
                tone: "accent",
            },
            { label: labels.savings.card, value: savings.card === null ? missingRate : formatters.money(savings.card) },
            { label: labels.savings.cash, value: savings.cash === null ? missingRate : formatters.money(savings.cash) },
        ]),
    ];

    if (savings.slices.length) {
        const body: TableCell[][] = [
            [
                headerCell(labels.savings.breakdown),
                headerCell(labels.savings.card, "right"),
                headerCell(labels.savings.cash, "right"),
                headerCell(labels.savings.total, "right"),
            ],
            ...savings.slices.map((slice) => [
                { text: slice.currency.toUpperCase(), style: "cell" },
                { text: formatters.amount(slice.card), style: "cell", alignment: "right" as const },
                { text: formatters.amount(slice.cash), style: "cell", alignment: "right" as const },
                { text: formatters.amount(slice.total), style: "cellStrong", alignment: "right" as const },
            ]),
        ];

        content.push({
            table: { headerRows: 1, widths: ["*", 100, 100, 100], body },
            layout: tableLayout(true),
            margin: [0, 0, 0, 6],
        });
    }

    if (savings.goals.length) {
        content.push({ text: labels.savings.goals, style: "subheading", margin: [0, 12, 0, 6] });

        savings.goals.forEach((goal) => {
            const facts = [
                `${labels.savings.saved}: ${formatters.money(goal.covered, goal.currency)} / ${formatters.money(goal.targetAmount, goal.currency)}`,
                `${labels.savings.monthly}: ${formatters.money(goal.monthlyContribution, goal.currency)}`,
                goal.targetDate
                    ? `${labels.savings.deadline}: ${formatters.date(goal.targetDate)}${
                          goal.daysRemaining !== null ? ` (${goal.daysRemaining} ${labels.savings.daysLeft})` : ""
                      }`
                    : null,
            ].filter((fact): fact is string => Boolean(fact));

            content.push({
                unbreakable: true,
                stack: [
                    {
                        columns: [
                            { text: goal.name, style: "cellStrong" },
                            {
                                width: "auto",
                                text: formatters.percent(goal.progress),
                                style: "cellStrong",
                                color: REPORT_COLORS.accent,
                            },
                        ],
                    },
                    bar(goal.progress, contentWidth),
                    { text: facts.join("   ·   "), style: "muted", margin: [0, 5, 0, 0] },
                ],
                margin: [0, 0, 0, 12],
            });
        });
    }

    return content;
};

const transactionsSection = (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters): Content[] => {
    if (!model.transactions.length) {
        return [heading(labels.transactions.heading), muted(labels.nothingHere)];
    }

    const body: TableCell[][] = [
        [
            headerCell(labels.transactions.date),
            headerCell(labels.transactions.category),
            headerCell(labels.transactions.description),
            headerCell(labels.transactions.amount, "right"),
        ],
        ...model.transactions.map((transaction) => {
            const expense = transaction.transactionType === TransactionEnum.EXPENSE;

            return [
                { text: formatters.date(transaction.date), style: "cell" },
                { text: formatters.categoryLabel(transaction.categorie), style: "cell" },
                { text: transaction.description || "-", style: "cellMuted" },
                {
                    text: `${expense ? "-" : "+"}${formatters.amount(transaction.value)}`,
                    style: "cellStrong",
                    alignment: "right" as const,
                    color: expense ? REPORT_COLORS.expense : REPORT_COLORS.accent,
                },
            ];
        }),
    ];

    return [
        heading(labels.transactions.heading),
        { table: { headerRows: 1, widths: [62, 96, "*", 84], body }, layout: tableLayout(true) },
    ];
};

const SECTION_BUILDERS: Record<
    ReportSection,
    (model: ReportModel, labels: ReportLabels, formatters: ReportFormatters) => Content[]
> = {
    summary: summarySection,
    categories: categoriesSection,
    dynamics: dynamicsSection,
    essentials: essentialsSection,
    savings: savingsSection,
    transactions: transactionsSection,
};

export const buildReportDocument = ({ model, labels, sections, formatters }: BuildArgs): TDocumentDefinitions => {
    const ordered = (Object.keys(SECTION_BUILDERS) as ReportSection[]).filter((section) => sections.includes(section));

    return {
        pageSize: "A4",
        pageMargins: [margin, margin, margin, 44],
        info: { title: labels.title, subject: labels.periodLabel },
        content: [
            documentHeader(model, labels, formatters),
            ...ordered.flatMap((section) => SECTION_BUILDERS[section](model, labels, formatters)),
        ],
        footer: (currentPage: number, pageCount: number) => ({
            columns: [
                { text: labels.title, style: "footer" },
                {
                    text: `${labels.page} ${currentPage} ${labels.of} ${pageCount}`,
                    style: "footer",
                    alignment: "right",
                },
            ],
            margin: [margin, 12, margin, 0],
        }),
        styles: {
            docTitle: { fontSize: 19, bold: true, color: REPORT_COLORS.inverted },
            docSubtitle: { fontSize: 10.5, color: REPORT_COLORS.inverted, margin: [0, 4, 0, 0] },
            docMeta: { fontSize: 8.5, color: REPORT_COLORS.inverted, margin: [0, 1, 0, 0] },
            sectionHeading: { fontSize: 12.5, bold: true, color: REPORT_COLORS.ink, margin: [0, 0, 0, 6] },
            subheading: { fontSize: 10, bold: true, color: REPORT_COLORS.inkSecondary },
            cardLabel: { fontSize: 8, color: REPORT_COLORS.inkMuted, margin: [0, 0, 0, 3] },
            cardValue: { fontSize: 13, bold: true },
            tableHeader: { fontSize: 8, bold: true, color: REPORT_COLORS.inkMuted },
            cell: { fontSize: 9, color: REPORT_COLORS.ink },
            cellStrong: { fontSize: 9, bold: true, color: REPORT_COLORS.ink },
            cellMuted: { fontSize: 9, color: REPORT_COLORS.inkSecondary },
            axisLabel: { fontSize: 7.5, color: REPORT_COLORS.inkMuted },
            muted: { fontSize: 8.5, color: REPORT_COLORS.inkMuted },
            footer: { fontSize: 7.5, color: REPORT_COLORS.inkMuted },
        },
        defaultStyle: { font: "Roboto", fontSize: 9, color: REPORT_COLORS.ink, lineHeight: 1.15 },
    };
};
