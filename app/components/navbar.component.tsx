'use client'

import { Button } from './ui/button'

export default function Navbar() {
    return (
        <nav className="w-full border-b border-white/50 py-4 px-6 flex justify-between items-center">
            <p>My Finance</p>
            <div className="flex items-center gap-x-3">
                <Button variant="outline">lang</Button>
                <Button variant="outline">theme</Button>
                <Button variant="outline">valute</Button>
            </div>
        </nav>
    )
}
