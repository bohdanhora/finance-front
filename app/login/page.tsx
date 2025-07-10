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
import { useEffect, useState } from 'react'
import { Checkbox } from 'components/ui/checkbox'
import { Label } from 'components/ui/label'
import { CheckedState } from '@radix-ui/react-checkbox'
import { twMerge } from 'tailwind-merge'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function Login() {
    const tAuth = useTranslations('auth')
    const tApi = useTranslations('api')

    const router = useRouter()

    const [isRedirecting, setIsRedirecting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState<CheckedState>(false)

    const { mutateAsync: loginAsync, isPending: LoginPending } =
        useLoginMutation(rememberMe)

    const formSchema = z.object({
        email: z
            .string()
            .email()
            .min(2, {
                message: tAuth('errors.email'),
            }),
        password: z.string().min(2, {
            message: tAuth('errors.password'),
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
        try {
            setIsRedirecting(true)
            await loginAsync(values)
            router.replace(Routes.HOME)
        } catch (error) {
            console.error('Login failed:', error)
        } finally {
            setIsRedirecting(false)
        }
    }

    useEffect(() => {
        const toastMap = [
            {
                key: 'showRegistrationToast',
                message: tApi('successRegistration'),
            },
            {
                key: 'showForgotPasswordToast',
                message: tApi('forgotPasswordSuccess'),
            },
            {
                key: 'showLogoutToast',
                message: tApi('logout'),
            },
            {
                key: 'showResetPasswordToast',
                message: tApi('resetPasswordSuccess'),
            },
        ]

        toastMap.forEach(({ key, message }) => {
            if (sessionStorage.getItem(key)) {
                toast.success(message)
                sessionStorage.removeItem(key)
            }
        })
    }, [])

    if (isRedirecting) {
        return <Loader />
    }

    return (
        <PublicProvider>
            {LoginPending && <Loader />}
            <VantaBackground />
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper
                    title={tAuth('login')}
                    subtitle={tAuth('loginSubTitle')}
                >
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
                                        <FormLabel>{tAuth('email')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="px-5 py-6"
                                                placeholder={tAuth('email')}
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
                                        <FormLabel>
                                            {tAuth('password')}
                                        </FormLabel>
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
                                                    placeholder={tAuth(
                                                        'password'
                                                    )}
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
                                            {tAuth('rememberMe')}
                                        </Label>
                                    </div>
                                    <Link
                                        href={Routes.FORGOT_PASSWORD}
                                        className="text-sm font-medium hover:opacity-70 transition-all"
                                    >
                                        {tAuth('forgotPassword')}
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full mb-14 py-4"
                                >
                                    {tAuth('login')}
                                </Button>

                                <div className="flex justify-center gap-1">
                                    <span className="text-sm opacity-60">
                                        {tAuth('dontHaveAccount')}
                                    </span>
                                    <Link
                                        href={Routes.REGISTRATION}
                                        className="text-sm font-medium hover:opacity-70 transition-all"
                                    >
                                        {tAuth('registration')}
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
