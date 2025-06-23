import * as React from 'react'

import { cn } from 'lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
    return (
        <textarea
            data-slot="textarea"
            className={cn(
                'flex min-h-16 w-full rounded-md px-3 py-2 text-base shadow-xs transition-colors duration-200 outline-none',
                'bg-white text-gray-700 placeholder:text-gray-500 border border-gray-300',
                'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-100/30 dark:border-gray-600',
                'focus-visible:border-gray-600 dark:focus-visible:border-blue-600',
                'aria-invalid:border-red-600 aria-invalid:ring-red-300 dark:aria-invalid:ring-red-500 dark:aria-invalid:border-red-500',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
                'md:text-sm',
                className
            )}
            {...props}
        />
    )
}

export { Textarea }
