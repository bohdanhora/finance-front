import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface RenderFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
}

export interface RenderPasswordFieldProps<T extends FieldValues> extends RenderFieldProps<T> {
    label: string;
    error: boolean;
    showPassword: boolean;
    toggleShowPassword: () => void;
}

export interface RenderInpitFieldProps<T extends FieldValues> extends RenderFieldProps<T> {
    label: string;
}
