import { Manrope, Poppins } from "next/font/google";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Metadata } from "next";

import { twMerge } from "tailwind-merge";

import { ProviderTheme } from "providers/theme";
import { ToastProvider } from "providers/toast";

import "./globals.css";
import { ReactQueryProvider } from "providers/react-query";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const poppins = Poppins({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
    variable: "--font-poppins",
});

export const metadata: Metadata = {
    title: "Finance App",
    description: "Personal Finance App",
};

const RootLayout = async ({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) => {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={twMerge(
                    "bg-background text-foreground text-base font-normal antialiased",
                    `${manrope.variable} ${poppins.variable} font-manrope`,
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
    );
};

export default RootLayout;
