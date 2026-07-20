<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :before-close="handleClose"
    :close-on-click-modal="false"
    append-to-body
    :show-close="true"
    class="custom-close-dialog"
    top="10vh"
  >
    <div class="dify-api-container">
      <div class="message-section" ref="messageContainer">
        <div v-if="messages.length === 0" class="empty-message">
          <div class="empty-icon">💬</div>
          <div>暂无消息，开始您的对话吧！</div>
        </div>
        <div v-else class="message-list">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'message-item',
              message.role === 'user' ? 'user-message' : 'assistant-message',
            ]"
          >
            <div class="message-header">
              <div class="avatar" :class="message.role">
                {{ message.role === "user" ? "👤" : "🤖" }}
              </div>
              <div class="message-role">{{ message.role === "user" ? "用户" : "AI 助手" }}</div>
            </div>
            <div class="message-content">
              <div v-if="message.isThinking" class="thinking-indicator">
                <span class="thinking-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span class="thinking-text">{{ message.thinkingContent || '思考中' }}</span>
              </div>
              <div v-else class="content-text" v-html="formatContent(message.content)"></div>
            </div>
            <div class="message-actions">
              <button
                class="copy-btn"
                @click="copyMessageContent(message)"
                :title="'复制内容'"
                v-if="!message.isThinking"
              >
                <svg t="1783476614918" class="copy-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M912 17.28H340.48a96 96 0 0 0-96 96v83.2h64v-83.2a32 32 0 0 1 32-32h571.52a32 32 0 0 1 32 32v650.88a31.36 31.36 0 0 1-32 31.36h-164.48v64h164.48a96 96 0 0 0 96-95.36V113.28a96 96 0 0 0-96-96z" fill="#909399"></path><path d="M683.52 1006.72H112a96 96 0 0 1-96-96V259.84a96 96 0 0 1 96-95.36h571.52a96 96 0 0 1 96 95.36v650.88a96 96 0 0 1-96 96zM112 228.48a31.36 31.36 0 0 0-32 31.36v650.88a32 32 0 0 0 32 32h571.52a32 32 0 0 0 32-32V259.84a32 32 0 0 0-32-31.36z" fill="#909399"></path><path d="M603.52 423.68H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32zM603.52 617.6H192a32 32 0 0 1 0-64h411.52a32 32 0 0 1 0 64zM603.52 810.88H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32z" fill="#909399"></path></svg>
              </button>
            </div>
            <div class="message-time" v-if="!message.isThinking">
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
      </div>

      <div class="input-section">
        <div class="input-wrapper">
          <div class="top-bar">
            <el-button type="warning" size="small" @click="clearMessages" :disabled="isLoading" title="清空对话">
              <svg t="1783560291301" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M593.92 126.68928a69.632 69.632 0 0 1 69.632 69.632l-0.04096 94.208H798.72a110.592 110.592 0 0 1 110.592 110.592v122.88a28.672 28.672 0 0 1-28.672 28.672h-49.93024l37.4784 336.81408a28.672 28.672 0 0 1-28.50816 31.82592H184.32a28.672 28.672 0 0 1-28.50816-31.82592l37.43744-336.85504L143.36 552.67328a28.672 28.672 0 0 1-28.672-28.672v-122.88a110.592 110.592 0 0 1 110.592-110.592h135.12704l0.04096-94.208a69.632 69.632 0 0 1 69.632-69.632h163.84z m179.11808 425.984H250.96192l-34.6112 311.296h147.0464l19.456-179.8144a28.672 28.672 0 1 1 57.01632 6.144l-18.8416 173.6704h182.14912l-17.408-173.91616a28.672 28.672 0 1 1 57.05728-5.7344l17.98144 179.6096 146.8416 0.04096-34.6112-311.296z m25.68192-204.8H225.28a53.248 53.248 0 0 0-53.248 53.248v94.208h679.936v-94.208a53.248 53.248 0 0 0-53.248-53.248z m-204.8-163.84h-163.84a12.288 12.288 0 0 0-12.288 12.288v94.208h188.416v-94.208a12.288 12.288 0 0 0-12.288-12.288z" fill="#ffffff"></path></svg>
            </el-button>
          </div>
          <div class="input-row">
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
              <div class="actions-row">
                <span class="hint" v-if="isLoading">AI 正在思考中，请稍候...</span>
                <el-button
                  v-if="isLoading"
                  type="danger"
                  size="small"
                  class="stop-button"
                  title="停止"
                >
                  <svg t="1783304242585" class="stop-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M678.592 639.68c0 17.6-14.4 32-32 32h-268.992a32 32 0 0 1-32-32v-260.608a32 32 0 0 1 32-32h268.992c17.6 0 32 14.4 32 32v260.608z" fill="#ffffff"></path><path d="M1015.552 512.128a502.656 502.656 0 0 0-503.68-503.68 502.208 502.208 0 0 0-356.096 147.264 502.016 502.016 0 0 0-147.328 356.416 500.288 500.288 0 0 0 146.816 356.736 499.584 499.584 0 0 0 356.544 146.688c277.312-2.816 503.744-226.24 503.744-503.424z m-947.968 0a444.288 444.288 0 0 1 444.288-444.544c246.976 0 447.296 200.128 447.296 444.544 0 244.032-200.32 444.416-447.296 444.416a442.304 442.304 0 0 1-444.288-444.416z" fill="#ffffff"></path></svg>
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="sendMessage"
                  :disabled="isLoading || !userQuery.trim()"
                  class="send-button"
                  title="发送"
                  v-show="!isLoading"
                >
                  <svg t="1783304326600" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M512 981.333333q11.52 0 23.04-0.554666t22.954667-1.706667q11.477333-1.109333 22.869333-2.816 11.392-1.706667 22.698667-3.925333 11.306667-2.261333 22.485333-5.077334 11.178667-2.773333 22.186667-6.144 11.008-3.328 21.888-7.210666 10.837333-3.882667 21.461333-8.277334 10.666667-4.437333 21.077333-9.386666 10.410667-4.906667 20.565334-10.325334 10.197333-5.418667 20.053333-11.349333 9.898667-5.930667 19.456-12.330667 9.6-6.4 18.858667-13.226666 9.258667-6.912 18.133333-14.208 8.96-7.296 17.493333-15.018667 8.533333-7.765333 16.64-15.914667 8.149333-8.106667 15.914667-16.64 7.68-8.533333 15.018667-17.493333 7.296-8.874667 14.165333-18.133333t13.269333-18.858667q6.4-9.557333 12.330667-19.456 5.930667-9.898667 11.349333-20.053333 5.418667-10.154667 10.368-20.565334 4.906667-10.410667 9.344-21.077333 4.394667-10.666667 8.277334-21.504 3.882667-10.837333 7.253333-21.888 3.328-11.008 6.101333-22.186667 2.816-11.178667 5.077334-22.485333 2.218667-11.306667 3.925333-22.698667t2.816-22.869333q1.152-11.434667 1.706667-22.954667Q981.333333 523.52 981.333333 512t-0.554666-23.04q-0.554667-11.52-1.706667-22.954667-1.109333-11.477333-2.816-22.869333-1.706667-11.392-3.925333-22.698667-2.261333-11.306667-5.077334-22.485333-2.773333-11.178667-6.144-22.186667-3.328-11.050667-7.210666-21.888-3.882667-10.837333-8.277334-21.504-4.437333-10.624-9.386666-21.034666-4.906667-10.410667-10.325334-20.565334-5.418667-10.197333-11.349333-20.053333-5.930667-9.898667-12.330667-19.456-6.4-9.6-13.226666-18.858667-6.912-9.258667-14.208-18.133333-7.296-8.96-15.061334-17.493333-7.765333-8.533333-15.914667-16.64-8.106667-8.149333-16.64-15.872-8.533333-7.765333-17.493333-15.061334-8.874667-7.296-18.133333-14.165333t-18.858667-13.269333q-9.557333-6.4-19.456-12.330667-9.856-5.930667-20.053333-11.349333-10.154667-5.418667-20.565334-10.368-10.410667-4.906667-21.034666-9.344-10.624-4.394667-21.461333-8.277334-10.88-3.882667-21.888-7.253333-11.008-3.328-22.186667-6.101333-11.178667-2.816-22.485333-5.077334-11.306667-2.218667-22.698667-3.925333t-22.869333-2.816q-11.434667-1.109333-22.954667-1.706667Q523.52 42.666667 512 42.666667t-23.04 0.554666q-11.52 0.597333-22.954667 1.706667-11.477333 1.109333-22.869333 2.816-11.392 1.706667-22.698667 3.925333-11.306667 2.261333-22.485333 5.077334-11.178667 2.773333-22.186667 6.144-11.050667 3.328-21.888 7.210666-10.837333 3.882667-21.504 8.277334-10.624 4.437333-21.034666 9.386666-10.410667 4.906667-20.565334 10.325334-10.197333 5.418667-20.053333 11.349333-9.898667 5.930667-19.456 12.330667-9.6 6.4-18.858667 13.226666-9.258667 6.912-18.133333 14.208-8.96 7.296-17.493333 15.061334-8.533333 7.68-16.64 15.872-8.149333 8.106667-15.872 16.64-7.765333 8.533333-15.061334 17.493333-7.296 8.874667-14.165333 18.133333t-13.269333 18.858667q-6.4 9.557333-12.330667 19.456-5.930667 9.856-11.349333 20.053333-5.418667 10.154667-10.368 20.565334-4.906667 10.410667-9.344 21.034666-4.394667 10.666667-8.277334 21.504-3.882667 10.837333-7.253333 21.888-3.328 11.008-6.101333 22.186667-2.816 11.178667-5.077334 22.485333-2.218667 11.306667-3.925333 22.698667t-2.816 22.869333q-1.109333 11.434667-1.706667 22.954667Q42.666667 500.48 42.666667 512t0.554666 23.04q0.597333 11.52 1.706667 22.954667 1.109333 11.477333 2.816 22.869333 1.706667 11.392 3.925333 22.698667 2.261333 11.306667 5.077334 22.485333 2.773333 11.178667 6.144 22.186667 3.328 11.008 7.210666 21.888 3.882667 10.837333 8.277334 21.461333 4.437333 10.666667 9.386666 21.077333 4.906667 10.410667 10.325334 20.565334 5.418667 10.197333 11.349333 20.053333 5.930667 9.898667 12.330667 19.456 6.4 9.6 13.226666 18.858667 6.912 9.258667 14.208 18.133333 7.296 8.96 15.061334 17.493333 7.68 8.533333 15.872 16.64 8.106667 8.149333 16.64 15.914667 8.533333 7.68 17.493333 15.018667 8.874667 7.296 18.133333 14.165333t18.858667 13.269333q9.557333 6.4 19.456 12.330667 9.856 5.930667 20.053333 11.349333 10.154667 5.418667 20.565334 10.368 10.410667 4.906667 21.034666 9.344 10.666667 4.394667 21.504 8.277334 10.837333 3.882667 21.888 7.253333 11.008 3.328 22.186667 6.101333 11.178667 2.816 22.485333 5.077334 11.306667 2.218667 22.698667 3.925333t22.869333 2.816q11.434667 1.152 22.954667 1.706667 11.52 0.554667 23.04 0.554666z m-10.666667-673.322666a32 32 0 0 1 45.226667 0l150.613333 150.186666a32 32 0 1 1-45.226666 45.312l-96-95.744V725.333333a32 32 0 0 1-64 0V407.765333L395.946667 503.466667a32 32 0 1 1-45.226667-45.312l150.613333-150.186667z" fill="#ffffff"></path></svg>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭111</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  nextTick,
  onUnmounted,
  PropType,
} from "vue";
import { ElMessage } from "element-plus";
import { DemoScriptEngine } from "./demo-script";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingContent?: string;
}

