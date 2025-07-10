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
import { AuthSectionWrapper } from 'components/wrappers/auth-section-wrapper.component'
import { Routes } from 'constants/routes'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { Loader } from 'components/loader.component'
import { useRouter } from 'next/navigation'

function useToggle(initial = false) {
    const [state, setState] = useState(initial)
    const toggle = () => setState((s) => !s)
    return [state, toggle] as const
}

function PasswordInput({
    label,
    placeholder,
    error,
    value,
    onChange,
    show,
    onToggleShow,
    name,
}: {
    label: string
    placeholder: string
    error?: boolean
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    show: boolean
    onToggleShow: () => void
    name: string
}) {
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <div className="relative">
                    <Input
                        name={name}
                        className={twMerge(
                            'px-5 py-6 pr-12',
                            error ? 'border-red-600' : ''
                        )}
                        placeholder={placeholder}
                        type={show ? 'text' : 'password'}
                        value={value}
                        onChange={onChange}
                    />
                    <button
                        type="button"
                        onClick={onToggleShow}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all cursor-pointer"
                        tabIndex={-1}
                        aria-label={show ? 'Hide pass' : 'Show password'}
                    >
                        {show ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    )
}

export default function Registration() {
    const t = useTranslations('auth')
    const router = useRouter()

    const [isRedirecting, setIsRedirecting] = useState(false)
    const [showPassword, toggleShowPassword] = useToggle(false)
    const [showConfirmPassword, toggleShowConfirmPassword] = useToggle(false)

    const { mutateAsync: registrationAsync, isPending: registrationPending } =
        useRegistrationMutation()

    const formSchema = z
        .object({
            name: z.string().min(2, { message: t('errors.name') }),
            email: z.string().email({ message: t('errors.email') }),
            password: z.string().min(2, { message: t('errors.password') }),
            confirmPassword: z
                .string()
                .min(2, { message: t('errors.confirmPassword') }),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('errors.matchPasswords'),
            path: ['confirmPassword'],
        })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setIsRedirecting(true)
        await registrationAsync({
            name: data.name,
            email: data.email,
            password: data.password,
        })
        router.replace(Routes.HOME)
    }

    if (isRedirecting) return <Loader />

    return (
        <PublicProvider>
            <VantaBackground />
            {registrationPending && <Loader />}

            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper>
                    <p className="mb-6 font-light text-base">{t('welcome')}</p>
                    <h1 className="font-medium mb-1 text-3xl">
                        {t('registration')}
                    </h1>
                    <p className="mb-12 font-light text-base">Finance App</p>

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
                                                className="px-5 py-6"
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
                                                className="px-5 py-6"
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
                                    <PasswordInput
                                        label={t('password')}
                                        placeholder={t('password')}
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
                                        label={t('confirmPassword')}
                                        placeholder={t('confirmPassword')}
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

                            <Button type="submit" className="w-full mb-5 py-4">
                                {t('registration')}
                            </Button>

                            <div className="flex justify-center gap-1">
                                <span className="text-sm opacity-60">
                                    {t('backToLogin')}
                                </span>
                                <Link
                                    href={Routes.LOGIN}
                                    className="text-sm font-medium hover:opacity-70 transition-all"
                                >
                                    {t('login')}
                                </Link>
                            </div>
                        </form>
                    </Form>
                </AuthSectionWrapper>
            </section>
        </PublicProvider>
    )
}
