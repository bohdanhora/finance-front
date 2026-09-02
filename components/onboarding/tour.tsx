"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { Button } from "components/ui/button";
import { CURRENCY_CHOSEN_EVENT, USER_CURRENCY_STORAGE_KEY } from "constants/index";

export const TOUR_STORAGE_KEY = "financeTourSeen";
export const TOUR_START_EVENT = "finance:start-tour";

/** Each step points at an element marked with `data-tour="<anchor>"`. */
const STEPS = [
    { anchor: "balance", key: "balance" },
    { anchor: "actions", key: "actions" },
    { anchor: "essentials", key: "essentials" },
    { anchor: "nextMonth", key: "nextMonth" },
    { anchor: "statistics", key: "statistics" },
    { anchor: "streak", key: "streak" },
] as const;

type Rect = { top: number; left: number; width: number; height: number };

const PADDING = 8;
const CARD_WIDTH = 320;
const GAP = 14;
/** Below this width the card is docked to the bottom instead of floating. */
const NARROW = 640;
/** Room kept clear at the top so the sticky navbar never covers the highlight. */
const TOP_SAFE = 76;

const viewportHeight = () => window.visualViewport?.height ?? window.innerHeight;
const viewportWidth = () => window.visualViewport?.width ?? window.innerWidth;

const sameRect = (a: Rect | null, b: Rect | null) => {
    if (!a || !b) return a === b;
    return (
        Math.abs(a.top - b.top) < 0.5 &&
        Math.abs(a.left - b.left) < 0.5 &&
        Math.abs(a.width - b.width) < 0.5 &&
        Math.abs(a.height - b.height) < 0.5
    );
};

