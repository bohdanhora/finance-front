import { useTranslations } from "next-intl";

export const FillForm = () => {
    const t = useTranslations("common");

    return (
        <a
            href="https://forms.gle/wffZufMK9K67cgoP7"
            target="_blank"
            className="fixed bottom-10 right-10 z-50 bg-white/70 dark:bg-black/70 px-3 py-4 rounded-lg"
        >
            <span className="animate-pulse">{t("fillForm")}</span>
        </a>
    );
};
