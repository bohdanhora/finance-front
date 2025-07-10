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
import { Popover, PopoverContent, PopoverTrigger } from 'ui/popover'
import { CalendarIcon, PlusIcon } from 'lucide-react'
import { Calendar } from 'ui/calendar'
import { format } from 'date-fns'
import { cn, formatCurrency } from 'lib/utils'
import { useTranslations } from 'next-intl'
import { toast } from 'react-toastify'
import { twMerge } from 'tailwind-merge'
import { useSetNewTransaction } from 'api/main.api'
import { v4 as uuidv4 } from 'uuid'
import { TransactionEnum } from 'constants/index'

const formSchema = z.object({
    value: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
    description: z.string().optional(),
    date: z.date(),
})

export default function IncomeDialogComponent() {
    const store = useStore()
    const t = useTranslations()

    const {
        mutateAsync: setNewTransactionAsync,
        isPending: setNewTransactionPending,
    } = useSetNewTransaction()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: '',
            description: '',
            date: new Date(),
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const createTransaction = {
            transactionType: TransactionEnum.INCOME,
            id: uuidv4(),
            value: Number(values.value),
            date: values.date,
            categorie: TransactionEnum.INCOME,
            description: values.description || '',
        }

        const response = await setNewTransactionAsync(createTransaction)

        store.setTotalAmount(response.updatedTotals.totalAmount)
        store.setTotalIncome(response.updatedTotals.totalIncome)
        store.setTotalSpend(response.updatedTotals.totalSpend)
        store.setTransactions(response.updatedItems)

        toast.success(
            t('toasts.addedIncome', {
                amount: formatCurrency(Number(values.value)),
            })
        )
        form.reset()
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button
                        variant="default"
                        className="hover:bg-green-500 dark:hover:bg-green-600"
                    >
                        <PlusIcon />
                        {t('expenses.income')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {t('dialogs.enterIncome')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('dialogs.incomeReceived')}
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="value"
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('dialogs.description')}
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t(
                                                'dialogs.description'
                                            )}
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>{t('dialogs.date')}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="popover"
                                                    className={cn(
                                                        'w-[240px] pl-3 text-left font-normal',
                                                        !field.value &&
                                                            'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(
                                                            field.value,
                                                            'PPP'
                                                        )
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) =>
                                                    date > new Date() ||
                                                    date <
                                                        new Date('1900-01-01')
                                                }
                                                captionLayout="dropdown"
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                                disabled={setNewTransactionPending}
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
