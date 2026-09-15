import axios from 'axios'
import { getToken, removeToken } from './token-util'
import { EditorModule } from '@/store/modules/editor'
import router from '@/routes'

const instance = axios.create()

// request interceptor
instance.interceptors.request.use(
  config => {

    if(config.url.indexOf(import.meta.env.VITE_App_AGENT_TOKEN) >= 0)
    {
      let token = getToken()
      if(!token)
      {
        token = EditorModule.agent_umbrella_token
      }

      config.headers.post._agent_umbrella_token_ = token
      config.headers.get._agent_umbrella_token_ = token
    }

    return config
  },
  error => {
    if(error.response.status == 403)
    {
      removeToken()
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: {redirect:router.currentRoute.value.fullPath} })
      }
      return Promise.reject({ data : { code :403 ,message:'登录失效，请重新登录' } })
    }
    else if(error.response.status == 401)
    {
      removeToken()
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: {redirect:router.currentRoute.value.fullPath} })
      }
      return Promise.reject({ data : { code :401 ,message:'登录失效，请重新登录' } })
    }
    else
    {
      return Promise.reject(error)
    }
  },
)

// response interceptor
instance.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  },
)

export default instance
