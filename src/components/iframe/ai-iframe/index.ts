import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import AiIframe from './src/index.vue'

AiIframe.install = (app: App): void => {
  app.component(AiIframe.name, AiIframe)
  app.component('VAiIframeProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default AiIframe as SFCWithInstall<typeof AiIframe>