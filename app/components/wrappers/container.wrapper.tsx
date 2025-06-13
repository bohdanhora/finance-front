export const ContentWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
        <section className="w-fit border border-black/50 dark:border-white/50  p-5 rounded bg-white/80 dark:bg-black/80">
            {children}
        </section>
    )
}
