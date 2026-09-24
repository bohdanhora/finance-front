import axios, { AxiosInstance } from "axios";
import { Routes } from "constants/routes";
import Cookies from "js-cookie";
import { getAuthCookieOptions, isRememberedSession } from "lib/auth-helper";

const url = process.env.NEXT_PUBLIC_API_URL;

const authAxios = axios.create({
    baseURL: `${url}/auth`,
});

const transactionsAxios = axios.create({
    baseURL: `${url}/transactions`,
    headers: {},
});

const accountAxios = axios.create({
    baseURL: `${url}/auth`,
});

let pendingRefresh: Promise<string> | null = null;

const requestNewTokens = async () => {
    const refreshToken = Cookies.get("refreshToken");
    if (!refreshToken) throw new Error("No refresh token found");

    const res = await authAxios.post("/refresh", { refreshToken });
    const cookieOptions = getAuthCookieOptions(isRememberedSession());

    Cookies.set("accessToken", res.data.accessToken, cookieOptions);
    Cookies.set("refreshToken", res.data.refreshToken, cookieOptions);

    return res.data.accessToken as string;
};

const refreshAccessToken = () => {
    pendingRefresh ??= requestNewTokens().finally(() => {
        pendingRefresh = null;
    });
    return pendingRefresh;
};

const endLocalSession = () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    if (typeof window !== "undefined") {
        window.location.href = Routes.LOGIN;
    }
};

const withSession = (instance: AxiosInstance) => {
    instance.interceptors.request.use((config) => {
        const token = Cookies.get("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            const originalRequest = error.config;

            if (error.response?.status !== 401 || !originalRequest || originalRequest.authRetried) {
                return Promise.reject(error);
            }

            originalRequest.authRetried = true;

            return refreshAccessToken().then(
                (token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return instance(originalRequest);
                },
                (refreshError) => {
                    endLocalSession();
                    return Promise.reject(refreshError);
                },
            );
        },
    );
};

withSession(transactionsAxios);
withSession(accountAxios);

export { accountAxios, authAxios, refreshAccessToken, transactionsAxios };
