import axios from 'axios'
import { getToken, redirectToDashboardLogin } from './token'
import { getApiUrl } from './apiUrl'

const instance = axios.create({
  baseURL: getApiUrl('aipage'),
  timeout: 300000,
  withCredentials: false,
})

// request interceptor（token 头约定与 dashboard 保持一致）
instance.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.post.token = token
      config.headers.get.token = token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  },
)

// response interceptor
instance.interceptors.response.use(
  response => {
    const res = response.data

    // 如果自定义code不为200，则将其判断为错误
    if (res.code !== undefined && res.code !== 200) {
      let msg = ''
      if (res.message) {
        msg = res.message
      } else if (res.msg) {
        msg = res.msg
      } else {
        msg = 'System Error'
      }
      return Promise.reject(new Error(msg))
    }

    return response
  },
  error => {
    if (error.response && (error.response.status === 403 || error.response.status === 401)) {
      redirectToDashboardLogin()
      return Promise.reject({ data: { code: error.response.status, message: '登录失效，请重新登录' } })
    }
    return Promise.reject(error)
  },
)

export default instance
