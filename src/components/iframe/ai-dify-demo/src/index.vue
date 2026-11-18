<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <button :style="buttonStyle" @click="handleClick">
      <IconAi class="ai-icon" :style="iconStyle" />
    </button>
    
    <DifyRealDialog
      v-model:visible="difyApiDialogVisible"
      :role="config.role as '' | 'project_manager' | 'developer' | 'user'"
      :login-account="anonymousToken"
      :auth-token="anonymousToken"
      :anonymous="!!anonymousToken"
      @close="handleDifyApiDialogClose"
      @message-received="handleDifyApiMessageReceived"
      @message-sent="handleDifyApiMessageSent"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRef, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { AiDifyDemo } from './ai-dify-demo'
import { useDataCenter } from '@/mixins/data-center'
import DifyRealDialog from '@/components/dify-chatbot/DifyRealDialog.vue'
import { IconAi } from '@/icons'
import { getAnonymousToken } from '@/utils/dify-publish'

export default defineComponent({
  name: 'VAiDifyDemo',
  components: { DifyRealDialog, IconAi },
  props: {
    com: {
      type: Object as PropType<AiDifyDemo>,
      required: true,
    },
  },

  setup(props) {
    useDataCenter(props.com)

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    const comid = toRef(props.com, 'id').value
    
    const difyApiDialogVisible = ref(false)

    // 发布页匿名访问：用 URL 上的原始 token 作为 loginAccount / 鉴权 token，并标记为匿名（显示名回退角色名）；
    // 非发布页返回空串，DifyRealDialog 内部会回退到 localStorage 登录态。
    // 用 computed 而非一次性取值：hash 路由变化时 token 能随之更新。
    const anonymousToken = computed(() => getAnonymousToken())

    const buttonImage = computed(() => {
      return config.value.buttonImage
    })

    const handleClick = () => {
      console.log('AiDifyDemo button clicked')
      difyApiDialogVisible.value = true
    }
    
    const handleDifyApiDialogClose = () => {
      console.log('Dify API dialog closed')
    }
    
    const handleDifyApiMessageReceived = () => {
      console.log('Dify API message received')
    }
    
    const handleDifyApiMessageSent = () => {
      console.log('Dify API message sent')
    }

    const buttonSize = computed(() => {
      return Math.min(attr.value.w, attr.value.h) - 20
    })

    const buttonStyle = computed(() => {
      const style = {
        padding: '5px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#FFFFFF',
        width: `${buttonSize.value}px`,
        height: `${buttonSize.value}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
      return style as CSSProperties
    })

    const iconStyle = computed(() => {
      const iconSize = Math.max(16, buttonSize.value - 10)
      return {
        width: `${iconSize}px`,
        height: `${iconSize}px`,
      } as CSSProperties
    })

    const wrapperStyle = computed(() => {
      return {
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } as CSSProperties
    })

    return {
      buttonImage,
      buttonStyle,
      iconStyle,
      wrapperStyle,
      handleClick,
      comid,
      difyApiDialogVisible,
      anonymousToken,
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
      config,
    }
  },
})
</script>

<style scoped>
button {
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  opacity: 0.8;
}

.ai-icon {
  width: 24px;
  height: 24px;
}

.ai-icon svg {
  width: 100%;
  height: 100%;
}

.ai-icon svg path {
  fill: #333333;
}

button:hover .ai-icon svg path {
  fill: #FFFFFF;
}
</style>