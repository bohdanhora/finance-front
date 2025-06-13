'use client'

import useStore from '../store/intex'
import { ContentWrapper } from './wrappers/container.wrapper'

export default function Total() {
    const store = useStore()

    return (
        <ContentWrapper>
            <p>Total: {store.total}</p>
            <p>Total income: {store.totalIncome}</p>
            <p>Total spend: {store.totalSpend}</p>
        </ContentWrapper>
    )
}
