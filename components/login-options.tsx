import Link from "next/link";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Routes } from "constants/routes";
import { useTranslations } from "next-intl";
import { CheckedState } from "@radix-ui/react-checkbox";

export const LoginOptions = ({ setRememberMe }: { setRememberMe: (checked: CheckedState) => void }) => {
    const tAuth = useTranslations("auth");

    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
                <Checkbox
                    id="remember"
                    className="cursor-pointer"
                    onCheckedChange={(checked) => setRememberMe(checked)}
                />
                <Label htmlFor="remember" className="text-sm cursor-pointer">
                    {tAuth("rememberMe")}
                </Label>
            </div>
            <Link href={Routes.FORGOT_PASSWORD} className="text-sm font-medium hover:opacity-70 transition-all">
                {tAuth("forgotPassword")}
            </Link>
        </div>
    );
};
