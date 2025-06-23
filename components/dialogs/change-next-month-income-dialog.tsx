'use client'

import { useForm } from 'react-hook-form'
import useStore from 'store/general.store'
import { Button } from 'ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from 'ui/dialog'
import { Input } from 'ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from 'ui/form'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

const formSchema = z.object({
    value: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
})

export default function ChangeNextMonthIncome() {
    const store = useStore()
    const t = useTranslations('dialogs')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: '',
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        store.setNextMonthIncome(Number(values.value))

        form.reset()
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button className="p-0 px-3 text-xs" variant="secondary">
                        {t('change')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <DialogHeader>
                            <DialogTitle>{t('expectedIncome')}</DialogTitle>
                            <DialogDescription>
                                {t('planNextMonth')}
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('inputIncome')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('inputIncome')}
                                            {...field}
                                            onChange={(e) => {
                                                const val = e.target.value

                                                if (val === '') {
                                                    field.onChange(val)
                                                    return
                                                }

                                                if (
                                                    !/^(0|[1-9]\d*)(\.\d{0,2})?$/.test(
                                                        val
                                                    )
                                                )
                                                    return

                                                field.onChange(val)
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive">
                                    {t('cancel')}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className={twMerge(
                                    !form.formState.isValid &&
                                        'opacity-10 pointer-events-none'
                                )}
                            >
                                {t('submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}
