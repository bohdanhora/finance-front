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

const formSchema = z.object({
    email: z.string().email().min(2, {
        message: 'email must be at least 2 characters.',
    }),
    password: z.string().min(2, {
        message: 'password must be at least 2 characters.',
    }),
})

export default function Login() {
    const t = useTranslations('auth.login')
    const { mutateAsync: loginAsync, isPending: LoginPending } =
        useLoginMutation()

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
                <div className="p-10 border rounded-2xl w-96">
                    <h1 className="text-center mb-10 text-4xl">{t('login')}</h1>
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
                                            <Input
                                                placeholder={t('password')}
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <Button type="submit">{t('login')}</Button>
                                    <Link
                                        href={Routes.FORGOT_PASSWORD}
                                        className="text-xs"
                                    >
                                        {t('forgotPassword')}
                                    </Link>
                                </div>

                                <Link
                                    href={Routes.REGISTRATION}
                                    className="text-xs"
                                >
                                    {t('dontHaveAccount')}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </div>
            </section>
        </PublicProvider>
    )
}
