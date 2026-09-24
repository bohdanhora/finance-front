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
import { twMerge } from "tailwind-merge";

import { AnimatedMoney } from "components/animated-number";
import { CardDialog } from "components/cards/card-dialog";
import { CardFace, useCardName } from "components/cards/card-face";
import { ALL_CARDS, creditLimitOf, resolveCardFilter } from "lib/cards";
import { formatSignedCurrency } from "lib/utils";
import { getCurrencySymbol } from "lib/currency";
import { useReorderCards } from "api/cards";
import useStore from "store/general";
import { Card } from "types/transactions";

const tileBase =
    "relative w-36 shrink-0 cursor-pointer snap-start rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:w-44";

const tileClass = `${tileBase} transition-[transform,opacity,box-shadow] duration-200`;

const sortableTileClass = `${tileBase} transition-[opacity,box-shadow] duration-200`;

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
            className={twMerge(
                className,
                "touch-manipulation select-none [-webkit-touch-callout:none]",
                isDragging && "opacity-30",
            )}
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
        "bg-card/90 text-foreground ring-border hover:bg-card absolute top-1/2 z-20 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full shadow-md ring-1 backdrop-blur transition-opacity [@media(pointer:fine)]:flex";

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
    const selectedClass = "ring-2 ring-indigo-500 ring-offset-2 ring-offset-card";
    const idleClass = dragging ? "opacity-75" : "opacity-75 hover:opacity-100 hover:-translate-y-0.5";
    const draggedCard = cards.find((card) => card.id === draggedId) ?? null;

    return (
        <div className="relative">
            {edges.left && (
                <button
                    type="button"
                    aria-label={t("scrollBack")}
                    onClick={() => scrollByPage(-1)}
                    className={twMerge(arrowClass, "-left-3 sm:-left-4")}
                >
                    <ChevronLeft className="size-4" />
                </button>
            )}
            {edges.right && (
                <button
                    type="button"
                    aria-label={t("scrollForward")}
                    onClick={() => scrollByPage(1)}
                    className={twMerge(arrowClass, "-right-3 sm:-right-4")}
                >
                    <ChevronRight className="size-4" />
                </button>
            )}
            <div
                ref={scrollerRef}
                role="listbox"
                aria-label={t("switcherLabel")}
                className={twMerge(
                    "-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pt-1 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
                        <div className="bg-muted/70 ring-border flex aspect-[1.586] w-full flex-col justify-between rounded-2xl p-3.5 text-left ring-1">
                            <span className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.08em] uppercase">
                                <Layers className="size-3.5 text-indigo-500" />
                                {t("allCards")}
                            </span>
                            <span className="min-w-0">
                                <span className="text-muted-foreground block text-xs">
                                    {t("cardsCount", { count: cards.length })}
                                </span>
                                <span className="block truncate text-lg leading-tight font-semibold tabular-nums">
                                    <AnimatedMoney
                                        value={totalAmount}
                                        symbol={symbol}
                                        symbolClassName="text-muted-foreground"
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
                                    />
                                </SortableCard>
                            );
                        })}
                    </SortableContext>
                    {typeof document !== "undefined" &&
                        createPortal(
                            <DragOverlay modifiers={[horizontalOnly]} zIndex={60}>
                                {draggedCard && (
                                    <div className="scale-[1.05] cursor-grabbing rounded-2xl shadow-2xl ring-2 shadow-black/40 ring-indigo-500/70">
                                        <CardFace
                                            skin={draggedCard.skin}
                                            name={cardName(draggedCard)}
                                            balance={draggedCard.balance}
                                            creditLimit={creditLimitOf(draggedCard)}
                                            symbol={symbol}
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
                                "border-border text-muted-foreground hover:text-foreground flex aspect-[1.586] flex-col items-center justify-center gap-1.5 border-2 border-dashed text-sm font-medium hover:border-indigo-400/60 hover:bg-indigo-500/5",
                            )}
                        >
                            <Plus className="size-5" />
                            {t("addCard")}
                        </button>
                    }
                />
            </div>
        </div>
    );
};
