import { create } from "zustand";
import { BankStoreType } from "types/stores.types";
import { CURRENCY } from "constants/index";

const useBankStore = create<BankStoreType>((set) => ({
    usd: null,
    eur: null,
    currency: CURRENCY.USD,

    setUsd: (obj) =>
        set(() => ({
            usd: obj,
        })),
    setEur: (obj) =>
        set(() => ({
            eur: obj,
        })),
    setCurrency: (newCurrency) =>
        set(() => ({
            currency: newCurrency,
        })),
}));
export default useBankStore;
