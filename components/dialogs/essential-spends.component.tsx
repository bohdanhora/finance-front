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
import { Checkbox } from 'components/ui/checkbox'
import { Label } from 'components/ui/label'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'
import { DefaultEssentialsArray, EssentialsType } from 'constants/index'
import { toast } from 'react-toastify'
import { XIcon } from 'lucide-react'
import { useSetEssentialPayments } from 'api/main.api'

const formSchema = z.object({
    amount: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
    title: z.string().min(1),
})

type Props = {
    nextMonth?: boolean
}

export default function EssentialSpends({ nextMonth }: Props) {
    const store = useStore()

    const t = useTranslations()

    const { mutateAsync: setEssentialsPaymentsAsync } =
        useSetEssentialPayments()

    const arrayEssentials = nextMonth
        ? store.nextMonthEssentials
        : store.essentials

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: '',
            title: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (nextMonth) {
            store.setNextMonthNewEssential({
                id: values.title + Math.random().toFixed(3) || '',
                title: values.title || '',
                amount: Number(values.amount) || 0,
                checked: false,
            })
            await setEssentialsPaymentsAsync({
                type: EssentialsType.NEXT_MONTH,
                items: store.nextMonthEssentials,
            })
        } else {
            store.setNewEssential({
                id: values.title + Math.random().toFixed(3) || '',
                title: values.title || '',
                amount: Number(values.amount) || 0,
                checked: false,
            })
            await setEssentialsPaymentsAsync({
                type: EssentialsType.THIS_MONTH,
                items: store.essentials,
            })
        }

        form.reset()
    }

    const checkedFunc = async (id: string, checked: boolean) => {
        if (nextMonth) {
            store.setNextMonthEssentialChecked({ id, checked })
            await setEssentialsPaymentsAsync({
                type: EssentialsType.NEXT_MONTH,
                items: store.nextMonthEssentials,
            })
        } else {
            store.setEssentialChecked({ id, checked })
            await setEssentialsPaymentsAsync({
                type: EssentialsType.THIS_MONTH,
                items: store.essentials,
            })
        }
    }

    const setDefaultsEssentials = async () => {
        if (nextMonth && store.nextMonthEssentials.length > 0) {
            toast.error(t('dialogs.essentials.standardFillWarning'))
            return
        }
        if (!nextMonth && store.essentials.length > 0) {
            toast.error(t('dialogs.essentials.standardFillWarning'))
            return
        }

        toast.success(t('dialogs.essentials.standardValuesAdded'))

        if (nextMonth) {
            store.setNextMonthFullEssentials(DefaultEssentialsArray)
            await setEssentialsPaymentsAsync({
                type: EssentialsType.NEXT_MONTH,
                items: DefaultEssentialsArray,
            })
        } else {
            store.setFullEssentials(DefaultEssentialsArray)
            await setEssentialsPaymentsAsync({
                type: EssentialsType.THIS_MONTH,
                items: DefaultEssentialsArray,
            })
        }
    }

    const removeEssential = async (id: string) => {
        if (nextMonth) {
            store.removeNextMonthEssential(id)
            await setEssentialsPaymentsAsync({
                type: EssentialsType.NEXT_MONTH,
                items: store.nextMonthEssentials.filter((i) => i.id !== id),
            })
        } else {
            store.removeEssential(id)
            await setEssentialsPaymentsAsync({
                type: EssentialsType.THIS_MONTH,
                items: store.essentials.filter((i) => i.id !== id),
            })
        }

        toast.success(t('dialogs.essentials.removed'))
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="secondary">
                        {nextMonth
                            ? t('dialogs.essentials.nextMonth')
                            : t('dialogs.essentials.title')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {t('dialogs.essentials.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('dialogs.essentials.hint')}
                        </DialogDescription>
                    </DialogHeader>
                    <ul className="flex flex-col gap-3">
                        {arrayEssentials?.map(
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
                                            className={twMerge(
                                                'relative',
                                                checked && 'line-through'
                                            )}
                                        >
                                            {title} = {`${amount} ₴`}
                                            <Button
                                                onClick={() =>
                                                    removeEssential(id)
                                                }
                                                variant="ghost"
                                                className="size-4 absolute -right-10"
                                            >
                                                <XIcon />
                                            </Button>
                                        </Label>
                                    </li>
                                )
                            }
                        )}
                    </ul>
                    <Button onClick={setDefaultsEssentials}>
                        {t('dialogs.essentials.fillStandard')}
                    </Button>
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
                                    <FormLabel>
                                        {t('dialogs.essentials.label')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                'dialogs.essentials.placeholder'
                                            )}
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
