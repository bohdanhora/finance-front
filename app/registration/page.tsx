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
import { useRegistrationMutation } from 'api/auth.api'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import VantaBackground from 'components/animated-background.component'

const formSchema = z
    .object({
        name: z.string().min(2, {
            message: 'Name must be at least 2 characters.',
        }),
        email: z.string().email({
            message: 'Invalid email address.',
        }),
        password: z.string().min(2, {
            message: 'Password must be at least 2 characters.',
        }),
        confirmPassword: z.string().min(2, {
            message: 'Please confirm your password.',
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    })

export default function Registration() {
    const t = useTranslations('auth.registration')

    const { mutateAsync: registrationAsync } = useRegistrationMutation()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    function onSubmit({ password, name, email }: z.infer<typeof formSchema>) {
        registrationAsync({
            password,
            name,
            email,
        })
    }

    return (
        <PublicProvider>
            <VantaBackground />
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <div className="p-10 border rounded-2xl w-96">
                    <h1 className="text-center mb-10 text-4xl">
                        {t('registration')}
                    </h1>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8"
                        >
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('name')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('name')}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t('email')}
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
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {t('confirmPassword')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'confirmPassword'
                                                )}
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-center justify-between">
                                <Button type="submit">
                                    {t('registration')}
                                </Button>

                                <Link href="/login" className="text-xs">
                                    {t('backToLogin')}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </div>
            </section>
        </PublicProvider>
    )
}