export const OnboardingTour = () => {
    const t = useTranslations("tour");

    const [active, setActive] = useState(false);
    const [index, setIndex] = useState(0);
    const [rect, setRect] = useState<Rect | null>(null);
    const [narrow, setNarrow] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const [cardHeight, setCardHeight] = useState(210);

    const steps = STEPS.filter(({ anchor }) =>
        typeof document === "undefined" ? true : document.querySelector(`[data-tour="${anchor}"]`),
    );

    const finish = useCallback(() => {
        setActive(false);
        setIndex(0);
        setRect(null);
        try {
            localStorage.setItem(TOUR_STORAGE_KEY, "1");
        } catch {
            // private mode or blocked storage: the tour simply runs again next time
        }
    }, []);

    // First visit starts the tour; the navbar button can replay it later. The
    // currency dialog comes first and is modal, so on a genuinely fresh install
    // the tour has to wait for it: Radix sets `pointer-events: none` on the body
    // while a modal is open, which left the tour visible but completely dead.
    useEffect(() => {
        let seen = "1";
        let currencyChosen = true;

        try {
            seen = localStorage.getItem(TOUR_STORAGE_KEY) ?? "";
            currencyChosen = Boolean(localStorage.getItem(USER_CURRENCY_STORAGE_KEY));
        } catch {
            seen = "1";
        }

        if (seen) return;

        let timer: ReturnType<typeof setTimeout>;
        const begin = () => {
            timer = setTimeout(() => setActive(true), 700);
        };

        if (currencyChosen) {
            begin();
        } else {
            window.addEventListener(CURRENCY_CHOSEN_EVENT, begin, { once: true });
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener(CURRENCY_CHOSEN_EVENT, begin);
        };
    }, []);

    useEffect(() => {
        const start = () => {
            setIndex(0);
            setActive(true);
        };
        window.addEventListener(TOUR_START_EVENT, start);
        return () => window.removeEventListener(TOUR_START_EVENT, start);
    }, []);

    // Phones dock the card to the bottom edge, so the breakpoint has to be known
    // during layout rather than through a `sm:` class.
    useEffect(() => {
        const read = () => setNarrow(viewportWidth() < NARROW);
        read();
        window.addEventListener("resize", read);
        window.visualViewport?.addEventListener("resize", read);
        return () => {
            window.removeEventListener("resize", read);
            window.visualViewport?.removeEventListener("resize", read);
        };
    }, []);

    const current = steps[index];
    const anchor = current?.anchor;

    // Bring the step's element into the part of the screen the card does not
    // cover. Instant rather than smooth: a smooth scroll on a phone is still
    // running when the first measurement happens, which is what made the
    // highlight land next to the wrong block.
    useEffect(() => {
        if (!active || !anchor) return;

        const target = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
        if (!target) return;

        const free = viewportHeight() - TOP_SAFE - (narrow ? cardHeight + GAP * 2 : 0);
        const r = target.getBoundingClientRect();
        const wanted = TOP_SAFE + Math.max(0, (free - Math.min(r.height, free)) / 2);

        window.scrollBy({ top: r.top - wanted, behavior: "auto" });
        // `narrow`/`cardHeight` only tune where the element lands, so re-running
        // on every card resize would fight the user's own scrolling.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, anchor]);

    // Follow the element on an animation frame instead of on every scroll event.
    // Scroll events on a phone fire faster than React can re-render, and the old
    // listener called setState on each one, which is what froze the overlay.
    useEffect(() => {
        if (!active || !anchor) return;

        let frame = 0;
        let last: Rect | null = null;

        const measure = () => {
            const target = document.querySelector<HTMLElement>(`[data-tour="${anchor}"]`);
            if (!target) return;

            const r = target.getBoundingClientRect();
            const next = { top: r.top, left: r.left, width: r.width, height: r.height };

            if (!sameRect(last, next)) {
                last = next;
                setRect(next);
            }
        };

        const tick = () => {
            measure();
            frame = requestAnimationFrame(tick);
        };

        // Straight away, not on the next frame: a browser that has paused
        // animation frames (a backgrounded tab, a phone that just woke) would
        // otherwise leave the tour mounted with nothing to position, so it
        // rendered nothing at all.
        measure();
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [active, anchor]);

    // The card's height drives whether it fits below the highlight. It is only
    // in the DOM once `rect` is known, so the measurement has to wait for that
    // too, otherwise it runs against an empty ref and keeps the placeholder.
    const positioned = rect !== null;

    useLayoutEffect(() => {
        if (!active || !positioned || !cardRef.current) return;

        const element = cardRef.current;
        const read = () => setCardHeight(element.offsetHeight);

        read();

        const observer = new ResizeObserver(read);
        observer.observe(element);
        return () => observer.disconnect();
    }, [active, index, positioned]);

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

    // A tap on the backdrop closes the tour, a drag scrolls the page behind it.
    // Pointer events rather than `onClick`: mobile Safari does not reliably fire
    // a click on a plain div, so the backdrop used to swallow taps silently.
    const pressRef = useRef<{ x: number; y: number; at: number } | null>(null);

    const onBackdropDown = (event: React.PointerEvent) => {
        pressRef.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    };

    const onBackdropUp = (event: React.PointerEvent) => {
        const press = pressRef.current;
        pressRef.current = null;
        if (!press) return;

        const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
        if (moved < 12 && Date.now() - press.at < 700) finish();
    };

    if (!active || !current || !rect) return null;

    const isLast = index === steps.length - 1;

    const vh = viewportHeight();
    const vw = viewportWidth();

    const cardWidth = narrow ? Math.min(CARD_WIDTH + 40, vw - GAP * 2) : CARD_WIDTH;

    // Narrow screens dock the card to the bottom edge: there is no honest room
    // to float a 320px card next to a full-width block, and anchoring it with
    // `bottom` keeps it on screen even before its height has been measured.
    const floatTop = (() => {
        const spaceBelow = vh - (rect.top + rect.height);
        const placeBelow = spaceBelow > cardHeight + GAP * 2;
        const preferred = placeBelow ? rect.top + rect.height + GAP : rect.top - cardHeight - GAP;
        return Math.min(Math.max(GAP, preferred), Math.max(GAP, vh - cardHeight - GAP));
    })();

    const cardStyle: React.CSSProperties = narrow
        ? { bottom: GAP, left: Math.max(GAP, (vw - cardWidth) / 2), width: cardWidth }
        : {
              top: floatTop,
              left: Math.min(
                  Math.max(GAP, rect.left + rect.width / 2 - cardWidth / 2),
                  Math.max(GAP, vw - cardWidth - GAP),
              ),
              width: cardWidth,
          };

    // Blocks taller than the free area would push the ring off screen and leave
    // most of the page lit, so the highlight is clipped to what is visible.
    const ringTop = Math.max(GAP, rect.top - PADDING);
    const cardTop = narrow ? vh - cardHeight - GAP : floatTop;
    const ringBottom = Math.min(narrow ? cardTop - GAP : vh - GAP, rect.top + rect.height + PADDING);
    const ringHeight = Math.max(40, ringBottom - ringTop);

    return (
        <div
            className="fixed inset-0 z-[100] touch-manipulation"
            style={{ pointerEvents: "auto" }}
            role="dialog"
            aria-modal="true"
            aria-label={t("title")}
        >
            {/* A transparent catcher for tap-to-dismiss; the dimming itself is
                the huge box-shadow below, which leaves the anchor lit. */}
            <div
                className="absolute inset-0 cursor-pointer"
                onPointerDown={onBackdropDown}
                onPointerUp={onBackdropUp}
            />

            <div
                className="pointer-events-none absolute rounded-2xl ring-2 ring-indigo-400"
                style={{
                    top: ringTop,
                    left: Math.max(4, rect.left - PADDING),
                    width: Math.min(rect.width + PADDING * 2, vw - 8),
                    height: ringHeight,
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.68)",
                }}
            />

            <div
                ref={cardRef}
                className="border-border bg-card absolute rounded-2xl border p-5 shadow-2xl"
                style={cardStyle}
            >
                <button
                    type="button"
                    onClick={finish}
                    aria-label={t("skip")}
                    className="text-muted-foreground hover:text-foreground absolute top-1.5 right-1.5 flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors"
                >
                    <X size={18} />
                </button>

                <p className="text-muted-foreground mb-1 text-[0.7rem] font-medium tracking-wide uppercase">
                    {t("step", { current: index + 1, total: steps.length })}
                </p>
                <h3 className="pr-10 text-base font-semibold">{t(`steps.${current.key}.title`)}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{t(`steps.${current.key}.body`)}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="flex gap-1.5">
                        {steps.map((step, i) => (
                            <span
                                key={step.anchor}
                                className={
                                    i === index
                                        ? "h-1.5 w-5 rounded-full bg-indigo-500"
                                        : "bg-muted-foreground/30 h-1.5 w-1.5 rounded-full"
                                }
                            />
                        ))}
                    </div>

                    <div className="flex gap-2">
                        {index > 0 && (
                            <Button
                                variant="secondary"
                                className="min-h-11 px-4"
                                onClick={() => setIndex((i) => i - 1)}
                            >
                                {t("back")}
                            </Button>
                        )}
                        <Button className="min-h-11 px-4" onClick={() => (isLast ? finish() : setIndex((i) => i + 1))}>
                            {isLast ? t("done") : t("next")}
                        </Button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={finish}
                    className="text-muted-foreground hover:text-foreground mt-3 w-full cursor-pointer py-2 text-xs underline underline-offset-4 sm:hidden"
                >
                    {t("skip")}
                </button>
            </div>
        </div>
    );
};
