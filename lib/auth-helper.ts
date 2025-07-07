import Cookies from 'js-cookie'
import { LoginResponseType } from 'types/auth.types'

export const loginSetTokens = ({
    accessToken,
    refreshToken,
    userId,
}: LoginResponseType) => {
    Cookies.set('accessToken', accessToken, { expires: 1 })
    Cookies.set('refreshToken', refreshToken, { expires: 3 })
    Cookies.set('userId', userId, { expires: 3 })
}
