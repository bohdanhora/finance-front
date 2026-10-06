"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dayjs from "dayjs";
import { AlertTriangle, Eye, Landmark, Loader2, RefreshCw, Settings2, Wallet } from "lucide-react";
import { twMerge } from "lib/tw";
import Link from "next/link";

import { isRateLimited, isTokenRejected, useMonobankClientInfo, useMonobankStatement } from "api/monobank";
import { CategoryBreakdown } from "components/monobank/category-breakdown";
import { Hint } from "components/hint";
import { MonoMark } from "components/monobank/mono-mark";
import { StatementList } from "components/monobank/statement-list";
import { Navbar } from "components/navbar";
import { StatCard } from "components/stat-card";
import { Button } from "components/ui/button";
import { ViewSwitcher } from "components/charts/view-switcher";
import { Section, StatGrid } from "components/wrappers/section";
import { PageHeader, PageShell } from "components/wrappers/page-header";
import { Routes } from "constants/routes";
import { useMonobankHistory } from "hooks/use-monobank-history";
import { useMonobankToken } from "hooks/use-monobank-token";
import {
    accountLabel,
    currencySymbolByCode,
    currencyNameByCode,
    fromMinorUnits,
    jarProgress,
    MONOBANK_COOLDOWN_MS,
    MONOBANK_MAX_STATEMENT_DAYS,
    saveMonobankProfile,
    statementRange,
    summarizeStatement,
} from "lib/monobank";
import { formatCurrency } from "lib/utils";
import { PrivateProvider } from "providers/auth";
import { GetDataProvider } from "providers/get-data";
import { MonobankAccount } from "types/monobank";

type Period = "7" | "31" | "all";

const historyDate = (value: number) => dayjs.unix(value).format("DD.MM.YYYY");

const sortAccounts = (accounts: MonobankAccount[]) =>
    [...accounts].sort((a, b) => {
        if (a.currencyCode !== b.currencyCode) {
            if (a.currencyCode === 980) return -1;
            if (b.currencyCode === 980) return 1;
        }
        return b.balance - a.balance;
    });

