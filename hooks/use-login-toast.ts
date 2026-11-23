import { useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations>;

export const useLoginToast = (t: T) => {
    useEffect(() => {
        if (sessionStorage.getItem("showLoginToast")) {
            toast.success(t("api.successLogin"));
            sessionStorage.removeItem("showLoginToast");
        }
        if (sessionStorage.getItem("showRegistrationToast")) {
            toast.success(t("api.successRegistration"));
            sessionStorage.removeItem("showRegistrationToast");
        }
    }, [t]);
};
