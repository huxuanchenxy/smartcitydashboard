<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <button :style="buttonStyle" @click="handleClick">
      <IconAi class="ai-icon" :style="iconStyle" />
    </button>
    
    <DifyRealDialog
      v-if="useRealDialog"
      v-model:visible="difyApiDialogVisible"
      :role="config.role as '' | 'project_manager' | 'developer' | 'user'"
      :font-scale="fontScale"
      :sidebar-width="sidebarWidth"
      :login-account="anonymousToken"
      :auth-token="anonymousToken"
      :anonymous="!!anonymousToken"
      :com="dialogCom"
      @close="handleDifyApiDialogClose"
      @message-received="handleDifyApiMessageReceived"
      @message-sent="handleDifyApiMessageSent"
    />
    <DifyApiDemoDialog
      v-else
      v-model:visible="difyApiDialogVisible"
      :role="config.role"
      :font-scale="fontScale"
      :com="dialogCom"
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
import DifyApiDemoDialog from '@/components/dify-chatbot/DifyApiDemoDialog.vue'
import DifyRealDialog from '@/components/dify-chatbot/DifyRealDialog.vue'
import { getAnonymousToken } from '@/utils/dify-publish'
import { resolveDifyDialogType } from '@/utils/dify-dialog'
import { IconAi } from '@/icons'

export default defineComponent({
  name: 'VAiDifyDemo',
  components: { DifyApiDemoDialog, DifyRealDialog, IconAi },
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

    // 对话实现切换：组件面板显式选择优先，否则跟随 VITE_APP_DIFY_DIALOG_TYPE（env 无效时兜底 demo）
    const useRealDialog = computed(() => resolveDifyDialogType(config.value.dialogType, 'demo') === 'real')
    // Real 对话框参数（老项目缺字段时给默认值，避免 undefined 传进对话框）
    const sidebarWidth = computed(() => config.value.sidebarWidth ?? 300)
    const fontScale = computed(() => config.value.fontScale ?? 1)
    // 对话框内部期望的 com 是普通配置对象，而不是 DatavComponent 实例
    const dialogCom = computed(() => ({
      buttonImage: config.value.buttonImage || '',
      buttonStyle: config.value.buttonStyle || {
        backgroundColor: '#409eff',
        hoverBackgroundColor: '#66b1ff',
      },
      role: config.value.role || '',
    }))
    // 发布页匿名访问时，把 URL token 下发给 Real 对话框作为会话归属与鉴权依据
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
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
      config,
      useRealDialog,
      sidebarWidth,
      fontScale,
      dialogCom,
      anonymousToken,
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