"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark, Check, Copy, Laptop, Smartphone } from "lucide-react";
import { toast } from "react-toastify";

import { Button, buttonVariants } from "components/ui/button";
import { buildBookmarklet } from "lib/product-capture";
import { twMerge } from "lib/tw";

export const ShopButton = () => {
    const t = useTranslations("shopButton");
    const linkRef = useRef<HTMLAnchorElement>(null);
    const [code, setCode] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const bookmarklet = buildBookmarklet(window.location.origin);
        linkRef.current?.setAttribute("href", bookmarklet);
        setCode(bookmarklet);
        if (window.location.hash === "#shop-button") {
            linkRef.current?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, []);

    const copy = async () => {
        if (!code || !navigator.clipboard) return;
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success(t("copied"));
        setTimeout(() => setCopied(false), 2000);
    };

    const steps = (icon: React.ReactNode, title: string, items: string[]) => (
        <div className="min-w-0">
            <p className="label flex items-center gap-1.5">
                {icon}
                {title}
            </p>
            <ol className="text-ink-muted mt-2 grid list-decimal gap-1.5 pl-4 text-xs leading-relaxed">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ol>
        </div>
    );

    return (
        <section id="shop-button" className="panel min-w-0 scroll-mt-24 p-5">
            <div className="flex items-center gap-3 pb-4">
                <span className="bg-accent-wash text-accent flex size-10 shrink-0 items-center justify-center rounded-xl">
                    <Bookmark className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg leading-tight font-medium tracking-tight">{t("title")}</h2>
                    <p className="text-ink-faint mt-1 text-xs break-words">{t("subtitle")}</p>
                </div>
            </div>

            <div className="border-rule grid min-w-0 gap-5 border-t pt-4">
                <p className="text-ink-muted text-sm leading-relaxed">{t("body")}</p>

                <div className="flex flex-wrap items-center gap-2">
                    <a
                        ref={linkRef}
                        draggable
                        onClick={(event) => {
                            event.preventDefault();
                            toast.info(t("dragHint"));
                        }}
                        className={twMerge(buttonVariants({ variant: "accent" }), "cursor-grab active:cursor-grabbing")}
                    >
                        <Bookmark />
                        {t("bookmarkName")}
                    </a>
                    <Button type="button" variant="outline" onClick={copy} disabled={!code}>
                        {copied ? <Check /> : <Copy />}
                        {t("copy")}
                    </Button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                    {steps(<Laptop className="size-3.5" />, t("desktopTitle"), [
                        t("desktop1"),
                        t("desktop2"),
                        t("desktop3"),
                    ])}
                    {steps(<Smartphone className="size-3.5" />, t("phoneTitle"), [
                        t("phone1"),
                        t("phone2"),
                        t("phone3"),
                    ])}
                </div>
            </div>
        </section>
    );
};
