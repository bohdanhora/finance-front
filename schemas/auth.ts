import { z } from "zod";

export const registrationSchema = (t: ReturnType<typeof import("next-intl").useTranslations>) =>
    z
        .object({
            name: z.string().min(2, { message: t("errors.name") }),
            email: z.string().email({ message: t("errors.email") }),
            verificationCode: z.string().min(6, { message: t("errors.verificationCode") }),
            password: z.string().min(2, { message: t("errors.password") }),
            confirmPassword: z.string().min(2, { message: t("errors.confirmPassword") }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("errors.matchPasswords"),
            path: ["confirmPassword"],
        });

export const loginSchema = (t: ReturnType<typeof import("next-intl").useTranslations>) =>
    z.object({
        email: z
            .string()
            .email({
                message: t("errors.email"),
            })
            .min(2),
        password: z.string().min(2, {
            message: t("errors.password"),
        }),
    });

export const forgotPasswordSchema = (t: ReturnType<typeof import("next-intl").useTranslations>) =>
    z.object({
        email: z
            .string()
            .email({
                message: t("errors.email"),
            })
            .min(2),
    });

export const resetPasswordSchema = (t: ReturnType<typeof import("next-intl").useTranslations>) =>
    z
        .object({
            password: z.string().min(2, { message: t("errors.password") }),
            confirmPassword: z.string().min(2, { message: t("errors.confirmPassword") }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t("errors.matchPasswords"),
            path: ["confirmPassword"],
        });

export const sendEmailSchema = (t: ReturnType<typeof import("next-intl").useTranslations>) =>
    z.object({
        email: z.string().email({ message: t("errors.email") }),
    });
