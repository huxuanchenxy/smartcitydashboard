<template>
  <div ref="containerRef" class="agent-config-page">
    <DifyApiDemoDialog
      v-model:visible="showDialog"
      title="Agent 配置助手"
      :no-mask="true"
      :initial-position="initialPosition"
      :initial-size="initialSize"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import DifyApiDemoDialog from '@/components/dify-chatbot/DifyApiDemoDialog.vue'

export default defineComponent({
  name: 'AgentConfig',
  components: {
    DifyApiDemoDialog,
  },
  setup() {
    const showDialog = ref(true)
    const containerRef = ref<HTMLElement | null>(null)
    const initialPosition = ref<{ x: number; y: number } | null>(null)
    const initialSize = ref<{ width: number; height: number } | null>(null)

    onMounted(() => {
      if (containerRef.value) {
        const rect = containerRef.value.getBoundingClientRect()
        initialPosition.value = { x: rect.left, y: rect.top }
        initialSize.value = {
          width: Math.floor(rect.width / 2),
          height: rect.height,
        }
      }
    })

    return {
      showDialog,
      containerRef,
      initialPosition,
      initialSize,
    }
  },
})
</script>

<style scoped>
.agent-config-page {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
