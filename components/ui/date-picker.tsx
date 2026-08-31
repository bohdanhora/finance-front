"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { enUS, ru, uk } from "date-fns/locale";
import { useLocale } from "next-intl";

import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { twMerge } from "tailwind-merge";

const copy = {
    en: { placeholder: "Choose a date", clear: "Clear", today: "Today" },
    ru: { placeholder: "Выберите дату", clear: "Очистить", today: "Сегодня" },
    ua: { placeholder: "Оберіть дату", clear: "Очистити", today: "Сьогодні" },
} as const;

const parseDateValue = (value?: string) => {
    if (!value) return undefined;

    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    if (
        !year ||
        !month ||
        !day ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return undefined;
    }

    return date;
};

const toDateValue = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

type DatePickerProps = Omit<React.ComponentProps<typeof Button>, "value" | "onChange"> & {
    value?: string;
    onChange: (value: string) => void;
    disabledDates?: React.ComponentProps<typeof Calendar>["disabled"];
};

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
    ({ value, onChange, disabledDates, className, disabled, ...triggerProps }, ref) => {
        const locale = useLocale() as keyof typeof copy;
        const currentCopy = copy[locale] ?? copy.en;
        const dateLocale = locale === "ru" ? ru : locale === "ua" ? uk : enUS;
        const intlLocale = locale === "ru" ? "ru-RU" : locale === "ua" ? "uk-UA" : "en-US";
        const selectedDate = parseDateValue(value);
        const [open, setOpen] = React.useState(false);
        const today = React.useMemo(() => new Date(), []);

        const selectDate = (date?: Date) => {
            if (!date) return;
            onChange(toDateValue(date));
            setOpen(false);
        };

        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        type="button"
                        variant="popover"
                        disabled={disabled}
                        className={twMerge(
                            "h-10 w-full justify-start rounded-xl px-3 text-left font-normal shadow-none",
                            !selectedDate && "text-muted-foreground",
                            className,
                        )}
                        {...triggerProps}
                    >
                        <CalendarDays className="mr-1 size-4 text-indigo-500" />
                        <span className="min-w-0 flex-1 truncate">
                            {selectedDate
                                ? new Intl.DateTimeFormat(intlLocale, {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                  }).format(selectedDate)
                                : currentCopy.placeholder}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="border-border bg-popover text-popover-foreground w-auto rounded-2xl p-1 shadow-2xl"
                >
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        defaultMonth={selectedDate}
                        onSelect={selectDate}
                        disabled={disabledDates}
                        locale={dateLocale}
                        weekStartsOn={locale === "en" ? 0 : 1}
                        captionLayout="dropdown"
                        startMonth={new Date(1900, 0, 1)}
                        endMonth={new Date(today.getFullYear() + 30, 11, 31)}
                        footer={
                            <div className="border-border mt-2 flex items-center justify-between border-t pt-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={!value}
                                    onClick={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                >
                                    {currentCopy.clear}
                                </Button>
                                <Button type="button" variant="secondary" size="sm" onClick={() => selectDate(today)}>
                                    {currentCopy.today}
                                </Button>
                            </div>
                        }
                    />
                </PopoverContent>
            </Popover>
        );
    },
);

DatePicker.displayName = "DatePicker";

export { DatePicker };
