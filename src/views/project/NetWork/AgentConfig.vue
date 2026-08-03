<template>
  <div class="agent-config-page">
    <DifyApiDemoDialog
      v-model:visible="showDialog"
      title="Agent 配置助手"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import DifyApiDemoDialog from '@/components/dify-chatbot/DifyApiDemoDialog.vue'

export default defineComponent({
  name: 'AgentConfig',
  components: {
    DifyApiDemoDialog,
  },
  setup() {
    const showDialog = ref(true)

    return {
      showDialog,
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
