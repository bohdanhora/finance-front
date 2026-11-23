"use client";

import { Check, ImageOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { getUrlHost } from "lib/savings";
import { twMerge } from "lib/tw";

type Props = {
    url: string;
    title?: string;
    image?: string;
    loading: boolean;
    selectable: boolean;
    selected: boolean;
    onSelect: () => void;
    onBroken: (image: string) => void;
};

export const SavingsLinkPreview = ({ url, title, image, loading, selectable, selected, onSelect, onBroken }: Props) => {
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

    if (!pickable) return <div className={base}>{content}</div>;

    return (
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
    );
};
