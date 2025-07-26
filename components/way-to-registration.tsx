import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const RegistrationWay = () => {
    const tAuth = useTranslations("auth");

    return (
        <div className="flex justify-center gap-1">
            <span className="text-sm opacity-60">{tAuth("dontHaveAccount")}</span>
            <Link href={Routes.SEND_EMAIL_CODE} className="text-sm font-medium hover:opacity-70 transition-all">
                {tAuth("registration")}
            </Link>
        </div>
    );
};
