import * as React from 'react'

import { cn } from 'lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base shadow-xs transition-colors duration-200 outline-none',
                'bg-white text-gray-700 placeholder:text-gray-400 border border-gray-300',
                'dark:bg-zinc-500/10 dark:text-gray-100 dark:placeholder:text-gray-500 dark:border-gray-600',
                'focus-visible:border-gray-600 dark:focus-visible:border-zinc-300',
                'aria-invalid:border-red-600 aria-invalid:ring-red-300 dark:aria-invalid:ring-red-500 dark:aria-invalid:border-red-500',
                'file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                className
            )}
            {...props}
        />
    )
}

export { Input }
