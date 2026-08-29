import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const BackToLogin = () => {
    const tAuth = useTranslations("auth");

    return (
        <p className="text-center text-sm text-black/55 dark:text-white/55">
            {tAuth("backToLoginFromForgot")}{" "}
            <Link
                href={Routes.LOGIN}
                className="font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
                {tAuth("login")}
            </Link>
        </p>
    );
};
