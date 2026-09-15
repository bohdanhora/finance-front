import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

import { MONOBANK_COOLDOWN_MS } from "lib/monobank";
import { MonobankClientInfo, MonobankStatementItem } from "types/monobank";

const monobankAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_MONO_PERSONAL_API_URL || "https://api.monobank.ua/personal",
});

const tokenKey = (token: string | null) => (token ? token.slice(-6) : null);

export const monobankClientInfoKey = (token: string | null) => ["monobank", "client-info", tokenKey(token)];

export const isRateLimited = (error: unknown) => (error as AxiosError)?.response?.status === 429;

export const isTokenRejected = (error: unknown) => {
    const status = (error as AxiosError)?.response?.status;
    return status === 401 || status === 403;
};

export const fetchClientInfo = async (token: string): Promise<MonobankClientInfo> => {
    const res = await monobankAxios.get<MonobankClientInfo>("/client-info", {
        headers: { "X-Token": token },
    });
    return res.data;
};

let lastStatementRequest = 0;

export const statementCooldownLeft = () => Math.max(0, lastStatementRequest + MONOBANK_COOLDOWN_MS - Date.now());

export const isPeriodRejected = (error: unknown) => (error as AxiosError)?.response?.status === 400;

export const fetchStatement = async (
    token: string,
    account: string,
    from: number,
    to: number,
): Promise<MonobankStatementItem[]> => {
    lastStatementRequest = Date.now();
    const res = await monobankAxios.get<MonobankStatementItem[]>(`/statement/${account}/${from}/${to}`, {
        headers: { "X-Token": token },
    });
    return res.data;
};

const sharedOptions = {
    staleTime: MONOBANK_COOLDOWN_MS,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: false,
} as const;

export const useMonobankClientInfo = (token: string | null): UseQueryResult<MonobankClientInfo, Error> => {
    return useQuery<MonobankClientInfo, Error>({
        queryKey: monobankClientInfoKey(token),
        queryFn: () => fetchClientInfo(token as string),
        enabled: Boolean(token),
        ...sharedOptions,
    });
};

export const useMonobankStatement = (
    token: string | null,
    account: string | null,
    from: number,
    to: number,
): UseQueryResult<MonobankStatementItem[], Error> => {
    return useQuery<MonobankStatementItem[], Error>({
        queryKey: ["monobank", "statement", tokenKey(token), account, from, to],
        queryFn: () => fetchStatement(token as string, account as string, from, to),
        enabled: Boolean(token && account),
        ...sharedOptions,
    });
};
