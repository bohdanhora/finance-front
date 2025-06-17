import { twMerge } from 'tailwind-merge'

export const ContentWrapper = ({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) => {
    return (
        <section
            className={twMerge(
                'w-fit p-5 rounded bg-white/80 dark:bg-black/80',
                className
            )}
        >
            {children}
        </section>
    )
}
