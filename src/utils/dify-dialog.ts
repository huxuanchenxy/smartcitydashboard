/**
 * AI 对话组件（AiDifyDemo / AiDifyReal）使用哪个 Dialog 的解析逻辑。
 *
 * 优先级：组件属性面板里的 dialogType > 环境变量 VITE_APP_DIFY_DIALOG_TYPE > 兜底值。
 * 环境变量在 Vite 启动时读入，修改 viteEnv/.env* 后需要重启 dev server 或重新构建。
 */

export type DifyDialogType = 'demo' | 'real'

const isDifyDialogType = (value: unknown): value is DifyDialogType =>
  value === 'demo' || value === 'real'

/** 读取环境变量中的全局默认值；未配置或值非法时返回空串，交给调用方兜底 */
export const getEnvDifyDialogType = (): DifyDialogType | '' => {
  const raw = String(import.meta.env.VITE_APP_DIFY_DIALOG_TYPE || '').trim().toLowerCase()
  return isDifyDialogType(raw) ? raw : ''
}

/**
 * 解析最终使用的 Dialog。
 * configured 为组件 config.dialogType：'env' / undefined / 非法值都表示「跟随环境」。
 */
export const resolveDifyDialogType = (
  configured: unknown,
  fallback: DifyDialogType = 'real',
): DifyDialogType => {
  if (isDifyDialogType(configured)) return configured
  return getEnvDifyDialogType() || fallback
}
