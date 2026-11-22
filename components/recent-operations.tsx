"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { Routes } from "constants/routes";
import { ChecklistShell } from "./essentials-checklist";
import { LastSpends } from "./last-spends";

const RECENT_COUNT = 8;

export const RecentOperations = () => {
    const t = useTranslations("transactions");

    return (
        <div data-tour="history">
            <ChecklistShell
                title={t("recent")}
                actions={
                    <Link
                        href={Routes.OPERATIONS}
                        className="text-ink-muted hover:text-accent inline-flex items-center gap-1 text-xs transition-colors"
                    >
                        {t("allOperations")}
                        <ArrowRight className="size-3.5" />
                    </Link>
                }
            >
                <LastSpends limit={RECENT_COUNT} />
            </ChecklistShell>
        </div>
    );
};
