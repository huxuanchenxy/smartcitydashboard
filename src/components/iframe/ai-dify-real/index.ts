import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import AiDifyReal from './src/index.vue'

AiDifyReal.install = (app: App): void => {
  app.component(AiDifyReal.name, AiDifyReal)
  app.component('VAiDifyRealProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default AiDifyReal as SFCWithInstall<typeof AiDifyReal>
