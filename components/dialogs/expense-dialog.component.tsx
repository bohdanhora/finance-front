'use client'

import useStore from 'store/general.store'

import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from 'ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from 'ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from 'ui/select'
import { Input } from 'ui/input'
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

import { format } from 'date-fns'
import {
    ShoppingBasketIcon,
    CalendarIcon,
    SparklesIcon,
    HouseIcon,
    SmilePlusIcon,
    UtensilsIcon,
    HamburgerIcon,
    CarTaxiFrontIcon,
    BanknoteIcon,
    GiftIcon,
    ShirtIcon,
    HandshakeIcon,
    MinusIcon,
} from 'lucide-react'
import { cn, formatCurrency } from 'lib/utils'
import { Calendar } from 'ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/popover'
import { Textarea } from 'ui/textarea'
import { useTranslations } from 'next-intl'
import { twMerge } from 'tailwind-merge'
import { toast } from 'react-toastify'
import { useSetNewTransaction } from 'api/main.api'
import { TransactionType } from 'constants/index'
import { v4 as uuidv4 } from 'uuid'

const formSchema = z.object({
    value: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
    description: z.string().optional(),
    categories: z.string().min(1),
    date: z.date(),
})

const categoryKeys = [
    'groceries',
    'cosmetics',
    'home',
    'restaurant',
    'entertainment',
    'delivery',
    'transport',
    'credit',
    'gifts',
    'clothing',
    'essentials',
]

export default function ExpenseDialogComponent() {
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
            categories: '',
            date: new Date(),
        },
    })

    const categoriesIcons = (category: string) => {
        if (category === 'groceries') return <ShoppingBasketIcon />
        if (category === 'cosmetics') return <SparklesIcon />
        if (category === 'home') return <HouseIcon />
        if (category === 'restaurant') return <UtensilsIcon />
        if (category === 'entertainment') return <SmilePlusIcon />
        if (category === 'delivery') return <HamburgerIcon />
        if (category === 'transport') return <CarTaxiFrontIcon />
        if (category === 'credit') return <BanknoteIcon />
        if (category === 'gifts') return <GiftIcon />
        if (category === 'clothing') return <ShirtIcon />
        if (category === 'essentials') return <HandshakeIcon />
    }

    async function onSubmit(values: z.infer<typeof formSchema>) {
        const createTransaction = {
            transactionType: TransactionType.EXPENCE,
            id: uuidv4(),
            value: Number(values.value),
            date: values.date,
            categorie: values.categories,
            description: values.description || '',
        }

        const response = await setNewTransactionAsync(createTransaction)

        store.setTotalAmount(response.updatedTotals.totalAmount)
        store.setTotalIncome(response.updatedTotals.totalIncome)
        store.setTotalSpend(response.updatedTotals.totalSpend)

        toast.success(
            t('toasts.addedExpense', {
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
                        variant="outline"
                        className="hover:shadow-2xl hover:shadow-red-500/50"
                    >
                        <MinusIcon />
                        {t('expenses.expence')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {t('dialogs.enterExpense')}
                            </DialogTitle>
                            <DialogDescription>
                                {t('dialogs.expenseHint')}
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
                            name="categories"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {t('dialogs.category')}
                                    </FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={t(
                                                        'dialogs.chooseCategory'
                                                    )}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categoryKeys.map((item) => (
                                                <SelectItem
                                                    value={item}
                                                    key={item}
                                                    className="flex items-center justify-between gap-x-7"
                                                >
                                                    {categoriesIcons(item)}
                                                    {t(`categories.${item}`)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                                            'dd/MM/yyyy'
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
