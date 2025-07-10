import { Manrope } from 'next/font/google'
import { Poppins } from 'next/font/google'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Metadata } from 'next'

import { twMerge } from 'tailwind-merge'

import ReactQueryProvider from 'providers/react-query-provider'
import { ProviderTheme } from 'providers/theme.provider'
import { ToastProvider } from 'providers/toast.provider'

import './globals.css'
import VantaBackground from 'components/animated-background.component'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const poppins = Poppins({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
    variable: '--font-poppins',
})

export const metadata: Metadata = {
    title: 'Finance App',
    description: 'Personal Finance App',
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
                    `${manrope.variable} ${poppins.variable} font-manrope`
                )}
            >
                <NextIntlClientProvider messages={messages}>
                    <ReactQueryProvider>
                        <ProviderTheme>
                            <VantaBackground />
                            <main>{children}</main>
                            <ToastProvider />
                        </ProviderTheme>
                    </ReactQueryProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
