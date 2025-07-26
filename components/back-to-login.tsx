import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const BackToLogin = () => {
    const tAuth = useTranslations("auth");

    return (
        <div className="flex justify-center gap-1">
            <span className="text-sm opacity-60">{tAuth("backToLoginFromForgot")}</span>
            <Link href={Routes.LOGIN} className="text-sm font-medium hover:opacity-70 transition-all">
                {tAuth("login")}
            </Link>
        </div>
    );
};
