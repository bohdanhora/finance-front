import { Manrope } from 'next/font/google'
import './globals.css'
import Navbar from './components/navbar.component'
import ReactQueryProvider from './providers/react-query-provider'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Metadata } from 'next'
import { ProviderTheme } from './providers/theme.provider'
import { twMerge } from 'tailwind-merge'
import { ToastProvider } from './providers/toast.provider'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'My app finance',
    description: 'My perfect site finance',
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={twMerge(
                    'bg-white dark:bg-black text-black dark:text-white text-base font-normal',
                    manrope.className
                )}
            >
                <NextIntlClientProvider messages={messages}>
                    <ReactQueryProvider>
                        <ProviderTheme>
                            <Navbar />
                            <main className="flex flex-col items-start py-14 px-6">
                                {children}
                            </main>
                            <ToastProvider />
                        </ProviderTheme>
                    </ReactQueryProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
