export const EXPENSE_CATEGORY_KEYS = [
    "groceries",
    "restaurant",
    "delivery",
    "housing",
    "home",
    "utilities",
    "transport",
    "car",
    "health",
    "pharmacy",
    "education",
    "children",
    "pets",
    "cosmetics",
    "clothing",
    "entertainment",
    "subscriptions",
    "travel",
    "gifts",
    "charity",
    "credit",
    "insurance",
    "taxes",
    "electronics",
    "repairs",
    "work",
    "essentials",
    "savings",
    "other",
] as const;

export const CATEGORY_KEYS = [...EXPENSE_CATEGORY_KEYS, "income"] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

const CATEGORY_KEY_SET = new Set<string>(CATEGORY_KEYS);

export const isDefaultCategory = (category: string): category is CategoryKey => CATEGORY_KEY_SET.has(category);

export const getCategoryLabel = (category: string, translate: (key: CategoryKey) => string) =>
    isDefaultCategory(category) ? translate(category) : category;
