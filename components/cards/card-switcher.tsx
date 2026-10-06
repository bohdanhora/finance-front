"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    Modifier,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    horizontalListSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, Layers, Plus } from "lucide-react";
import { twMerge } from "lib/tw";

import { AnimatedMoney } from "components/animated-number";
import { CardDialog } from "components/cards/card-dialog";
import { CardFace, useCardName } from "components/cards/card-face";
import { ALL_CARDS, creditLimitOf, resolveCardFilter } from "lib/cards";
import { formatSignedCurrency } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";
import { useReorderCards } from "api/cards";
import useStore from "store/general";
import { Card } from "types/transactions";

const tileBase = "card-tile relative w-tile shrink-0 cursor-pointer snap-start outline-none sm:w-tile-lg";

const tileClass = tileBase;

const sortableTileClass = tileBase;

const horizontalOnly: Modifier = ({ transform }) => ({ ...transform, y: 0 });

const SortableCard = ({
    card,
    selected,
    className,
    onSelect,
    children,
}: {
    card: Card;
    selected: boolean;
    className: string;
    onSelect: () => void;
    children: React.ReactNode;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

    return (
        <button
            ref={setNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            role="option"
            aria-selected={selected}
            onClick={onSelect}
            onContextMenu={(event) => event.preventDefault()}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={twMerge(className, "touch-manipulation select-none", isDragging && "opacity-30")}
        >
            {children}
        </button>
    );
};

export const CardSwitcher = () => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const totalAmount = useStore((state) => state.totalAmount);
    const selectedCardId = useStore((state) => state.selectedCardId);
    const setSelectedCardId = useStore((state) => state.setSelectedCardId);
    const symbol = getCurrencySymbol(useStore((state) => state.userCurrency));
    const cardName = useCardName();
    const setCards = useStore((state) => state.setCards);
    const reorderCards = useReorderCards();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const dragging = draggedId !== null;
    const justDragged = useRef(false);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });

    const updateEdges = useCallback(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const max = scroller.scrollWidth - scroller.clientWidth;
        setEdges({ left: scroller.scrollLeft > 4, right: scroller.scrollLeft < max - 4 });
    }, []);

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        const onWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            const max = scroller.scrollWidth - scroller.clientWidth;
            const atStart = scroller.scrollLeft <= 0 && event.deltaY < 0;
            const atEnd = scroller.scrollLeft >= max - 1 && event.deltaY > 0;
            if (max <= 0 || atStart || atEnd) return;
            event.preventDefault();
            scroller.scrollLeft += event.deltaY;
        };

        const observer = new ResizeObserver(updateEdges);
        observer.observe(scroller);
        scroller.addEventListener("wheel", onWheel, { passive: false });
        scroller.addEventListener("scroll", updateEdges, { passive: true });
        updateEdges();

        return () => {
            observer.disconnect();
            scroller.removeEventListener("wheel", onWheel);
            scroller.removeEventListener("scroll", updateEdges);
        };
    }, [updateEdges]);

    useEffect(updateEdges, [cards.length, updateEdges]);

    const scrollByPage = (direction: 1 | -1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        scroller.scrollBy({ left: direction * scroller.clientWidth * 0.8, behavior: "smooth" });
    };

    const arrowClass =
        "bg-paper border-rule-strong text-ink hover:bg-ink hover:text-paper absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 items-center justify-center border transition-colors pointer-fine:flex";

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active: dragged }: DragStartEvent) => {
        setDraggedId(String(dragged.id));
        justDragged.current = true;
    };

    const handleDragEnd = ({ active: dragged, over }: DragEndEvent) => {
        setDraggedId(null);
        window.setTimeout(() => {
            justDragged.current = false;
        }, 0);
        if (!over || dragged.id === over.id) return;

        const previous = cards;
        const from = cards.findIndex((card) => card.id === dragged.id);
        const to = cards.findIndex((card) => card.id === over.id);
        if (from < 0 || to < 0) return;

        const reordered = arrayMove(cards, from, to);
        setCards(reordered);
        reorderCards.mutate(
            reordered.map((card) => card.id),
            { onError: () => setCards(previous) },
        );
    };

    const active = resolveCardFilter(selectedCardId, cards);
    const showAll = cards.length > 1;
    const selectedClass = "";
    const idleClass = dragging ? "opacity-60" : "opacity-90 hover:opacity-100";
    const draggedCard = cards.find((card) => card.id === draggedId) ?? null;

    return (
        <div className="relative">
            {edges.left && (
                <button
                    type="button"
                    aria-label={t("scrollBack")}
                    onClick={() => scrollByPage(-1)}
                    className={twMerge(arrowClass, "-left-2")}
                >
                    <ChevronLeft className="size-4" />
                </button>
            )}
            {edges.right && (
                <button
                    type="button"
                    aria-label={t("scrollForward")}
                    onClick={() => scrollByPage(1)}
                    className={twMerge(arrowClass, "-right-2")}
                >
                    <ChevronRight className="size-4" />
                </button>
            )}
            <div
                ref={scrollerRef}
                role="listbox"
                aria-label={t("switcherLabel")}
                className={twMerge(
                    "no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pt-2 pb-4 md:mx-0 md:scroll-px-0 md:px-0",
                    dragging && "snap-none",
                )}
            >
                {showAll && (
                    <button
                        type="button"
                        role="option"
                        aria-selected={active === ALL_CARDS}
                        onClick={() => setSelectedCardId(ALL_CARDS)}
                        className={twMerge(tileClass, active === ALL_CARDS ? selectedClass : idleClass)}
                    >
                        <div
                            className={twMerge(
                                "bg-surface border-rule-strong rounded-card flex aspect-card w-full flex-col justify-between gap-2 border p-3 text-left sm:p-3.5",
                            )}
                        >
                            <span className="flex items-center gap-2 font-mono text-2xs tracking-wide uppercase">
                                <Layers className="size-3" />
                                {t("allCards")}
                            </span>
                            <span className="min-w-0">
                                <span className="text-ink-faint block text-xs">
                                    {t("cardsCount", { count: cards.length })}
                                </span>
                                <span className="figure block text-base leading-tight break-words sm:text-lg">
                                    <AnimatedMoney
                                        value={totalAmount}
                                        symbol={symbol}
                                        symbolClassName="text-ink-faint"
                                        format={formatSignedCurrency}
                                    />
                                </span>
                            </span>
                        </div>
                    </button>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[horizontalOnly]}
                    onDragStart={handleDragStart}
                    onDragCancel={() => {
                        setDraggedId(null);
                        justDragged.current = false;
                    }}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={cards.map((card) => card.id)} strategy={horizontalListSortingStrategy}>
                        {cards.map((card) => {
                            const selected = showAll ? active === card.id : true;
                            return (
                                <SortableCard
                                    key={card.id}
                                    card={card}
                                    selected={selected}
                                    className={twMerge(sortableTileClass, selected ? selectedClass : idleClass)}
                                    onSelect={() => {
                                        if (!justDragged.current) setSelectedCardId(card.id);
                                    }}
                                >
                                    <CardFace
                                        skin={card.skin}
                                        name={cardName(card)}
                                        balance={card.balance}
                                        creditLimit={creditLimitOf(card)}
                                        symbol={symbol}
                                        cover={card.cover}
                                    />
                                </SortableCard>
                            );
                        })}
                    </SortableContext>
                    {typeof document !== "undefined" &&
                        createPortal(
                            <DragOverlay modifiers={[horizontalOnly]} zIndex={60}>
                                {draggedCard && (
                                    <div className="rotate-2 cursor-grabbing">
                                        <CardFace
                                            skin={draggedCard.skin}
                                            name={cardName(draggedCard)}
                                            balance={draggedCard.balance}
                                            creditLimit={creditLimitOf(draggedCard)}
                                            symbol={symbol}
                                            cover={draggedCard.cover}
                                        />
                                    </div>
                                )}
                            </DragOverlay>,
                            document.body,
                        )}
                </DndContext>

                <CardDialog
                    trigger={
                        <button
                            type="button"
                            aria-label={t("addTitle")}
                            className={twMerge(
                                tileClass,
                                "border-rule text-ink-faint hover:border-accent hover:text-accent rounded-card flex aspect-card flex-col items-center justify-center gap-2 border border-dashed font-mono text-2xs tracking-wide uppercase transition-colors",
                            )}
                        >
                            <Plus className="size-4" />
                            {t("addCard")}
                        </button>
                    }
                />
            </div>
        </div>
    );
};
