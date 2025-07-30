import { twMerge } from "tailwind-merge";
import { FormControl, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";

export const PasswordInput = ({
    label,
    placeholder,
    error,
    value,
    onChange,
    show,
    onToggleShow,
    name,
}: {
    label: string;
    placeholder: string;
    error?: boolean;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    show: boolean;
    onToggleShow: () => void;
    name: string;
}) => {
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="relative">
                    <Input
                        name={name}
                        className={twMerge("px-5 py-6 pr-12", error ? "border-red-600" : "")}
                        placeholder={placeholder}
                        type={show ? "text" : "password"}
                        value={value}
                        onChange={onChange}
                    />
                    <button
                        type="button"
                        onClick={onToggleShow}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                        tabIndex={-1}
                        aria-label={show ? "Hide pass" : "Show password"}
                    >
                        {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
};
