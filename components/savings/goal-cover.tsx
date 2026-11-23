"use client";

import { ReactNode, useState } from "react";

import { useSavingsGoalPrices } from "api/main";
import { twMerge } from "lib/tw";

type Props = {
    links: string[];
    image?: string;
    alt: string;
    className?: string;
    fallback?: ReactNode;
};

export const SavingsGoalCover = ({ links, image: chosen, alt, className, fallback = null }: Props) => {
    const queries = useSavingsGoalPrices(links);
    const [broken, setBroken] = useState<string[]>([]);

    const fetched = queries.map(({ data }) => data?.image);
    const image = [chosen, ...fetched].find(
        (value): value is string => Boolean(value) && !broken.includes(value as string),
    );
    const loading = !image && queries.some(({ isFetching, data }) => isFetching && !data);

    if (!image && !loading) return fallback;

    return (
        <div className={twMerge("bg-wash relative overflow-hidden", className)}>
            {image ? (
                <>
                    <img
                        src={image}
                        alt=""
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 size-full scale-125 object-cover opacity-40 blur-2xl"
                    />
                    <div className="relative flex size-full items-center justify-center p-4">
                        <img
                            key={image}
                            src={image}
                            alt={alt}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={() => setBroken((current) => [...current, image])}
                            className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                        />
                    </div>
                </>
            ) : (
                <div className="size-full animate-pulse" />
            )}
        </div>
    );
};
