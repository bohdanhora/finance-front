import { LoginResponseType } from 'types/index'

export const loginSetTokens = ({
    accessToken,
    refreshToken,
    userId,
}: LoginResponseType) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('userId', userId)
}
