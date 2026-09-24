"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { History, Loader2, LogOut, Monitor, MonitorSmartphone, Smartphone, Tablet, X } from "lucide-react";
import { toast } from "react-toastify";
import { twMerge } from "tailwind-merge";

import { useClearSessionHistory, useEndOtherSessions, useRemoveSession, useSessions } from "api/account";
import { ConnectionCard } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { refreshAccessToken } from "config/axios.instances";
import { Routes } from "constants/routes";
import { formatDateTime, formatRelativeTime } from "lib/date-locale";
import { clearCookies } from "lib/logout";
import useStore from "store/general";
import { AccountSession, SessionDeviceType } from "types/auth";

const DEVICE_ICONS: Record<SessionDeviceType, typeof Monitor> = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
};

const SessionRow = ({ session, action }: { session: AccountSession; action: React.ReactNode }) => {
    const t = useTranslations("sessions");
    const locale = useLocale();
    const Icon = DEVICE_ICONS[session.deviceType] ?? Monitor;

    const activity = session.active
        ? session.current
            ? t("onlineNow")
            : t("lastActive", { time: formatRelativeTime(session.lastActiveAt, locale) })
        : t(`ended.${session.endReason ?? "expired"}`, {
              time: formatDateTime(session.endedAt ?? session.expiresAt, locale),
          });

    return (
        <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
                className={twMerge(
                    "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl",
                    session.current
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground",
                )}
            >
                <Icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                    <span className="truncate">
                        {session.browser} · {session.os}
                    </span>
                    {session.current && (
                        <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
                            {t("thisDevice")}
                        </span>
                    )}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                    {[session.ip && `IP ${session.ip}`, t(`method.${session.method}`), activity]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                <p className="text-muted-foreground/80 mt-0.5 text-xs">
                    {t("signedIn", { time: formatDateTime(session.createdAt, locale) })}
                </p>
            </div>
            {action}
        </li>
    );
};

export const AccountSessions = () => {
    const t = useTranslations("sessions");
    const router = useRouter();
    const queryClient = useQueryClient();
    const setAllToDefaults = useStore((state) => state.setAllToDefaults);

    const { data, isLoading, isError, refetch } = useSessions();
    const removeSession = useRemoveSession();
    const endOthers = useEndOtherSessions();
    const clearHistory = useClearSessionHistory();

    const [confirmId, setConfirmId] = useState<string | null>(null);
    const upgradeTried = useRef(false);

    useEffect(() => {
        if (!data || upgradeTried.current || data.active.some((session) => session.current)) return;
        upgradeTried.current = true;
        refreshAccessToken()
            .then(() => refetch())
            .catch(() => undefined);
    }, [data, refetch]);

    const active = data?.active ?? [];
    const recent = data?.recent ?? [];
    const others = active.filter((session) => !session.current);
    const busy = removeSession.isPending || endOthers.isPending || clearHistory.isPending;

    const leave = () => {
        clearCookies();
        queryClient.clear();
        setAllToDefaults();
        router.replace(Routes.LOGIN);
    };

    const end = async (session: AccountSession) => {
        if (confirmId !== session.id) {
            setConfirmId(session.id);
            return;
        }
        setConfirmId(null);
        try {
            const response = await removeSession.mutateAsync(session.id);
            if (response.current) {
                leave();
                return;
            }
            toast.success(session.active ? t("endedToast") : t("removedToast"));
        } catch {
            toast.error(t("requestFailed"));
        }
    };

    const endAllOthers = async () => {
        if (confirmId !== "others") {
            setConfirmId("others");
            return;
        }
        setConfirmId(null);
        try {
            const response = await endOthers.mutateAsync();
            toast.success(t("endedOthersToast", { count: response.ended }));
        } catch {
            toast.error(t("requestFailed"));
        }
    };

    const clear = async () => {
        try {
            await clearHistory.mutateAsync();
            toast.success(t("historyClearedToast"));
        } catch {
            toast.error(t("requestFailed"));
        }
    };

    const endButton = (session: AccountSession) => {
        const confirming = confirmId === session.id;
        return (
            <Button
                type="button"
                size="sm"
                variant={confirming ? "destructive" : "secondary"}
                disabled={busy}
                onClick={() => void end(session)}
                className="shrink-0"
            >
                {session.current && <LogOut />}
                {confirming ? t("confirm") : session.current ? t("signOut") : t("end")}
            </Button>
        );
    };

    return (
        <ConnectionCard
            mark={
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-700 text-white shadow-sm">
                    <MonitorSmartphone className="size-5" />
                </span>
            }
            title={t("title")}
            status={isLoading ? t("loading") : isError ? t("loadFailed") : t("activeCount", { count: active.length })}
            connected={false}
            connectedLabel=""
            note={t("note")}
        >
            {isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : isError ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadFailed")}</p>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-[0.7rem] font-semibold tracking-wide uppercase">
                            {t("activeTitle")}
                        </p>
                        <ul className="divide-border/70 flex flex-col divide-y">
                            {active.map((session) => (
                                <SessionRow key={session.id} session={session} action={endButton(session)} />
                            ))}
                        </ul>
                        {others.length > 0 && (
                            <Button
                                type="button"
                                variant={confirmId === "others" ? "destructive" : "outline"}
                                disabled={busy}
                                onClick={() => void endAllOthers()}
                                className="sm:self-start"
                            >
                                {endOthers.isPending && <Loader2 className="animate-spin" />}
                                {confirmId === "others"
                                    ? t("endOthersConfirm", { count: others.length })
                                    : t("endOthers", { count: others.length })}
                            </Button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-muted-foreground flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wide uppercase">
                                <History className="size-3.5" />
                                {t("recentTitle")}
                            </p>
                            {recent.length > 0 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={busy}
                                    onClick={() => void clear()}
                                    className="text-muted-foreground h-7"
                                >
                                    {t("clearHistory")}
                                </Button>
                            )}
                        </div>
                        {recent.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t("recentEmpty")}</p>
                        ) : (
                            <ul className="divide-border/70 flex flex-col divide-y">
                                {recent.map((session) => (
                                    <SessionRow
                                        key={session.id}
                                        session={session}
                                        action={
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                aria-label={t("remove")}
                                                disabled={busy}
                                                onClick={() =>
                                                    void removeSession
                                                        .mutateAsync(session.id)
                                                        .catch(() => toast.error(t("requestFailed")))
                                                }
                                                className="text-muted-foreground hover:text-foreground size-8 shrink-0"
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        }
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </ConnectionCard>
    );
};
