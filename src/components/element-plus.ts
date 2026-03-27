import type { App } from 'vue'

import {
  ElTabPane,
  ElTabs,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElButton
} from 'element-plus'

const components = [
  ElTabPane,
  ElTabs,
  ElDialog,
  ElInput,
  ElInputNumber,
  ElButton
]

const install = (app: App): void => {
  app.config.globalProperties.$ELEMENT = { size: 'medium' }

  components.forEach(component => {
    app.component(component.name, component)
  })
}

export default {
  install,
}
