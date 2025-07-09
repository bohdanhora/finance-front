'use client'

import useStore from 'store/general.store'
import { ContentWrapper } from './wrappers/container.wrapper'
import { TransactionType } from 'types/transactions.types'
import { createDateString } from 'lib/utils'

export default function LastSpends() {
    const store = useStore()

    if (!store.transactions.length) {
        return (
            <ContentWrapper>
                <p className="text-center text-gray-500 italic">
                    No spends yet
                </p>
            </ContentWrapper>
        )
    }

    const renderLi = ({
        date,
        description,
        value,
        categorie,
        id,
    }: TransactionType) => (
        <li
            key={id}
            className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 px-4 py-3 border-b border-gray-200 text-sm"
        >
            <span className="font-medium text-gray-800">
                {categorie !== 'income' && '-'} {value}
            </span>
            <span className="text-gray-600">{description}</span>
            <span className="text-gray-400">
                {createDateString(new Date(date))}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">
                {categorie}
            </span>
        </li>
    )

    return (
        <ContentWrapper>
            <ul className="divide-y divide-gray-100">
                {store.transactions.map(renderLi)}
            </ul>
        </ContentWrapper>
    )
}