export default defineComponent({
  name: "DifyApiDemoDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "AI 助手",
    },
    width: {
      type: String,
      default: "700px",
    },
  },
  emits: ["update:visible", "close", "message-sent", "message-received"],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const userQuery = ref("");
    const messages = ref<Message[]>([]);
    const isLoading = ref(false);
    const messageContainer = ref<HTMLElement>();
    const scriptEngine = new DemoScriptEngine();

    const addWelcomeMessage = () => {
      if (messages.value.length === 0) {
        messages.value.push({
          role: "assistant",
          content: "👋 欢迎！我是您的AI智能助手。\n\n请告诉我您的角色：\n- 项目经理\n- 开发人员\n- 使用人员",
          timestamp: Date.now(),
        });
      }
    };

    watch(
      () => props.visible,
      (newVal) => {
        dialogVisible.value = newVal;
        if (newVal) {
          nextTick(() => {
            addWelcomeMessage();
          });
        }
      },
    );

    watch(dialogVisible, (newVal) => {
      emit("update:visible", newVal);
    });

    const scrollToBottom = async () => {
      await nextTick();
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    };

    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const formatContent = (content: any) => {
      if (content === null || content === undefined) {
        return "";
      }
      if (typeof content !== "string") {
        return String(content);
      }
      return content.replace(/\n/g, "<br/>");
    };

    const handleEnter = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        sendMessage();
      }
    };

    const copyMessageContent = async (message: Message) => {
      try {
        await navigator.clipboard.writeText(message.content);
        ElMessage.success("已复制到剪贴板");
      } catch {
        ElMessage.error("复制失败");
      }
    };

    const clearMessages = () => {
      messages.value = [];
    };

    const handleClose = () => {
      dialogVisible.value = false;
      emit("close");
    };

    const sendMessage = async () => {
      const query = userQuery.value.trim();
      if (!query) {
        ElMessage.warning("请输入查询内容");
        return;
      }

      if (isLoading.value) {
        ElMessage.warning("请求处理中，请稍候");
        return;
      }

      const userMsg: Message = {
        role: "user",
        content: query,
        timestamp: Date.now(),
      };
      messages.value.push(userMsg);

      const thinkingMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isThinking: true,
        thinkingContent: "思考中...",
      };
      messages.value.push(thinkingMsg);

      await scrollToBottom();
      userQuery.value = "";
      isLoading.value = true;

      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      const result = scriptEngine.processInput(query);

      const lastMsg = messages.value[messages.value.length - 1];
      if (lastMsg?.role === "assistant") {
        lastMsg.isThinking = false;
        lastMsg.thinkingContent = undefined;
        lastMsg.content = result.response;
      }

      isLoading.value = false;
      await scrollToBottom();

      emit("message-sent", query);
      emit("message-received", result.response);
    };

    onUnmounted(() => {
      scriptEngine.reset();
    });

    return {
      dialogVisible,
      userQuery,
      messages,
      isLoading,
      messageContainer,
      sendMessage,
      clearMessages,
      handleClose,
      handleEnter,
      formatContent,
      formatTime,
      copyMessageContent,
    };
  },
});
</script>

