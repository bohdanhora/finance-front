import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldValues } from "react-hook-form";
import { twMerge } from "lib/tw";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { RenderInputFieldProps } from "types/other";
import { authInputClass, authLabelClass } from "./styles";

export const RenderPassword = <T extends FieldValues>({
    form,
    name,
    label,
    autoComplete = "new-password",
}: RenderInputFieldProps<T> & { autoComplete?: "current-password" | "new-password" }) => {
    const tAuth = useTranslations("auth");
    const [show, setShow] = useState(false);

    const text = tAuth(label);

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field, fieldState }) => (
                <FormItem>
                    <FormLabel className={authLabelClass}>{text}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input
                                className={twMerge(authInputClass, "pr-12")}
                                placeholder={text}
                                type={show ? "text" : "password"}
                                autoComplete={autoComplete}
                                aria-invalid={!!fieldState.error}
                                {...field}
                            />
                            <button
                                type="button"
                                onClick={() => setShow((prev) => !prev)}
                                tabIndex={-1}
                                aria-label={show ? tAuth("hidePassword") : tAuth("showPassword")}
                                className="text-ink-faint hover:text-ink absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center transition-colors"
                            >
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
