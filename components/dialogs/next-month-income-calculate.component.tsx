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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select'
import useBankStore from 'store/bank.store'
import { toast } from 'react-toastify'
import { formatCurrency } from 'lib/utils'

const formSchema = z.object({
    rate: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)(\.\d{1,2})?$/),
    hours: z
        .string()
        .min(1)
        .regex(/^(0|[1-9]\d*)?$/),
    customValue: z.string().optional(),
    currency: z.string().optional(),
})

const currencyArray = ['$', '₴', '€']

export default function NextMonthIncomeCalculate() {
    const store = useStore()
    const bankStore = useBankStore()

    const t = useTranslations('dialogs')

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            rate: '',
            hours: '',
            customValue: '',
            currency: currencyArray[0],
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        const { rate, hours, customValue, currency } = values

        const rateMultiplyHours = Number(rate) * Number(hours)
        const usdRate = bankStore.usd?.rateBuy ?? 0
        const eurRate = bankStore.eur?.rateBuy ?? 0

        const convertToUah = (value: number, currency: string): number => {
            switch (currency) {
                case '$':
                    return value * usdRate
                case '€':
                    return value * eurRate
                case '₴':
                default:
                    return value
            }
        }

        const rateInUah = rateMultiplyHours * usdRate

        const customInUah = customValue
            ? convertToUah(Number(customValue), currency || currencyArray[0])
            : 0

        const result = rateInUah + customInUah

        store.setNextMonthIncome(result)
        toast.success(`you add ${formatCurrency(result)} uah`)
        form.reset()
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button className="p-0 px-3 text-xs" variant="secondary">
                        {t('calculate')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8"
                    >
                        <DialogHeader>
                            <DialogTitle>{t('calculate')}</DialogTitle>
                            <DialogDescription>
                                {t('calculateByRate')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex items-center w-full gap-x-10">
                            <FormField
                                control={form.control}
                                name="rate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('rate')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'ratePlaceholder'
                                                )}
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
                                name="hours"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t('hours')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'hoursPlaceholder'
                                                )}
                                                {...field}
                                                onChange={(e) => {
                                                    const val = e.target.value

                                                    if (val === '') {
                                                        field.onChange(val)
                                                        return
                                                    }

                                                    if (
                                                        !/^(0|[1-9]\d*)?$/.test(
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
                        </div>

                        <div className="flex items-center w-full gap-x-10">
                            <FormField
                                control={form.control}
                                name="customValue"
                                render={({ field }) => (
                                    <FormItem className="w-3/4">
                                        <FormLabel>
                                            {t('additionalAmount')}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={t(
                                                    'additionalAmountPlaceholder'
                                                )}
                                                className="w-full"
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
                                name="currency"
                                render={({ field }) => (
                                    <FormItem className="w-1/4">
                                        <FormLabel>{t('currency')}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue
                                                        placeholder={t(
                                                            'currencyPlaceholder'
                                                        )}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {currencyArray.map((item) => (
                                                    <SelectItem
                                                        value={item}
                                                        key={item}
                                                        className="flex items-center justify-between gap-x-7"
                                                    >
                                                        {item}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
