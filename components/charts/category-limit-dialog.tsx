"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

type Props = {
    category: string | null;
    label: string;
    current?: number;
    currencySymbol: string;
    onClose: () => void;
    onSave: (category: string, limit: number | null) => void;
};

export const CategoryLimitDialog = ({ category, label, current, currencySymbol, onClose, onSave }: Props) => {
    const t = useTranslations("statistics");
    const [value, setValue] = useState("");

    useEffect(() => {
        setValue(current ? String(current) : "");
    }, [category, current]);

    const amount = Number(value.replace(",", "."));
    const valid = value.trim() !== "" && Number.isFinite(amount) && amount > 0;

    const submit = (limit: number | null) => {
        if (!category) return;
        onSave(category, limit);
        onClose();
    };

    return (
        <Dialog open={!!category} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("limitTitle", { category: label })}</DialogTitle>
                    <DialogDescription>{t("limitDescription")}</DialogDescription>
                </DialogHeader>
                <form
                    className="grid gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (valid) submit(amount);
                    }}
                >
                    <Label htmlFor="category-limit">{t("limitAmount", { symbol: currencySymbol })}</Label>
                    <Input
                        id="category-limit"
                        inputMode="decimal"
                        autoFocus
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder="3000"
                    />
                    <DialogFooter className="mt-3">
                        {current ? (
                            <Button type="button" variant="ghost" onClick={() => submit(null)}>
                                {t("removeLimit")}
                            </Button>
                        ) : null}
                        <Button type="submit" disabled={!valid}>
                            {t("saveLimit")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
