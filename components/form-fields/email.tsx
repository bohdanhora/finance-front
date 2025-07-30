import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { useTranslations } from "next-intl";
import { FieldValues } from "react-hook-form";
import { RenderFieldProps } from "types/other";

export const RenderEmailField = <T extends FieldValues>({ form, name }: RenderFieldProps<T>) => {
    const tAuth = useTranslations("auth");
    const emailLabel = tAuth("email");

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{emailLabel}</FormLabel>
                    <FormControl>
                        <Input className="px-5 py-6" placeholder={emailLabel} type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
