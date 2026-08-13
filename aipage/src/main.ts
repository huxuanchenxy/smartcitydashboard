import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { startTokenSyncListener } from './utils/token'

// 监听 dashboard 通过 postMessage 推送的 token 同步（跨域 iframe 场景）
startTokenSyncListener()

createApp(App)
  .use(router)
  .mount('#app')
