<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :before-close="handleClose"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="dify-chatbot-container">
      <iframe
        :src="iframeSrc"
        style="width: 100%; height: 100%; min-height: 700px"
        frameborder="0"
        allow="microphone"
        ref="iframeRef"
      ></iframe>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleSendData">发送数据</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted, PropType } from 'vue';

export default defineComponent({
  name: 'DifyChatbotDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Dify 聊天机器人'
    },
    width: {
      type: String,
      default: '80%'
    },
    difyToken: {
      type: String,
      default: 'YbHQ6fwgitbVujQP'
    },
    baseUrl: {
      type: String,
      default: 'http://10.89.34.9'
    },
    data: {
      type: Object as PropType<any>,
      default: () => ({})
    }
  },
  emits: ['update:visible', 'close', 'data-sent', 'data-received'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const iframeRef = ref<HTMLIFrameElement | null>(null);
    const iframeSrc = ref(`${props.baseUrl}/chatbot/${props.difyToken}`);

    // 监听 visible 属性变化
    watch(
      () => props.visible,
      (newVal) => {
        dialogVisible.value = newVal;
      }
    );

    // 监听 dialogVisible 变化，通知父组件
    watch(
      dialogVisible,
      (newVal) => {
        emit('update:visible', newVal);
        
        // 当弹框打开时，向 iframe 发送初始数据
        if (newVal && props.data) {
          setTimeout(() => {
            sendDataToIframe({
              type: 'INITIAL_DATA',
              data: props.data,
              timestamp: new Date().toISOString()
            });
          }, 1000); // 等待 iframe 加载完成
        }
      }
    );

    // 处理关闭事件
    const handleClose = () => {
      dialogVisible.value = false;
      emit('close');
    };

    // 向 iframe 发送数据
    const sendDataToIframe = (data: any) => {
      if (iframeRef.value && iframeRef.value.contentWindow) {
        iframeRef.value.contentWindow.postMessage(data, '*');
        console.log('Data sent to iframe:', data);
      }
    };

    // 处理发送数据按钮点击
    const handleSendData = () => {
      const sendData = {
        type: 'FROM_PARENT',
        data: props.data,
        timestamp: new Date().toISOString()
      };
      sendDataToIframe(sendData);
      emit('data-sent', sendData);
    };

    // 接收来自 iframe 的数据
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源
      if (event.origin === props.baseUrl) {
        console.log('Data received from iframe:', event.data);
        emit('data-received', event.data);
      }
    };

    onMounted(() => {
      // 监听消息事件
      window.addEventListener('message', handleMessage);
    });

    // 清理事件监听器
    onUnmounted(() => {
      window.removeEventListener('message', handleMessage);
    });

    return {
      dialogVisible,
      iframeRef,
      iframeSrc,
      handleClose,
      handleSendData
    };
  }
});
</script>

<style scoped>
.dify-chatbot-container {
  width: 100%;
  height: 600px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<style>
/* 确保弹框的 z-index 足够高，避免被其他元素遮挡 */
.el-dialog {
  z-index: 9999 !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  margin: 0 !important;
  width: 80% !important;
  max-width: 900px !important;
  max-height: 80vh !important;
}

.el-dialog__wrapper {
  z-index: 9999 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>