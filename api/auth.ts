import { CheckedState } from "@radix-ui/react-checkbox";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { authAxios } from "config/axios.instances";
import { loginSetTokens } from "lib/auth-helper";
import { toast } from "react-toastify";
import {
    ErrorResponse,
    ForgotPasswordPayload,
    ForgotPasswordResponseType,
    LoginPayload,
    LoginResponseType,
    LogoutPayload,
    LogoutResponseType,
    RefreshPayload,
    RefreshResponseType,
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
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
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
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
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
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
    });
};

const registration = async (payload: RegistrationPayload): Promise<RegistrationResponseType> => {
    const res = await authAxios.post("registration", payload);
    return res.data;
};

export const useRegistrationMutation = () => {
    return useMutation({
        mutationKey: ["registration"],
        mutationFn: registration,
        onSuccess: () => {
            sessionStorage.setItem("showRegistrationToast", "true");
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
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
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
    });
};

const refresh = async (payload: RefreshPayload): Promise<RefreshResponseType> => {
    const res = await authAxios.post("refresh", payload);
    return res.data;
};

export const useRefresh = () => {
    return useMutation({
        mutationKey: ["refresh"],
        mutationFn: refresh,
        onSuccess: (data) => {
            loginSetTokens(data, true);
        },
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
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
        onError: (error: AxiosError<ErrorResponse>) => {
            toast.error(error.response?.data.message);
        },
    });
};
