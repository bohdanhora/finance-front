import { LoginResponseType } from 'types/index'

export const loginSetTokens = ({
    accessToken,
    refreshToken,
}: LoginResponseType) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
}
