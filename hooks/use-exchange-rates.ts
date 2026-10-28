import { useMemo } from "react";
import useBankStore from "store/bank";

export const useExchangeRates = () => {
    const usdToUah = useBankStore((state) => state.usd?.rateBuy ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.rateBuy ?? 0);

    return useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);
};
