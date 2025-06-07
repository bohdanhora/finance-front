'use client'

import useStore from '../store/intex'

export default function Total() {
    const store = useStore()

    return (
        <section className="w-fit border border-white/50 p-5 rounded bg-black/80">
            <p>Total: {store.total}</p>
            <p>Total income: {store.totalIncome}</p>
            <p>Total spend: {store.totalSpend}</p>
        </section>
    )
}
