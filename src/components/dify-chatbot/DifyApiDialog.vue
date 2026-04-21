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
      <!-- 消息区域 -->
      <div class="message-section" ref="messageContainer">
        <div v-if="messages.length === 0" class="empty-message">
          <div class="empty-icon">💬</div>
          <div>暂无消息，开始您的对话吧！</div>
        </div>
        <div v-else class="message-list">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message']"
          >
            <div class="message-header">
              <div class="avatar" :class="message.role">
                {{ message.role === 'user' ? '👤' : '🤖' }}
              </div>
              <div class="message-role">{{ message.role === 'user' ? '用户' : 'AI 助手' }}</div>
            </div>
            <div class="message-content">
              <!-- 思考中状态 -->
              <div v-if="message.isThinking" class="thinking-indicator">
                <span class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span class="thinking-text">思考中</span>
              </div>
              <!-- 正常内容 -->
              <div v-else class="content-text" v-html="formatContent(message.content)"></div>
            </div>
            <div class="message-time" v-if="!message.isThinking">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-wrapper">
          <el-input
            v-model="userQuery"
            type="textarea"
            :rows="3"
            placeholder="请输入您的问题..."
            resize="none"
            :disabled="isLoading"
            @keydown.enter.prevent="handleEnter"
          ></el-input>
          <div class="input-actions">
            <span class="hint" v-if="isLoading">AI 正在思考中，请稍候...</span>
            <el-button 
              type="primary" 
              @click="sendMessage" 
              :loading="isLoading"
              :disabled="!userQuery.trim() || isLoading"
              class="send-button"
            >
              {{ isLoading ? '发送中' : '发送' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="warning" @click="clearMessages">清空对话</el-button>
        <el-button type="info" @click="outputJsonToConsole">AI生成画布</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, PropType } from 'vue';
import { ElMessage } from 'element-plus';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export default defineComponent({
  name: 'DifyApiDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'AI 助手'
    },
    width: {
      type: String,
      default: '800px'
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
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    }
  },
  emits: ['update:visible', 'close', 'message-sent', 'message-received', 'conversation-created'],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const userQuery = ref('');
    const messages = ref<Message[]>([]);
    const conversationId = ref(props.conversationId);
    const isLoading = ref(false);
    const messageContainer = ref<HTMLElement>();
    const abortController = ref<AbortController | null>(null);

    // 监听 visible 变化
    watch(() => props.visible, (newVal) => {
      dialogVisible.value = newVal;
    });

    watch(dialogVisible, (newVal) => {
      emit('update:visible', newVal);
    });

    // 监听 conversationId 变化
    watch(() => props.conversationId, (newVal) => {
      if (newVal) conversationId.value = newVal;
    });

    // 滚动到底部
    const scrollToBottom = async () => {
      await nextTick();
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    };

    // 格式化内容（支持简单的换行）
    const formatContent = (content: string) => {
      return content.replace(/\n/g, '<br>');
    };

    // 格式化时间
    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // 处理回车发送（Shift+Enter 换行）
    const handleEnter = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        sendMessage();
      }
    };

    // 发送消息 - 使用流式响应
    const sendMessage = async () => {
      if (!userQuery.value.trim() || isLoading.value) return;

      const query = userQuery.value.trim();
      
      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: query,
        timestamp: Date.now()
      });

      // 添加 AI 思考中的占位消息
      const thinkingMsg: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isThinking: true
      };
      messages.value.push(thinkingMsg);
      
      await scrollToBottom();
      
      userQuery.value = '';
      isLoading.value = true;

      // 创建 AbortController 用于取消请求
      abortController.value = new AbortController();

      try {
        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${props.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: props.data,
            query: query,
            response_mode: 'streaming', // 使用流式模式
            conversation_id: conversationId.value,
            user: props.userId
          }),
          signal: abortController.value.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let newConversationId = '';

        if (!reader) {
          throw new Error('无法读取响应流');
        }

        // 读取流式数据
        let firstMessageReceived = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // 处理不同类型的事件
                switch (data.event) {
                  case 'message': // 增量消息内容
                    if (data.answer) {
                      // 收到第一个消息块后移除思考状态
                      if (!firstMessageReceived) {
                        const lastMsg = messages.value[messages.value.length - 1];
                        lastMsg.isThinking = false;
                        lastMsg.content = '';
                        firstMessageReceived = true;
                      }
                      fullContent += data.answer;
                      const lastMsg = messages.value[messages.value.length - 1];
                      lastMsg.content = fullContent;
                      await scrollToBottom();
                    }
                    break;
                    
                  case 'message_end': // 消息结束
                    newConversationId = data.conversation_id || '';
                    break;
                    
                  case 'error': // 错误
                    throw new Error(data.message || '流式响应错误');
                }

                // 获取会话 ID
                if (data.conversation_id && !newConversationId) {
                  newConversationId = data.conversation_id;
                }

              } catch (e) {
                console.warn('解析流数据失败:', line, e);
              }
            }
          }
        }

        // 更新会话 ID
        if (newConversationId && !conversationId.value) {
          conversationId.value = newConversationId;
          emit('conversation-created', newConversationId);
        }

        emit('message-received', fullContent);

      } catch (error: any) {
        console.error('发送消息失败:', error);
        
        // 如果是用户取消，不显示错误
        if (error.name === 'AbortError') {
          messages.value.pop(); // 移除思考中的消息
          return;
        }

        // 更新最后一条消息为错误提示
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.isThinking = false;
          lastMsg.content = '抱歉，服务暂时不可用，请稍后重试。';
        }

        ElMessage.error('发送消息失败: ' + error.message);
      } finally {
        isLoading.value = false;
        abortController.value = null;
      }
    };

    // 清空消息
    const clearMessages = () => {
      messages.value = [];
      conversationId.value = '';
      ElMessage.success('对话已清空');
    };

    // 将最后一条 AI 回答中的 JSON 输出到控制台
    const outputJsonToConsole = () => {
      // 查找最后一条 AI 助手的消息
      const aiMessages = messages.value.filter(msg => msg.role === 'assistant' && !msg.isThinking);
      if (aiMessages.length === 0) {
        ElMessage.warning('暂无 AI 回答');
        return;
      }

      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const content = lastAiMessage.content;

      // 尝试从内容中提取 JSON
      try {
        // 从浏览器缓存中获取 DataS-Project 值
        const dataSProject = localStorage.getItem('DataS-Project');
        // console.log('DataS-Project:', dataSProject);
        // 查找 JSON 对象（以 { 开头，以 } 结尾）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          
          try {
            const jsonObj = JSON.parse(jsonStr);
            
            if (dataSProject) {
              // 将值添加到 JSON 对象中，键名为 projectid
              jsonObj.projectid = dataSProject;
            }
            
            console.log('AI 回答中的 JSON 内容:', jsonObj);
            ElMessage.success('JSON 已输出到控制台');
            return;
          } catch (parseError) {
            console.warn('找到 JSON 格式但解析失败:', parseError);
          }
        }

        // 查找 JSON 数组（以 [ 开头，以 ] 结尾）
        const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonArrayMatch) {
          const jsonStr = jsonArrayMatch[0];
          try {
            const jsonObj = JSON.parse(jsonStr);
            
            if (dataSProject) {
              // 将值添加到 JSON 数组的每个对象中，键名为 projectid
              if (Array.isArray(jsonObj)) {
                jsonObj.forEach(item => {
                  if (typeof item === 'object' && item !== null) {
                    item.projectid = dataSProject;
                  }
                });
              }
            }
            
            console.log('AI 回答中的 JSON 内容:', jsonObj);
            ElMessage.success('JSON 已输出到控制台');
            return;
          } catch (parseError) {
            console.warn('找到 JSON 数组格式但解析失败:', parseError);
          }
        }

        // 如果没有找到 JSON 格式，提示用户
        ElMessage.warning('回答内容中未找到有效的 JSON 格式');
        console.log('AI 回答内容（非 JSON）:', content);

      } catch (error) {
        console.error('处理 JSON 时发生错误:', error);
        ElMessage.warning('处理 JSON 时发生错误');
      }
    };

    // 关闭对话框
    const handleClose = () => {
      // 如果有正在进行的请求，取消它
      if (abortController.value) {
        abortController.value.abort();
      }
      dialogVisible.value = false;
      messages.value = [];
      conversationId.value = '';
      emit('close');
    };

    return {
      dialogVisible,
      userQuery,
      messages,
      isLoading,
      messageContainer,
      handleClose,
      sendMessage,
      clearMessages,
      outputJsonToConsole,
      handleEnter,
      formatContent,
      formatTime
    };
  }
});
</script>

<style scoped>
.dify-api-container {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

/* 消息区域 */
.message-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f5f5;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-item {
  display: flex;
  flex-direction: column;
  max-width: 85%;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.user-message {
  align-self: flex-end;
}

.assistant-message {
  align-self: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.avatar.user {
  background-color: #409eff;
}

.avatar.assistant {
  background-color: #67c23a;
}

.message-role {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  font-size: 14px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.user-message .message-content {
  background-color: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}

.assistant-message .message-content {
  background-color: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  align-self: flex-end;
}

/* 思考中动画 */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  padding: 8px 0;
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background-color: #409eff;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.thinking-text {
  font-size: 14px;
  color: #666;
}

/* 输入区域 */
.input-section {
  padding: 16px 20px;
  background-color: white;
  border-top: 1px solid #e4e7ed;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  font-size: 12px;
  color: #909399;
}

.send-button {
  min-width: 80px;
}

/* 对话框样式优化 */
:deep(.el-dialog__body) {
  padding: 0;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #e4e7ed;
  margin-right: 0;
  padding: 16px 20px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px;
}
</style>