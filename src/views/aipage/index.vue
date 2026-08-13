<template>
  <iframe class="aipage-frame" :src="aipageUrl" frameborder="0" allow="fullscreen"></iframe>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, onUnmounted } from 'vue'
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

    // 跨域 iframe 不共享 localStorage，token 只能通过 URL query 传递
    const aipageUrl = computed(() => {
      const token = getToken() || ''
      // 可调整 #/home 以控制进入 aipage 的具体页面
      return `${AIPAGE_URL}/index.html?token=${encodeURIComponent(token)}#/home`
    })

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
    })

    onUnmounted(() => {
      window.removeEventListener('message', onMessage)
    })

    return { aipageUrl }
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
