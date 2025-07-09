import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { transactionsAxios } from 'config/axios.instances'
import { toast } from 'react-toastify'
import {
    AllTransactionsInfoResponse,
    EssentialPaymentsPayload,
    EssentialPaymentsResponseType,
    NewTransactionPaymentsPayload,
    NewTransactionResponseType,
    NextMonthTotalAmountErrorResponse,
    NextMonthTotalAmountPayload,
    NextMonthTotalAmountResponseType,
    TotalAmountErrorResponse,
    TotalAmountPayload,
    TotalAmountResponseType,
} from 'types/transactions.types'

export const allTransactionInfo =
    async (): Promise<AllTransactionsInfoResponse> => {
        const res = await transactionsAxios.get('all-info')
        return res.data
    }

export const useAllTransactionInfo = () => {
    return useQuery({
        queryKey: ['total-amount'],
        queryFn: allTransactionInfo,
    })
}

export const setTotalAmount = async (
    payload: TotalAmountPayload
): Promise<TotalAmountResponseType> => {
    const res = await transactionsAxios.post('set-total', payload)
    return res.data
}

export const useSetTotalAmount = () => {
    return useMutation({
        mutationKey: ['total-amount'],
        mutationFn: setTotalAmount,
        onError: (error: AxiosError<TotalAmountErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

export const setNextMonthTotalAmount = async (
    payload: NextMonthTotalAmountPayload
): Promise<NextMonthTotalAmountResponseType> => {
    const res = await transactionsAxios.post('set-next-month-total', payload)
    return res.data
}

export const useSetNextMonthTotalAmount = () => {
    return useMutation({
        mutationKey: ['next-month-total-amount'],
        mutationFn: setNextMonthTotalAmount,
        onError: (error: AxiosError<NextMonthTotalAmountErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

export const setEssentialPayments = async (
    payload: EssentialPaymentsPayload
): Promise<EssentialPaymentsResponseType> => {
    const res = await transactionsAxios.put('set-essential-payments', payload)
    return res.data
}

export const useSetEssentialPayments = () => {
    return useMutation({
        mutationKey: ['essential-payments'],
        mutationFn: setEssentialPayments,
        onError: (error: AxiosError<EssentialPaymentsResponseType>) => {
            toast.error(error.response?.data.message)
        },
    })
}

export const setNewTransaction = async (
    payload: NewTransactionPaymentsPayload
): Promise<NewTransactionResponseType> => {
    const res = await transactionsAxios.post('new-transaction', payload)
    return res.data
}

export const useSetNewTransaction = () => {
    return useMutation({
        mutationKey: ['new-transaction'],
        mutationFn: setNewTransaction,
        onError: (error: AxiosError<NewTransactionResponseType>) => {
            toast.error(error.response?.data.message)
        },
    })
}
