import { CheckedState } from '@radix-ui/react-checkbox'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { authAxios } from 'config/axios.instances'
import { Routes } from 'constants/routes'
import { loginSetTokens } from 'lib/auth-helper'
import { clearCookies } from 'lib/logout'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
    LoginErrorResponse,
    LoginPayload,
    LoginResponseType,
    LogoutErrorResponse,
    LogoutPayload,
    LogoutResponseType,
    RefreshErrorResponse,
    RefreshPayload,
    RefreshResponseType,
    RegistrationErrorResponse,
    RegistrationPayload,
    RegistrationResponseType,
} from 'types/auth.types'

const login = async (payload: LoginPayload): Promise<LoginResponseType> => {
    const res = await authAxios.post('login', payload)
    return res.data
}

export const useLoginMutation = (rememberMe: CheckedState) => {
    const router = useRouter()
    return useMutation({
        mutationKey: ['login'],
        mutationFn: login,
        onSuccess: (data) => {
            if (data.accessToken) {
                loginSetTokens(data, rememberMe)
                toast.success('Login Success')
                router.push('/')
            }
        },
        onError: (error: AxiosError<LoginErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const registration = async (
    payload: RegistrationPayload
): Promise<RegistrationResponseType> => {
    const res = await authAxios.post('registration', payload)
    return res.data
}

export const useRegistrationMutation = () => {
    const router = useRouter()
    return useMutation({
        mutationKey: ['registration'],
        mutationFn: registration,
        onSuccess: () => {
            toast.success('Registration success! Login Please')
            router.push(Routes.LOGIN)
        },
        onError: (error: AxiosError<RegistrationErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const logout = async (payload: LogoutPayload): Promise<LogoutResponseType> => {
    const res = await authAxios.post('logout', payload)
    return res.data
}

export const useLogoutMutation = () => {
    const router = useRouter()
    return useMutation({
        mutationKey: ['logout'],
        mutationFn: logout,
        onSuccess: () => {
            clearCookies()
            router.replace(Routes.LOGIN)
        },
        onError: (error: AxiosError<LogoutErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

const refresh = async (
    payload: RefreshPayload
): Promise<RefreshResponseType> => {
    const res = await authAxios.post('refresh', payload)
    return res.data
}

export const useRefresh = () => {
    return useMutation({
        mutationKey: ['refresh'],
        mutationFn: refresh,
        onSuccess: (data) => {
            loginSetTokens(data, true)
        },
        onError: (error: AxiosError<RefreshErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}
