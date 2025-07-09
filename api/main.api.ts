import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { transactionsAxios } from 'config/axios.instances'
import { toast } from 'react-toastify'
import {
    AllTransactionsInfoResponse,
    CheckedEssentialErrorResponse,
    CheckedEssentialPayload,
    CheckedEssentialResponseType,
    EssentialPaymentsPayload,
    EssentialPaymentsResponseType,
    NewEssentialErrorResponse,
    NewEssentialPayload,
    NewEssentialResponseType,
    NewTransactionErrorResponse,
    NewTransactionPaymentsPayload,
    NewTransactionResponseType,
    NextMonthTotalAmountErrorResponse,
    NextMonthTotalAmountPayload,
    NextMonthTotalAmountResponseType,
    RemoveEssentialErrorResponse,
    RemoveEssentialPayload,
    RemoveEssentialResponseType,
    TotalAmountErrorResponse,
    TotalAmountPayload,
    TotalAmountResponseType,
} from 'types/transactions.types'

const allTransactionInfo = async (): Promise<AllTransactionsInfoResponse> => {
    const res = await transactionsAxios.get('all-info')
    return res.data
}

export const useAllTransactionInfo = () => {
    return useQuery({
        queryKey: ['total-amount'],
        queryFn: allTransactionInfo,
    })
}

const setTotalAmount = async (
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

const setNextMonthTotalAmount = async (
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

const setEssentialPayments = async (
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

const setNewTransaction = async (
    payload: NewTransactionPaymentsPayload
): Promise<NewTransactionResponseType> => {
    const res = await transactionsAxios.post('new-transaction', payload)
    return res.data
}

export const useSetNewTransaction = () => {
    return useMutation({
        mutationKey: ['new-transaction'],
        mutationFn: setNewTransaction,
        onError: (error: AxiosError<NewTransactionErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const setCheckedEssential = async (
    payload: CheckedEssentialPayload
): Promise<CheckedEssentialResponseType> => {
    const res = await transactionsAxios.put(
        'set-checked-essential-payments',
        payload
    )
    return res.data
}

export const useSetCheckedEssential = () => {
    return useMutation({
        mutationKey: ['checked-essential'],
        mutationFn: setCheckedEssential,
        onError: (error: AxiosError<CheckedEssentialErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const removeEssential = async (
    payload: RemoveEssentialPayload
): Promise<RemoveEssentialResponseType> => {
    const res = await transactionsAxios.put('remove-essential', payload)
    return res.data
}

export const useRemoveEssential = () => {
    return useMutation({
        mutationKey: ['remove-essential'],
        mutationFn: removeEssential,
        onError: (error: AxiosError<RemoveEssentialErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const newEssential = async (
    payload: NewEssentialPayload
): Promise<NewEssentialResponseType> => {
    const res = await transactionsAxios.put('new-essential', payload)
    return res.data
}

export const useNewEssential = () => {
    return useMutation({
        mutationKey: ['new-essential'],
        mutationFn: newEssential,
        onError: (error: AxiosError<NewEssentialErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}
