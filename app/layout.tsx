import { Manrope } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Metadata } from 'next'

import { twMerge } from 'tailwind-merge'

import ReactQueryProvider from 'providers/react-query-provider'
import { ProviderTheme } from 'providers/theme.provider'
import { ToastProvider } from 'providers/toast.provider'

import './globals.css'
import { PrivateProvider } from 'providers/auth-provider'

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
                            <main>{children}</main>
                            <ToastProvider />
                        </ProviderTheme>
                    </ReactQueryProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    )
}
