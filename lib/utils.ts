import { MonobankCurrency } from "types/auth";
import { ISO4217Codes } from "constants/index";
import { toast } from "react-toastify";

import { AxiosError } from "axios";
import { ErrorResponse } from "types/other";
import dayjs from "dayjs";

export const createDateString = (input: string | Date): string => {
    const date = dayjs(input);

    if (!date.isValid()) {
        return "Invalid Date";
    }

    return date.format("DD/MM/YYYY");
};

export const findCurrency = (currency: MonobankCurrency[], isoCode: ISO4217Codes) => {
    if (!currency.length) return null;

    const USDtoUAH = currency?.find(
        (item) => item.currencyCodeA === isoCode && item.currencyCodeB === ISO4217Codes.UAH,
    );

    return USDtoUAH;
};

export const formatCurrency = (num: number) => {
    const absNum = Math.abs(num);

    const [intPart, decPart = ""] = absNum.toString().split(".");

    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const formattedDec = (decPart + "00").slice(0, 2);

    if (num < 0) return "0";

    return `${formattedInt}.${formattedDec}`;
};

export const calculateDailyBudget = (totalAmount: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysLeft = lastDayOfMonth.getDate() - today.getDate() + 1;

    if (daysLeft <= 0) {
        throw new Error("error month");
    }

    const dailyBudget = totalAmount / daysLeft;

    const result = {
        daysLeft,
        dailyBudget,
    };
    return result;
};

export const calculateSavings = (totalAmount: number) => {
    const percentageToSave = 0.1;
    const saved = Number((totalAmount * percentageToSave).toFixed(2));
    const remaining = Number((totalAmount - saved).toFixed(2));

    return {
        saved,
        remaining,
    };
};

export const showSessionToasts = (keys: { key: string; message: string }[]) => {
    keys.forEach(({ key, message }) => {
        if (sessionStorage.getItem(key)) {
            toast.success(message);
            sessionStorage.removeItem(key);
        }
    });
};

export const extractTokensFromParams = (params: URLSearchParams) => {
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const userId = params.get("userId");
    if (!accessToken || !refreshToken || !userId) return null;
    return { accessToken, refreshToken, userId };
};

export const showAxiosError = (error: AxiosError<ErrorResponse>) => {
    const message = error.response?.data.message;

    if (Array.isArray(message)) {
        message.forEach((msg) => toast.error(msg));
    } else if (typeof message === "string") {
        toast.error(message);
    } else {
        toast.error("Error");
    }
};

export const handleDecimalInputChange =
    (fieldOnChange: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;

        if (val === "") {
            fieldOnChange(val);
            return;
        }

        if (!/^(0|[1-9]\d*)(\.\d{0,2})?$/.test(val)) return;

        fieldOnChange(val);
    };
