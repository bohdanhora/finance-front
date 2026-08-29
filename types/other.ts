import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface RenderFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
}

export interface RenderInputFieldProps<T extends FieldValues> extends RenderFieldProps<T> {
    label: string;
}

export type ErrorResponse = {
    message: string | string[];
};
