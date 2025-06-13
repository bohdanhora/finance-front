import LastSpends from './components/last-spends.component'
import Total from './components/total'

export default function Home() {
    return (
        <div className="relative w-full flex flex-col gap-4 overflow-hidden">
            <Total />
            <LastSpends />
        </div>
    )
}
