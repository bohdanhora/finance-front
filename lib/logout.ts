import Cookies from "js-cookie";
import { USER_CURRENCY_STORAGE_KEY } from "constants/index";

export const clearCookies = () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("userId");
    Cookies.remove("rememberMe");
    if (typeof window !== "undefined") {
        localStorage.removeItem(USER_CURRENCY_STORAGE_KEY);
    }
};
