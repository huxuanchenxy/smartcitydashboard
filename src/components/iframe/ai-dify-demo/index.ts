import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import AiDifyDemo from './src/index.vue'

AiDifyDemo.install = (app: App): void => {
  app.component(AiDifyDemo.name, AiDifyDemo)
  app.component('VAiDifyDemoProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default AiDifyDemo as SFCWithInstall<typeof AiDifyDemo>