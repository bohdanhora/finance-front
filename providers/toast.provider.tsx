'use client'

import { useTheme } from 'next-themes'
import { ToastContainer } from 'react-toastify'

export function ToastProvider() {
    const { resolvedTheme } = useTheme()

    return <ToastContainer autoClose={4000} theme={resolvedTheme} />
}
