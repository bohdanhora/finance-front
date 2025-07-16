import { FieldValues, Path, UseFormReturn } from "react-hook-form";

export interface RenderFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
}
