'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useState, useEffect } from 'react'

import { Button } from 'ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from 'ui/form'
import { PublicProvider } from 'providers/auth-provider'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Routes } from 'constants/routes'
import { AuthSectionWrapper } from 'components/wrappers/auth-section-wrapper.component'
import { useRouter } from 'next/navigation'
import { Input } from 'components/ui/input'
import { useRequestEmailCode } from 'api/auth.api'
import { toast } from 'react-toastify'
import useOtherStore from 'store/other.store'

export default function SendCode() {
    const otherStore = useOtherStore()
    const tAuth = useTranslations('auth')
    const router = useRouter()

    const { mutateAsync: requestEmailCode, isPending: requestEmailPending } =
        useRequestEmailCode()

    const [resendTimer, setResendTimer] = useState(0)
    const [codeSent, setCodeSent] = useState(false)

    const formSchema = z.object({
        email: z.string().email({ message: tAuth('errors.email') }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    })

    const toRegistrationPage = () => {
        const values = form.getValues()
        otherStore.setEmail(values.email)
        router.push(Routes.REGISTRATION)
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const res = await requestEmailCode(values)
        toast.success(res.message)
        setResendTimer(60)
        setCodeSent(true)
    }

    async function handleResend() {
        const values = form.getValues()
        if (values.email) {
            await requestEmailCode(values)
            setResendTimer(60)
        }
    }

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setInterval(() => {
                setResendTimer((prev) => prev - 1)
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [resendTimer])

    return (
        <PublicProvider>
            <section className="w-full min-h-screen flex justify-center items-center p-3">
                <AuthSectionWrapper
                    title={tAuth('emailVerificationTitle')}
                    subtitle={tAuth('emailVerificationSubtitle')}
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
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {codeSent ? (
                                <Button
                                    variant="secondary"
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resendTimer > 0}
                                    className="w-full mb-5 py-4"
                                >
                                    {resendTimer > 0
                                        ? `${tAuth('resendCode')} (${resendTimer})`
                                        : tAuth('resendCode')}
                                </Button>
                            ) : (
                                <Button
                                    disabled={requestEmailPending}
                                    type="submit"
                                    className="w-full mb-5 py-4"
                                >
                                    {tAuth('sendCode')}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                type="button"
                                onClick={toRegistrationPage}
                                className="w-full mb-5 py-4"
                            >
                                {tAuth('iReceivedCode')}
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
