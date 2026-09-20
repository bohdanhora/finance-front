import { Manrope, Poppins } from "next/font/google";

import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Metadata, Viewport } from "next";

import { twMerge } from "tailwind-merge";

import { ProviderTheme } from "providers/theme";
import { ToastProvider } from "providers/toast";
import { ValidationProvider } from "providers/validation";

import "./globals.css";
import { ReactQueryProvider } from "providers/react-query";
import { DesktopCalculator } from "components/calculator/desktop-calculator";
import { KeyboardInset } from "components/keyboard-inset";

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
                    "bg-background text-foreground text-base font-normal antialiased",
                    `${manrope.variable} ${poppins.variable} font-manrope`,
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
