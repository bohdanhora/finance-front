import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import GoogleButton from "react-google-button";

export const GoogleAuth = () => {
    const { theme } = useTheme();
    const tAuth = useTranslations("auth");

    const handleClickGoogleAuth = () => {
        window.location.href = process.env.NEXT_PUBLIC_OAUTH_URL || "";
    };
    return (
        <div className="flex flex-col items-center mb-5">
            <span className="my-5">{tAuth("or")}</span>
            <GoogleButton type={theme === "dark" ? "dark" : "light"} onClick={handleClickGoogleAuth} />
        </div>
    );
};
