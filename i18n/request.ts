import { LANG_COOKIES_NAME, normalizeLocale } from "constants/index";
import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export default getRequestConfig(async () => {
    const cookiesLang = (await cookies()).get(LANG_COOKIES_NAME)?.value;
    const acceptLanguage = (await headers()).get("accept-language")?.split(",")[0];

    const locale = normalizeLocale(cookiesLang || acceptLanguage);

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
