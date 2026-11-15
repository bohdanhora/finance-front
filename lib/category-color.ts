import { CategoryKey, isDefaultCategory } from "constants/categories";

export type CategoryHue = "green" | "orange" | "blue" | "violet" | "pink" | "amber" | "cyan" | "slate" | "teal";

const CATEGORY_HUES: Record<CategoryKey, CategoryHue> = {
    groceries: "green",
    restaurant: "orange",
    delivery: "orange",
    housing: "slate",
    home: "slate",
    utilities: "amber",
    transport: "blue",
    car: "blue",
    health: "pink",
    pharmacy: "pink",
    education: "violet",
    children: "pink",
    pets: "amber",
    cosmetics: "pink",
    clothing: "violet",
    entertainment: "violet",
    subscriptions: "cyan",
    travel: "cyan",
    gifts: "pink",
    charity: "green",
    credit: "slate",
    transfers: "slate",
    insurance: "blue",
    taxes: "slate",
    electronics: "cyan",
    repairs: "amber",
    work: "blue",
    essentials: "amber",
    savings: "teal",
    other: "slate",
    income: "teal",
};

export const categoryHue = (category: string): CategoryHue =>
    isDefaultCategory(category) ? CATEGORY_HUES[category] : "slate";

export const categoryColorVar = (category: string) => `var(--hue-${categoryHue(category)})`;
