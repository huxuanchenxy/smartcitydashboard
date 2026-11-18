// token key 与 dashboard 保持同名（仅为命名约定，不代表数据共享）：
// - 当前方案（跨域独立站点）：两边 localStorage 互相不可见，
//   aipage 的 token 由 dashboard 通过 iframe URL query 传入，解析后写入 aipage 自己的 localStorage
// - 若未来改回同域部署：localStorage 天然共享，此代码无需改动即可直接读取
const TokenKey = 'DataS-Token'

export function getToken(): string | null {
  return localStorage.getItem(TokenKey)
}

export function setToken(token: string) {
  localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  localStorage.removeItem(TokenKey)
}

/**
 * 从 URL 中解析 dashboard 传入的 token（?token=xxx），并写入 localStorage。
 * 兼容两种地址形态：
 *   /aipage/index.html?token=xxx#/home
 *   /aipage/#/home?token=xxx
 */
export function resolveToken(): string | null {
  const hashQuery = window.location.hash.split('?')[1] || ''
  const search = window.location.search.slice(1) || hashQuery
  if (search) {
    const token = new URLSearchParams(search).get('token')
    if (token) {
      setToken(token)
    }
  }
  return getToken()
}

/** 判断当前是否被 dashboard 以 iframe 方式嵌入 */
export function isInIframe(): boolean {
  return window.self !== window.top
}

/**
 * dashboard 登录页地址（aipage 独立站点跨域部署时使用）。
 * VITE_APP_DASHBOARD_URL 为空时认为是同站部署，回退到本站 /#/login。
 */
export function getDashboardLoginUrl(): string {
  const base = String(import.meta.env.VITE_APP_DASHBOARD_URL || '').replace(/\/$/, '')
  return base ? `${base}/#/login` : '/#/login'
}

/** 未登录/登录失效时的统一跳转：iframe 内通知父窗口，独立访问时直接跳转 */
export function redirectToDashboardLogin() {
  removeToken()
  if (isInIframe()) {
    // 跨域 iframe 内无法直接跳 dashboard 页面，通知父窗口处理
    window.top?.postMessage({ type: 'aipage-auth-expired' }, '*')
    return
  }
  window.location.href = getDashboardLoginUrl()
}

/** dashboard 站点 origin（用于校验 postMessage 来源，防止伪造） */
export function getDashboardOrigin(): string {
  const base = String(import.meta.env.VITE_APP_DASHBOARD_URL || '').replace(/\/$/, '')
  if (base) {
    try {
      return new URL(base).origin
    } catch {
      return ''
    }
  }
  // 未配置 dashboard 地址时按同站部署处理
  return window.location.origin
}

/**
 * 监听 dashboard 主动推送的 token 同步（aipage-sync-token）。
 * URL query 只在 iframe 首次加载时携带，此后 token 变化（如重新登录）依赖此通道更新。
 */
export function startTokenSyncListener() {
  const expectedOrigin = getDashboardOrigin()
  window.addEventListener('message', (event: MessageEvent) => {
    if (!expectedOrigin || event.origin !== expectedOrigin) {
      return
    }
    const data = event.data
    if (data && data.type === 'aipage-sync-token' && typeof data.token === 'string' && data.token) {
      setToken(data.token)
    }
  })
}
