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
                <Checkbox
                    id="remember"
                    className="size-4 cursor-pointer rounded-[5px] border-black/20 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 dark:border-white/25"
                    onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <Label
                    htmlFor="remember"
                    className="cursor-pointer text-sm font-normal text-black/65 dark:text-white/65"
                >
                    {tAuth("rememberMe")}
                </Label>
            </div>
            <Link
                href={Routes.FORGOT_PASSWORD}
                className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
                {tAuth("forgotPassword")}
            </Link>
        </div>
    );
};
