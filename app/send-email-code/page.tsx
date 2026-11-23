"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Routes } from "constants/routes";

const SendEmailCodePage = () => {
    const router = useRouter();

    useEffect(() => {
        router.replace(Routes.REGISTRATION);
    }, [router]);

    return null;
};

export default SendEmailCodePage;
