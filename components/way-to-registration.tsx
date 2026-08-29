import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const RegistrationWay = () => {
    const tAuth = useTranslations("auth");

    return (
        <p className="text-center text-sm text-black/55 dark:text-white/55">
            {tAuth("dontHaveAccount")}{" "}
            <Link
                href={Routes.SEND_EMAIL_CODE}
                className="font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
                {tAuth("registration")}
            </Link>
        </p>
    );
};
