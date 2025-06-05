import { create } from 'zustand'
import { StoreType } from './type'

const useStore = create<StoreType>((set) => ({
    bears: 0,
    increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
    removeAllBears: () => set({ bears: 0 }),
    updateBears: (newBears) => set({ bears: newBears }),
}))

export default useStore
