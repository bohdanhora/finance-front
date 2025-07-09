import axios from 'axios'
import { Routes } from 'constants/routes'
import Cookies from 'js-cookie'

const url = process.env.NEXT_PUBLIC_API_URL

const authAxios = axios.create({
    baseURL: `${url}/auth`,
})

const transactionsAxios = axios.create({
    baseURL: `${url}/transactions`,
    headers: {},
})

transactionsAxios.interceptors.request.use((config) => {
    const token = Cookies.get('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

transactionsAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        console.log('error', error)

        if (
            error.response?.data?.message === 'Invalid Token' &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true

            try {
                const refreshToken = Cookies.get('refreshToken')
                console.log('refreshToken', refreshToken)

                if (!refreshToken) {
                    Cookies.remove('accessToken')
                    Cookies.remove('refreshToken')
                    if (typeof window !== 'undefined') {
                        window.location.href = Routes.LOGIN
                    }
                    return Promise.reject(new Error('No refresh token found'))
                }

                const res = await authAxios.post('/refresh', { refreshToken })
                console.log('res after refresh', refreshToken)

                const newToken = res.data.accessToken
                console.log('newToken', refreshToken)

                Cookies.set('accessToken', newToken, { secure: true })

                const newRequest = {
                    ...originalRequest,
                    headers: {
                        ...originalRequest.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                }
                console.log('new req', newRequest)

                return transactionsAxios(newRequest)
            } catch (refreshError) {
                console.log('refresh error', refreshError)
                Cookies.remove('accessToken')
                Cookies.remove('refreshToken')
                if (typeof window !== 'undefined') {
                    window.location.href = Routes.LOGIN
                }
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export { authAxios, transactionsAxios }
