export type StoreType = {
    bears: number
    increasePopulation: () => void
    removeAllBears: () => void
    updateBears: (newBears: number) => void
}
