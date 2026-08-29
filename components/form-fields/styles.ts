/** Shared look for the auth screens' inputs and labels. */

export const authInputClass = [
    "h-12 rounded-xl px-4 shadow-none",
    "border-black/10 bg-white/70 dark:border-white/10 dark:bg-white/5",
    "transition-[border-color,box-shadow,background-color] duration-200",
    "focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/15",
    "dark:focus-visible:border-indigo-400 dark:focus-visible:ring-indigo-400/20",
    "aria-invalid:border-red-500 aria-invalid:ring-4 aria-invalid:ring-red-500/15",
].join(" ");

export const authLabelClass = "text-xs font-medium tracking-wide text-black/60 dark:text-white/60";

/** Primary call to action. Lifts slightly on hover, presses back down on click. */
export const authPrimaryButtonClass = [
    "h-auto min-h-12 w-full rounded-xl px-4 py-3 text-[0.95rem] font-medium whitespace-normal",
    "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white",
    "shadow-lg shadow-indigo-500/25 dark:shadow-indigo-900/40",
    "transition-[transform,box-shadow,filter] duration-200",
    "hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl active:translate-y-0 active:brightness-95",
    "disabled:translate-y-0 disabled:shadow-none",
].join(" ");

/** Neutral secondary action sitting inside the glass card. */
export const authSecondaryButtonClass = [
    "h-auto min-h-12 w-full rounded-xl px-4 py-3 text-[0.95rem] font-medium whitespace-normal",
    "border border-black/10 bg-white/60 text-black/80",
    "dark:border-white/10 dark:bg-white/5 dark:text-white/80",
    "transition-colors duration-200 hover:bg-white/90 dark:hover:bg-white/10",
].join(" ");
