import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckedState } from "@radix-ui/react-checkbox";

import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Routes } from "constants/routes";

export const LoginOptions = ({ setRememberMe }: { setRememberMe: (checked: CheckedState) => void }) => {
    const tAuth = useTranslations("auth");

    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Checkbox id="remember" onCheckedChange={(checked) => setRememberMe(checked)} />
                <Label
                    htmlFor="remember"
                    className="text-ink-muted cursor-pointer font-sans text-sm tracking-normal normal-case"
                >
                    {tAuth("rememberMe")}
                </Label>
            </div>
            <Link href={Routes.FORGOT_PASSWORD} className="link text-accent text-sm">
                {tAuth("forgotPassword")}
            </Link>
        </div>
    );
};
