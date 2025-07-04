import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import authAxios from 'config/axios.instances'
import { Routes } from 'constants/routes'
import { loginSetTokens } from 'lib/auth-helper'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import {
    LoginErrorResponse,
    LoginPayload,
    LoginResponseType,
    RegistrationErrorResponse,
    RegistrationPayload,
    RegistrationResponseType,
} from 'types/index'

export const login = async (
    payload: LoginPayload
): Promise<LoginResponseType> => {
    const res = await authAxios.post('login', payload)
    return res.data
}

export const useLoginMutation = () => {
    const router = useRouter()
    return useMutation({
        mutationKey: ['login'],
        mutationFn: login,
        onSuccess: (data) => {
            if (data.accessToken) {
                loginSetTokens(data)
                toast.success('Login Success')
                router.push('/')
            }
        },
        onError: (error: AxiosError<LoginErrorResponse>) => {
            toast.error(error.response?.data.message)
        },
    })
}

export const registration = async (
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
