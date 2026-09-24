"use client";

import { useState } from "react";
import { AxiosError } from "axios";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { useAccount, useChangePassword } from "api/account";
import { ConnectionCard } from "components/settings/connection-card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";

type Field = "current" | "next" | "confirm";

const PasswordInput = ({
    id,
    label,
    value,
    autoComplete,
    disabled,
    visible,
    showLabel,
    hideLabel,
    onToggle,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    autoComplete: "current-password" | "new-password";
    disabled: boolean;
    visible: boolean;
    showLabel: string;
    hideLabel: string;
    onToggle: () => void;
    onChange: (value: string) => void;
}) => (
    <div className="flex flex-col gap-1.5">
        <Label htmlFor={id} className="text-xs font-semibold">
            {label}
        </Label>
        <div className="relative">
            <Input
                id={id}
                name={id}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                className="pr-10"
                placeholder={label}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            />
            <button
                type="button"
                tabIndex={-1}
                aria-label={visible ? hideLabel : showLabel}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                onClick={onToggle}
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    </div>
);

export const AccountPassword = () => {
    const t = useTranslations("password");
    const tAuth = useTranslations("auth");
    const { data: account, isLoading, isError } = useAccount();
    const { mutateAsync, isPending } = useChangePassword();

    const [values, setValues] = useState<Record<Field, string>>({ current: "", next: "", confirm: "" });
    const [visible, setVisible] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasPassword = Boolean(account?.hasPassword);

    const update = (field: Field) => (value: string) => {
        setValues((current) => ({ ...current, [field]: value }));
        setError(null);
    };

    const validate = () => {
        if (hasPassword && !values.current) return t("currentRequired");
        if (values.next.length < 6) return tAuth("errors.passwordMin");
        if (!/[0-9]/.test(values.next)) return tAuth("errors.passwordNumber");
        if (!values.confirm) return tAuth("errors.confirmPassword");
        if (values.next !== values.confirm) return tAuth("errors.matchPasswords");
        if (hasPassword && values.current === values.next) return t("samePassword");
        return null;
    };

    const submit = async () => {
        if (isPending) return;

        const problem = validate();
        if (problem) {
            setError(problem);
            return;
        }

        try {
            await mutateAsync(
                hasPassword ? { oldPassword: values.current, newPassword: values.next } : { newPassword: values.next },
            );
            setValues({ current: "", next: "", confirm: "" });
            setVisible(false);
            setError(null);
            toast.success(hasPassword ? t("changedToast") : t("createdToast"));
        } catch (requestError) {
            const message = (requestError as AxiosError<{ message?: unknown }>).response?.data?.message;
            setError(message === "Wrong current password" ? t("wrongCurrent") : t("requestFailed"));
        }
    };

    const field = (name: Field, label: string, autoComplete: "current-password" | "new-password") => (
        <PasswordInput
            id={`password-${name}`}
            label={label}
            value={values[name]}
            autoComplete={autoComplete}
            disabled={isPending}
            visible={visible}
            showLabel={tAuth("showPassword")}
            hideLabel={tAuth("hidePassword")}
            onToggle={() => setVisible((current) => !current)}
            onChange={update(name)}
        />
    );

    const status = isLoading
        ? t("loading")
        : isError
          ? t("loadFailed")
          : hasPassword
            ? t("statusSet")
            : account?.registeredVia === "google"
              ? t("statusGoogle")
              : t("statusNotSet");

    return (
        <ConnectionCard
            mark={
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-900 text-white shadow-sm dark:from-slate-500 dark:to-slate-800">
                    <KeyRound className="size-5" />
                </span>
            }
            title={t("title")}
            status={status}
            connected={hasPassword}
            connectedLabel={t("setBadge")}
            note={account?.email ? t("note", { email: account.email }) : t("noteNoEmail")}
        >
            {isLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                </div>
            ) : isError ? (
                <p className="text-sm text-rose-600 dark:text-rose-400">{t("loadFailed")}</p>
            ) : (
                <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void submit();
                    }}
                >
                    {account?.email && (
                        <input
                            type="email"
                            name="email"
                            autoComplete="username"
                            value={account.email}
                            readOnly
                            hidden
                        />
                    )}
                    {hasPassword && field("current", t("current"), "current-password")}
                    {field("next", t("new"), "new-password")}
                    {field("confirm", t("confirm"), "new-password")}

                    {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

                    <Button type="submit" disabled={isPending} className="sm:self-start">
                        {isPending && <Loader2 className="animate-spin" />}
                        {hasPassword ? t("change") : t("create")}
                    </Button>
                </form>
            )}
        </ConnectionCard>
    );
};
