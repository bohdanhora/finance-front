import axios from 'axios'

const url = process.env.NEXT_PUBLIC_API_URL

const authAxios = axios.create({
    baseURL: `${url}/auth`,
})

export default authAxios
