"use client";

export const Loader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin" />
        </div>
    );
};
