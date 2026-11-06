"use client";

import * as React from "react";
import { PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { twMerge } from "lib/tw";
import { Button } from "ui/button";
import { RowMenu } from "components/row-menu";

const CLEAR_CONFIRM_TIMEOUT_MS = 4000;

function ListDialogBody({ className, ...props }: React.ComponentProps<"div">) {
    return <div className={twMerge("grid gap-6 lg:grid-cols-5", className)} {...props} />;
}

type ClearListButtonProps = {
    label: string;
    confirmLabel: string;
    disabled?: boolean;
    onClear: () => void;
};

function ClearListButton({ label, confirmLabel, disabled, onClear }: ClearListButtonProps) {
    const [confirming, setConfirming] = React.useState(false);

    React.useEffect(() => {
        if (!confirming) return;
        const timer = setTimeout(() => setConfirming(false), CLEAR_CONFIRM_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [confirming]);

    return (
        <Button
            type="button"
            variant={confirming ? "destructive" : "ghost"}
            size="sm"
            disabled={disabled}
            onBlur={() => setConfirming(false)}
            onClick={() => {
                if (!confirming) {
                    setConfirming(true);
                    return;
                }
                setConfirming(false);
                onClear();
            }}
            className={twMerge("h-6 px-2", !confirming && "text-ink-faint hover:bg-signal-wash hover:text-signal")}
        >
            <Trash2Icon />
            {confirming ? confirmLabel : label}
        </Button>
    );
}

type ListPanelProps = {
    label: React.ReactNode;
    summary?: React.ReactNode;
    action?: React.ReactNode;
    empty?: React.ReactNode;
    isEmpty?: boolean;
    toolbar?: React.ReactNode;
    children?: React.ReactNode;
};

function ListPanel({ label, summary, action, empty, isEmpty, toolbar, children }: ListPanelProps) {
    return (
        <div className="flex min-w-0 flex-col lg:col-span-3">
            <div className="border-rule-strong flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b pb-2">
                <span className="label">{label}</span>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                    {summary && <span className="text-ink-muted font-mono text-xs tabular-nums">{summary}</span>}
                    {action}
                </div>
            </div>
            {toolbar && (
                <div className="border-rule flex flex-wrap items-center justify-between gap-2 border-b py-2">
                    {toolbar}
                </div>
            )}
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center lg:h-list">
                    {empty}
                </div>
            ) : (
                <ul className="max-h-60 overflow-y-auto overscroll-contain lg:h-list lg:max-h-none">{children}</ul>
            )}
        </div>
    );
}

type ListRowProps = {
    title: React.ReactNode;
    meta?: React.ReactNode;
    leading?: React.ReactNode;
    htmlFor?: string;
    active?: boolean;
    muted?: boolean;
    disabled?: boolean;
    removeDisabled?: boolean;
    copyValue?: string;
    editLabel: string;
    removeLabel: string;
    onEdit: () => void;
    onRemove: () => void;
};

function ListRow({
    title,
    meta,
    leading,
    htmlFor,
    active,
    muted,
    disabled,
    removeDisabled,
    copyValue,
    editLabel,
    removeLabel,
    onEdit,
    onRemove,
}: ListRowProps) {
    const content = (
        <>
            <span className={twMerge("block truncate text-sm font-medium", muted && "line-through")}>{title}</span>
            {meta && <span className="text-ink-faint mt-1 block truncate font-mono text-xs tabular-nums">{meta}</span>}
        </>
    );

    return (
        <RowMenu
            title={title}
            copyValue={copyValue}
            onEdit={disabled ? undefined : onEdit}
            onRemove={disabled || removeDisabled ? undefined : onRemove}
        >
            <li
                className={twMerge(
                    "border-rule data-[state=open]:bg-surface flex items-center gap-3 border-b border-l-2 border-l-transparent py-3 pr-1 pl-2 transition-colors",
                    active && "bg-surface border-l-accent",
                )}
            >
                {leading}
                {htmlFor ? (
                    <label
                        htmlFor={htmlFor}
                        className={twMerge("min-w-0 flex-1 cursor-pointer", muted && "opacity-55")}
                    >
                        {content}
                    </label>
                ) : (
                    <div className={twMerge("min-w-0 flex-1", muted && "opacity-55")}>{content}</div>
                )}
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled}
                        onClick={onEdit}
                        className={twMerge("text-ink-faint hover:text-ink size-8 p-0", active && "text-accent")}
                        aria-label={editLabel}
                        title={editLabel}
                    >
                        <PencilIcon className="size-3.5" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={disabled || removeDisabled}
                        onClick={onRemove}
                        className="text-ink-faint hover:bg-signal-wash hover:text-signal size-8 p-0"
                        aria-label={removeLabel}
                        title={removeLabel}
                    >
                        <XIcon className="size-3.5" />
                    </Button>
                </div>
            </li>
        </RowMenu>
    );
}

type FormPanelProps = {
    label: React.ReactNode;
    children: React.ReactNode;
};

function FormPanel({ label, children }: FormPanelProps) {
    return (
        <div className="border-rule lg:bg-surface flex min-w-0 flex-col gap-4 border-t pt-5 lg:col-span-2 lg:self-start lg:border lg:p-5">
            <span className="label">{label}</span>
            {children}
        </div>
    );
}

export { ClearListButton, FormPanel, ListDialogBody, ListPanel, ListRow };
