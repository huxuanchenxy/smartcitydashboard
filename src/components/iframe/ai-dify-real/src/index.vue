<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <!-- 内嵌模式：默认直接显示对话框，填满组件自身区域，不再通过按钮触发 -->
    <DifyRealDialog
      v-model:visible="difyApiDialogVisible"
      :inline="true"
      :fixed="true"
      :sidebar-width="config.sidebarWidth"
      :role="config.role as '' | 'project_manager' | 'developer' | 'user'"
      @close="handleDifyApiDialogClose"
      @message-received="handleDifyApiMessageReceived"
      @message-sent="handleDifyApiMessageSent"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRef, ref } from 'vue'
import type { CSSProperties } from 'vue'
import { AiDifyReal } from './ai-dify-real'
import { useDataCenter } from '@/mixins/data-center'
import DifyRealDialog from '@/components/dify-chatbot/DifyRealDialog.vue'

export default defineComponent({
  name: 'VAiDifyReal',
  components: { DifyRealDialog },
  props: {
    com: {
      type: Object as PropType<AiDifyReal>,
      required: true,
    },
  },

  setup(props) {
    useDataCenter(props.com)

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    const comid = toRef(props.com, 'id').value

    // 内嵌展示，默认即为显示状态
    const difyApiDialogVisible = ref(true)

    const handleDifyApiDialogClose = () => {
      console.log('Dify API dialog closed')
    }

    const handleDifyApiMessageReceived = () => {
      console.log('Dify API message received')
    }

    const handleDifyApiMessageSent = () => {
      console.log('Dify API message sent')
    }

    // 组件自身盒子：作为内嵌对话框的容器，铺满 attr 指定的宽高
    const wrapperStyle = computed(() => {
      return {
        position: 'relative',
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
        overflow: 'hidden',
      } as CSSProperties
    })

    return {
      wrapperStyle,
      comid,
      difyApiDialogVisible,
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
      config,
    }
  },
})
</script>
