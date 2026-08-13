// 与 dashboard 的 apiUrl 逻辑保持一致，复用同一套部署环境变量
export function getApiUrl(urlPart: string) {
  let fullUrl = ''

  if (import.meta.env.VITE_APP_IC_HOST) {
    fullUrl = `${window.location.protocol}//${import.meta.env.VITE_APP_IC_HOST}`
  } else {
    fullUrl = `${window.location.protocol}//${window.location.hostname}`
  }

  if (import.meta.env.VITE_APP_IC_PORT) {
    fullUrl += `:${import.meta.env.VITE_APP_IC_PORT}`
  }

  // 后端需要为 aipage 提供 /aipage 前缀的接口（与 dashboard 共用同一套用户体系鉴权）
  return `${fullUrl}/${urlPart}`
}
