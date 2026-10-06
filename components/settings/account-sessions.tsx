"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { History, Loader2, LogOut, Monitor, MonitorSmartphone, Smartphone, Tablet, X } from "lucide-react";
import { toast } from "react-toastify";
import { twMerge } from "lib/tw";

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
        <li className="border-rule flex items-start gap-3 border-b py-3">
            <span
                className={twMerge(
                    "border-rule mt-0.5 flex size-9 shrink-0 items-center justify-center border",
                    session.current ? "border-accent text-accent" : "text-ink-faint",
                )}
            >
                <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                    <span className="break-words">
                        {session.browser} · {session.os}
                    </span>
                    {session.current && (
                        <span className="label text-accent flex items-center gap-1.5">
                            <span className="tick" />
                            {t("thisDevice")}
                        </span>
                    )}
                </p>
                <p className="text-ink-faint mt-1 font-mono text-3xs uppercase">
                    {[session.ip && `IP ${session.ip}`, t(`method.${session.method}`), activity]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                <p className="text-ink-faint mt-0.5 font-mono text-3xs uppercase">
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
                <span className="border-rule-strong flex size-11 shrink-0 items-center justify-center border">
                    <MonitorSmartphone className="size-4" />
                </span>
            }
            title={t("title")}
            status={isLoading ? t("loading") : isError ? t("loadFailed") : t("activeCount", { count: active.length })}
            connected={false}
            connectedLabel=""
            note={t("note")}
        >
            {isLoading ? (
                <div className="text-ink-faint flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : isError ? (
                <p className="text-sm text-signal">{t("loadFailed")}</p>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-3">
                        <p className="label text-ink">{t("activeTitle")}</p>
                        <ul className="border-rule-strong flex flex-col border-t">
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
                            <p className="label text-ink flex items-center gap-1.5">
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
                                    className="text-ink-faint h-7"
                                >
                                    {t("clearHistory")}
                                </Button>
                            )}
                        </div>
                        {recent.length === 0 ? (
                            <p className="text-ink-faint text-sm">{t("recentEmpty")}</p>
                        ) : (
                            <ul className="border-rule-strong flex flex-col border-t">
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
                                                className="text-ink-faint hover:text-ink size-8 shrink-0"
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
