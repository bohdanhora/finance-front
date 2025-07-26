import { PasswordInput } from "components/password-input";
import { FormField } from "components/ui/form";
import { useTranslations } from "next-intl";
import { FieldValues } from "react-hook-form";
import { RenderPasswordFieldProps } from "types/other";

export const RenderPassword = <T extends FieldValues>({
    form,
    name,
    label,
    error,
    showPassword,
    toggleShowPassword,
}: RenderPasswordFieldProps<T>) => {
    const t = useTranslations("auth");

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <PasswordInput
                    label={t(label)}
                    placeholder={t(label)}
                    error={error}
                    value={field.value}
                    onChange={field.onChange}
                    show={showPassword}
                    onToggleShow={toggleShowPassword}
                    name={field.name}
                />
            )}
        />
    );
};
