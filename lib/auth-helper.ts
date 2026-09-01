import { CheckedState } from "@radix-ui/react-checkbox";
import Cookies from "js-cookie";
import { LoginResponseType } from "types/auth";

export const AUTH_SESSION_DAYS = 3;
export const GOOGLE_AUTH_REMEMBER_ME_KEY = "googleAuthRememberMe";

const REMEMBER_ME_COOKIE = "rememberMe";

export const getAuthCookieOptions = (rememberMe: boolean) => ({
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    ...(rememberMe ? { expires: AUTH_SESSION_DAYS } : {}),
});

export const isRememberedSession = () => Cookies.get(REMEMBER_ME_COOKIE) === "true";

export const loginSetTokens = ({ accessToken, refreshToken, userId }: LoginResponseType, rememberMe: CheckedState) => {
    const shouldRemember = rememberMe === true;
    const cookieOptions = getAuthCookieOptions(shouldRemember);

    Cookies.set("accessToken", accessToken, cookieOptions);
    Cookies.set("refreshToken", refreshToken, cookieOptions);
    Cookies.set("userId", userId, cookieOptions);

    if (shouldRemember) {
        Cookies.set(REMEMBER_ME_COOKIE, "true", cookieOptions);
    } else {
        Cookies.remove(REMEMBER_ME_COOKIE, { path: "/" });
    }
};
