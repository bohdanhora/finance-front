"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames, type DropdownProps } from "react-day-picker";

import { Button, buttonVariants } from "components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { twMerge } from "tailwind-merge";

function CalendarDropdown({ options, value, onChange, disabled, "aria-label": ariaLabel }: DropdownProps) {
    const selectedValue = String(value ?? "");
    const isMonthDropdown = options?.every((option) => option.value >= 0 && option.value <= 11) ?? false;

    return (
        <Select
            value={selectedValue}
            disabled={disabled}
            onValueChange={(nextValue) =>
                onChange?.({ target: { value: nextValue } } as React.ChangeEvent<HTMLSelectElement>)
            }
        >
            <SelectTrigger
                size="sm"
                aria-label={ariaLabel}
                className={twMerge(
                    "border-border/70 bg-muted/40 hover:bg-indigo-500/10 hover:text-indigo-600 focus:ring-indigo-500/25 h-10 rounded-xl px-3 font-semibold shadow-none transition-colors focus:ring-2 dark:hover:text-indigo-300",
                    isMonthDropdown ? "w-[6.75rem] capitalize sm:w-32" : "w-20 sm:w-24",
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent
                align="center"
                className={twMerge(
                    "border-border/80 bg-popover text-popover-foreground max-h-72 rounded-xl shadow-xl",
                    isMonthDropdown ? "min-w-[9rem]" : "min-w-24",
                )}
            >
                {options?.map((option) => (
                    <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        disabled={option.disabled}
                        className={isMonthDropdown ? "capitalize" : undefined}
                    >
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

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
                "bg-transparent text-foreground group/calendar w-[20.5rem] max-w-[calc(100vw-1.5rem)] p-4 [--cell-size:--spacing(10)] sm:w-96 sm:p-5 sm:[--cell-size:--spacing(12)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
                String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
                String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
                className,
            )}
            captionLayout={captionLayout}
            formatters={formatters}
            classNames={{
                root: twMerge("w-fit", defaultClassNames.root),
                months: twMerge("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
                month: twMerge("flex w-full flex-col gap-3", defaultClassNames.month),
                nav: twMerge(
                    "pointer-events-none absolute inset-x-0 top-0 z-10 flex w-full items-center justify-between gap-1 px-0.5",
                    defaultClassNames.nav,
                ),
                button_previous: twMerge(
                    buttonVariants({ variant: buttonVariant }),
                    "border-border/70 bg-muted/35 pointer-events-auto size-(--cell-size) rounded-xl border p-0 select-none hover:bg-indigo-500/10 hover:text-indigo-600 aria-disabled:opacity-40 dark:hover:text-indigo-300",
                    defaultClassNames.button_previous,
                ),
                button_next: twMerge(
                    buttonVariants({ variant: buttonVariant }),
                    "border-border/70 bg-muted/35 pointer-events-auto size-(--cell-size) rounded-xl border p-0 select-none hover:bg-indigo-500/10 hover:text-indigo-600 aria-disabled:opacity-40 dark:hover:text-indigo-300",
                    defaultClassNames.button_next,
                ),
                month_caption: twMerge(
                    "flex h-(--cell-size) w-full items-center justify-center px-[calc(var(--cell-size)+0.5rem)]",
                    defaultClassNames.month_caption,
                ),
                dropdowns: twMerge(
                    "flex h-(--cell-size) w-full flex-nowrap items-center justify-center gap-2 text-sm font-semibold",
                    defaultClassNames.dropdowns,
                ),
                dropdown_root: twMerge("relative", defaultClassNames.dropdown_root),
                dropdown: twMerge(defaultClassNames.dropdown),
                caption_label: twMerge(
                    "select-none font-semibold",
                    captionLayout === "label"
                        ? "text-sm capitalize"
                        : "flex h-8 items-center gap-1 rounded-xl pr-2 pl-3 text-sm capitalize [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
                    defaultClassNames.caption_label,
                ),
                table: "w-full border-collapse",
                weekdays: twMerge("mt-3 flex border-b border-border/50 pb-2", defaultClassNames.weekdays),
                weekday: twMerge(
                    "text-muted-foreground flex-1 select-none rounded-md text-center text-[0.68rem] font-semibold uppercase tracking-[0.08em]",
                    defaultClassNames.weekday,
                ),
                week: twMerge("mt-1.5 flex w-full", defaultClassNames.week),
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
                    "rounded-xl bg-indigo-500/5 text-indigo-600 ring-1 ring-inset ring-indigo-500/35 dark:text-indigo-300 data-[selected=true]:rounded-xl data-[selected=true]:text-white",
                    defaultClassNames.today,
                ),
                outside: twMerge(
                    "text-muted-foreground opacity-30 aria-selected:text-muted-foreground",
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
                Dropdown: CalendarDropdown,
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
                "data-[selected-single=true]:bg-indigo-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-lg data-[selected-single=true]:shadow-indigo-500/25 data-[range-middle=true]:bg-indigo-500/10 data-[range-middle=true]:text-foreground data-[range-start=true]:bg-indigo-600 data-[range-start=true]:text-white data-[range-end=true]:bg-indigo-600 data-[range-end=true]:text-white group-data-[focused=true]/day:ring-indigo-500/35 dark:hover:text-white flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 rounded-xl leading-none font-semibold transition-all hover:scale-[1.04] hover:bg-indigo-500/10 hover:text-indigo-700 active:scale-95 group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-2 data-[range-end=true]:rounded-xl data-[range-end=true]:rounded-r-xl data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-xl data-[range-start=true]:rounded-l-xl dark:hover:text-indigo-200 [&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className,
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };
