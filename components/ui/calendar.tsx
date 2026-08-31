"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { Button, buttonVariants } from "components/ui/button";
import { twMerge } from "tailwind-merge";

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    buttonVariant = "ghost",
    formatters,
    components,
    ...props
}: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
    const defaultClassNames = getDefaultClassNames();

    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={twMerge(
                "bg-transparent text-foreground group/calendar p-3 [--cell-size:--spacing(9)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
                String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                className,
            )}
            captionLayout={captionLayout}
            formatters={{
                formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
                ...formatters,
            }}
            classNames={{
                root: twMerge("w-fit", defaultClassNames.root),
                months: twMerge("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
                month: twMerge("flex w-full flex-col gap-3", defaultClassNames.month),
                nav: twMerge(
                    "absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1",
                    defaultClassNames.nav,
                ),
                button_previous: twMerge(
                    buttonVariants({ variant: buttonVariant }),
                    "size-(--cell-size) rounded-xl p-0 select-none aria-disabled:opacity-40",
                    defaultClassNames.button_previous,
                ),
                button_next: twMerge(
                    buttonVariants({ variant: buttonVariant }),
                    "size-(--cell-size) rounded-xl p-0 select-none aria-disabled:opacity-40",
                    defaultClassNames.button_next,
                ),
                month_caption: twMerge(
                    "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
                    defaultClassNames.month_caption,
                ),
                dropdowns: twMerge(
                    "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-semibold",
                    defaultClassNames.dropdowns,
                ),
                dropdown_root: twMerge(
                    "border-border bg-muted/40 relative rounded-lg border shadow-none has-focus:border-indigo-500 has-focus:ring-2 has-focus:ring-indigo-500/20",
                    defaultClassNames.dropdown_root,
                ),
                dropdown: twMerge("absolute inset-0 opacity-0", defaultClassNames.dropdown),
                caption_label: twMerge(
                    "select-none font-semibold",
                    captionLayout === "label"
                        ? "text-sm capitalize"
                        : "flex h-8 items-center gap-1 rounded-lg pr-1 pl-2 text-sm capitalize [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
                    defaultClassNames.caption_label,
                ),
                table: "w-full border-collapse",
                weekdays: twMerge("mt-1 flex", defaultClassNames.weekdays),
                weekday: twMerge(
                    "text-muted-foreground flex-1 select-none rounded-md text-center text-[0.72rem] font-medium uppercase",
                    defaultClassNames.weekday,
                ),
                week: twMerge("mt-1 flex w-full", defaultClassNames.week),
                week_number_header: twMerge("select-none w-(--cell-size)", defaultClassNames.week_number_header),
                week_number: twMerge("text-[0.8rem] select-none text-muted-foreground", defaultClassNames.week_number),
                day: twMerge(
                    "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-lg [&:last-child[data-selected=true]_button]:rounded-r-lg",
                    defaultClassNames.day,
                ),
                range_start: twMerge("rounded-l-lg bg-accent", defaultClassNames.range_start),
                range_middle: twMerge("rounded-none", defaultClassNames.range_middle),
                range_end: twMerge("rounded-r-lg bg-accent", defaultClassNames.range_end),
                today: twMerge(
                    "rounded-lg text-indigo-600 ring-1 ring-inset ring-indigo-500/35 dark:text-indigo-300 data-[selected=true]:rounded-lg data-[selected=true]:text-white",
                    defaultClassNames.today,
                ),
                outside: twMerge(
                    "text-muted-foreground opacity-35 aria-selected:text-muted-foreground",
                    defaultClassNames.outside,
                ),
                disabled: twMerge("text-muted-foreground opacity-50", defaultClassNames.disabled),
                hidden: twMerge("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                Root: ({ className, rootRef, ...props }) => {
                    return <div data-slot="calendar" ref={rootRef} className={twMerge(className)} {...props} />;
                },
                Chevron: ({ className, orientation, ...props }) => {
                    if (orientation === "left") {
                        return <ChevronLeftIcon className={twMerge("size-4", className)} {...props} />;
                    }

                    if (orientation === "right") {
                        return <ChevronRightIcon className={twMerge("size-4", className)} {...props} />;
                    }

                    return <ChevronDownIcon className={twMerge("size-4", className)} {...props} />;
                },
                DayButton: CalendarDayButton,
                WeekNumber: ({ children, ...props }) => {
                    return (
                        <td {...props}>
                            <div className="flex size-(--cell-size) items-center justify-center text-center">
                                {children}
                            </div>
                        </td>
                    );
                },
                ...components,
            }}
            {...props}
        />
    );
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
    const defaultClassNames = getDefaultClassNames();

    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    return (
        <Button
            ref={ref}
            variant="ghost"
            size="icon"
            data-day={day.date.toLocaleDateString()}
            data-selected-single={
                modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
            }
            data-range-start={modifiers.range_start}
            data-range-end={modifiers.range_end}
            data-range-middle={modifiers.range_middle}
            className={twMerge(
                "data-[selected-single=true]:bg-indigo-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-md data-[selected-single=true]:shadow-indigo-500/20 data-[range-middle=true]:bg-indigo-500/10 data-[range-middle=true]:text-foreground data-[range-start=true]:bg-indigo-600 data-[range-start=true]:text-white data-[range-end=true]:bg-indigo-600 data-[range-end=true]:text-white group-data-[focused=true]/day:ring-indigo-500/35 dark:hover:text-white flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-lg leading-none font-medium transition-colors hover:bg-indigo-500/10 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 data-[range-end=true]:rounded-lg data-[range-end=true]:rounded-r-lg data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-lg data-[range-start=true]:rounded-l-lg [&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className,
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };
