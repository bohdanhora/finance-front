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
