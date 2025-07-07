import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { transactionsAxios } from 'config/axios.instances'
import { toast } from 'react-toastify'
import {
    AllTransactionsInfoResponse,
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
        onSuccess: () => {},
        onError: (error: AxiosError<TotalAmountErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}
