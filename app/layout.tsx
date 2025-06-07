import { Geist } from 'next/font/google'

const geist = Geist({
    subsets: ['latin'],
})

import './globals.css'
import Navbar from './components/navbar.component'
import FuzzyOverlay from './components/black-noise-bg.component'

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={geist.className}>
            <body className="relative overflow-hidden">
                <Navbar />
                <FuzzyOverlay />
                <main className="flex flex-col items-start py-14 px-6">
                    {children}
                </main>
            </body>
        </html>
    )
}
