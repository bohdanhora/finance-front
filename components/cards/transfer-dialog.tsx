"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useCardTransfer } from "api/cards";
import { useCardName } from "components/cards/card-face";
import { CardSelect } from "components/cards/card-select";
import { Button } from "components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { availableOnCard, defaultCardId, findCardById, isCreditCard } from "lib/cards";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency, handleDecimalInputChange } from "lib/utils";
import useStore from "store/general";

export const TransferDialog = () => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const selectedCardId = useStore((state) => state.selectedCardId);
    const symbol = getCurrencySymbol(useStore((state) => state.userCurrency));
    const cardName = useCardName();
    const transfer = useCardTransfer();

    const [open, setOpen] = useState(false);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (cards.length < 2) return null;

    const source = findCardById(cards, from);
    const destination = findCardById(cards, to);

    const handleOpenChange = (next: boolean) => {
        if (next) {
            const start = defaultCardId(selectedCardId, cards);
            setFrom(start);
            setTo(cards.find((card) => card.id !== start)?.id ?? "");
            setAmount("");
            setDescription("");
            setError(null);
        }
        setOpen(next);
    };

    const changeFrom = (value: string) => {
        setFrom(value);
        if (value === to) setTo(cards.find((card) => card.id !== value)?.id ?? "");
        setError(null);
    };

    const submit = async () => {
        const value = Number(amount);
        if (!source || !destination) return;
        if (!value || value <= 0) {
            setError(t("amountRequired"));
            return;
        }
        if (value > availableOnCard(source)) {
            const available = `${formatCurrency(availableOnCard(source))} ${symbol}`;
            setError(
                isCreditCard(source)
                    ? t("notEnoughCredit", { amount: available })
                    : t("notEnough", { amount: available }),
            );
            return;
        }

        try {
            await transfer.mutateAsync({
                fromCardId: source.id,
                toCardId: destination.id,
                amount: value,
                description: description.trim() || undefined,
            });
            toast.success(
                t("transferToast", {
                    amount: `${formatCurrency(value)} ${symbol}`,
                    from: cardName(source),
                    to: cardName(destination),
                }),
            );
            setOpen(false);
        } catch {}
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="secondary">
                    <ArrowLeftRight />
                    {t("transfer")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form
                    className="flex flex-col gap-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{t("transferTitle")}</DialogTitle>
                        <DialogDescription>{t("transferSubtitle")}</DialogDescription>
                    </DialogHeader>

                    <CardSelect id="transfer-from" label={t("from")} value={from} onChange={changeFrom} />
                    <CardSelect
                        id="transfer-to"
                        label={t("to")}
                        value={to}
                        exclude={from}
                        onChange={(value) => {
                            setTo(value);
                            setError(null);
                        }}
                    />

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="transfer-amount">{t("amount")}</Label>
                        <Input
                            id="transfer-amount"
                            inputMode="decimal"
                            placeholder={t("amount")}
                            value={amount}
                            onChange={handleDecimalInputChange((value) => {
                                setAmount(value);
                                setError(null);
                            })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="transfer-note">{t("note")}</Label>
                        <Input
                            id="transfer-note"
                            maxLength={200}
                            placeholder={t("notePlaceholder")}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t("cancel")}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={transfer.isPending}>
                            {transfer.isPending && <Loader2 className="animate-spin" />}
                            {t("transferSubmit")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
