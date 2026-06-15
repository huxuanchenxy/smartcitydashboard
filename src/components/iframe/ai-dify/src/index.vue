<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <button :style="buttonStyle" @click="handleClick">
      <IconAi class="ai-icon" />
    </button>
    
    <!-- Dify API 聊天机器人弹框 -->
    <DifyApiDialog
      v-model:visible="difyApiDialogVisible"
      :data="difyData"
      @close="handleDifyApiDialogClose"
      @message-received="handleDifyApiMessageReceived"
      @message-sent="handleDifyApiMessageSent"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRef, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { AiDify } from './ai-dify'
import { useDataCenter } from '@/mixins/data-center'
import DifyApiDialog from '@/components/dify-chatbot/DifyApiDialog.vue'
import { IconAi } from '@/icons'

export default defineComponent({
  name: 'VAiDify',
  components: { DifyApiDialog, IconAi },
  props: {
    com: {
      type: Object as PropType<AiDify>,
      required: true,
    },
  },

  setup(props) {
    useDataCenter(props.com)

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    const comid = toRef(props.com, 'id').value
    
    // Dify API 聊天机器人相关状态
    const difyApiDialogVisible = ref(false)
    const difyData = ref({})

    const buttonImage = computed(() => {
      return config.value.buttonImage
    })

    const handleClick = () => {
      console.log('AiDify button clicked')
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

    const buttonStyle = computed(() => {
      const style = {
        padding: '10px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#FFFFFF',
      }
      return style as CSSProperties
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
      wrapperStyle,
      handleClick,
      comid,
      difyApiDialogVisible,
      difyData,
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
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
