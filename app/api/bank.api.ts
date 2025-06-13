import { useQuery, UseQueryResult } from '@tanstack/react-query'
import axios from 'axios'
import { MonobankCurrency } from '../types'

const getCurrency = async (): Promise<MonobankCurrency[]> => {
    const res = await axios.get<MonobankCurrency[]>(
        'https://api.monobank.ua/bank/currency'
    )
    return res.data
}

export const useGetCurrencyQuery = (): UseQueryResult<
    MonobankCurrency[],
    Error
> => {
    return useQuery<MonobankCurrency[], Error>({
        queryKey: ['currency'],
        queryFn: getCurrency,
    })
}
