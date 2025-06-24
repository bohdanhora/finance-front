import LastSpends from 'components/last-spends.component'
import Navbar from 'components/navbar.component'
import { NextMonthIncome } from 'components/next-month-income.component'
import PossibleRemaining from 'components/possible-remaining-balance.component'
import Total from 'components/total'
import TotalCredit from 'components/total-credit-section.component'

export default function Home() {
    return (
        <>
            <Navbar />
            <div className="relative w-full flex flex-col items-center gap-10 overflow-hidden mt-10">
                <Total />
                <PossibleRemaining />
                <NextMonthIncome />
                <TotalCredit />
                <LastSpends />
            </div>
        </>
    )
}
