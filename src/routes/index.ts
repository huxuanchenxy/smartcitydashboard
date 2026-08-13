import * as loginJson from '@/../public/templates/login.json'

import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'

import { UserStore } from '@/domains/user'
import { getToken } from '@/utils/token-util'
import { globalConfig } from '@/config'
import { loginSettingModel } from './loginSettingModel'

const setting = loginJson.default as unknown as loginSettingModel

const navRoutes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    redirect: '/project',
    component: () => import('@/views/home/index.vue'),
    children: [
      {
        path: 'project',
        name: 'MyProject',
        component: () => import('@/views/project/Project/new-Project-list.vue'),
        meta: { title: '项目列表' },
      },
      {
        path: 'authority',
        name: 'Authority',
        component: () => import('@/views/project/User/authority.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/project/User/user.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'paramConfig',
        name: 'ParamConfig',
        component: () => import('@/views/project/NetWork/ParamConfig.vue'),
        meta: { title: '参数配置' },
      },
      {
        path: 'ServerConfig',
        name: 'ServerConfig',
        component: () => import('@/views/project/NetWork/ServerConfig.vue'),
        meta: { title: '设备管理器配置' },
      },
      {
        path: 'deviceType',
        name: 'DeviceType',
        component: () => import('@/views/project/NetWork/DeviceType.vue'),
        meta: { title: '设备管理' },
      },
      {
        path: 'colonyConfig',
        name: 'ColonyConfig',
        component: () => import('@/views/project/NetWork/ColonyConfig.vue'),
        meta: { title: '集群配置' },
      },
      {
        path: 'agentConfig',
        name: 'AgentConfig',
        component: () => import('@/views/project/NetWork/AgentConfig.vue'),
        meta: { title: 'Agent配置' },
      },
      {
        path: 'updatePassword',
        name: 'UpdatePassword',
        component: () => import('@/views/home/updatePassword.vue'),
        meta: { title: '更新登录密码' },
        props: true,
      },
    ],

  },
  {
    path: '/',
    name: 'ProjectMenu',
    redirect: '/cavans',
    component: () => import('@/views/home/menu.vue'),
    children: [
      {
        path: 'cavans',
        name: 'CavansList',
        component: () => import('@/views/my-project/index.vue'),
        meta: { title: '画布管理' },
      },
      {
        path: 'warning',
        name: 'WarningList',
        component: () => import('@/views/frames/warning/index.vue'),
        meta: { title: '报警规则' },
      },
      {
        path: 'history',
        name: 'HistoryList',
        component: () => import('@/views/frames/history-alarm/index.vue'),
        meta: { title: '历史报警' },
      },
      {
        path: 'report',
        name: 'ReportList',
        component: () => import('@/views/report/report.vue'),
        meta: { title: '报表' },
      },
      {
        path: 'device',
        name: 'DeviceList',
        component: () => import('@/views/device-management/device/index.vue'),
        meta: { title: '设备管理' },
      },
      {
        path: 'position',
        name: 'PositionList',
        component: () => import('@/views/device-management/position/index.vue'),
        meta: { title: '点位' },
      },
      {
        path: 'formula',
        name: 'FormulaList',
        component: () => import('@/views/formula/formula/index.vue'),
        meta: { title: '配方' },
      },
      {
        path: 'variate',
        name: 'VariateList',
        component: () => import('@/views/variate/index.vue'),
        meta: { title: '上位机变量' },
      },
      {
        path: 'hostComputer',
        name: 'HostComputer',
        component: () => import('@/views/host-computer/index.vue'),
        meta: { title: '上位机程序' },
      },
      {
        path: 'cavansRole',
        name: 'CavansRole',
        component: () => import('@/views/cavans-user/role/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'cavansUser',
        name: 'CavansUser',
        component: () => import('@/views/cavans-user/user/index.vue'),
        meta: { title: '用户管理' },
      },
      {
        path: 'cavansUserLocation',
        name: 'CavansUserLocation',
        component: () => import('@/views/cavans-user/user-location/index.vue'),
        meta: { title: '点位设置' },
      },
      {
        path: 'aipage',
        name: 'AiPage',
        component: () => import('@/views/aipage/index.vue'),
        meta: { title: 'AI页面' },
      },

      //   path: 'data',
      //   name: 'MyData',
      //   component: () => import('@/views/my-data/index.vue'),
      //   meta: { title: '我的数据' },
      // },
      // {
      //   path: 'com',
      //   name: 'MyCom',
      //   component: () => import('@/views/my-com/index.vue'),
      //   meta: { title: '我的组件' },
      // },
      // {
      //   path: 'system',
      //   name: 'SystemSetting',
      //   component: () => import('@/views/my-com/system-setting.vue'),
      //   meta: { title: '系统配置' },
      // },
      // {
      //   path: 'case',
      //   name: 'MyCase',
      //   component: () => import('@/views/my-case/index.vue'),
      //   meta: { title: '教程' },
      // },
    ],
  },
]

