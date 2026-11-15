import { Geist, Geist_Mono } from "next/font/google";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Metadata, Viewport } from "next";

import { twMerge } from "lib/tw";

import { ProviderTheme } from "providers/theme";
import { ToastProvider } from "providers/toast";
import { ValidationProvider } from "providers/validation";

import "./globals.css";
import { ReactQueryProvider } from "providers/react-query";
import { DesktopCalculator } from "components/calculator/desktop-calculator";
import { KeyboardInset } from "components/keyboard-inset";

const geist = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-geist-mono" });

const description = "Personal Finance App";

export const metadata: Metadata = {
    metadataBase: new URL("https://finance-front-zeta.vercel.app"),
    title: "Finance App",
    description,
    openGraph: {
        type: "website",
        url: "/",
        siteName: "Finance App",
        title: "Finance App",
        description,
    },
    twitter: { card: "summary_large_image", title: "Finance App", description },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    interactiveWidget: "resizes-content",
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
                    "bg-paper text-ink text-base font-normal antialiased",
                    `${geist.variable} ${geistMono.variable} font-sans`,
                )}
            >
                <NextIntlClientProvider messages={messages}>
                    <ValidationProvider>
                        <ReactQueryProvider>
                            <ProviderTheme>
                                <main>{children}</main>
                                <KeyboardInset />
                                <DesktopCalculator />
                                <ToastProvider />
                            </ProviderTheme>
                        </ReactQueryProvider>
                    </ValidationProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
};

export default RootLayout;
