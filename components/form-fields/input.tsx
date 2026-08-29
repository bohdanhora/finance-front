import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { Input } from "components/ui/input";
import { useTranslations } from "next-intl";
import { FieldValues } from "react-hook-form";
import { RenderInputFieldProps } from "types/other";
import { authInputClass, authLabelClass } from "./styles";

export const RenderInputField = <T extends FieldValues>({ form, name, label }: RenderInputFieldProps<T>) => {
    const tAuth = useTranslations("auth");
    const labelFrom = tAuth(label);

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel className={authLabelClass}>{labelFrom}</FormLabel>
                    <FormControl>
                        <Input className={authInputClass} placeholder={labelFrom} {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
