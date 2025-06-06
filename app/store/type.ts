export type SpendType = {
    description: string
    value: string
    date: string
    categorie: string
    id: string
}

export type StoreType = {
    total: number
    totalIncome: number
    totalSpend: number
    lastTransactions: SpendType[] | []
    categories: string[] | []

    setTotalIncome: (spend: number) => void
    setTotal: (spend: number) => void
    setNewSpend: (spend: SpendType) => void
    setTotalSpend: (spend: number) => void
    calculateTotal: () => void
}
