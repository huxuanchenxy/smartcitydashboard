import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import AiDify from './src/index.vue'

AiDify.install = (app: App): void => {
  app.component(AiDify.name, AiDify)
  app.component('VAiDifyProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default AiDify as SFCWithInstall<typeof AiDify>
