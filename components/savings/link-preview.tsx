"use client";

import { Check, ImageOff, Loader2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";

import { getUrlHost } from "lib/savings";
import { twMerge } from "lib/tw";
import { Button } from "components/ui/button";

type Props = {
    url: string;
    title?: string;
    image?: string;
    loading: boolean;
    selectable: boolean;
    selected: boolean;
    onSelect: () => void;
    onBroken: (image: string) => void;
    price?: string;
    onUsePrice?: () => void;
};

export const SavingsLinkPreview = ({
    url,
    title,
    image,
    loading,
    selectable,
    selected,
    onSelect,
    onBroken,
    price,
    onUsePrice,
}: Props) => {
    const t = useTranslations("savings");
    const pickable = selectable && Boolean(image);

    const content = (
        <>
            <div className="bg-surface flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                {loading ? (
                    <Loader2 className="text-ink-faint size-4 animate-spin" />
                ) : image ? (
                    <img
                        src={image}
                        alt=""
                        referrerPolicy="no-referrer"
                        onError={() => onBroken(image)}
                        className="size-full object-contain p-1"
                    />
                ) : (
                    <ImageOff className="text-ink-faint size-4" />
                )}
            </div>
            <div className="min-w-0 flex-1 text-xs">
                <p className="line-clamp-2 font-medium break-words">
                    {loading ? t("previewLoading") : (title ?? getUrlHost(url))}
                </p>
                {(loading || title) && <p className="text-ink-faint mt-0.5 truncate">{getUrlHost(url)}</p>}
                {price && <p className="mt-0.5 font-medium tabular-nums">{t("priceOnSite", { amount: price })}</p>}
            </div>
            {pickable && (
                <span
                    className={twMerge(
                        "flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-2xs font-medium",
                        selected ? "bg-accent text-surface" : "text-ink-faint border-rule border",
                    )}
                >
                    {selected && <Check className="size-3" />}
                    {selected ? t("coverSelected") : t("coverPick")}
                </span>
            )}
        </>
    );

    const base = "bg-wash flex w-full items-center gap-3 rounded-xl p-2 text-left";

    const usePrice = onUsePrice && (
        <Button type="button" variant="ghost" size="sm" onClick={onUsePrice} className="mt-1">
            <Tag />
            {t("useSitePrice")}
        </Button>
    );

    if (!pickable) {
        return (
            <div>
                <div className={base}>{content}</div>
                {usePrice}
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                aria-pressed={selected}
                onClick={onSelect}
                className={twMerge(
                    base,
                    "ring-2 transition-colors",
                    selected ? "ring-accent" : "hover:ring-rule ring-transparent",
                )}
            >
                {content}
            </button>
            {usePrice}
        </div>
    );
};
