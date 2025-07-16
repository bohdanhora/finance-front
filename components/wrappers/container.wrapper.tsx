import { twMerge } from "tailwind-merge";

export const ContentWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => {
    return (
        <section
            className={twMerge(
                "w-fit flex flex-col items-center justify-between rounded-xl bg-white/80 dark:bg-black/80 p-5",
                className,
            )}
        >
            {children}
        </section>
    );
};
