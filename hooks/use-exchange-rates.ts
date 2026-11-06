import { useMemo } from "react";
import useBankStore from "store/bank";

export const useExchangeRates = (side: "buy" | "sell" = "buy") => {
    const field = side === "sell" ? "rateSell" : "rateBuy";
    const usdToUah = useBankStore((state) => state.usd?.[field] ?? 0);
    const eurToUah = useBankStore((state) => state.eur?.[field] ?? 0);

    return useMemo(() => ({ usdToUah, eurToUah }), [eurToUah, usdToUah]);
};
