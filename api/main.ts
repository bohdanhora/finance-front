import { useMutation, useQuery } from "@tanstack/react-query";
import { transactionsAxios } from "config/axios.instances";
import { showAxiosError } from "lib/utils";
import {
    AllTransactionsInfoResponse,
    CheckedEssentialPayload,
    CheckedEssentialResponseType,
    ClearDataPayload,
    ClearDataResponseType,
    DeleteTransactionPayload,
    DeleteTransactionResponseType,
    EssentialPaymentsPayload,
    EssentialPaymentsResponseType,
    NewEssentialPayload,
    NewEssentialResponseType,
    NewTransactionPaymentsPayload,
    NewTransactionResponseType,
    NextMonthTotalAmountPayload,
    NextMonthTotalAmountResponseType,
    RemoveEssentialPayload,
    RemoveEssentialResponseType,
    SavePercentPayload,
    SavePercentResponseType,
    TotalAmountPayload,
    TotalAmountResponseType,
} from "types/transactions";

const allTransactionInfo = async (): Promise<AllTransactionsInfoResponse> => {
    const res = await transactionsAxios.get("all-info");
    return res.data;
};

export const useAllTransactionInfo = () => {
    return useQuery({
        queryKey: ["all-info"],
        queryFn: allTransactionInfo,
    });
};

const setTotalAmount = async (payload: TotalAmountPayload): Promise<TotalAmountResponseType> => {
    const res = await transactionsAxios.post("set-total", payload);
    return res.data;
};

export const useSetTotalAmount = () => {
    return useMutation({
        mutationKey: ["total-amount"],
        mutationFn: setTotalAmount,
        onError: showAxiosError,
    });
};

const setNextMonthTotalAmount = async (
    payload: NextMonthTotalAmountPayload,
): Promise<NextMonthTotalAmountResponseType> => {
    const res = await transactionsAxios.post("set-next-month-total", payload);
    return res.data;
};

export const useSetNextMonthTotalAmount = () => {
    return useMutation({
        mutationKey: ["next-month-total-amount"],
        mutationFn: setNextMonthTotalAmount,
        onError: showAxiosError,
    });
};

const setEssentialPayments = async (payload: EssentialPaymentsPayload): Promise<EssentialPaymentsResponseType> => {
    const res = await transactionsAxios.put("set-essential-payments", payload);
    return res.data;
};

export const useSetEssentialPayments = () => {
    return useMutation({
        mutationKey: ["essential-payments"],
        mutationFn: setEssentialPayments,
        onError: showAxiosError,
    });
};

const setNewTransaction = async (payload: NewTransactionPaymentsPayload): Promise<NewTransactionResponseType> => {
    const res = await transactionsAxios.post("new-transaction", payload);
    return res.data;
};

export const useSetNewTransaction = () => {
    return useMutation({
        mutationKey: ["new-transaction"],
        mutationFn: setNewTransaction,
        onError: showAxiosError,
    });
};

const setCheckedEssential = async (payload: CheckedEssentialPayload): Promise<CheckedEssentialResponseType> => {
    const res = await transactionsAxios.put("set-checked-essential-payments", payload);
    return res.data;
};

export const useSetCheckedEssential = () => {
    return useMutation({
        mutationKey: ["checked-essential"],
        mutationFn: setCheckedEssential,
        onError: showAxiosError,
    });
};

const removeEssential = async (payload: RemoveEssentialPayload): Promise<RemoveEssentialResponseType> => {
    const res = await transactionsAxios.put("remove-essential", payload);
    return res.data;
};

export const useRemoveEssential = () => {
    return useMutation({
        mutationKey: ["remove-essential"],
        mutationFn: removeEssential,
        onError: showAxiosError,
    });
};

const newEssential = async (payload: NewEssentialPayload): Promise<NewEssentialResponseType> => {
    const res = await transactionsAxios.post("new-essential", payload);
    return res.data;
};

export const useNewEssential = () => {
    return useMutation({
        mutationKey: ["new-essential"],
        mutationFn: newEssential,
        onError: showAxiosError,
    });
};

const exportPdf = async (userId: string): Promise<Blob> => {
    const res = await transactionsAxios.get(userId, {
        responseType: "blob",
    });
    return res.data;
};

export const useExportPdf = () => {
    return useMutation({
        mutationKey: ["export-pdf"],
        mutationFn: (userId: string) => exportPdf(userId),
        onSuccess: (blob) => {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "report.pdf");
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        },
        onError: showAxiosError,
    });
};

const clearData = async (payload: ClearDataPayload): Promise<ClearDataResponseType> => {
    const res = await transactionsAxios.post("clear-all", payload);
    return res.data;
};

export const useClearData = () => {
    return useMutation({
        mutationKey: ["clear-data"],
        mutationFn: clearData,
        onError: showAxiosError,
    });
};

const savePercent = async (payload: SavePercentPayload): Promise<SavePercentResponseType> => {
    const res = await transactionsAxios.post("percent", payload);
    return res.data;
};

export const useSavePercent = () => {
    return useMutation({
        mutationKey: ["save-percent"],
        mutationFn: savePercent,
        onError: showAxiosError,
    });
};

const deleteTransaction = async (payload: DeleteTransactionPayload): Promise<DeleteTransactionResponseType> => {
    const res = await transactionsAxios.post("delete-transaction", payload);
    return res.data;
};

export const useDeleteTransaction = () => {
    return useMutation({
        mutationKey: ["delete-transaction"],
        mutationFn: deleteTransaction,
        onError: showAxiosError,
    });
};
