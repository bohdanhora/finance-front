import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { useTranslations } from "next-intl";
import { FieldValues } from "react-hook-form";
import { RenderInpitFieldProps } from "types/other.types";

export const RenderInputField = <T extends FieldValues>({ form, name, label }: RenderInpitFieldProps<T>) => {
    const tAuth = useTranslations("auth");
    const labelFrom = tAuth(label);

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{labelFrom}</FormLabel>
                    <FormControl>
                        <Input className="px-5 py-6" placeholder={labelFrom} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
