import { CheckedState } from "@radix-ui/react-checkbox";
import Cookies from "js-cookie";
import { LoginResponseType } from "types/auth.types";

export const loginSetTokens = ({ accessToken, refreshToken, userId }: LoginResponseType, rememberMe: CheckedState) => {
    if (rememberMe === true) {
        Cookies.set("accessToken", accessToken, { expires: 3 });
        Cookies.set("refreshToken", refreshToken, { expires: 3 });
        Cookies.set("userId", userId, { expires: 3 });
    } else {
        Cookies.set("accessToken", accessToken);
        Cookies.set("refreshToken", refreshToken);
        Cookies.set("userId", userId);
    }
};
