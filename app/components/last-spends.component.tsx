'use client'

import useStore from '../store/intex'
import { SpendType } from '../store/type'

export default function LastSpends() {
    const store = useStore()

    if (!store.lastTransactions.length) return <p>No any spends</p>

    const renderLi = ({
        date,
        description,
        value,
        categorie,
        id,
    }: SpendType) => (
        <li key={id} className="flex gap-x-4">
            <p>
                {categorie !== 'income' && '-'} {value}
            </p>
            <p>{description}</p>
            <p>{date}</p>
            <p>{categorie}</p>
        </li>
    )

    return (
        <section className="w-fit border border-white/50 p-5 rounded bg-black/80">
            {store.lastTransactions.map(renderLi)}
        </section>
    )
}
