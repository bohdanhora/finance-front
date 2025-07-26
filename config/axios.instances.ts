import axios from "axios";
import { Routes } from "constants/routes";
import Cookies from "js-cookie";

const url = process.env.NEXT_PUBLIC_API_URL;

const authAxios = axios.create({
    baseURL: `${url}/auth`,
});

const transactionsAxios = axios.create({
    baseURL: `${url}/transactions`,
    headers: {},
});

const retryMap = new WeakMap();

let isRefreshing = false;

let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

transactionsAxios.interceptors.request.use((config) => {
    const token = Cookies.get("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

transactionsAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !retryMap.get(originalRequest)) {
            retryMap.set(originalRequest, true);

            if (!isRefreshing) {
                isRefreshing = true;

                const refreshToken = Cookies.get("refreshToken");

                if (!refreshToken) {
                    Cookies.remove("accessToken");
                    Cookies.remove("refreshToken");
                    if (typeof window !== "undefined") {
                        window.location.href = Routes.LOGIN;
                    }
                    return Promise.reject(new Error("No refresh token found"));
                }

                return authAxios
                    .post("/refresh", { refreshToken })
                    .then((res) => {
                        const newToken = res.data.accessToken;
                        const newRefreshToken = res.data.refreshToken;

                        Cookies.set("accessToken", newToken, {
                            secure: true,
                            expires: 3,
                        });
                        Cookies.set("refreshToken", newRefreshToken, {
                            secure: true,
                            expires: 3,
                        });

                        isRefreshing = false;

                        onRefreshed(newToken);

                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return transactionsAxios(originalRequest);
                    })
                    .catch((refreshError) => {
                        isRefreshing = false;
                        Cookies.remove("accessToken");
                        Cookies.remove("refreshToken");
                        if (typeof window !== "undefined") {
                            window.location.href = Routes.LOGIN;
                        }
                        return Promise.reject(refreshError);
                    });
            } else {
                return new Promise((resolve) => {
                    addRefreshSubscriber((token: string) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(transactionsAxios(originalRequest));
                    });
                });
            }
        }

        return Promise.reject(error);
    },
);

export { authAxios, transactionsAxios };