const routes: Array<RouteRecordRaw> = [

  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/login.vue'),
    meta: { title: '登录' },
  },
  ...navRoutes,
  {
    path: '/create-screen',
    name: 'CreateScreen',
    component: () => import('@/views/my-project/create-screen.vue'),
    meta: { title: '创建' },
  },
  {
    path: '/admin/screen2/:projectId',
    name: 'ScreenEditor2',
    props: true,
    component: () => import('@/views/screen-editor/index.vue'),
    meta: { title: '编辑器' },
  },
  {
    path: '/admin/screen/:projectId/:groupId?/:token?',
    name: 'ScreenEditor',
    props: true,
    component: () => import('@/views/screen-editor/index-new.vue'),
    meta: { title: '编辑器' },
  },
  {
    path: '/screen/preview/:screenId/:token?',
    name: 'Preview',
    props: true,
    component: () => import('@/views/screen/index.vue'),
  },
  {
    path: '/publish/:screenId',
    name: 'publish',
    props: true,
    component: () => import('@/views/screen/publish.vue'),
  },
  {
    path: '/admin/screen/cache',
    name: 'ScreenCache',
    component: () => import('@/views/screen/cache.vue'),
    meta: { title: '缓存管理' },
  },
  {
    path: '/admin/screen/searichat',
    name: 'SeariChat',
    component: () => import('@/views/screen/searichat.vue'),
    meta: { title: '开发人员' },
  },
  {
    path: '/admin/screen/searichatpm',
    name: 'SeariChatPM',
    component: () => import('@/views/screen/searichatpm.vue'),
    meta: { title: '项目经理' },
  },
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/index.vue'),
    meta: { title: '找不到页面' },
  },
]

if (__DEV__) {
  routes.unshift(
    {
      path: '/dev/props-config',
      name: 'DevPropsConfig',
      component: () => import('@/pages/props-config/index.vue'),
      meta: { title: '属性配置' },
    },
  )
}

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})


const whiteList = ['/login', '/auth-redirect', '/dev', '/publish', '/updatePassword','/admin/screen','/screen/preview'] // no redirect whitelist

router.beforeEach(async (to, from, next) => {
  // set page title
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} | ${globalConfig.title}`
  } else {
    document.title = globalConfig.title
  }


  //getToken()
  //next()

  if (setting.needLogin) {
    const hasToken = getToken()
    if (hasToken) {
      if (to.path === '/login') {
        next({ path: '/' })
      } else {
        const { role, getUserInfo, resetToken } = UserStore()
        if (role.value > 0) {
          next()
        } else {
          try {
            //await getUserInfo()
            //next({ ...to, replace: true })
            next()
          } catch (error) {
            resetToken()
            next(`/login?redirect=${to.path}`)
          }
        }
      }
    } else if (whiteList.some(m => to.path.startsWith(m))) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
    }
  }
  else {
    next()
  }


})


export default router
