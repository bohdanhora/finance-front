import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const BackToLogin = () => {
    const tAuth = useTranslations("auth");

    return (
        <p className="text-ink-muted text-sm">
            {tAuth("backToLoginFromForgot")}{" "}
            <Link href={Routes.LOGIN} className="link text-accent font-medium">
                {tAuth("login")}
            </Link>
        </p>
    );
};
