'use client'

import { useEffect } from 'react'

export const Loader = () => {
    useEffect(() => {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'

        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [])

    return (
        <div className="absolute top-0 z-[9999] w-full h-screen flex justify-center items-center bg-white dark:bg-black">
            <div
                className="loader border-t-2 rounded-full border-gray-500 bg-gray-300 animate-spin
aspect-square w-8 flex justify-center items-center text-yellow-700"
            ></div>
        </div>
    )
}
