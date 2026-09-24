import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountAxios } from "config/axios.instances";
import {
    AccountResponse,
    AccountSessionsResponse,
    ChangePasswordPayload,
    ChangePasswordResponseType,
    RemoveSessionResponse,
} from "types/auth";

export const ACCOUNT_QUERY_KEY = ["account"];
export const SESSIONS_QUERY_KEY = ["account", "sessions"];

const fetchAccount = async (): Promise<AccountResponse> => {
    const res = await accountAxios.get("account");
    return res.data;
};

export const useAccount = () =>
    useQuery({
        queryKey: ACCOUNT_QUERY_KEY,
        queryFn: fetchAccount,
        retry: false,
    });

const changePassword = async (payload: ChangePasswordPayload): Promise<ChangePasswordResponseType> => {
    const res = await accountAxios.put("change-password", payload);
    return res.data;
};

export const useChangePassword = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["change-password"],
        mutationFn: changePassword,
        onSuccess: () => {
            queryClient.setQueryData<AccountResponse>(ACCOUNT_QUERY_KEY, (current) =>
                current ? { ...current, hasPassword: true } : current,
            );
            void queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        },
    });
};

const fetchSessions = async (): Promise<AccountSessionsResponse> => {
    const res = await accountAxios.get("sessions");
    return res.data;
};

export const useSessions = () =>
    useQuery({
        queryKey: SESSIONS_QUERY_KEY,
        queryFn: fetchSessions,
        refetchInterval: 60_000,
    });

const useSessionsMutation = <TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn,
        onSettled: () => queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY }),
    });
};

export const useRemoveSession = () =>
    useSessionsMutation(async (id: string): Promise<RemoveSessionResponse> => {
        const res = await accountAxios.delete(`sessions/${id}`);
        return res.data;
    });

export const useEndOtherSessions = () =>
    useSessionsMutation<void, { message: string; ended: number }>(async () => {
        const res = await accountAxios.delete("sessions/others");
        return res.data;
    });

export const useClearSessionHistory = () =>
    useSessionsMutation<void, { message: string; removed: number }>(async () => {
        const res = await accountAxios.delete("sessions/history");
        return res.data;
    });
