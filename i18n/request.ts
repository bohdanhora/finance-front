import { LANG_COOKIES_NAME } from '@/app/constants'
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export default getRequestConfig(async () => {
    const cookiesLang = (await cookies()).get(LANG_COOKIES_NAME)?.value || 'en'

    const locale = cookiesLang

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    }
})
