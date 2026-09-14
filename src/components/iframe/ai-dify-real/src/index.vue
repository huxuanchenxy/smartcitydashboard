<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <!-- 内嵌模式：默认直接显示对话框，填满组件自身区域，不再通过按钮触发 -->
    <DifyRealDialog
      v-model:visible="difyApiDialogVisible"
      :inline="true"
      :fixed="true"
      :sidebar-width="config.sidebarWidth"
      :font-scale="config.fontScale"
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

    // 组件自身盒子：填满父级容器（大屏 .-datav-com），尺寸交由父级决定。
    // 用 100%×100% 而非固定 attr.w/h：这样「响应式铺满」模式下父级为视口尺寸时本组件随视口自适应，
    // 避免固定 1080 高度超出视口(如 945) 被 overflow:hidden 裁掉底部输入框/上传/发送按钮。
    const wrapperStyle = computed(() => {
      return {
        position: 'relative',
        width: '100%',
        height: '100%',
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
