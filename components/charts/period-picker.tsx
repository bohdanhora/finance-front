"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { getIntlLocale } from "lib/date-locale";
import {
    customPeriod,
    periodOf,
    shiftPeriod,
    toDateKey,
    type CalendarKind,
    type Period,
    type PeriodKind,
} from "lib/period";

const KINDS: PeriodKind[] = ["week", "month", "quarter", "year", "custom"];

export const usePeriodLabel = () => {
    const t = useTranslations("statistics");
    const locale = useLocale();
    const intl = getIntlLocale(locale);

    return (period: Period) => {
        const start = new Date(`${period.start}T00:00:00`);
        const end = new Date(`${period.end}T00:00:00`);

        if (period.kind === "month") {
            return new Intl.DateTimeFormat(intl, { month: "long", year: "numeric" }).format(start);
        }
        if (period.kind === "year") return String(start.getFullYear());
        if (period.kind === "quarter") {
            return t("quarterLabel", { quarter: Math.floor(start.getMonth() / 3) + 1, year: start.getFullYear() });
        }

        const sameYear = start.getFullYear() === end.getFullYear();
        const short = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" });
        const full = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", year: "numeric" });
        return `${(sameYear ? short : full).format(start)} - ${full.format(end)}`;
    };
};

export const PeriodPicker = ({
    period,
    onChange,
    earliest,
}: {
    period: Period;
    onChange: (period: Period) => void;
    earliest?: string;
}) => {
    const t = useTranslations("statistics");
    const label = usePeriodLabel();
    const today = toDateKey(new Date());
    const [rangeOpen, setRangeOpen] = useState(false);
    const [from, setFrom] = useState(period.start);
    const [to, setTo] = useState(period.end);

    useEffect(() => {
        setFrom(period.start);
        setTo(period.end);
    }, [period.start, period.end]);

    const changeKind = (kind: PeriodKind) => {
        if (kind === "custom") {
            onChange(customPeriod(period.start, period.end > today ? today : period.end));
            setRangeOpen(true);
            return;
        }
        const anchor = today >= period.start && today <= period.end ? today : period.start;
        onChange(periodOf(kind as CalendarKind, anchor));
    };

    const labelBox = (
        <span className="flex min-w-0 flex-1 items-center justify-center px-2 text-center font-mono text-2xs uppercase sm:w-52 sm:flex-none">
            <span className="truncate">{label(period)}</span>
        </span>
    );

    return (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Select value={period.kind} onValueChange={(value) => changeKind(value as PeriodKind)}>
                <SelectTrigger aria-label={t("periodKind")} className="w-full sm:w-36">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {KINDS.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                            {t(`period.${kind}`)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="border-rule flex h-10 min-w-0 flex-1 items-stretch border sm:flex-none">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-full"
                    aria-label={t("previousPeriod")}
                    disabled={!!earliest && period.start <= earliest}
                    onClick={() => onChange(shiftPeriod(period, -1))}
                >
                    <ChevronLeft className="size-4" />
                </Button>
                <span className="border-rule flex min-w-0 flex-1 border-x">
                    {period.kind === "custom" ? (
                        <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
                            <PopoverTrigger asChild>
                                <button type="button" className="hover:bg-wash flex min-w-0 flex-1 cursor-pointer">
                                    {labelBox}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="period-from">{t("periodFrom")}</Label>
                                    <Input
                                        id="period-from"
                                        type="date"
                                        value={from}
                                        max={to}
                                        onChange={(event) => setFrom(event.target.value)}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="period-to">{t("periodTo")}</Label>
                                    <Input
                                        id="period-to"
                                        type="date"
                                        value={to}
                                        min={from}
                                        max={today}
                                        onChange={(event) => setTo(event.target.value)}
                                    />
                                </div>
                                <Button
                                    disabled={!from || !to}
                                    onClick={() => {
                                        onChange(customPeriod(from, to));
                                        setRangeOpen(false);
                                    }}
                                >
                                    {t("applyPeriod")}
                                </Button>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        labelBox
                    )}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-full"
                    aria-label={t("nextPeriod")}
                    disabled={period.end >= today}
                    onClick={() => onChange(shiftPeriod(period, 1))}
                >
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </div>
    );
};
