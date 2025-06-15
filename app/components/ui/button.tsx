import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/app/lib/utils'

const buttonVariants = cva(
    "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    {
        variants: {
            variant: {
                default:
                    'bg-gray-500 dark:bg-blue-600 text-white hover:bg-gray-500/90 dark:hover:bg-blue-600/90',
                destructive:
                    'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500',
                outline:
                    'border border-gray-500 h-9 text-gray-800 bg-transparent rounded-full hover:bg-gray-500 hover:text-white dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-400 dark:hover:text-black',
                secondary:
                    'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
                ghost: 'bg-transparent hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white',
                popover:
                    'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600',
                link: 'text-blue-600 underline-offset-4 hover:underline dark:text-blue-400',
            },
            size: {
                default: 'px-4 py-2 has-[>svg]:px-3',
                sm: 'rounded-md gap-1.5 px-3 py-2 has-[>svg]:px-2.5',
                lg: 'rounded-md px-6 py-2 has-[>svg]:px-4',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }) {
    const Comp = asChild ? Slot : 'button'

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
}

export { Button, buttonVariants }
