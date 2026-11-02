"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { CopyIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "ui/context-menu";

export type RowMenuAction = {
    key: string;
    label: string;
    icon?: React.ReactNode;
    onSelect: () => void;
    disabled?: boolean;
};

type RowMenuProps = {
    title?: React.ReactNode;
    actions?: RowMenuAction[];
    onEdit?: () => void;
    onRemove?: () => void;
    copyValue?: string;
    disabled?: boolean;
    children: React.ReactElement;
};

export const copyText = async (value: string, successMessage: string) => {
    try {
        await navigator.clipboard.writeText(value);
        toast.success(successMessage);
    } catch {}
};

export const RowMenu = ({ title, actions = [], onEdit, onRemove, copyValue, disabled, children }: RowMenuProps) => {
    const t = useTranslations("rowMenu");

    if (disabled) return children;

    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent>
                {title && <ContextMenuLabel>{title}</ContextMenuLabel>}
                {actions.map((action) => (
                    <ContextMenuItem key={action.key} disabled={action.disabled} onSelect={action.onSelect}>
                        {action.icon}
                        {action.label}
                    </ContextMenuItem>
                ))}
                {onEdit && (
                    <ContextMenuItem onSelect={onEdit}>
                        <PencilIcon />
                        {t("edit")}
                    </ContextMenuItem>
                )}
                {copyValue !== undefined && (
                    <ContextMenuItem onSelect={() => copyText(copyValue, t("copied"))}>
                        <CopyIcon />
                        {t("copyAmount")}
                    </ContextMenuItem>
                )}
                {onRemove && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem variant="destructive" onSelect={onRemove}>
                            <Trash2Icon />
                            {t("remove")}
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
};