<style scoped>
.dify-api-container {
  display: flex;
  flex-direction: column;
  height: 500px;
}

.message-section {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: #fafafa;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-message {
  align-items: flex-end;
}

.assistant-message {
  align-items: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.avatar.user {
  background-color: #409eff;
  color: white;
}

.avatar.assistant {
  background-color: #67c23a;
  color: white;
}

.message-role {
  font-size: 12px;
  color: #999;
}

.message-content {
  max-width: 80%;
  padding: 12px;
  border-radius: 8px;
  word-break: break-all;
}

.user-message .message-content {
  background-color: #409eff;
  color: white;
}

.assistant-message .message-content {
  background-color: white;
  border: 1px solid #e4e7ed;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
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
  animation: thinking 1.4s infinite ease-in-out both;
}

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes thinking {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.thinking-text {
  color: #999;
  font-size: 14px;
}

.content-text {
  font-size: 14px;
  line-height: 1.6;
}

.message-actions {
  display: flex;
  gap: 8px;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 4px;
}

.copy-btn:hover {
  color: #409eff;
}

.message-time {
  font-size: 12px;
  color: #bbb;
}

.input-section {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
  background-color: white;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-row :deep(.el-input) {
  flex: 1;
}

.input-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint {
  font-size: 12px;
  color: #67c23a;
}

.stop-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>