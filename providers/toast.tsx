"use client";

import { useTheme } from "next-themes";
import { ToastContainer } from "react-toastify";

export const ToastProvider = () => {
    const { resolvedTheme } = useTheme();

    return (
        <ToastContainer
            position='bottom-right'
            autoClose={2400}
            limit={2}
            newestOnTop
            hideProgressBar
            closeButton={false}
            closeOnClick
            pauseOnFocusLoss={false}
            pauseOnHover={false}
            theme={resolvedTheme}
            toastClassName='finance-toast'
        />
    );
};
