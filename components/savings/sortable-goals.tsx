"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    rectSortingStrategy,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { useReorderSavingsGoals } from "api/main";
import { CURRENCY } from "constants/index";
import { twMerge } from "lib/tw";
import useStore from "store/general";
import { SavingsGoal, SavingsOperation } from "types/transactions";
import { SavingsGoalCard } from "./goal-card";
import { SavingsGoalDetails } from "./goal-details";

type Props = {
    goals: SavingsGoal[];
    operations: SavingsOperation[];
    rates: { usdToUah: number; eurToUah: number };
    displayCurrency: CURRENCY;
    onEdit: (goal: SavingsGoal) => void;
    onDelete: (goal: SavingsGoal) => void;
};

type CardProps = Omit<Props, "goals" | "onEdit" | "onDelete"> & { onOpen: (goal: SavingsGoal) => void };

const handleClass =
    "bg-surface/85 text-ink-muted hover:text-ink flex h-8 shrink-0 cursor-grab touch-none items-center gap-0.5 rounded-lg pr-2 pl-1 shadow-sm backdrop-blur transition-colors active:cursor-grabbing";

const HandleContent = ({ position }: { position: number }) => (
    <>
        <GripVertical className="size-4" />
        <span className="font-mono text-xs tabular-nums">{position}</span>
    </>
);

const SortableGoal = ({
    goal,
    position,
    sortable,
    ...cardProps
}: CardProps & { goal: SavingsGoal; position: number; sortable: boolean }) => {
    const t = useTranslations("savings");
    const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
        id: goal.id,
        disabled: !sortable,
    });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Translate.toString(transform), transition }}
            className={twMerge("transition-opacity", isDragging && "opacity-30")}
        >
            <SavingsGoalCard
                goal={goal}
                {...cardProps}
                handle={
                    sortable && (
                        <button
                            ref={setActivatorNodeRef}
                            type="button"
                            aria-label={`${t("dragToReorder")}. ${t("priority", { position })}`}
                            title={t("dragToReorder")}
                            className={handleClass}
                            {...attributes}
                            {...listeners}
                        >
                            <HandleContent position={position} />
                        </button>
                    )
                }
            />
        </div>
    );
};

export const SortableGoals = ({ goals, onEdit, onDelete, ...shared }: Props) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const openGoal = goals.find((goal) => goal.id === openId) ?? null;
    const cardProps = { ...shared, onOpen: (goal: SavingsGoal) => setOpenId(goal.id) };
    const setSavingsGoals = useStore((state) => state.setSavingsGoals);
    const reorder = useReorderSavingsGoals();
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const sortable = goals.length > 1;
    const draggedIndex = goals.findIndex((goal) => goal.id === draggedId);
    const dragged = draggedIndex >= 0 ? goals[draggedIndex] : null;

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragStart = ({ active }: DragStartEvent) => setDraggedId(String(active.id));

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        setDraggedId(null);
        if (!over || active.id === over.id) return;
        const from = goals.findIndex((goal) => goal.id === active.id);
        const to = goals.findIndex((goal) => goal.id === over.id);
        if (from < 0 || to < 0) return;

        const previous = goals;
        const reordered = arrayMove(goals, from, to);
        setSavingsGoals(reordered);
        reorder.mutate(
            reordered.map((goal) => goal.id),
            { onError: () => setSavingsGoals(previous) },
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={() => setDraggedId(null)}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={goals.map((goal) => goal.id)} strategy={rectSortingStrategy}>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal, index) => (
                        <SortableGoal
                            key={goal.id}
                            goal={goal}
                            position={index + 1}
                            sortable={sortable}
                            {...cardProps}
                        />
                    ))}
                </div>
            </SortableContext>
            {typeof document !== "undefined" &&
                createPortal(
                    <DragOverlay zIndex={60}>
                        {dragged && (
                            <SavingsGoalCard
                                goal={dragged}
                                {...cardProps}
                                className="ring-accent rotate-1 cursor-grabbing shadow-2xl ring-1"
                                handle={
                                    <span className={handleClass}>
                                        <HandleContent position={draggedIndex + 1} />
                                    </span>
                                }
                            />
                        )}
                    </DragOverlay>,
                    document.body,
                )}
            <SavingsGoalDetails
                goal={openGoal}
                {...shared}
                onOpenChange={(open) => !open && setOpenId(null)}
                onEdit={(goal) => {
                    setOpenId(null);
                    onEdit(goal);
                }}
                onDelete={(goal) => {
                    setOpenId(null);
                    onDelete(goal);
                }}
            />
        </DndContext>
    );
};
