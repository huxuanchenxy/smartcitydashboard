import type { App } from 'vue'
import type { SFCWithInstall } from '@/utils/types'
import { loadAsyncComponent } from '@/utils/async-component'
import PgmEditor from './src/index.vue'

PgmEditor.install = (app: App): void => {
  app.component(PgmEditor.name, PgmEditor)
  app.component('VPgmEditorProp', loadAsyncComponent(() => import('./src/config.vue')))
}

export default PgmEditor as SFCWithInstall<typeof PgmEditor>