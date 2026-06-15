<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <button :style="buttonStyle" @click="handleClick">
      <img :src="buttonImage" style="height: 40px; width: 40px;">
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

export default defineComponent({
  name: 'VAiDify',
  components: { DifyApiDialog },
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
      const bs = config.value.buttonStyle
      const style = {
        padding: '10px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: bs.backgroundColor,
        hoverBackgroundColor: bs.hoverBackgroundColor,
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
