import axios from 'axios'

import { getApiUrl } from './apiUrl'
import { getToken } from './token'

// IC 后端权限接口（与 dashboard 共用同一套用户体系）：
// 与 dashboard 的 ic-request 一样直连后端原始地址（baseURL = http://<IC_HOST>:<IC_PORT>/device），
// 浏览器网络面板可直接看到完整请求 URL；需后端开启 CORS 允许 aipage 的 origin 与 token 请求头

export interface PermissionMenuItem {
  id?: number
  _id?: number
  name?: string
  path?: string
  enabled?: boolean
  children?: PermissionMenuItem[] | null
}

export interface MenuPermissions {
  一级菜单: PermissionMenuItem[]
  二级菜单: PermissionMenuItem[]
}

const instance = axios.create({
  baseURL: getApiUrl('device'),
  timeout: 30000,
  withCredentials: false,
})

/**
 * 查询当前 token 对应的菜单权限（等价 dashboard 的 getRolePermissions）。
 * token 头约定与 dashboard ic-request 保持一致：post/get 均带 token 头
 */
export async function fetchMenuPermissions(): Promise<MenuPermissions> {
  const token = getToken() || ''
  const resp = await instance.post(
    '/server/authority/menu/permissions',
    {},
    {
      headers: {
        post: { token },
        get: { token },
      } as any,
    },
  )
  const body = resp.data
  if (body && body.code === 200 && body.data) {
    return body.data as MenuPermissions
  }
  throw new Error((body && (body.msg || body.message)) || '权限接口返回异常')
}
