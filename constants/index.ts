export enum ISO4217Codes {
    UAH = 980,
    USD = 840,
    EUR = 978,
}

export enum CURRENCY {
    USD = "usd",
    EUR = "eur",
    UAH = "uah",
}

export enum EssentialsType {
    DEFAULT = "default",
    THIS_MONTH = "this-month",
    NEXT_MONTH = "next-month",
}

export enum TransactionEnum {
    EXPENSE = "expense",
    INCOME = "income",
}

export const LANG_COOKIES_NAME = "LANG_FINANCE";
export const USER_CURRENCY_STORAGE_KEY = "currency";
/** Fired once the user has picked a currency on first launch. */
export const CURRENCY_CHOSEN_EVENT = "finance:currency-chosen";
export const CURRENCY_COOKIES_NAME = "CURRENCY_FINANCE";

export const currencyArray = ["$", "₴", "€"];

/** The locales that actually have a file in `messages/`. */
export const SUPPORTED_LOCALES = ["en", "ru", "ua"] as const;
export const DEFAULT_LOCALE = "en";

/**
 * Browsers report Ukrainian as `uk`, so the tag a browser sends never matches
 * the `ua` file name, and anything else (`de`, `pl`, ...) has no file at all.
 * An unmapped tag used to reach `import("../messages/<tag>.json")` and take the
 * whole app down, so everything funnels through here.
 */
export const normalizeLocale = (value?: string | null) => {
    const tag = (value || "").toLowerCase().split("-")[0];
    if (tag === "uk") return "ua";
    return (SUPPORTED_LOCALES as readonly string[]).includes(tag) ? tag : DEFAULT_LOCALE;
};
