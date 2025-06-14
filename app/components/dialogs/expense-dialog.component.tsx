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
import { CalendarIcon } from 'lucide-react'
import { cn, createDateString } from 'lib/utils'
import { Calendar } from 'ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from 'ui/popover'
import { Textarea } from 'ui/textarea'
import { useTranslations } from 'next-intl'

const formSchema = z.object({
    value: z.string(),
    description: z.string().optional(),
    categories: z.string(),
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

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: '0',
            description: '',
            categories: '',
            date: new Date(),
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        store.setTotalSpend(Number(values.value))
        store.setNewSpend({
            id: Math.random().toString(),
            value: values.value,
            date: createDateString(values.date),
            categorie: values.categories,
            description: values.description || '',
        })

        store.calculateTotalAfterExpence(Number(values.value))
        form.reset()
    }

    return (
        <Dialog>
            <Form {...form}>
                <DialogTrigger asChild>
                    <Button variant="outline">{t('expenses.expence')}</Button>
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
                                            placeholder="value"
                                            type="text"
                                            {...field}
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
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categoryKeys.map((item) => (
                                                <SelectItem
                                                    value={item}
                                                    key={item}
                                                >
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
                            <Button type="submit">{t('dialogs.submit')}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Form>
        </Dialog>
    )
}
