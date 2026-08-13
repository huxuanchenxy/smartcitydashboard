<template>
  <iframe ref="iframeRef" class="aipage-frame" :src="aipageUrl" frameborder="0" allow="fullscreen" @load="sendTokenToAipage"></iframe>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToken } from '@/utils/token-util'

// aipage 作为独立站点部署的完整地址（跨域 iframe 嵌入，不走代理）
// 为空时回退到同域 /aipage 路径（兼容 Nginx 同域部署方式）
const AIPAGE_URL = String(import.meta.env.VITE_APP_AIPAGE_URL || '/aipage').replace(/\/$/, '')
const AIPAGE_ORIGIN = new URL(AIPAGE_URL, window.location.origin).origin

export default defineComponent({
  name: 'AiPageView',
  setup() {
    const router = useRouter()
    const iframeRef = ref<HTMLIFrameElement>()

    // 跨域 iframe 不共享 localStorage，token 只能通过 URL query 传递
    const aipageUrl = computed(() => {
      const token = getToken() || ''
      // 可调整 #/home 以控制进入 aipage 的具体页面
      return `${AIPAGE_URL}/index.html?token=${encodeURIComponent(token)}#/home`
    })

    // 主动向 iframe 推送最新 token（指定 targetOrigin，跨域安全）：
    // URL query 只在 iframe 首次加载时携带，此后 token 变化（如重新登录）依赖此通道
    const sendTokenToAipage = () => {
      const token = getToken() || ''
      if (token) {
        iframeRef.value?.contentWindow?.postMessage({ type: 'aipage-sync-token', token }, AIPAGE_ORIGIN)
      }
    }

    // 其他标签页重新登录导致 token 变化时，同步推送给 iframe
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'DataS-Token') {
        sendTokenToAipage()
      }
    }

    // 监听 aipage 登录失效通知，校验来源 origin 防止伪造（跨域安全）
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== AIPAGE_ORIGIN) {
        return
      }
      if (event.data && event.data.type === 'aipage-auth-expired') {
        router.push('/login')
      }
    }

    onMounted(() => {
      window.addEventListener('message', onMessage)
      window.addEventListener('storage', onStorage)
    })

    onUnmounted(() => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('storage', onStorage)
    })

    return { aipageUrl, iframeRef, sendTokenToAipage }
  },
})
</script>

<style lang="scss" scoped>
.aipage-frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 168px);
  border: none;
}
</style>
