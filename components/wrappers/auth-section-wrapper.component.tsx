import { twMerge } from 'tailwind-merge'

export const AuthSectionWrapper = ({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) => {
    return (
        <div
            className={twMerge(
                'w-lg p-9 rounded-xl border font-poppins border-[#878787] bg-white/80 dark:bg-black/80',
                className
            )}
        >
            {children}
        </div>
    )
}
