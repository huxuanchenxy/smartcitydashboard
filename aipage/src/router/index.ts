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
    // 知识库管理台（演示环境，假数据）：数据集 / 文档 / chunks / 召回测试
    path: '/console',
    component: () => import('@/views/console/layout.vue'),
    children: [
      { path: '', redirect: '/console/datasets' },
      {
        path: 'datasets',
        name: 'ConsoleDatasets',
        component: () => import('@/views/console/datasets.vue'),
        meta: { title: '数据集' },
      },
      {
        path: 'datasets/:id',
        name: 'ConsoleDocuments',
        component: () => import('@/views/console/documents.vue'),
        meta: { title: '文档管理' },
      },
      {
        path: 'datasets/:id/docs/:docId/chunks',
        name: 'ConsoleChunks',
        component: () => import('@/views/console/chunks.vue'),
        meta: { title: 'Chunks' },
      },
      {
        path: 'retrieval',
        name: 'ConsoleRetrieval',
        component: () => import('@/views/console/retrieval.vue'),
        meta: { title: '召回测试' },
      },
    ],
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
