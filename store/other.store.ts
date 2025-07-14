import { create } from 'zustand'
import { OtherStoreType } from './type'

const useOtherStore = create<OtherStoreType>((set) => ({
    email: '',

    setEmail: (email) =>
        set(() => ({
            email: email,
        })),
}))
export default useOtherStore
