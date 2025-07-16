import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldValues } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { RenderFieldProps } from "types/other.types";

export const LoginPassword = <T extends FieldValues>({ form, name }: RenderFieldProps<T>) => {
    const tAuth = useTranslations("auth");

    const [showPassword, setShowPassword] = useState(false);

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{tAuth("password")}</FormLabel>
                    <FormControl>
                        <div className="relative">
                            <Input
                                className={twMerge(
                                    "px-5 py-6 pr-12",
                                    form.formState.errors.password ? "border-red-600" : "",
                                )}
                                placeholder={tAuth("password")}
                                type={showPassword ? "text" : "password"}
                                {...field}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
