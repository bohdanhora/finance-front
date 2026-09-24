export const getIntlLocale = (locale: string) => {
    if (locale === "ua") return "uk-UA";
    if (locale === "ru") return "ru-RU";
    return "en-US";
};

export const formatMonthKey = (monthKey: string, locale: string, month: "short" | "long" = "long") => {
    const [year, monthNumber] = monthKey.split("-").map(Number);
    return new Intl.DateTimeFormat(getIntlLocale(locale), {
        month,
        year: month === "long" ? "numeric" : undefined,
    }).format(new Date(year, monthNumber - 1, 1));
};

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 60],
    ["day", 24],
    ["week", 7],
];

export const formatRelativeTime = (value: string | Date, locale: string, now = new Date()) => {
    const formatter = new Intl.RelativeTimeFormat(getIntlLocale(locale), { numeric: "auto" });
    let amount = (new Date(value).getTime() - now.getTime()) / 1000;

    if (Math.abs(amount) < 60) return formatter.format(0, "second");

    amount /= 60;
    for (const [unit, next] of RELATIVE_STEPS) {
        if (Math.abs(amount) < next) return formatter.format(Math.round(amount), unit);
        amount /= next;
    }

    return new Intl.DateTimeFormat(getIntlLocale(locale), { day: "numeric", month: "short", year: "numeric" }).format(
        new Date(value),
    );
};

export const formatDateTime = (value: string | Date, locale: string) =>
    new Intl.DateTimeFormat(getIntlLocale(locale), {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
