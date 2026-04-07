<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :before-close="handleClose"
    :close-on-click-modal="false"
    append-to-body
  >
    <div class="dify-api-container">
      <div class="input-section">
        <el-input
          v-model="userQuery"
          type="textarea"
          :rows="3"
          placeholder="请输入您的问题..."
          resize="none"
        ></el-input>
        <el-button type="primary" @click="sendMessage" class="send-button">发送</el-button>
      </div>
      <div class="message-section">
        <div v-if="messages.length === 0" class="empty-message">
          暂无消息，开始您的对话吧！
        </div>
        <div v-else class="message-list">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message']"
          >
            <div class="message-role">{{ message.role === 'user' ? '用户' : '助手' }}</div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="clearMessages">清空消息</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, onUnmounted, PropType } from 'vue';
import { ElMessage } from 'element-plus';

export default defineComponent({
  name: 'DifyApiDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Dify 聊天机器人 (API)' 
    },
    width: {
      type: String,
      default: '80%'
    },
    apiKey: {
      type: String,
      default: 'app-bvB0IYwRflahot7Bog2n1G5o'
    },
    baseUrl: {
      type: String,
      default: 'http://10.89.34.9'
    },
    userId: {
      type: String,
      default: 'huyz'
    },
    conversationId: {
      type: String,
      default: ''
    },
    data: {
      type: Object as PropType<any>,
      default: () => ({})
    }
  },
  emits: ['update:visible', 'close', 'message-sent', 'message-received', 'conversation-created'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const userQuery = ref('');
    const messages = ref<any[]>([]);
    // 优先使用从父组件传递的 conversationId，其次使用 localStorage 中的值，最后使用空字符串
    const storedConversationId = localStorage.getItem('difyConversationId');
    console.log('Stored conversationId in localStorage:', storedConversationId);
    console.log('Prop conversationId:', props.conversationId);
    const conversationId = ref(props.conversationId || storedConversationId || '');
    const isLoading = ref(false);
    
    console.log('Initial conversationId:', conversationId.value);

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
      }
    );

    // 监听 props.conversationId 的变化
    watch(
      () => props.conversationId,
      (newVal) => {
        console.log('Props conversationId changed:', newVal);
        if (newVal) {
          conversationId.value = newVal;
          console.log('Updated conversationId.value:', conversationId.value);
        }
      }
    );

    // 处理关闭事件
    const handleClose = () => {
      dialogVisible.value = false;
      // 清空会话 ID
      conversationId.value = '';
      localStorage.removeItem('difyConversationId');
      console.log('Cleared conversationId');
      emit('close');
    };

    // 发送消息
    const sendMessage = async () => {
      if (!userQuery.value.trim()) {
        ElMessage.warning('请输入您的问题');
        return;
      }

      isLoading.value = true;
      try {
        // 添加用户消息到列表
        messages.value.push({
          role: 'user',
          content: userQuery.value
        });

        // 调用 API 创建会话或发送消息
        console.log('Sending message with conversationId:', conversationId.value);
        console.log('LocalStorage difyConversationId:', localStorage.getItem('difyConversationId'));
        console.log('API URL:', `${props.baseUrl}/v1/chat-messages`);
        console.log('API Key:', props.apiKey);
        console.log('User ID:', props.userId);
        console.log('Message query:', userQuery.value);
        console.log('Message inputs:', props.data);
        
        const requestBody = {
          inputs: props.data,
          query: userQuery.value,
          response_mode: 'blocking',
          conversation_id: conversationId.value || localStorage.getItem('difyConversationId') || '',
          user: props.userId
        };
        console.log('Request body:', requestBody);
        
        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${props.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Message request response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        // 尝试解析响应
        // let data;
        // const responseText = await response.text();
        // console.log('Raw response text:', responseText);
        
        // try {
        //   data = JSON.parse(responseText);
        //   console.log('Message response:', data);
        // } catch (parseError) {
        //   console.warn('Failed to parse response as JSON:', parseError);
        //   console.warn('Response text:', responseText);
        //   // 模拟一个响应，以便继续执行
        //   data = {
        //     answer: '正在处理您的请求...'
        //   };
        // }

        // 每次发送消息后，都调用 conversations API 获取最新的会话 ID
        console.log('Fetching conversations to get latest conversation ID');
        const conversationsResponse = await fetch(`${props.baseUrl}/v1/conversations?user=${props.userId}&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${props.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!conversationsResponse.ok) {
          const errorText = await conversationsResponse.text();
          console.error('Conversations API error response:', errorText);
          throw new Error(`HTTP error when fetching conversations: status: ${conversationsResponse.status}, message: ${errorText}`);
        }

        const conversationsData = await conversationsResponse.json();
        console.log('Conversations response:', conversationsData);

        if (conversationsData.data && conversationsData.data.length > 0) {
          const latestConversation = conversationsData.data[0];
          const latestConvId = latestConversation.id || latestConversation.conversation_id;
          console.log('Retrieved conversation ID from conversations API:', latestConvId);
          
          if (latestConvId) {
            conversationId.value = latestConvId;
            localStorage.setItem('difyConversationId', latestConvId);
            console.log('Stored conversationId to localStorage:', latestConvId);
            emit('conversation-created', latestConvId);
          }
        }

        // 添加助手回复到列表
        // messages.value.push({
        //   role: 'assistant',
        //   content: data.answer || '抱歉，我无法回答这个问题。'
        // });

        // 清空输入框
        userQuery.value = '';

        // 通知父组件
        // emit('message-sent', { query: userQuery.value, response: data });
        // emit('message-received', data);

      } catch (error) {
        console.error('Error sending message:', error);
        ElMessage.error('发送消息失败');

        // 移除用户消息（因为发送失败）
        if (messages.value.length > 0) {
          messages.value.pop();
        }
      } finally {
        isLoading.value = false;
      }
    };

    // 清空消息
    const clearMessages = () => {
      messages.value = [];
      conversationId.value = '';
      // 清空 localStorage 中的会话 ID
      localStorage.removeItem('difyConversationId');
      ElMessage.success('消息已清空');
    };

    return {
      dialogVisible,
      userQuery,
      messages,
      isLoading,
      handleClose,
      sendMessage,
      clearMessages
    };
  }
});
</script>

<style scoped>
.dify-api-container {
  width: 100%;
  height: 700px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.input-section {
  padding: 15px;
  border-top: 1px solid #ebeef5;
  background-color: #f9f9f9;
}

.send-button {
  margin-top: 10px;
  float: right;
}

.message-section {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #ffffff;
}

.empty-message {
  text-align: center;
  color: #909399;
  margin-top: 100px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 8px;
  word-wrap: break-word;
}

.user-message {
  align-self: flex-end;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.assistant-message {
  align-self: flex-start;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
}

.message-role {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #666;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
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
  background-color: white !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1) !important;
  overflow: visible !important;
}

/* 确保弹框内容区域不会被遮挡 */
.el-dialog__body {
  padding: 0 !important;
  overflow: visible !important;
}

.el-dialog__header {
  padding: 20px 20px 10px !important;
  border-bottom: 1px solid #ebeef5 !important;
}

.el-dialog__footer {
  padding: 15px 20px !important;
  border-top: 1px solid #ebeef5 !important;
}

.el-dialog__wrapper {
  z-index: 9998 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  pointer-events: auto !important;
}

/* 确保 el-overlay 能够正确显示为遮罩层 */
.el-overlay {
  z-index: 9998 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  pointer-events: auto !important;
}
</style>