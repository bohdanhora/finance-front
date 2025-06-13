'use client'

import * as React from 'react'

import { Button } from '../components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { LANG_COOKIES_NAME } from '../constants'
import { useTranslations } from 'next-intl'

export function LangugaeDropdown() {
    const [language, setLanguage] = React.useState('')
    const router = useRouter()
    const t = useTranslations('navbar')

    React.useEffect(() => {
        const cookieLocale = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${LANG_COOKIES_NAME}=`))
            ?.split('=')[1]

        if (cookieLocale) {
            setLanguage(cookieLocale)
        } else {
            const browserLocale = navigator.language.slice(0, 2)
            setLanguage(browserLocale)
            document.cookie = `${LANG_COOKIES_NAME}=${browserLocale};`
            router.refresh()
        }
    }, [router])

    const changeLanguage = (newLanguage: string) => {
        setLanguage(newLanguage)
        document.cookie = `${LANG_COOKIES_NAME}=${newLanguage};`
        router.refresh()
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">{t('lang')}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-fit">
                <DropdownMenuRadioGroup
                    value={language}
                    onValueChange={changeLanguage}
                >
                    <DropdownMenuRadioItem value="ru">
                        {t('ru')}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="en">
                        {t('en')}
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
