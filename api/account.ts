import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountAxios } from "config/axios.instances";
import { AccountResponse, ChangePasswordPayload, ChangePasswordResponseType } from "types/auth";

export const ACCOUNT_QUERY_KEY = ["account"];

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
        },
    });
};
