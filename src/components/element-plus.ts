import type { App } from 'vue'

import {
  ElTabPane,
  ElTabs,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElButton,
  // 后台配置弹窗（BackendConfigDialog）需要以下组件；未注册时 <el-table> 会被当成
  // 未知原生标签渲染，导致 el-table-column 内部 inject 父表格上下文为 undefined，
  // 抛 "Cannot read properties of undefined (reading 'deep')"。
  ElTable,
  ElTableColumn,
  ElForm,
  ElFormItem,
  ElSwitch,
  ElPagination,
  ElTooltip,
  ElLoading,
} from 'element-plus'

const components = [
  ElTabPane,
  ElTabs,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElButton,
  ElTable,
  ElTableColumn,
  ElForm,
  ElFormItem,
  ElSwitch,
  ElPagination,
  ElTooltip,
]

const install = (app: App): void => {
  app.config.globalProperties.$ELEMENT = { size: 'medium' }

  components.forEach(component => {
    app.component(component.name, component)
  })

  // v-loading 指令（Element Plus 未通过 app.use 全量安装，需手动注册）
  app.directive('loading', ElLoading.directive)
  // 供 ElLoading.service() 使用（如全屏 loading）
  app.config.globalProperties.$loading = ElLoading.service
}

export default {
  install,
}
