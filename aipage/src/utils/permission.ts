import axios from 'axios'

import { getToken } from './token'

// IC 后端权限接口（与 dashboard 共用同一套用户体系）：
// 开发态走 vite 同源代理 /device → VITE_APP_IC_HOST:VITE_APP_IC_PORT（见 vite.config.ts），规避 CORS；
// 生产部署需 nginx 配置等价 location /device/ { proxy_pass http://<IC_HOST>:<IC_PORT>/device/; }

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

/**
 * 查询当前 token 对应的菜单权限（等价 dashboard 的 getRolePermissions）。
 * token 头约定与 dashboard ic-request 保持一致：post/get 均带 token 头
 */
export async function fetchMenuPermissions(): Promise<MenuPermissions> {
  const token = getToken() || ''
  const resp = await axios.post(
    '/device/server/authority/menu/permissions',
    {},
    {
      timeout: 30000,
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
