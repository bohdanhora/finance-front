"use client";

import { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

import { useCreateCard, useDeleteCard, useReorderCards, useUpdateCard } from "api/cards";
import { CardFace, useCardName } from "components/cards/card-face";
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
import { Checkbox } from "components/ui/checkbox";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { CARD_SKIN_ORDER } from "lib/card-skins";
import { balanceFromParts, creditLimitOf, isCreditCard } from "lib/cards";
import { getCurrencySymbol } from "lib/currency";
import { formatCurrency, formatSignedCurrency, handleDecimalInputChange } from "lib/utils";
import useStore from "store/general";
import { Card, CardSkin } from "types/transactions";

export const CardDialog = ({ card, trigger }: { card?: Card; trigger: ReactNode }) => {
    const t = useTranslations("cards");
    const cards = useStore((state) => state.cards);
    const setSelectedCardId = useStore((state) => state.setSelectedCardId);
    const symbol = getCurrencySymbol(useStore((state) => state.userCurrency));
    const cardName = useCardName();

    const createCard = useCreateCard();
    const updateCard = useUpdateCard();
    const reorderCards = useReorderCards();
    const deleteCard = useDeleteCard();

    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [skin, setSkin] = useState<CardSkin>(CardSkin.MONOBANK);
    const [balance, setBalance] = useState("");
    const [isCredit, setIsCredit] = useState(false);
    const [limit, setLimit] = useState("");
    const [debt, setDebt] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [moveTo, setMoveTo] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const editing = Boolean(card);
    const others = cards.filter((item) => item.id !== card?.id);
    const isPrimary = editing && cards[0]?.id === card?.id;
    const busy = createCard.isPending || updateCard.isPending || reorderCards.isPending || deleteCard.isPending;
    const previewName = name.trim() || cardName({ name: "", skin });
    const creditLimit = isCredit ? Number(limit) || 0 : 0;
    const startDebt = isCredit ? Number(debt) || 0 : 0;
    const startBalance = balanceFromParts(Number(balance) || 0, startDebt);

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setName(card?.name ?? "");
            setSkin(card?.skin ?? CardSkin.MONOBANK);
            setBalance("");
            setDebt("");
            setIsCredit(card ? isCreditCard(card) : false);
            setLimit(card && isCreditCard(card) ? String(creditLimitOf(card)) : "");
            setError(null);
            setMoveTo(others[0]?.id ?? "");
            setConfirmDelete(false);
        }
        setOpen(next);
    };

    const save = async () => {
        if (!card && startDebt > creditLimit) {
            setError(t("debtOverLimit", { amount: `${formatCurrency(creditLimit)} ${symbol}` }));
            return;
        }
        if (card && card.balance < -creditLimit) {
            setError(t("limitBelowDebt", { amount: `${formatCurrency(-card.balance)} ${symbol}` }));
            return;
        }
        setError(null);
        try {
            if (card) {
                await updateCard.mutateAsync({ id: card.id, name: name.trim(), skin, creditLimit });
                toast.success(t("savedToast"));
            } else {
                const response = await createCard.mutateAsync({
                    name: name.trim(),
                    skin,
                    balance: startBalance,
                    creditLimit,
                });
                setSelectedCardId(response.card.id);
                toast.success(t("addedToast"));
            }
            setOpen(false);
        } catch {}
    };

    const makePrimary = async () => {
        if (!card) return;
        try {
            await reorderCards.mutateAsync([card.id, ...others.map((item) => item.id)]);
            toast.success(t("primaryToast"));
        } catch {}
    };

    const remove = async () => {
        if (!card || !moveTo) return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        try {
            await deleteCard.mutateAsync({ id: card.id, moveTo });
            setSelectedCardId(moveTo);
            toast.success(t("deletedToast"));
            setOpen(false);
        } catch {}
    };

    const target = others.find((item) => item.id === moveTo);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
                <form
                    className="flex flex-col gap-5"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>{editing ? t("editTitle") : t("addTitle")}</DialogTitle>
                        <DialogDescription>{editing ? t("editSubtitle") : t("addSubtitle")}</DialogDescription>
                    </DialogHeader>

                    <div className="mx-auto w-full max-w-64">
                        <CardFace
                            skin={skin}
                            name={previewName}
                            balance={card ? card.balance : startBalance}
                            creditLimit={creditLimit}
                            symbol={symbol}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>{t("skin")}</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {CARD_SKIN_ORDER.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    aria-pressed={skin === option}
                                    aria-label={cardName({ name: "", skin: option })}
                                    onClick={() => setSkin(option)}
                                    className={twMerge(
                                        "cursor-pointer rounded-xl p-0.5 ring-2 ring-transparent transition-shadow outline-none focus-visible:ring-indigo-400",
                                        skin === option && "ring-indigo-500",
                                    )}
                                >
                                    <CardFace
                                        skin={option}
                                        name={cardName({ name: "", skin: option })}
                                        showBalance={false}
                                        compact
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="card-name">{t("name")}</Label>
                        <Input
                            id="card-name"
                            maxLength={40}
                            placeholder={cardName({ name: "", skin })}
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                        />
                    </div>

                    <div className="border-border/70 flex flex-col gap-3 rounded-xl border p-3">
                        <label className="flex cursor-pointer items-start gap-3">
                            <Checkbox
                                checked={isCredit}
                                onCheckedChange={(checked) => {
                                    setIsCredit(checked === true);
                                    setError(null);
                                }}
                                className="mt-0.5"
                            />
                            <span className="space-y-1">
                                <span className="block text-sm font-medium">{t("creditCard")}</span>
                                <span className="text-muted-foreground block text-xs">{t("creditCardHint")}</span>
                            </span>
                        </label>
                        {isCredit && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="card-limit">{t("creditLimit")}</Label>
                                <Input
                                    id="card-limit"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={limit}
                                    onChange={handleDecimalInputChange((value) => {
                                        setLimit(value);
                                        setError(null);
                                    })}
                                />
                            </div>
                        )}
                        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
                    </div>

                    {!editing && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="card-balance">{isCredit ? t("ownOnCard") : t("startBalance")}</Label>
                            <Input
                                id="card-balance"
                                inputMode="decimal"
                                placeholder="0"
                                value={balance}
                                onChange={handleDecimalInputChange(setBalance)}
                            />
                            <p className="text-muted-foreground text-xs">
                                {isCredit ? t("ownOnCardHint") : t("startBalanceHint")}
                            </p>
                            {isCredit && (
                                <>
                                    <Label htmlFor="card-debt" className="mt-2">
                                        {t("debtOnCard")}
                                    </Label>
                                    <Input
                                        id="card-debt"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={debt}
                                        onChange={handleDecimalInputChange((value) => {
                                            setDebt(value);
                                            setError(null);
                                        })}
                                    />
                                    <p className="text-muted-foreground text-xs">{t("debtOnCardHint")}</p>
                                </>
                            )}
                        </div>
                    )}

                    {editing && others.length > 0 && (
                        <div className="border-border/70 flex flex-col gap-3 rounded-xl border p-3">
                            {!isPrimary && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={busy}
                                    onClick={() => void makePrimary()}
                                >
                                    <Star />
                                    {t("makePrimary")}
                                </Button>
                            )}
                            <CardSelect
                                id="card-move-to"
                                label={t("moveTo")}
                                value={moveTo}
                                exclude={card?.id}
                                onChange={(value) => {
                                    setMoveTo(value);
                                    setConfirmDelete(false);
                                }}
                            />
                            {confirmDelete && target && card && (
                                <p className="text-sm text-rose-600 dark:text-rose-400">
                                    {t("deleteConfirm", {
                                        amount: `${formatSignedCurrency(card.balance)} ${symbol}`,
                                        card: cardName(target),
                                    })}
                                </p>
                            )}
                            <Button
                                type="button"
                                variant="destructive"
                                disabled={busy || !moveTo}
                                onClick={() => void remove()}
                            >
                                <Trash2 />
                                {confirmDelete ? t("deleteConfirmButton") : t("delete")}
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t("cancel")}
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={busy}>
                            {(createCard.isPending || updateCard.isPending) && <Loader2 className="animate-spin" />}
                            {editing ? t("save") : t("add")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};
