"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Button } from "components/ui/button";

export const TOUR_STORAGE_KEY = "financeTourSeen";
export const TOUR_START_EVENT = "finance:start-tour";

/** Each step points at an element marked with `data-tour="<anchor>"`. */
const STEPS = [
    { anchor: "balance", key: "balance" },
    { anchor: "actions", key: "actions" },
    { anchor: "essentials", key: "essentials" },
    { anchor: "nextMonth", key: "nextMonth" },
    { anchor: "statistics", key: "statistics" },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const CARD_WIDTH = 320;
const GAP = 14;

export const OnboardingTour = () => {
    const t = useTranslations("tour");

    const [active, setActive] = useState(false);
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState(210);

    const steps = STEPS.filter(({ anchor }) =>
        typeof document === "undefined" ? true : document.querySelector(`[data-tour="${anchor}"]`),
    );

    const finish = useCallback(() => {
        setActive(false);
        setIndex(0);
        try {
            localStorage.setItem(TOUR_STORAGE_KEY, "1");
        } catch {
            // private mode or blocked storage: the tour simply runs again next time
        }
    }, []);

    // First visit starts the tour; the navbar button can replay it later.
    useEffect(() => {
        let seen = "1";
        try {
            seen = localStorage.getItem(TOUR_STORAGE_KEY) ?? "";
        } catch {
            seen = "1";
        }

        if (!seen) {
            const timer = setTimeout(() => setActive(true), 700);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const start = () => {
            setIndex(0);
            setActive(true);
        };
        window.addEventListener(TOUR_START_EVENT, start);
        return () => window.removeEventListener(TOUR_START_EVENT, start);
    }, []);

    const current = steps[index];

    // Track the anchor's position, following scroll and resize.
    useLayoutEffect(() => {
        if (!active || !current) return;

        const target = document.querySelector<HTMLElement>(`[data-tour="${current.anchor}"]`);
        if (!target) return;

        target.scrollIntoView({ behavior: "smooth", block: "center" });

        const measure = () => {
            const r = target.getBoundingClientRect();
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        };

        const timer = setTimeout(measure, 350);
        measure();

        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [active, current, index]);

    // The card's height drives whether it fits below the highlight.
    useLayoutEffect(() => {
        if (!active || !cardRef.current) return;
        setCardHeight(cardRef.current.offsetHeight);
    }, [active, index, rect]);

    useEffect(() => {
        if (!active) return;

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") finish();
            if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
            if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [active, finish, steps.length]);

    if (!active || !current || !rect) return null;

    const isLast = index === steps.length - 1;

    // Prefer sitting under the highlight, flip above when there is no room, and
    // always keep the whole card on screen using its measured height.
    const spaceBelow = window.innerHeight - (rect.top + rect.height);
    const placeBelow = spaceBelow > cardHeight + GAP * 2;

    const preferredTop = placeBelow ? rect.top + rect.height + GAP : rect.top - cardHeight - GAP;
    const cardTop = Math.min(Math.max(GAP, preferredTop), Math.max(GAP, window.innerHeight - cardHeight - GAP));

    const cardLeft = Math.min(
        Math.max(GAP, rect.left + rect.width / 2 - CARD_WIDTH / 2),
        Math.max(GAP, window.innerWidth - CARD_WIDTH - GAP),
    );

    return (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={t("title")}>
            {/* A transparent catcher for click-to-dismiss; the dimming itself is
                the huge box-shadow below, which leaves the anchor lit. */}
            <div className="absolute inset-0" onClick={finish} />

            <div
                className="pointer-events-none absolute rounded-2xl ring-2 ring-indigo-400 transition-all duration-300"
                style={{
                    top: rect.top - PADDING,
                    left: rect.left - PADDING,
                    width: rect.width + PADDING * 2,
                    height: rect.height + PADDING * 2,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.68)",
                }}
            />

            <div
                ref={cardRef}
                className="border-border bg-card absolute rounded-2xl border p-5 shadow-2xl transition-all duration-300"
                style={{ top: cardTop, left: cardLeft, width: CARD_WIDTH }}
            >
                <button
                    type="button"
                    onClick={finish}
                    aria-label={t("skip")}
                    className="text-muted-foreground hover:text-foreground absolute top-3 right-3 cursor-pointer transition-colors"
                >
                    <X size={16} />
                </button>

                <p className="text-muted-foreground mb-1 text-[0.7rem] font-medium tracking-wide uppercase">
                    {t("step", { current: index + 1, total: steps.length })}
                </p>
                <h3 className="pr-6 text-base font-semibold">{t(`steps.${current.key}.title`)}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t(`steps.${current.key}.body`)}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5">
                        {steps.map((step, i) => (
                            <span
                                key={step.anchor}
                                className={
                                    i === index
                                        ? "h-1.5 w-5 rounded-full bg-indigo-500 transition-all"
                                        : "bg-muted-foreground/30 h-1.5 w-1.5 rounded-full transition-all"
                                }
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {index > 0 && (
                            <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>
                                {t("back")}
                            </Button>
                        )}
                        <Button size="sm" onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}>
                            {isLast ? t("done") : t("next")}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
