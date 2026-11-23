import { CheckedState } from "@radix-ui/react-checkbox";
import { useMutation } from "@tanstack/react-query";
import { authAxios } from "config/axios.instances";
import { loginSetTokens } from "lib/auth-helper";
import { showAxiosError } from "lib/utils";
import {
    ClaimEmailPayload,
    ForgotPasswordPayload,
    ForgotPasswordResponseType,
    LoginPayload,
    LoginResponseType,
    LogoutPayload,
    LogoutResponseType,
    RegistrationPayload,
    RegistrationResponseType,
    ResetPasswordPayload,
    ResetPasswordResponseType,
} from "types/auth";
import { RequestEmailCodePayload, RequestEmailCodeResponseType } from "types/transactions";

const login = async (payload: LoginPayload): Promise<LoginResponseType> => {
    const res = await authAxios.post("login", payload);
    return res.data;
};

export const useLoginMutation = (rememberMe: CheckedState) => {
    return useMutation({
        mutationKey: ["login"],
        mutationFn: login,
        onSuccess: (data) => {
            if (data.accessToken) {
                sessionStorage.setItem("showLoginToast", "true");
                loginSetTokens(data, rememberMe);
            }
        },
        onError: showAxiosError,
    });
};

const forgotPassword = async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponseType> => {
    const res = await authAxios.post("forgot-password", payload);
    return res.data;
};

export const useForgotPassword = () => {
    return useMutation({
        mutationKey: ["forgot-password"],
        mutationFn: forgotPassword,
        onSuccess: (data) => {
            if (data.message) {
                sessionStorage.setItem("showForgotPasswordToast", "true");
            }
        },
    });
};

const resetPassword = async (payload: ResetPasswordPayload): Promise<ResetPasswordResponseType> => {
    const res = await authAxios.put("reset-password", payload);
    return res.data;
};

export const useResetPassword = () => {
    return useMutation({
        mutationKey: ["reset-password"],
        mutationFn: resetPassword,
        onSuccess: (data) => {
            if (data.message) {
                sessionStorage.setItem("showResetPasswordToast", "true");
            }
        },
        onError: showAxiosError,
    });
};

const registration = async (payload: RegistrationPayload): Promise<RegistrationResponseType> => {
    const res = await authAxios.post("registration", payload);
    return res.data;
};

const signInAfterRegistration = (data: RegistrationResponseType) => {
    if (!data.accessToken) return;
    sessionStorage.setItem("showRegistrationToast", "true");
    loginSetTokens(data, true);
};

export const useRegistrationMutation = () => {
    return useMutation({
        mutationKey: ["registration"],
        mutationFn: registration,
        onSuccess: signInAfterRegistration,
    });
};

const claimEmail = async (payload: ClaimEmailPayload): Promise<RegistrationResponseType> => {
    const res = await authAxios.post("claim-email", payload);
    return res.data;
};

export const useClaimEmailMutation = () => {
    return useMutation({
        mutationKey: ["claim-email"],
        mutationFn: claimEmail,
        onSuccess: signInAfterRegistration,
    });
};

const logout = async (payload: LogoutPayload): Promise<LogoutResponseType> => {
    const res = await authAxios.post("logout", payload);
    return res.data;
};

export const useLogoutMutation = () => {
    return useMutation({
        mutationKey: ["logout"],
        mutationFn: logout,
        onSuccess: () => {
            sessionStorage.setItem("showLogoutToast", "true");
        },
        onError: showAxiosError,
    });
};

const requestEmailCode = async (payload: RequestEmailCodePayload): Promise<RequestEmailCodeResponseType> => {
    const res = await authAxios.post("request-email-code", payload);
    return res.data;
};

export const useRequestEmailCode = () => {
    return useMutation({
        mutationKey: ["request-email-code"],
        mutationFn: requestEmailCode,
    });
};
