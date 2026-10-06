import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import Link from "next/link";

export const RegistrationWay = () => {
    const tAuth = useTranslations("auth");

    return (
        <p className="text-ink-muted text-sm">
            {tAuth("dontHaveAccount")}{" "}
            <Link href={Routes.SEND_EMAIL_CODE} className="link text-accent font-medium">
                {tAuth("registration")}
            </Link>
        </p>
    );
};
