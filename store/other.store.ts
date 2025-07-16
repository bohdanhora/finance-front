import { create } from "zustand";
import { OtherStoreType } from "types/stores.types";

const useOtherStore = create<OtherStoreType>((set) => ({
    email: "",

    setEmail: (email) =>
        set(() => ({
            email: email,
        })),
}));
export default useOtherStore;
