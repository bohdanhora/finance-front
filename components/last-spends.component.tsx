'use client'

import useStore from 'store/general.store'
import { SpendType } from 'store/type'
import { ContentWrapper } from './wrappers/container.wrapper'

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
        <ContentWrapper>{store.lastTransactions.map(renderLi)}</ContentWrapper>
    )
}
