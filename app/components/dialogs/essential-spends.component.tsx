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
import { Textarea } from 'ui/textarea'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Label } from '@/app/components/ui/label'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'

const formSchema = z.object({
    amount: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
    title: z.string().min(1),
})

export default function EssentialSpends() {
    const store = useStore()
    const t = useTranslations()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            title: '',
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        store.setNewEssential({
            id: values.title + Math.random().toFixed(3) || '',
            title: values.title || '',
            amount: Number(values.amount) || 0,
            checked: false,
        })

        form.reset()
    }

    const checkedFunc = (id: string, checked: boolean) => {
        store.setEssentialChecked({ id, checked })
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="secondary">set or change essential</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>esential title</DialogTitle>
                        <DialogDescription>esential desc</DialogDescription>
                    </DialogHeader>
                    <ul className="flex flex-col gap-3">
                        {store.essentials?.map(
                            ({ id, title, amount, checked }) => {
                                return (
                                    <li
                                        className="flex items-center gap-3"
                                        key={id}
                                    >
                                        <Checkbox
                                            id={id}
                                            checked={checked}
                                            onCheckedChange={(val) =>
                                                checkedFunc(id, Boolean(val))
                                            }
                                        />
                                        <Label
                                            htmlFor={id}
                                            className={
                                                checked ? 'line-through' : ''
                                            }
                                        >
                                            {title} = {amount}
                                        </Label>
                                    </li>
                                )
                            }
                        )}
                    </ul>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('dialogs.amount')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t('dialogs.amount')}
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
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>title</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="title"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="destructive">
                                    {t('dialogs.cancel')}
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                className={twMerge(
                                    !form.formState.isValid &&
                                        'opacity-10 pointer-events-none'
                                )}
                            >
                                {t('dialogs.submit')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}
