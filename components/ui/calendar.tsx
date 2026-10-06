"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames, type DropdownProps } from "react-day-picker";

import { Button, buttonVariants } from "components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { twMerge } from "lib/tw";

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
                    "h-9 px-2.5 font-mono text-2xs uppercase",
                    isMonthDropdown ? "w-28 sm:w-32" : "w-20 sm:w-24",
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="center" className={twMerge("max-h-72", isMonthDropdown ? "min-w-36" : "min-w-24")}>
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
                "bg-transparent text-ink group/calendar w-80 max-w-full p-4 [--cell-size:--spacing(10)] sm:w-96 sm:p-5 sm:[--cell-size:--spacing(12)]",
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
                    "border-rule pointer-events-auto size-(--cell-size) border p-0 select-none hover:border-rule-strong aria-disabled:opacity-40",
                    defaultClassNames.button_previous,
                ),
                button_next: twMerge(
                    buttonVariants({ variant: buttonVariant }),
                    "border-rule pointer-events-auto size-(--cell-size) border p-0 select-none hover:border-rule-strong aria-disabled:opacity-40",
                    defaultClassNames.button_next,
                ),
                month_caption: twMerge(
                    "flex h-(--cell-size) w-full items-center justify-center px-12 sm:px-14",
                    defaultClassNames.month_caption,
                ),
                dropdowns: twMerge(
                    "flex h-(--cell-size) w-full flex-nowrap items-center justify-center gap-2 text-sm font-semibold",
                    defaultClassNames.dropdowns,
                ),
                dropdown_root: twMerge("relative", defaultClassNames.dropdown_root),
                dropdown: twMerge(defaultClassNames.dropdown),
                caption_label: twMerge(
                    "select-none font-mono text-xs uppercase",
                    captionLayout === "label"
                        ? "text-sm capitalize"
                        : "flex h-8 items-center gap-1 pr-2 pl-3 text-sm capitalize [&>svg]:size-3.5 [&>svg]:text-ink-faint",
                    defaultClassNames.caption_label,
                ),
                table: "w-full border-collapse",
                weekdays: twMerge("mt-3 flex border-b border-rule-strong pb-2", defaultClassNames.weekdays),
                weekday: twMerge("label flex-1 select-none text-center", defaultClassNames.weekday),
                week: twMerge("mt-1.5 flex w-full", defaultClassNames.week),
                week_number_header: twMerge("select-none w-(--cell-size)", defaultClassNames.week_number_header),
                week_number: twMerge("text-xs select-none text-ink-faint", defaultClassNames.week_number),
                day: twMerge(
                    "group/day relative aspect-square h-full w-full select-none p-0 text-center",
                    defaultClassNames.day,
                ),
                range_start: twMerge("bg-wash", defaultClassNames.range_start),
                range_middle: twMerge("", defaultClassNames.range_middle),
                range_end: twMerge("bg-wash", defaultClassNames.range_end),
                today: twMerge(
                    "text-accent [&>button]:outline [&>button]:outline-1 [&>button]:-outline-offset-1 [&>button]:outline-accent",
                    defaultClassNames.today,
                ),
                outside: twMerge("text-ink-faint opacity-30 aria-selected:text-ink-faint", defaultClassNames.outside),
                disabled: twMerge("text-ink-faint opacity-50", defaultClassNames.disabled),
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
                "data-[selected-single=true]:bg-accent data-[selected-single=true]:text-on-accent data-[range-middle=true]:bg-wash data-[range-middle=true]:text-ink data-[range-start=true]:bg-accent data-[range-start=true]:text-on-accent data-[range-end=true]:bg-accent data-[range-end=true]:text-on-accent flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 font-sans text-sm leading-none normal-case tabular-nums tracking-normal hover:bg-wash hover:text-ink group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:outline group-data-[focused=true]/day:outline-2 group-data-[focused=true]/day:outline-accent [&>span]:text-xs [&>span]:opacity-70",
                defaultClassNames.day,
                className,
            )}
            {...props}
        />
    );
}

export { Calendar, CalendarDayButton };
