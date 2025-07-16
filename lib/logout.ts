import Cookies from "js-cookie";

export const clearCookies = () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    Cookies.remove("userId");
};
