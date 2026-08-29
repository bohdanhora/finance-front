import { useTranslations } from "next-intl";
import { MessageSquareText } from "lucide-react";

export const FillForm = () => {
    const t = useTranslations("common");

    return (
        <a
            href="https://forms.gle/wffZufMK9K67cgoP7"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-3 text-sm font-medium shadow-lg shadow-black/10 backdrop-blur-xl transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:right-8 sm:bottom-8 dark:border-white/10 dark:bg-black/70 dark:shadow-black/40"
        >
            <MessageSquareText size={16} className="text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">{t("fillForm")}</span>
        </a>
    );
};
