import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import RangeNumberFlop from './src/index.vue'

RangeNumberFlop.install = (app: App): void => {
  app.component(RangeNumberFlop.name, RangeNumberFlop)
  app.component('VRangeNumberFlopProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default RangeNumberFlop as SFCWithInstall<typeof RangeNumberFlop>