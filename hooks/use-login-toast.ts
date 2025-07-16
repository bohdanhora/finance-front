import { useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations>;

export const useLoginToast = (t: T) => {
    useEffect(() => {
        const shouldShowToast = sessionStorage.getItem("showLoginToast");
        if (shouldShowToast) {
            toast.success(t("api.successLogin"));
            sessionStorage.removeItem("showLoginToast");
        }
    }, [t]);
};
