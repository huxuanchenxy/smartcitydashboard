// 与 dashboard 保持同一个 key：
// 1. 同域部署时 localStorage 共享，可直接读取 dashboard 写入的 token
// 2. iframe 跨域嵌入时由 dashboard 通过 URL query 传入，解析后写入本地
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
