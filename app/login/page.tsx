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
import { useLoginMutation } from 'api/main.api'
import { Loader } from 'components/loader.component'

const formSchema = z.object({
    email: z.string().email().min(2, {
        message: 'email must be at least 2 characters.',
    }),
    password: z.string().min(2, {
        message: 'password must be at least 2 characters.',
    }),
})
export default function Login() {
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
            <section className="w-full min-h-screen flex justify-center items-center">
                <div className="p-10 border rounded-2xl min-w-md">
                    <h1 className="text-center mb-10 text-4xl">Login</h1>
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
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="email"
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
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Password"
                                                type="password"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">Submit</Button>
                        </form>
                    </Form>
                </div>
            </section>
        </PublicProvider>
    )
}
