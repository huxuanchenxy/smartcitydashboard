import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import { redirectToDashboardLogin, resolveToken } from '@/utils/token'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '首页' },
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/views/error/forbidden.vue'),
    meta: { title: '无权限' },
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta && to.meta.title ? `${to.meta.title} | AI Page` : 'AI Page'

  // 1. 优先消费 dashboard 通过 URL 传入的 token（跨域嵌入时 localStorage 不共享，这是唯一来源）
  const token = resolveToken()
  if (!token && to.path !== '/forbidden') {
    // 未登录直接访问：iframe 内通知父窗口，独立访问时跳 dashboard 登录页
    redirectToDashboardLogin()
    return
  }

  // 2. 如需按角色细分权限，可在此处用 token 请求后端获取角色后判断：
  //    无权限时 next({ path: '/forbidden' })

  next()
})

export default router
