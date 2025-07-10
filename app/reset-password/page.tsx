'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from 'ui/button'
import { Form, FormField } from 'ui/form'
import { PublicProvider } from 'providers/auth-provider'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Routes } from 'constants/routes'
import { AuthSectionWrapper } from 'components/wrappers/auth-section-wrapper.component'
import { PasswordInput } from 'components/password-input.component'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'react-toastify'
import { useResetPassword } from 'api/auth.api'

function useToggle(initial = false) {
    const [state, setState] = useState(initial)
    const toggle = () => setState((s) => !s)
    return [state, toggle] as const
}

export default function ForgotPassword() {
    const tAuth = useTranslations('auth')
    const searchParams = useSearchParams()
    const router = useRouter()

    const token = searchParams.get('token')

    const { mutateAsync: resetPasswordAsync, isPending: resetPasswordPending } =
        useResetPassword()

    const [showPassword, toggleShowPassword] = useToggle(false)
    const [showConfirmPassword, toggleShowConfirmPassword] = useToggle(false)

    const formSchema = z
        .object({
            password: z.string().min(2, { message: tAuth('errors.password') }),
            confirmPassword: z
                .string()
                .min(2, { message: tAuth('errors.confirmPassword') }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: tAuth('errors.matchPasswords'),
            path: ['confirmPassword'],
        })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const body = {
            resetToken: token,
            newPassword: values.password,
        }

        await resetPasswordAsync(body)
        router.replace(Routes.LOGIN)
    }

    useEffect(() => {
        if (!token) {
            router.replace(Routes.LOGIN)
            toast.error(tAuth('missingToken'))
        }
    }, [])

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper
                    title={tAuth('resetPassword')}
                    subtitle={tAuth('resetPasswordSubtitle')}
                >
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <PasswordInput
                                        label={tAuth('password')}
                                        placeholder={tAuth('password')}
                                        error={!!form.formState.errors.password}
                                        value={field.value}
                                        onChange={field.onChange}
                                        show={showPassword}
                                        onToggleShow={toggleShowPassword}
                                        name={field.name}
                                    />
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <PasswordInput
                                        label={tAuth('confirmPassword')}
                                        placeholder={tAuth('confirmPassword')}
                                        error={
                                            !!form.formState.errors
                                                .confirmPassword
                                        }
                                        value={field.value}
                                        onChange={field.onChange}
                                        show={showConfirmPassword}
                                        onToggleShow={toggleShowConfirmPassword}
                                        name={field.name}
                                    />
                                )}
                            />

                            <Button
                                disabled={resetPasswordPending}
                                type="submit"
                                className="w-full mb-5 py-4"
                            >
                                {tAuth('resetBtn')}
                            </Button>

                            <div className="flex justify-center gap-1">
                                <span className="text-sm opacity-60">
                                    {tAuth('backToLoginFromForgot')}
                                </span>
                                <Link
                                    href={Routes.LOGIN}
                                    className="text-sm font-medium hover:opacity-70 transition-all"
                                >
                                    {tAuth('login')}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    )
}
