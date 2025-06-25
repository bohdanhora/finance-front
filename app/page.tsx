import LastSpends from 'components/last-spends.component'
import Navbar from 'components/navbar.component'
import { NextMonthIncome } from 'components/next-month-income.component'
import PossibleRemaining from 'components/possible-remaining-balance.component'
import Total from 'components/total'
import { PrivateProvider } from 'providers/auth-provider'

export default function Home() {
    return (
        <PrivateProvider>
            <Navbar />
            <div className="relative w-full flex flex-col items-center gap-10 overflow-hidden mt-10">
                <Total />
                <PossibleRemaining />
                <NextMonthIncome />
                <LastSpends />
            </div>
        </PrivateProvider>
    )
}
