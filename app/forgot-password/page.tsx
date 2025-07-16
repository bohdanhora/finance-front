"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { PublicProvider } from "providers/auth-provider";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Routes } from "constants/routes";
import { AuthSectionWrapper } from "components/wrappers/auth-section-wrapper.component";
import { Input } from "components/ui/input";
import { useForgotPassword } from "api/auth.api";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
    const tAuth = useTranslations("auth");
    const router = useRouter();

    const { mutateAsync: forgotPasswordAsync, isPending: forgotPasswordPending } = useForgotPassword();

    const formSchema = z.object({
        email: z
            .string()
            .email()
            .min(2, {
                message: tAuth("email"),
            }),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await forgotPasswordAsync({ email: values.email.toLowerCase() });
        router.replace(Routes.LOGIN);
    }

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper title={tAuth("forgotPasswordTitle")} subtitle={tAuth("forgotPasswordSubtitle")}>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{tAuth("email")}</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="px-5 py-6"
                                                placeholder={tAuth("email")}
                                                type="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button disabled={forgotPasswordPending} type="submit" className="w-full mb-5 py-4">
                                {tAuth("sendEmail")}
                            </Button>

                            <div className="flex justify-center gap-1">
                                <span className="text-sm opacity-60">{tAuth("backToLoginFromForgot")}</span>
                                <Link
                                    href={Routes.LOGIN}
                                    className="text-sm font-medium hover:opacity-70 transition-all"
                                >
                                    {tAuth("login")}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    );
}
