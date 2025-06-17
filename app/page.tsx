import LastSpends from './components/last-spends.component'
import { NextMonthIncome } from './components/next-month-income.component'
import PossibleRemaining from './components/possible-remaining-balance.component'
import Total from './components/total'

export default function Home() {
    return (
        <div className="relative w-full flex flex-col items-center gap-10 overflow-hidden">
            <Total />
            <PossibleRemaining />
            <NextMonthIncome />
            <LastSpends />
        </div>
    )
}
