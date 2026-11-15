"use client";

import { BrandMark } from "./brand";

export const Loader = () => {
    return (
        <div className="bg-paper fixed inset-0 z-50 flex items-center justify-center">
            <span role="status" aria-label="Finance" className="flex items-center gap-3">
                <BrandMark className="animate-pulse" />
                <span className="text-base font-medium tracking-tight">Finance</span>
            </span>
        </div>
    );
};
