'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from 'ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from 'ui/form'
import { Input } from 'ui/input'
import { PublicProvider } from 'providers/auth-provider'
import { useLoginMutation } from 'api/auth.api'
import { Loader } from 'components/loader.component'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Routes } from 'constants/routes'
import VantaBackground from 'components/animated-background.component'
import { AuthSectionWrapper } from 'components/wrappers/auth-section-wrapper.component'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Checkbox } from 'components/ui/checkbox'
import { Label } from 'components/ui/label'
import { CheckedState } from '@radix-ui/react-checkbox'
import { twMerge } from 'tailwind-merge'

export default function Login() {
    const t = useTranslations('auth.login')

    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState<CheckedState>(false)

    const { mutateAsync: loginAsync, isPending: LoginPending } =
        useLoginMutation(rememberMe)

    const formSchema = z.object({
        email: z
            .string()
            .email()
            .min(2, {
                message: t('errors.email'),
            }),
        password: z.string().min(2, {
            message: t('errors.password'),
        }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await loginAsync(values)
    }

    return (
        <PublicProvider>
            {LoginPending && <Loader />}
            <VantaBackground />
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper>
                    <p className="mb-6 font-light text-base">{t('welcome')}</p>
                    <h1 className="font-medium mb-1 text-3xl">{t('login')}</h1>
                    <p className="mb-12 font-light text-base">Finance App</p>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="px-5 py-6"
                                                placeholder={t('email')}
                                                type="email"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('password')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    className={twMerge(
                                                        'px-5 py-6 pr-12',
                                                        form.formState.errors
                                                            .password
                                                            ? 'border-red-600'
                                                            : ''
                                                    )}
                                                    placeholder={t('password')}
                                                    type={
                                                        showPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (prev) => !prev
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                                                    tabIndex={-1}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff size={20} />
                                                    ) : (
                                                        <Eye size={20} />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="remember"
                                            className="cursor-pointer"
                                            onCheckedChange={(checked) =>
                                                setRememberMe(checked)
                                            }
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="text-sm cursor-pointer"
                                        >
                                            {t('rememberMe')}
                                        </Label>
                                    </div>
                                    <Link
                                        href={Routes.FORGOT_PASSWORD}
                                        className="text-sm font-medium hover:opacity-70 transition-all"
                                    >
                                        {t('forgotPassword')}
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full mb-14 py-4"
                                >
                                    {t('login')}
                                </Button>

                                <div className="flex justify-center gap-1">
                                    <span className="text-sm opacity-60">
                                        {t('dontHaveAccount')}
                                    </span>
                                    <Link
                                        href={Routes.REGISTRATION}
                                        className="text-sm font-medium hover:opacity-70 transition-all"
                                    >
                                        {t('registration')}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    )
}
