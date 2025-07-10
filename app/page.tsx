'use client'

import LastSpends from 'components/last-spends.component'
import Navbar from 'components/navbar.component'
import { NextMonthIncome } from 'components/next-month-income.component'
import PossibleRemaining from 'components/possible-remaining-balance.component'
import Total from 'components/total'
import { useTranslations } from 'next-intl'
import { PrivateProvider } from 'providers/auth-provider'
import { GetDataProvider } from 'providers/get-data.provider'
import { useEffect } from 'react'
import { toast } from 'react-toastify'

export default function Home() {
    const t = useTranslations()

    useEffect(() => {
        const shouldShowToast = sessionStorage.getItem('showLoginToast')
        if (shouldShowToast) {
            toast.success(t('api.successLogin'))
            sessionStorage.removeItem('showLoginToast')
        }
    }, [])
    return (
        <PrivateProvider>
            <GetDataProvider>
                <Navbar />
                <div className="relative w-full flex flex-col items-center gap-10 overflow-hidden mt-10">
                    <Total />
                    <PossibleRemaining />
                    <NextMonthIncome />
                    <LastSpends />
                </div>
            </GetDataProvider>
        </PrivateProvider>
    )
}
