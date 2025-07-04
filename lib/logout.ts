export const clearAfterLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
}