const MonobankPage = () => {
    const t = useTranslations("monobank");
    const queryClient = useQueryClient();
    const { token, ready, connected } = useMonobankToken();

    const [period, setPeriod] = useState<Period>("31");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [requestedAt, setRequestedAt] = useState(() => Date.now());
    const [now, setNow] = useState(() => Date.now());

    const clientInfo = useMonobankClientInfo(token);
    const accounts = useMemo(() => sortAccounts(clientInfo.data?.accounts || []), [clientInfo.data]);
    const jars = clientInfo.data?.jars || [];

    const account = accounts.find((item) => item.id === selectedId) || accounts[0] || null;
    const allTime = period === "all";
    const range = useMemo(
        () => statementRange(allTime ? MONOBANK_MAX_STATEMENT_DAYS : Number(period), new Date(requestedAt)),
        [allTime, period, requestedAt],
    );
    const statement = useMonobankStatement(token, allTime ? null : account?.id || null, range.from, range.to);
    const history = useMonobankHistory(token, account?.id || null, allTime);

    const items = useMemo(
        () => (allTime ? history.items : statement.data || []),
        [allTime, history.items, statement.data],
    );
    const oldestItem = history.items[history.items.length - 1];
    const summary = useMemo(() => summarizeStatement(items), [items]);

    const lastFetched = Math.max(clientInfo.dataUpdatedAt || 0, statement.dataUpdatedAt || 0);
    const cooldownLeft = Math.max(0, Math.ceil((lastFetched + MONOBANK_COOLDOWN_MS - now) / 1000));

    useEffect(() => {
        if (cooldownLeft <= 0) return;

        const timer = setTimeout(() => setNow(Date.now()), 1000);
        return () => clearTimeout(timer);
    }, [cooldownLeft, now]);

    useEffect(() => {
        if (!clientInfo.data) return;

        saveMonobankProfile({
            name: clientInfo.data.name || "",
            accounts: clientInfo.data.accounts?.length || 0,
            jars: clientInfo.data.jars?.length || 0,
        });
    }, [clientInfo.data]);

    const refresh = () => {
        setNow(Date.now());
        setRequestedAt(Date.now());
        void queryClient.invalidateQueries({ queryKey: ["monobank"] });
    };

    const error = clientInfo.error || (allTime ? history.error : statement.error);
    const loading = clientInfo.isFetching || (!allTime && statement.isFetching);
    const symbol = account ? currencySymbolByCode(account.currencyCode) : "";
    const money = (value: number) => `${formatCurrency(value)} ${symbol}`;

    const errorMessage = () => {
        if (!error) return null;
        if (isTokenRejected(error)) return t("invalidToken");
        if (isRateLimited(error)) return t("rateLimited");
        return t("requestFailed");
    };

    if (!ready) return null;

    if (!connected) {
        return (
            <GetDataProvider>
                <PrivateProvider>
                    <Navbar />
                    <div className="shell pt-16 pb-28">
                        <div className="border-rule mx-auto flex max-w-xl flex-col items-center gap-4 border border-dashed p-10 text-center">
                            <MonoMark className="size-14" />
                            <h1 className="font-display text-xl font-medium tracking-tight uppercase">
                                {t("notConnectedTitle")}
                            </h1>
                            <p className="text-ink-faint max-w-md text-sm leading-relaxed">{t("notConnectedHint")}</p>
                            <Button asChild>
                                <Link href={Routes.SETTINGS}>
                                    <Settings2 />
                                    {t("openSettings")}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </PrivateProvider>
            </GetDataProvider>
        );
    }

    return (
        <GetDataProvider>
            <PrivateProvider>
                <Navbar />

                <PageShell>
                    <PageHeader
                        index="04"
                        title={t("title")}
                        subtitle={
                            clientInfo.data?.name ? t("connectedAs", { name: clientInfo.data.name }) : t("subtitle")
                        }
                        actions={
                            <>
                                {lastFetched > 0 && (
                                    <span className="label hidden sm:inline">
                                        {t("updatedAt", { time: dayjs(lastFetched).format("HH:mm") })}
                                    </span>
                                )}
                                <Button
                                    variant="outline"
                                    disabled={loading || cooldownLeft > 0}
                                    title={cooldownLeft > 0 ? t("cooldown", { seconds: cooldownLeft }) : t("refresh")}
                                    onClick={refresh}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                                    {cooldownLeft > 0 ? t("cooldown", { seconds: cooldownLeft }) : t("refresh")}
                                </Button>
                                <Button variant="ghost" size="icon" aria-label={t("openSettings")} asChild>
                                    <Link href={Routes.SETTINGS}>
                                        <Settings2 className="size-4" />
                                    </Link>
                                </Button>
                            </>
                        }
                    />

                    <p className="label flex items-center gap-2">
                        <Eye className="text-accent size-3.5" />
                        {t("readOnlyBadge")}
                        <Hint text={t("readOnly")} />
                    </p>

                    {errorMessage() && (
                        <div className="border-signal text-signal flex items-start gap-3 border-l-2 py-1 pl-4 text-sm">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p>{errorMessage()}</p>
                        </div>
                    )}

                    {clientInfo.isPending && (
                        <p className="text-ink-faint flex items-center gap-2 text-sm">
                            <Loader2 className="size-4 animate-spin" />
                            {t("loading")}
                        </p>
                    )}

                    {account && (
                        <StatGrid>
                            <StatCard
                                label={t("balance")}
                                value={money(fromMinorUnits(account.balance - account.creditLimit))}
                                secondary={
                                    account.creditLimit > 0
                                        ? t("withCreditLimit", { amount: money(fromMinorUnits(account.balance)) })
                                        : accountLabel(account)
                                }
                            />
                            <StatCard
                                label={t("spent")}
                                value={money(summary.spent)}
                                secondary={
                                    <>
                                        <span className="block">{t("operations", { count: summary.count })}</span>
                                        {summary.largest && (
                                            <span className="block">
                                                {t("largest", {
                                                    amount: money(fromMinorUnits(Math.abs(summary.largest.amount))),
                                                })}
                                            </span>
                                        )}
                                    </>
                                }
                            />
                            <StatCard label={t("received")} value={money(summary.received)} />
                            <StatCard label={t("cashback")} value={money(summary.cashback)} />
                        </StatGrid>
                    )}

                    {accounts.length > 0 && (
                        <Section index="01" title={t("accounts")}>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {accounts.map((item) => {
                                    const active = item.id === account?.id;

                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedId(item.id)}
                                            className={twMerge(
                                                "border-rule hover:border-rule-strong flex items-center gap-3 border p-4 text-left transition-colors",
                                                active && "bg-ink text-paper border-ink hover:border-ink",
                                            )}
                                        >
                                            <span className="flex size-9 shrink-0 items-center justify-center border border-current opacity-70">
                                                <Wallet className="size-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">
                                                    {accountLabel(item)}
                                                </span>
                                                <span className="block font-mono text-3xs uppercase opacity-60">
                                                    {currencyNameByCode(item.currencyCode)}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-mono text-sm tabular-nums">
                                                {formatCurrency(fromMinorUnits(item.balance - item.creditLimit))}{" "}
                                                {currencySymbolByCode(item.currencyCode)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    {jars.length > 0 && (
                        <Section index="02" title={t("jars")}>
                            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                                {jars.map((jar) => {
                                    const progress = jarProgress(jar);
                                    const jarSymbol = currencySymbolByCode(jar.currencyCode);

                                    return (
                                        <div
                                            key={jar.id}
                                            className="border-rule-strong flex flex-col gap-2 border-t pt-3"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-accent flex shrink-0 items-center justify-center">
                                                    <Landmark className="size-4" />
                                                </span>
                                                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                                                    {jar.title}
                                                </p>
                                            </div>
                                            <p className="figure text-figure">
                                                {formatCurrency(fromMinorUnits(jar.balance))} {jarSymbol}
                                            </p>
                                            {progress !== null && jar.goal && (
                                                <>
                                                    <div className="bg-wash h-1.5 w-full">
                                                        <div
                                                            className="bg-accent h-full"
                                                            style={{ width: `${Math.max(progress, 2)}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-ink-faint font-mono text-2xs">
                                                        {t("jarGoal", {
                                                            amount: `${formatCurrency(fromMinorUnits(jar.goal))} ${jarSymbol}`,
                                                            percent: progress,
                                                        })}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </Section>
                    )}

                    <Section
                        index={jars.length > 0 ? "03" : "02"}
                        title={t("statement")}
                        actions={
                            <ViewSwitcher
                                value={period}
                                onChange={setPeriod}
                                options={[
                                    { value: "7", label: t("period7") },
                                    { value: "31", label: t("period31") },
                                    { value: "all", label: t("periodAll") },
                                ]}
                            />
                        }
                    >
                        {allTime && account && (
                            <p className="text-ink-faint mb-4 flex items-center gap-2 text-sm">
                                {history.loading && <Loader2 className="size-4 shrink-0 animate-spin" />}
                                {history.complete
                                    ? t("historyComplete", {
                                          date: historyDate(oldestItem?.time ?? history.from ?? range.from),
                                      })
                                    : history.from
                                      ? t("historyLoading", { date: historyDate(history.from) })
                                      : t("historyStarting")}
                            </p>
                        )}

                        {summary.byCategory.length > 0 && (
                            <div className="mb-6">
                                <CategoryBreakdown totals={summary.byCategory} spent={summary.spent} symbol={symbol} />
                            </div>
                        )}

                        {(allTime ? history.items.length === 0 && history.loading : statement.isPending) && account ? (
                            <p className="text-ink-faint flex items-center gap-2 py-8 text-sm">
                                <Loader2 className="size-4 animate-spin" />
                                {t("loading")}
                            </p>
                        ) : items.length > 0 ? (
                            <StatementList items={items} accountCurrency={account?.currencyCode ?? 980} />
                        ) : (
                            <p className="text-ink-faint border-rule border border-dashed py-16 text-center text-sm">
                                {t("noOperations")}
                            </p>
                        )}
                    </Section>
                </PageShell>
            </PrivateProvider>
        </GetDataProvider>
    );
};

export default MonobankPage;
