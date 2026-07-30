<template>
  <div class="searichat-page">
    <div class="searichat-header">
    </div>
    <button class="ai-chat-trigger" @click="showAiDialog = true"></button>
    <DifyApiDemoDialog
      v-model:visible="showAiDialog"
      :role="'developer'"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import DifyApiDemoDialog from "@/components/dify-chatbot/DifyApiDemoDialog.vue";

const showAiDialog = ref(false);
</script>

<style scoped>
.searichat-page {
  min-height: 100vh;
  background-image: url('/images/ScreenShot.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 20px;
  position: relative;
}

.searichat-header {
  margin-bottom: 20px;
}

.searichat-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.searichat-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.ai-chat-trigger {
    position: absolute;
    top: 1%;
    width: 50px;
    height: 50px;
    background: transparent;
    border: none;
    cursor: pointer;
    outline: none;
    z-index: 10;
    right: 16%;
}

.ai-chat-trigger:hover {
  background: rgba(253, 253, 253, 0.1);
  border-radius: 4px;
}
</style>
