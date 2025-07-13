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

        if (
            error.response?.data?.message === 'Invalid Token' &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true

            try {
                const refreshToken = Cookies.get('refreshToken')

                if (!refreshToken) {
                    Cookies.remove('accessToken')
                    Cookies.remove('refreshToken')
                    if (typeof window !== 'undefined') {
                        window.location.href = Routes.LOGIN
                    }
                    return Promise.reject(new Error('No refresh token found'))
                }

                const res = await authAxios.post('/refresh', { refreshToken })

                const newToken = res.data.accessToken
                const newRefreshToken = res.data.refreshToken

                Cookies.set('accessToken', newToken, {
                    secure: true,
                    expires: 3,
                })
                Cookies.set('refreshToken', newRefreshToken, {
                    secure: true,
                    expires: 3,
                })

                const newRequest = {
                    ...originalRequest,
                    headers: {
                        ...originalRequest.headers,
                        Authorization: `Bearer ${newToken}`,
                    },
                }

                return transactionsAxios(newRequest)
            } catch (refreshError) {
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
