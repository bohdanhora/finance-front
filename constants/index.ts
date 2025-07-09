export enum ISO4217Codes {
    UAH = 980,
    USD = 840,
    EUR = 978,
}

export enum CURRENCY {
    USD = 'usd',
    EUR = 'eur',
}

export enum EssentialsType {
    DEFAULT = 'default',
    THIS_MONTH = 'this-month',
    NEXT_MONTH = 'next-month',
}

export enum TransactionEnum {
    EXPENCE = 'expence',
    INCOME = 'income',
}

export const LANG_COOKIES_NAME = 'LANG_FINANCE'
export const CURRENCY_COOKIES_NAME = 'CURRENCY_FINANCE'

export const DefaultEssentialsArray = [
    {
        id: '1',
        amount: 14000,
        title: 'Квартплата',
        checked: false,
    },
    {
        id: '2',
        amount: 3900,
        title: 'Коммуналка',
        checked: false,
    },
    {
        id: '3',
        amount: 660,
        title: 'Вода 4 бутылки',
        checked: false,
    },
    {
        id: '4',
        amount: 300,
        title: 'Интернет',
        checked: false,
    },
    {
        id: '5',
        amount: 600,
        title: 'Телефоны',
        checked: false,
    },
    {
        id: '6',
        amount: 1000,
        title: 'Подписки',
        checked: false,
    },
]
