import { AddMoney } from './components/add-money-dialog.component'
import FormComponent from './components/form.component'
import LastSpends from './components/last-spends.component'
import Total from './components/total'

export default function Home() {
    return (
        <div className="relative w-full flex flex-col items-center gap-4 overflow-hidden">
            <Total />
            <FormComponent />
            <LastSpends />
            <AddMoney />
        </div>
    )
}
