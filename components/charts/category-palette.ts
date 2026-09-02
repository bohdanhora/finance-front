/**
 * Categorical palette. Distinguishable side by side and legible on both the
 * light and the dark surface, so one set works for every chart.
 */
export const CATEGORY_COLORS = [
    "#6366f1",
    "#f43f5e",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#a855f7",
    "#14b8a6",
    "#ef4444",
    "#84cc16",
    "#ec4899",
    "#0ea5e9",
    "#f97316",
    "#8b5cf6",
    "#22c55e",
    "#e11d48",
    "#06b6d4",
    "#d97706",
    "#7c3aed",
    "#65a30d",
    "#db2777",
];

export const colorFor = (index: number) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

export const INCOME_COLOR = "#10b981";
export const EXPENSE_COLOR = "#f43f5e";
