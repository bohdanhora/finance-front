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

const formSchema = z.object({
    value: z.string(),
})

export default function ChangeNextMonthIncome() {
    const store = useStore()
    const t = useTranslations('dialogs')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: '0',
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
                    <Button className="p-0 px-3 ml-10" variant="ghost">
                        {t('change')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <DialogHeader>
                            <DialogTitle>title</DialogTitle>
                            <DialogDescription>desc</DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('inputIncome')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="value"
                                            type="number"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">{t('cancel')}</Button>
                            </DialogClose>
                            <Button type="submit">{t('submit')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}
