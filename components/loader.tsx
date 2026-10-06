"use client";

export const Loader = () => {
    return (
        <div className="bg-paper fixed inset-0 z-50 flex items-center justify-center">
            <span className="label text-ink flex items-center" role="status" aria-label="Finance">
                Finance
                <span className="caret caret-blink" aria-hidden="true" />
            </span>
        </div>
    );
};
