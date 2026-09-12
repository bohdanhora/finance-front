"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, ExternalLink, Eye, EyeOff, Link2Off, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { fetchClientInfo, isRateLimited, isTokenRejected, monobankClientInfoKey } from "api/monobank";
import { MonoMark } from "components/monobank/mono-mark";
import { ConnectionCard, KeyField } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Routes } from "constants/routes";
import { useMonobankToken } from "hooks/use-monobank-token";
import {
    clearMonobankToken,
    type MonobankProfileSnapshot,
    readMonobankProfile,
    saveMonobankProfile,
    saveMonobankToken,
} from "lib/monobank";
import { MonobankClientInfo } from "types/monobank";

const MONOBANK_TOKEN_PAGE = "https://api.monobank.ua/";

const snapshotOf = (info: MonobankClientInfo): MonobankProfileSnapshot => ({
    name: info.name || "",
    accounts: info.accounts?.length || 0,
    jars: info.jars?.length || 0,
});

export const MonobankConnection = ({ opened, onNavigate }: { opened: boolean; onNavigate: () => void }) => {
    const t = useTranslations("monobank");
    const queryClient = useQueryClient();
    const { token, connected } = useMonobankToken();

    const [value, setValue] = useState("");
    const [visible, setVisible] = useState(false);
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<MonobankProfileSnapshot | null>(null);

    useEffect(() => {
        if (!opened) return;

        setValue("");
        setVisible(false);
        setError(null);
        const cached = queryClient.getQueryData<MonobankClientInfo>(monobankClientInfoKey(token));
        setProfile(cached ? snapshotOf(cached) : readMonobankProfile());
    }, [opened, queryClient, token]);

    const connect = async () => {
        const candidate = value.trim();

        if (!candidate) {
            setError(t("emptyToken"));
            return;
        }

        setChecking(true);
        setError(null);

        try {
            const fetched = await fetchClientInfo(candidate);
            const snapshot = snapshotOf(fetched);

            queryClient.setQueryData(monobankClientInfoKey(candidate), fetched);
            saveMonobankToken(candidate);
            saveMonobankProfile(snapshot);
            setProfile(snapshot);
            setValue("");
            toast.success(t("connectedToast"));
        } catch (requestError) {
            if (isTokenRejected(requestError)) {
                setError(t("invalidToken"));
            } else if (isRateLimited(requestError)) {
                setError(t("rateLimited"));
            } else {
                setError(t("requestFailed"));
            }
        } finally {
            setChecking(false);
        }
    };

    const disconnect = () => {
        queryClient.removeQueries({ queryKey: ["monobank"] });
        clearMonobankToken();
        setProfile(null);
        setError(null);
        toast.success(t("disconnectedToast"));
    };

    const counter = (label: string, count: number) => (
        <div className="bg-muted/50 ring-border/60 min-w-0 rounded-xl px-3 py-2 ring-1">
            <p className="text-muted-foreground text-[0.62rem] font-semibold tracking-[0.08em] uppercase">{label}</p>
            <p className="text-sm font-semibold tabular-nums">{count}</p>
        </div>
    );

    return (
        <ConnectionCard
            mark={<MonoMark />}
            title={t("bankName")}
            status={
                connected ? (profile?.name ? t("connectedAs", { name: profile.name }) : t("connected")) : t("notLinked")
            }
            connected={connected}
            connectedLabel={t("connected")}
            note={t("storedLocally")}
        >
            {connected ? (
                <div className="flex flex-col gap-3">
                    {profile && (
                        <div className="grid grid-cols-2 gap-2">
                            {counter(t("accounts"), profile.accounts)}
                            {counter(t("jars"), profile.jars)}
                        </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button asChild className="sm:flex-1" onClick={onNavigate}>
                            <Link href={Routes.MONOBANK}>
                                {t("openTab")}
                                <ArrowRight />
                            </Link>
                        </Button>
                        <Button variant="secondary" onClick={disconnect}>
                            <Link2Off />
                            {t("disconnect")}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-2.5">
                    <Label htmlFor="monobank-token" className="text-xs font-semibold">
                        {t("tokenLabel")}
                    </Label>
                    <KeyField>
                        <div className="relative flex-1">
                            <Input
                                id="monobank-token"
                                name="monobank-token"
                                type={visible ? "text" : "password"}
                                autoComplete="new-password"
                                data-1p-ignore
                                data-lpignore="true"
                                spellCheck={false}
                                className="pr-10"
                                placeholder={t("tokenPlaceholder")}
                                value={value}
                                disabled={checking}
                                onChange={(event) => setValue(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") void connect();
                                }}
                            />
                            <button
                                type="button"
                                aria-label={visible ? t("hideToken") : t("showToken")}
                                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                                onClick={() => setVisible((current) => !current)}
                            >
                                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <Button disabled={checking} onClick={() => void connect()}>
                            {checking && <Loader2 className="animate-spin" />}
                            {checking ? t("checking") : t("connect")}
                        </Button>
                    </KeyField>

                    {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                    <a
                        href={MONOBANK_TOKEN_PAGE}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-fit items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                        {t("getToken")}
                        <ExternalLink className="size-3.5" />
                    </a>
                </div>
            )}
        </ConnectionCard>
    );
};
