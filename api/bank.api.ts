import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios from "axios";
import { MonobankCurrency } from "types/auth.types";

const url = process.env.NEXT_PUBLIC_MONO_API_URL || "";

const getCurrency = async (): Promise<MonobankCurrency[]> => {
    const res = await axios.get<MonobankCurrency[]>(url);
    return res.data;
};

export const useGetCurrencyQuery = (): UseQueryResult<MonobankCurrency[], Error> => {
    return useQuery<MonobankCurrency[], Error>({
        queryKey: ["currency"],
        queryFn: getCurrency,
    });
};
