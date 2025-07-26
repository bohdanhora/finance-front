import { LangugaeDropdown } from "components/language-dropdown";
import { ThemeSwitch } from "components/theme-switch";
import { useTranslations } from "next-intl";
import { twMerge } from "tailwind-merge";

export const AuthSectionWrapper = ({
    children,
    className,
    title,
    subtitle,
}: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
}) => {
    const tAuth = useTranslations("auth");

    return (
        <div
            className={twMerge(
                "w-lg p-9 rounded-xl border font-poppins border-[#878787] bg-white/80 dark:bg-black/80",
                className,
            )}
        >
            <div className="w-full flex items-center justify-between mb-6">
                <p className="font-light text-base">{tAuth("welcome")}</p>
                <div className="flex items-center gap-3">
                    <LangugaeDropdown />
                    <ThemeSwitch />
                </div>
            </div>

            <h1 className="font-medium mb-1 text-3xl">{title}</h1>
            <p className="mb-12 font-light text-base">{subtitle}</p>
            {children}
        </div>
    );
};
