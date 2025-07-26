import { create } from "zustand";
import { OtherStoreType } from "types/stores";

const useOtherStore = create<OtherStoreType>((set) => ({
    email: "",

    setEmail: (email) =>
        set(() => ({
            email: email,
        })),
}));
export default useOtherStore;
