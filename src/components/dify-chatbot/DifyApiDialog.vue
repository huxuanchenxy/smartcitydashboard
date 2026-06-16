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
    <button class="my-close-btn" @click="handleClose">×</button>
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
            :class="['message-item', message.role === 'user' ? 'user-message' : 'assistant-message', { 'human-interaction-message': message.isHumanInteraction }]"
          >
            <!-- 人工介入消息 -->
            <div v-if="message.isHumanInteraction" class="human-interaction-wrapper">
              <!-- 人工介入提示条 -->
              <div class="agent-indicator">
                <span class="agent-icon">🔔</span>
                <span class="agent-text">等待您的反馈</span>
              </div>
              
              <!-- AI 消息内容 -->
              <div class="ai-message-content">
                <div v-html="formatContent(message.content)"></div>
              </div>
              
              <!-- 用户反馈输入区域 -->
              <div class="human-feedback-section">
                <textarea
                  v-model="message.humanInput"
                  rows="3"
                  placeholder="在此填写修改意见:"
                  class="feedback-textarea"
                  :disabled="isSubmitting"
                ></textarea>
                <div class="feedback-actions">
                  <el-button
                    type="primary"
                    @click="handleHumanApprove(index)"
                    :disabled="isSubmitting || message.isProcessed"
                    :loading="isSubmitting"
                  >
                    确认
                  </el-button>
                  <el-button
                    type="default"
                    @click="handleHumanRevise(index)"
                    :disabled="isSubmitting || message.isProcessed"
                    :loading="isSubmitting"
                  >
                    修改
                  </el-button>
                </div>
                <div class="expiry-note">
                  ⚠️ 此操作将在3天内过期。
                </div>
              </div>
            </div>
            
            <!-- 普通消息 -->
            <template v-else>
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
            </template>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-wrapper">
          <!-- 推荐问题下拉框和操作按钮行 -->
          <div class="top-bar">
            <!-- 水务模式下隐藏推荐问题下拉框 -->
            <select
              v-if="!waterServiceMode"
              v-model="selectedQuestion"
              :disabled="isLoading || isAwaitingFeedback"
              style="width: 280px; height: 32px; padding: 0 12px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px; cursor: pointer;"
            >
              <option value="" disabled>选择推荐问题...</option>
              <option v-for="question in recommendQuestions" :key="question" :value="question">
                {{ question }}
              </option>
            </select>
            <div class="top-bar-actions">
              <!-- 水务模式下保留：复制回答内容、清空对话、上传图片 -->
              <el-button type="primary" size="small" @click="copyLastMessageContent" :disabled="isLoading">复制回答内容</el-button>
              <el-button type="warning" size="small" @click="clearMessages" :disabled="isLoading">清空对话</el-button>
              <el-button type="info" size="small" @click="triggerImageUpload" :disabled="isLoading || isAwaitingFeedback">上传图片</el-button>
              <!-- 水务模式下隐藏：CAD转JSON -->
              <el-button 
              v-if="!waterServiceMode"
              type="success" 
              size="small"
              @click="cadToJson" 
              :disabled="isLoading || isAwaitingFeedback || !lastUploadedImage"
              :loading="isCadConverting"
            >
              {{ isCadConverting ? '转换中' : 'CAD转JSON' }}
            </el-button>
            <!-- 水务模式下保留：图片预览链接 -->
            <el-link
              v-if="lastUploadedImage"
              type="primary"
              :underline="false"
              @click="openImagePreview"
              class="image-preview-link"
            >
              🖼️ 查看
            </el-link>
            </div>
          </div>
          <!-- 输入框和发送按钮行 -->
          <div class="input-row">
            <el-input
              v-model="userQuery"
              type="textarea"
              :rows="3"
              placeholder="请输入您的问题..."
              resize="none"
              :disabled="isLoading || isAwaitingFeedback"
              @keydown.enter.prevent="handleEnter"
            ></el-input>
            <div class="input-actions">
              <span class="hint" v-if="isLoading || isCadConverting">AI 正在思考中，请稍候...</span>
              <!-- 水务模式下保留：停止生成 -->
              <el-button 
                v-if="isLoading || isCadConverting"
                type="danger"
                size="small"
                @click="stopGeneration"
                class="stop-button"
              >
                停止生成
              </el-button>
              <!-- 水务模式下隐藏：发送、发送4 -->
              <el-button
                v-if="!waterServiceMode"
                type="success"
                size="small"
                @click="sendMessage"
                :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                class="send-button"
              >
                {{ isLoading ? '发送中' : '发送' }}
              </el-button>
              <el-button
                v-if="!waterServiceMode"
                type="success"
                size="small"
                @click="sendMessage3"
                :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                class="send3-button"
              >
                {{ isLoading ? '发送中' : '发送3' }}
              </el-button>
              <!-- 发送(反复) -->
              <el-button
                v-if="!waterServiceMode"
                type="primary"
                size="small"
                @click="sendMessage4()"
                :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                class="send4-button"
              >
                {{ isLoading ? '发送中' : '发送4' }}
              </el-button>
              <!-- 水务模式下保留：发送(水务专用) -->
              <el-button
                type="warning"
                size="small"
                @click="sendMessageWater()"
                :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                class="send-water-button"
              >
                {{ isLoading ? '发送中' : '发送' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传图片输入框（隐藏） -->
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
      style="display: none"
      @change="handleImageUpload"
    />

    <!-- 图片预览弹窗 -->
    <el-dialog
      v-model="imagePreviewVisible"
      title="图片预览"
      width="800px"
      append-to-body
    >
      <img :src="previewImageUrl" alt="预览图片" style="width: 100%;" />
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <!-- <el-button @click="handleClose">关闭</el-button> -->

        <el-button v-if="!waterServiceMode" type="primary" @click="outputJsonToConsole" :disabled="isLoading || isAwaitingFeedback">AI生成画布</el-button>
        <el-button v-if="!waterServiceMode" type="success" @click="saveRawJson" :disabled="isLoading || isAwaitingFeedback">原始保存</el-button>
        <el-button v-if="!waterServiceMode" type="info" @click="saveTempPayload" :disabled="isAwaitingFeedback">临时保存payload</el-button>
        <!-- 水务模式下隐藏：AI生成画布 -->
        <el-button v-if="!waterServiceMode" type="success" @click="fetchAndSaveScreenAI" :disabled="isLoading || isAwaitingFeedback">AI生成画布</el-button>
        <el-button v-if="!waterServiceMode" type="danger" @click="calibrateJson" :disabled="isLoading || isAwaitingFeedback">校准JSON</el-button>
        
        <!-- <el-switch
          v-model="enableJsonValidation"
          active-text="JSON校验"
          inactive-text="JSON校验"
          class="json-validation-switch"
        /> -->
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, watch, nextTick, PropType } from 'vue';
import { ElMessage } from 'element-plus';
import { EditorModule } from '@/store/modules/editor';
import { FilterModule } from '@/store/modules/filter';
import { UploadImagesModule } from '@/store/modules/images';
import { ThreedModule } from '@/store/modules/threed';
import { ToolbarModule } from '@/store/modules/toolbar';
import { saveScreen } from "@/api/screen";
import * as payloadJson from './payloadpie.json';
import comsTemplate from './comstemplate.json';
import { calibrateJsonString, JSONRepairTool } from './jsonCalibration';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  isHumanInteraction?: boolean;
  formToken?: string;
  workflowRunId?: string;
  isProcessed?: boolean;
  humanInput?: string;
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
      default: '900px'
    },
    apiKey: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY 
    },
    // 发送2功能的第一次调用 API Key（对应第一个 chatflow）
    apiKeyFlow1: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW1 || ''
    },
    // 发送2功能的第二次调用 API Key（对应第二个 chatflow）
    apiKeyFlow2: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW2 || ''
    },
    // 新程序专用 API Key
    apiKeyFlow3: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW3 || ''
    },
    // difyapidialog 专用 API Key
    apiKeyFlow4: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW4 || ''
    },
    // difyapidialog 专用 API Key (FLOWa1)
    apiKeyFlowA1: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOWa1 || ''
    },
    // 水务专用 API Key
    apiKeyFlowWater: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW_WATER || ''
    },
    // 水务业务模式开关（开启时仅显示水务相关控件）
    waterServiceMode: {
      type: Boolean,
      default: import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE === 'true' || import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE === '1' || false
    },
    baseUrl: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_BASE_URL || 'http://10.89.34.9'
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
    
    // 调试日志：验证 waterServiceMode 的值
    console.log('=== DifyApiDialog 初始化 ===');
    console.log('waterServiceMode prop:', props.waterServiceMode);
    console.log('VITE_APP_DIFY_WATER_SERVICE_MODE:', import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE);
    const currentTaskId = ref<string | null>(null);
    // JSON保存前校验开关 - 开启时会在saveScreenAI前校验JSON结构是否符合最低要求
    const enableJsonValidation = ref(true);
    // 图片上传相关
    const fileInput = ref<HTMLInputElement | null>(null);
    const imagePreviewVisible = ref(false);
    const previewImageUrl = ref('');
    const lastUploadedImage = ref<any>(null); // 保存最后一次上传的图片信息
    const isCadConverting = ref(false); // CAD转JSON转换状态

    // 人工介入相关
    const isSubmitting = ref(false);
    const isAwaitingFeedback = ref(false); // 是否正在等待用户反馈

    // 推荐问题相关
    const recommendQuestions = [
      '生成智慧城市大屏',
      '智慧水务',
      '智慧医疗',
      '智慧教育',
      '智慧交通',
      '智慧园区'
    ];
    const selectedQuestion = ref('');

    // 监听推荐问题选择变化
    watch(selectedQuestion, (newVal) => {
      if (newVal && newVal.trim()) {
        userQuery.value = newVal;
        selectedQuestion.value = ''; // 清空选择
      }
    });

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
    const formatContent = (content: any) => {
      if (content === null || content === undefined) {
        return '';
      }
      if (typeof content !== 'string') {
        return String(content);
      }
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
        // 水务模式下回车调用 sendMessageWater，否则调用 sendMessage3
        if (props.waterServiceMode) {
          sendMessageWater();
        } else {
          sendMessage3();
        }
      }
    };

    // 从暂停数据中提取 form_token
    const extractFormToken = (pauseData: any): string => {
      if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
        const reason = pauseData.data.reasons[0];
        if (reason.form_token) return reason.form_token;
        
        // 尝试从原始数据中提取
        const raw = JSON.stringify(pauseData);
        const match = raw.match(/"form_token"\s*:\s*"([^"]+)"/);
        if (match) return match[1];
        
        // 尝试从 node_id 中提取
        if (pauseData.data.paused_nodes && pauseData.data.paused_nodes.length > 0) {
          return pauseData.data.paused_nodes[0];
        }
      }
      return '';
    };

    // 定义发送消息的配置接口
    interface SendMessageConfig {
      apiKey: string;
      logPrefix: string;
      query?: string;
      clearQuery?: boolean;
      supportWorkflowPaused?: boolean;
      onWorkflowPaused?: (data: any, fullContent: string) => Promise<boolean>;
    }

    // 通用的发送消息函数
    const sendRequest = async (config: SendMessageConfig): Promise<string> => {
      const {
        apiKey,
        logPrefix,
        query: configQuery,
        clearQuery = true,
        supportWorkflowPaused = false,
        onWorkflowPaused
      } = config;

      const query = configQuery || userQuery.value.trim();
      if (!query || isLoading.value) return '';

      console.log(`=== ${logPrefix} 调用开始 ===`);
      console.log(`${logPrefix} query:`, query);

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
      
      if (clearQuery && !configQuery) {
        userQuery.value = '';
      }
      isLoading.value = true;

      // 创建 AbortController 用于取消请求
      abortController.value = new AbortController();

      // 定义需要在 try-finally 中共享的变量
      let isPaused = false;
      let pauseData: any = null;
      let currentFormToken = '';
      let currentWorkflowRunId = '';

      try {
        // 构建 files 参数（如果有上传的图片）
        const files = lastUploadedImage.value ? [{
          type: 'image',
          transfer_method: 'local_file',
          upload_file_id: lastUploadedImage.value.id
        }] : undefined;

        const requestBody = {
          inputs: props.data,
          query: query,
          response_mode: 'streaming',
          conversation_id: conversationId.value,
          user: props.userId,
          files: files
        };

        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        console.log(`${logPrefix} 开始流式响应`);

        let fullContent = '';
        let newConversationId = '';
        let pendingData = '';
        let hasError = false;

        // 流式处理每个数据块
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          // 保留最后一行（可能是不完整的）
          pendingData = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // 处理 error 事件
              if (data.event === 'error') {
                hasError = true;
                const errorMsg = data.message || '服务发生未知错误';
                const errorCode = data.code || 'unknown';
                const errorDetail = `[Dify Error] code: ${errorCode}, status: ${data.status || 'N/A'}, message: ${errorMsg}`;
                
                console.error(errorDetail);
                
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.isThinking = false;
                  lastMsg.content = `请求失败：${errorMsg}`;
                }
                
                ElMessage.error(errorDetail);
                continue;
              }

              // 如果已经出现过 error 事件，跳过后续数据处理
              if (hasError) continue;

              // 处理 workflow_paused 事件 - 工作流暂停，需要人工介入
              if (supportWorkflowPaused && data.event === 'workflow_paused') {
                console.log('⏸️ 检测到工作流暂停');
                isPaused = true;
                isAwaitingFeedback.value = true;
                pauseData = data;
                
                // 保存 workflow_run_id 和 conversation_id
                if (data.data && data.data.workflow_run_id) {
                  currentWorkflowRunId = data.data.workflow_run_id;
                }
                if (data.conversation_id) {
                  newConversationId = data.conversation_id;
                }
                
                // 提取 form_token
                const formToken = extractFormToken(data);
                if (formToken) {
                  currentFormToken = formToken;
                  console.log('🔑 Form Token:', formToken);
                }
                
                // 收集当前消息内容
                if (data.answer) {
                  fullContent += data.answer;
                }
                
                // 更新消息状态
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.isThinking = false;
                  lastMsg.content = fullContent;
                }
                
                await scrollToBottom();
                
                // 如果有自定义的暂停处理函数，调用它
                if (onWorkflowPaused) {
                  const shouldContinue = await onWorkflowPaused(data, fullContent);
                  if (!shouldContinue) {
                    break;
                  }
                }
                
                // 跳出循环，准备显示人工介入弹窗
                break;
              }

              // 处理普通消息 - 实时更新
              if (data.event === 'message' && data.answer) {
                // 保存 task_id 用于停止请求
                if (data.task_id) {
                  currentTaskId.value = data.task_id;
                }
                fullContent += data.answer;
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.isThinking = false;
                  lastMsg.content = fullContent;
                  await scrollToBottom();
                }
              }

              // 处理 workflow_finished 事件 - 最终完成
              if (data.event === 'workflow_finished' && data.data && data.data.outputs && data.data.outputs.answer) {
                console.log(`${logPrefix} 找到 workflow_finished 事件`);
                fullContent = data.data.outputs.answer;
                const lastMsg = messages.value[messages.value.length - 1];
                lastMsg.isThinking = false;
                lastMsg.content = fullContent;
                await scrollToBottom();
              }

              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
            } catch (e) {
              console.warn(`${logPrefix} 解析单行数据失败:`, e);
            }
          }
          
          // 如果检测到暂停，跳出外层循环
          if (isPaused) break;
        }

        // 如果工作流暂停，添加人工介入消息到对话中
        if (isPaused && pauseData) {
          console.log('📢 检测到工作流暂停，添加人工介入消息');
          
          // 提取暂停时的消息内容
          let content = '';
          if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
            const reason = pauseData.data.reasons[0];
            if (reason.form_content) {
              content = reason.form_content
                .replace(/\\n/g, '\n')
                .replace(/\*\*/g, '');
            }
          }
          
          // 如果没有提取到内容，使用已收集的消息
          if (!content.trim()) {
            content = fullContent || 'AI 需要您的反馈以继续处理...';
          }
          
          // 更新最后一条消息为人工介入消息
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.isThinking = false;
            lastMsg.content = content;
            lastMsg.isHumanInteraction = true;
            lastMsg.formToken = currentFormToken;
            lastMsg.workflowRunId = currentWorkflowRunId;
          }
          
          await scrollToBottom();
          
          // 更新会话 ID
          if (newConversationId && !conversationId.value) {
            conversationId.value = newConversationId;
            emit('conversation-created', newConversationId);
          }
          
          isLoading.value = false;
          return fullContent; // 等待用户操作
        }

        // 处理最后可能残留的数据
        if (pendingData.trim() && pendingData.startsWith('data: ')) {
          try {
            const data = JSON.parse(pendingData.slice(6));
            
            // 处理残留数据中的 error 事件
            if (data.event === 'error') {
              hasError = true;
              const errorMsg = data.message || '服务发生未知错误';
              const errorCode = data.code || 'unknown';
              const errorDetail = `[Dify Error] code: ${errorCode}, status: ${data.status || 'N/A'}, message: ${errorMsg}`;
              
              console.error(errorDetail);
              
              const lastMsg = messages.value[messages.value.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.isThinking = false;
                lastMsg.content = `请求失败：${errorMsg}`;
              }
              
              ElMessage.error(errorDetail);
            }
            
            if (!hasError && data.event === 'message' && data.answer) {
              fullContent += data.answer;
              const lastMsg = messages.value[messages.value.length - 1];
              if (lastMsg?.role === 'assistant') {
                lastMsg.isThinking = false;
                lastMsg.content = fullContent;
                await scrollToBottom();
              }
            }
          } catch (e) {
            console.warn(`${logPrefix} 解析最后残留数据失败:`, e);
          }
        }

        // 更新会话 ID
        if (newConversationId && !conversationId.value) {
          conversationId.value = newConversationId;
          emit('conversation-created', newConversationId);
        }

        // 如果发生了错误，不再触发 message-received 成功事件
        if (!hasError) {
          console.log(`=== ${logPrefix} 调用完成 ===`);
          console.log(`${logPrefix} 回答:`, fullContent);
          emit('message-received', fullContent);
        }

        return fullContent;

      } catch (error: any) {
        console.error(`${logPrefix} 发送消息失败:`, error);
        
        // 如果是用户取消，不显示错误，保留已收到的内容
        if (error.name === 'AbortError') {
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.isThinking = false;
            // 如果没有内容，显示"已停止"提示
            if (!lastMsg.content.trim()) {
              lastMsg.content = '已停止生成';
            }
          }
          return '';
        }

        // 更新最后一条消息为错误提示
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.isThinking = false;
          lastMsg.content = '抱歉，服务暂时不可用，请稍后重试。';
        }

        ElMessage.error(`${logPrefix} 发送消息失败: ` + error.message);
        return '';
      } finally {
        if (!isPaused) {
          isLoading.value = false;
          abortController.value = null;
          currentTaskId.value = null;
        }
      }
    };

    // 发送消息 - 使用流式响应
    const sendMessage = async () => {
      await sendRequest({
        apiKey: props.apiKey,
        logPrefix: '发送'
      });
    };

    // 发送消息2 - 连续调用两次接口，第一次的回答作为第二次的query
    const sendMessage2 = async () => {
      if (!userQuery.value.trim() || isLoading.value) return;

      const query = userQuery.value.trim();

      console.log('=== 发送2 第一次调用开始 ===');
      console.log('发送2 query:', query);

      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: query,
        timestamp: Date.now()
      });

      // 添加第一次调用的 AI 消息（显示思考中状态）
      messages.value.push({
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isThinking: true
      });

      await scrollToBottom();

      userQuery.value = '';
      isLoading.value = true;
      abortController.value = new AbortController();

      let firstCallAnswer = '';

      try {
        // 使用 apiKeyFlow1，如果未配置则回退到 apiKey
        const apiKey1 = props.apiKeyFlow1 || props.apiKey;

        // 构建 files 参数（如果有上传的图片）
        const files = lastUploadedImage.value ? [{
          type: 'image',
          transfer_method: 'local_file',
          upload_file_id: lastUploadedImage.value.id
        }] : undefined;

        const requestBody = {
          inputs: props.data,
          query: query,
          response_mode: 'streaming',
          conversation_id: conversationId.value,
          user: props.userId,
          files: files
        };

        const response1 = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey1}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal
        });

        if (!response1.ok) {
          throw new Error(`第一次调用 HTTP error! status: ${response1.status}`);
        }

        const reader1 = response1.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader1) {
          throw new Error('第一次调用无法读取响应流');
        }

        console.log('发送2 第一次调用开始流式响应');

        let fullContent1 = '';
        let pendingData = '';

        while (true) {
          const { done, value } = await reader1.read();
          if (done) break;

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          pendingData = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.event === 'error') {
                console.error('发送2 第一次调用错误:', data.message || '未知错误');
                continue;
              }

              if (data.event === 'message' && data.answer) {
                fullContent1 += data.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent1,
                  isThinking: false
                };
                await scrollToBottom();
              }

              if (data.event === 'workflow_finished' && data.data && data.data.outputs && data.data.outputs.answer) {
                console.log('发送2 第一次调用找到 workflow_finished 事件');
                fullContent1 = data.data.outputs.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent1,
                  isThinking: false
                };
                await scrollToBottom();
              }
            } catch (e) {
              console.warn('发送2 第一次调用解析数据失败:', e);
            }
          }
        }

        if (pendingData.trim() && pendingData.startsWith('data: ')) {
          try {
            const data = JSON.parse(pendingData.slice(6));
            if (data.event === 'message' && data.answer) {
              fullContent1 += data.answer;
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: fullContent1,
                isThinking: false
              };
              await scrollToBottom();
            }
            if (data.event === 'workflow_finished' && data.data && data.data.outputs && data.data.outputs.answer) {
              fullContent1 = data.data.outputs.answer;
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: fullContent1,
                isThinking: false
              };
              await scrollToBottom();
            }
          } catch (e) {
            console.warn('发送2 第一次调用解析残留数据失败:', e);
          }
        }

        firstCallAnswer = fullContent1;
        console.log('=== 发送2 第一次调用完成 ===');
        console.log('发送2 第一次回答:', firstCallAnswer);

        // 添加第二次调用的 AI 消息
        messages.value.push({
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isThinking: true
        });

        console.log('=== 发送2 第二次调用开始 ===');
        console.log('发送2 第二次 query (来自第一次回答):', firstCallAnswer);

        // 使用 apiKeyFlow2，如果未配置则回退到 apiKey
        const apiKey2 = props.apiKeyFlow2 || props.apiKey;

        // 复用第一次调用的 files 参数（上传的图片在两次调用之间不会改变）
        const requestBody2 = {
          inputs: props.data,
          query: firstCallAnswer,
          response_mode: 'streaming',
          conversation_id: conversationId.value,
          user: props.userId,
          files: files
        };

        const response2 = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey2}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody2),
          signal: abortController.value.signal
        });

        if (!response2.ok) {
          throw new Error(`第二次调用 HTTP error! status: ${response2.status}`);
        }

        const reader2 = response2.body?.getReader();

        if (!reader2) {
          throw new Error('第二次调用无法读取响应流');
        }

        console.log('发送2 第二次调用开始流式响应');

        let fullContent2 = '';
        pendingData = '';
        let hasError = false;

        while (true) {
          const { done, value } = await reader2.read();
          if (done) break;

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          pendingData = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.event === 'error') {
                hasError = true;
                const errorMsg = data.message || '服务发生未知错误';
                const errorDetail = `[Dify Error] ${errorMsg}`;
                console.error('发送2 第二次调用错误:', errorDetail);
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: `请求失败：${errorMsg}`,
                  isThinking: false
                };
                ElMessage.error(errorDetail);
                continue;
              }

              if (hasError) continue;

              if (data.event === 'message' && data.answer) {
                if (data.task_id) {
                  currentTaskId.value = data.task_id;
                }
                fullContent2 += data.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent2,
                  isThinking: false
                };
                await scrollToBottom();
              }

              if (data.event === 'workflow_finished' && data.data && data.data.outputs && data.data.outputs.answer) {
                console.log('发送2 第二次调用找到 workflow_finished 事件');
                fullContent2 = data.data.outputs.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent2,
                  isThinking: false
                };
                await scrollToBottom();
              }
            } catch (e) {
              console.warn('发送2 第二次调用解析数据失败:', e);
            }
          }
        }

        if (pendingData.trim() && pendingData.startsWith('data: ')) {
          try {
            const data = JSON.parse(pendingData.slice(6));

            if (data.event === 'error') {
              hasError = true;
              const errorMsg = data.message || '服务发生未知错误';
              ElMessage.error(errorMsg);
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: `请求失败：${errorMsg}`,
                isThinking: false
              };
            }

            if (!hasError && data.event === 'message' && data.answer) {
              fullContent2 += data.answer;
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: fullContent2,
                isThinking: false
              };
              await scrollToBottom();
            }
          } catch (e) {
            console.warn('发送2 第二次调用解析残留数据失败:', e);
          }
        }

        console.log('=== 发送2 第二次调用完成 ===');
        console.log('发送2 最终回答:', fullContent2);

        if (!hasError) {
          emit('message-received', fullContent2);
        }

      } catch (error: any) {
        console.error('发送2 发送消息失败:', error);

        if (error.name === 'AbortError') {
          const msgIndex = messages.value.length - 1;
          if (msgIndex >= 0 && messages.value[msgIndex]?.role === 'assistant') {
            messages.value[msgIndex] = {
              ...messages.value[msgIndex],
              isThinking: false,
              content: messages.value[msgIndex].content.trim() || '已停止生成'
            };
          }
          ElMessage.info('已停止生成');
          return;
        }

        const msgIndex = messages.value.length - 1;
        if (msgIndex >= 0 && messages.value[msgIndex]?.role === 'assistant') {
          messages.value[msgIndex] = {
            ...messages.value[msgIndex],
            isThinking: false,
            content: '抱歉，服务暂时不可用，请稍后重试。'
          };
        }

        ElMessage.error('发送2 发送消息失败: ' + error.message);
      } finally {
        isLoading.value = false;
        abortController.value = null;
        currentTaskId.value = null;
      }
    };

    // 发送消息3 - 使用 FLOW4 的 API Key
    const sendMessage3 = async () => {
      await sendRequest({
        apiKey: props.apiKeyFlow4 || props.apiKey,
        logPrefix: '发送3'
      });
    };

    // 发送消息4 - 使用 FLOWa1 的 API Key，支持工作流暂停和人工介入
    const sendMessage4 = async (queryText?: string) => {
      await sendRequest({
        apiKey: props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey,
        logPrefix: '发送4',
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true
      });
    };

    // 发送消息Water - 使用水务专用 API Key
    const sendMessageWater = async () => {
      await sendRequest({
        apiKey: props.apiKeyFlowWater || props.apiKey,
        logPrefix: '发送Water'
      });
    };

    // 提交表单
    const submitForm = async (formToken: string, inputs: Record<string, any>, action: string): Promise<any> => {
      const submitUrl = `${props.baseUrl}/api/form/human_input/${formToken}`;
      
      console.log(`📤 提交表单到: ${submitUrl}`);
      console.log('📤 提交数据:', JSON.stringify({ inputs, action }, null, 2));
      
      const response = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs, action })
      });
      
      if (!response.ok) {
        throw new Error(`表单提交失败 (${response.status})`);
      }
      
      const result = await response.json();
      console.log('✅ 表单提交成功');
      console.log('📥 返回数据:', JSON.stringify(result, null, 2));
      return result;
    };

    // 等待工作流完成
    const waitForWorkflowCompletion = async (workflowRunId: string, intervalMs: number = 2000, maxRetries: number = 30): Promise<any> => {
      console.log(`\n⏳ 开始轮询工作流状态 (ID: ${workflowRunId})...`);
      
      let retries = 0;
      let finalResult = null;

      while (retries < maxRetries) {
        retries++;
        const url = `${props.baseUrl}/v1/workflows/run/${workflowRunId}`;
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey}`
            }
          });
          
          if (!response.ok) {
            throw new Error(`查询失败 (${response.status})`);
          }
          
          const result = await response.json();
          const status = result.status;
          
          console.log(`   🔁 第 ${retries} 次查询: 状态 = ${status}`);

          if (status === 'succeeded') {
            console.log('   ✅ 工作流执行成功！');
            finalResult = result;
            break;
          } else if (status === 'failed') {
            console.error('   ❌ 工作流执行失败');
            console.error('   错误信息:', result.error);
            finalResult = result;
            break;
          } else if (status === 'stopped') {
            console.warn('   ⚠️ 工作流已停止');
            finalResult = result;
            break;
          }
        } catch (error) {
          console.error(`   ⚠️ 查询出错: ${error.message}`);
        }

        if (!finalResult) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }

      if (!finalResult) {
        throw new Error(`轮询超时：在 ${maxRetries} 次尝试后工作流仍未完成`);
      }

      return finalResult;
    };

    // 处理人工介入 - Approve
    const handleHumanApprove = async (msgIndex: number) => {
      const message = messages.value[msgIndex];
      if (!message?.formToken) {
        ElMessage.error('无法获取表单令牌');
        return;
      }
      
      isSubmitting.value = true;
      isLoading.value = true;
      
      // 标记消息为已处理，防止重复提交
      message.isProcessed = true;
      
      // 添加用户反馈消息
      messages.value.push({
        role: 'user',
        content: `✅ 确认 - ${message.humanInput || '确认继续'}`,
        timestamp: Date.now()
      });
      
      // 添加 AI 思考中消息
      const thinkingMsg: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isThinking: true
      };
      messages.value.push(thinkingMsg);
      
      await scrollToBottom();

      try {
        // 提交表单
        await submitForm(message.formToken, { usercomments: message.humanInput || '' }, 'approve');
        
        // 等待工作流处理
        console.log('⏳ 等待工作流处理完成...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查询工作流运行结果
        if (message.workflowRunId) {
          const finalResult = await waitForWorkflowCompletion(message.workflowRunId);
          console.log('\n🎉 流程执行完成！');
          
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.isThinking = false;
            
            if (finalResult.outputs && finalResult.outputs.answer) {
              lastMsg.content = finalResult.outputs.answer;
            } else if (finalResult.status === 'succeeded') {
              lastMsg.content = '工作流执行成功完成！';
            } else if (finalResult.error) {
              lastMsg.content = `工作流执行失败：${finalResult.error}`;
            } else {
              lastMsg.content = '工作流已完成，但没有返回结果。';
            }
          }
          
          await scrollToBottom();
          emit('message-received', lastMsg?.content || '');
        } else {
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === 'assistant') {
            lastMsg.isThinking = false;
            lastMsg.content = '已确认，工作流继续执行中...';
          }
        }
        
      } catch (error: any) {
        console.error('人工介入 Approve 失败:', error);
        
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.isThinking = false;
          lastMsg.content = `提交失败：${error.message}`;
        }
        
        ElMessage.error('提交失败：' + error.message);
      } finally {
        isSubmitting.value = false;
        isLoading.value = false;
        isAwaitingFeedback.value = false; // 重置等待反馈状态
        // 确保最后滚动到底部
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    // 处理人工介入 - Revise
    const handleHumanRevise = async (msgIndex: number) => {
      const message = messages.value[msgIndex];
      if (!message?.formToken) {
        ElMessage.error('无法获取表单令牌');
        return;
      }
      
      isSubmitting.value = true;
      isLoading.value = true;
      
      // 标记消息为已处理，防止重复提交
      message.isProcessed = true;
      
      // 获取修改意见
      const reviseQuery = message.humanInput || '继续';
      
      // 添加用户反馈消息
      messages.value.push({
        role: 'user',
        content: reviseQuery,
        timestamp: Date.now()
      });
      
      await scrollToBottom();
      // 再次确保滚动（使用 setTimeout 确保 DOM 更新）
      setTimeout(() => scrollToBottom(), 50);

      try {
        // 提交表单
        await submitForm(message.formToken, { usercomments: reviseQuery }, 'revise');
        
        // 继续对话，将用户反馈作为新的查询
        console.log('🔄 用户选择 Revise，继续对话...');
        
        // 添加 AI 思考中消息
        const thinkingMsg: Message = {
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
          isThinking: true
        };
        messages.value.push(thinkingMsg);
        
        await scrollToBottom();
        // 再次确保滚动
        setTimeout(() => scrollToBottom(), 50);
        
        // 使用相同的 conversation_id 再次调用 chat-messages 接口
        const apiKey = props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey;

        // 构建 files 参数（如果有上传的图片）
        const files = lastUploadedImage.value ? [{
          type: 'image',
          transfer_method: 'local_file',
          upload_file_id: lastUploadedImage.value.id
        }] : [];
        
        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: props.data || {},
            query: reviseQuery,
            response_mode: 'streaming',
            conversation_id: conversationId.value,
            user: props.userId,
            files: files
          }),
          signal: abortController.value.signal
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Revise 请求失败 (${response.status}):`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('无法读取响应流');
        }

        console.log('Revise 开始流式响应');
        
        let fullContent = '';
        let isPaused = false;
        let pauseData: any = null;
        let currentFormToken = '';
        let currentWorkflowRunId = '';
        let pendingData = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Revise 流式响应完成');
              break;
            }
            
            const chunk = pendingData + decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            // 保留最后一行（可能是不完整的）
            pendingData = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim() || line === 'data: [DONE]') {
                continue;
              }
              
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // 处理工作流暂停事件
                  if (data.event === 'workflow_paused') {
                    isPaused = true;
                    isAwaitingFeedback.value = true;
                    pauseData = data;
                    
                    // 提取 form_token（使用专门的提取函数）
                    const formToken = extractFormToken(data);
                    if (formToken) {
                      currentFormToken = formToken;
                      console.log('🔑 Form Token:', formToken);
                    } else {
                      // 如果提取失败，使用 task_id 作为备用
                      currentFormToken = data.task_id || '';
                      console.log('⚠️ 无法提取 form_token，使用 task_id:', currentFormToken);
                    }
                    
                    // 保存 workflow_run_id
                    if (data.data && data.data.workflow_run_id) {
                      currentWorkflowRunId = data.data.workflow_run_id;
                    } else {
                      currentWorkflowRunId = data.workflow_run_id || '';
                    }
                    
                    console.log('🔔 工作流暂停，需要人工介入:', pauseData);
                    
                    // 提取暂停时的消息内容（form_content）
                    let pauseContent = '';
                    if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
                      const reason = pauseData.data.reasons[0];
                      if (reason.form_content) {
                        pauseContent = reason.form_content
                          .replace(/\\n/g, '\n')
                          .replace(/\*\*/g, '');
                      }
                    }
                    
                    // 更新当前消息内容
                    if (thinkingMsg) {
                      thinkingMsg.isThinking = false;
                      thinkingMsg.content = pauseContent || fullContent || '工作流已暂停，等待人工介入';
                      thinkingMsg.isHumanInteraction = true;
                      thinkingMsg.formToken = currentFormToken;
                      thinkingMsg.workflowRunId = currentWorkflowRunId;
                    }
                    
                    await scrollToBottom();
                    // 再次确保滚动到最新的人工介入区域
                    setTimeout(() => scrollToBottom(), 100);
                    break;
                  }
                  
                  // 处理消息内容
                  if (data.answer) {
                    fullContent += data.answer;
                    if (thinkingMsg) {
                      thinkingMsg.content = fullContent;
                    }
                    await scrollToBottom();
                  }
                  
                  // 处理工作流完成事件
                  if (data.event === 'workflow_finished' || data.event === 'message_end') {
                    if (thinkingMsg) {
                      thinkingMsg.isThinking = false;
                      // 检查工作流是否失败
                      if (data.data && data.data.status === 'failed') {
                        const errorMsg = data.data.error || '工作流执行失败';
                        thinkingMsg.content = `❌ ${errorMsg}`;
                        thinkingMsg.isHumanInteraction = true; // 保持等待状态，允许重新输入
                        ElMessage.error('工作流执行失败：' + errorMsg);
                      }
                    }
                  }
                  
                } catch (parseError) {
                  console.error('解析 SSE 数据失败:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        // 处理残留数据中的 workflow_finished 事件（处理分块传输导致的残留）
        if (pendingData.trim() && pendingData.startsWith('data: ')) {
          try {
            const data = JSON.parse(pendingData.slice(6));
            if (data.event === 'workflow_finished' && thinkingMsg) {
              thinkingMsg.isThinking = false;
              if (data.data && data.data.status === 'failed') {
                const errorMsg = data.data.error || '工作流执行失败';
                thinkingMsg.content = `❌ ${errorMsg}`;
                thinkingMsg.isHumanInteraction = true;
                ElMessage.error('工作流执行失败：' + errorMsg);
              }
            }
          } catch (e) {
            console.warn('处理残留数据失败:', e);
          }
        }
        
        // 如果工作流暂停，保持人工介入状态
        if (isPaused && pauseData) {
          console.log('Revise 工作流暂停，等待用户操作');
        } else {
          // 正常完成
          if (thinkingMsg) {
            thinkingMsg.isThinking = false;
          }
          emit('message-received', fullContent);
        }
        
      } catch (error: any) {
        console.error('人工介入 Revise 失败:', error);
        
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === 'assistant') {
          lastMsg.isThinking = false;
          lastMsg.content = `提交失败：${error.message}`;
        }
        
        ElMessage.error('提交失败：' + error.message);
      } finally {
        isSubmitting.value = false;
        isLoading.value = false;
        isAwaitingFeedback.value = false; // 重置等待反馈状态
        // 确保最后滚动到底部
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    // 触发图片上传
    const triggerImageUpload = () => {
      fileInput.value?.click();
    };

    // 处理图片上传
    const handleImageUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;

      // 检查文件类型
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        ElMessage.error('请选择有效的图片格式（png/jpeg/jpg/webp/gif）');
        target.value = '';
        return;
      }

      // 检查文件大小（小于2MB）
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        ElMessage.error('图片大小不能超过2MB');
        target.value = '';
        return;
      }

      // 显示加载状态
      isLoading.value = true;

      try {
        // 使用 apiKeyFlow3，如果未配置则回退到 apiKey
        const apiKey = props.apiKeyFlow3 || props.apiKey;
        
        console.log('=== 开始上传图片 ===');
        console.log('文件名:', file.name);
        console.log('文件大小:', file.size);
        console.log('文件类型:', file.type);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('user', props.userId || 'abc-123');

        const response = await fetch(`${props.baseUrl}/v1/files/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`
          },
          body: formData
        });

        if (!response.ok) {
          throw new Error(`上传失败 HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        console.log('=== 图片上传成功 ===');
        console.log('上传结果:', JSON.stringify(result, null, 2));

        // 保存图片信息（不显示在对话框中）
        lastUploadedImage.value = {
          id: result.id,
          name: result.name,
          size: result.size,
          extension: result.extension,
          mime_type: result.mime_type,
          created_at: result.created_at
        };

        // 预览图片（不自动打开预览，只保存图片数据）
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImageUrl.value = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        ElMessage.success(`图片 "${result.name}" 上传成功！点击旁边的链接查看预览`);

      } catch (error: any) {
        console.error('图片上传失败:', error);
        ElMessage.error('图片上传失败：' + error.message);
      } finally {
        isLoading.value = false;
        target.value = ''; // 重置文件输入
      }
    };

    // 打开图片预览
    const openImagePreview = () => {
      if (!lastUploadedImage.value) {
        ElMessage.warning('暂无已上传的图片');
        return;
      }
      imagePreviewVisible.value = true;
    };

    // CAD转JSON
    const cadToJson = async () => {
      if (!lastUploadedImage.value) {
        ElMessage.warning('请先上传图片');
        return;
      }

      isCadConverting.value = true;

      // 添加用户消息
      messages.value.push({
        role: 'user',
        content: `📐 CAD转JSON (图片: ${lastUploadedImage.value.name})`,
        timestamp: Date.now()
      });

      // 添加AI消息（思考中状态）
      const msgIndex = messages.value.length;
      messages.value.push({
        role: 'assistant',
        content: '',
        isThinking: true,
        timestamp: Date.now()
      });

      await scrollToBottom();

      // 创建 AbortController 用于取消请求
      abortController.value = new AbortController();

      try {
        // 使用 apiKeyFlow3，如果未配置则回退到 apiKey
        const apiKey = props.apiKeyFlow3 || props.apiKey;
        
        console.log('=== CAD转JSON 开始 ===');
        console.log('使用图片ID:', lastUploadedImage.value.id);

        const requestBody = {
          inputs: {},
          query: 'cad转json',
          response_mode: 'streaming',
          conversation_id: '',
          user: props.userId || 'abc-123',
          files: [
            {
              type: 'image',
              transfer_method: 'local_file',
              upload_file_id: lastUploadedImage.value.id
            }
          ]
        };

        console.log('请求体:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal
        });

        if (!response.ok) {
          throw new Error(`请求失败 HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('无法获取响应流');
        }

        const decoder = new TextDecoder('utf-8');
        let fullContent = '';

        console.log('=== CAD转JSON 开始流式响应 ===');

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('=== CAD转JSON 流式响应结束 ===');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const data = JSON.parse(line.substring(6));
              
              // 保存 taskId 用于停止生成
              if (data.task_id) {
                currentTaskId.value = data.task_id;
              }
              
              if (data.event === 'message') {
                if (data.answer) {
                  fullContent += data.answer;
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: fullContent,
                    isThinking: false
                  };
                  await scrollToBottom();
                }
              } else if (data.event === 'error') {
                throw new Error(data.message || '转换失败');
              } else if (data.event === 'end') {
                console.log('=== CAD转JSON 找到 end 事件 ===');
                break;
              }
            } catch (jsonError) {
              console.warn('解析JSON失败:', line, jsonError);
            }
          }
        }

        console.log('=== CAD转JSON 完成 ===');
        console.log('转换结果:', fullContent);

        // 确保消息状态正确
        messages.value[msgIndex] = {
          ...messages.value[msgIndex],
          content: fullContent,
          isThinking: false
        };

        await scrollToBottom();

        ElMessage.success('CAD转JSON完成！');

      } catch (error: any) {
        // 如果是用户主动取消，不显示错误
        if (error.name === 'AbortError') {
          console.log('CAD转JSON已停止');
          ElMessage.info('CAD转JSON已停止');
          return;
        }

        console.error('CAD转JSON失败:', error);
        
        // 更新消息显示错误
        messages.value[messages.value.length - 1] = {
          ...messages.value[messages.value.length - 1],
          content: `CAD转JSON失败：${error.message}`,
          isThinking: false
        };

        await scrollToBottom();

        ElMessage.error('CAD转JSON失败：' + error.message);
      } finally {
        isCadConverting.value = false;
        abortController.value = null;
        currentTaskId.value = null;
      }
    };

    // 清空消息
    const clearMessages = () => {
      messages.value = [];
      conversationId.value = '';
      ElMessage.success('对话已清空');
    };

    // 停止生成
    const stopGeneration = async () => {
      if (!isLoading.value && !isCadConverting.value) return;
      
      // 先调用官方停止接口
      if (currentTaskId.value) {
        try {
          const response = await fetch(`${props.baseUrl}/v1/chat-messages/${currentTaskId.value}/stop`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${props.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user: props.userId
            })
          });
          
          const result = await response.json();
          if (result.result === 'success') {
            console.log('停止请求成功');
          }
        } catch (error) {
          console.error('调用停止接口失败:', error);
        }
      }
      
      // 取消本地请求
      if (abortController.value) {
        abortController.value.abort();
      }
      
      // 将最后一条 AI 消息的 isThinking 设置为 false
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.isThinking) {
          messages.value[messages.value.length - 1] = {
            ...lastMsg,
            isThinking: false
          };
        }
      }
      
      // 如果是 CAD转JSON，清理状态
      if (isCadConverting.value) {
        isCadConverting.value = false;
        abortController.value = null;
        currentTaskId.value = null;
      }
      
      ElMessage.info('已停止生成');
    };

    // 校验屏幕JSON是否符合最低结构要求
    // 返回true表示通过校验，false表示未通过
    const validateScreenJsonStructure = (jsonObj: any): boolean => {
      // 检查是否为对象
      if (!jsonObj || typeof jsonObj !== 'object') {
        ElMessage.warning('JSON结构无效：根对象不存在或不是有效对象');
        return false;
      }

      // 检查screen对象
      if (!jsonObj.screen || typeof jsonObj.screen !== 'object') {
        ElMessage.warning('JSON结构无效：缺少screen对象或screen不是有效对象');
        return false;
      }

      // 检查screen.id
      if (jsonObj.screen.id === undefined || jsonObj.screen.id === null) {
        ElMessage.warning('JSON结构无效：screen对象缺少id字段');
        return false;
      }

      // 检查screen.name
      if (jsonObj.screen.name === undefined || jsonObj.screen.name === null) {
        ElMessage.warning('JSON结构无效：screen对象缺少name字段');
        return false;
      }

      // 检查coms数组
      if (!Array.isArray(jsonObj.coms)) {
        ElMessage.warning('JSON结构无效：coms不是有效的数组');
        return false;
      }

      return true;
    };

    // 保存AI生成的屏幕数据
    const saveScreenAI = async (jsonObj: any) => {
      try {
        await saveScreen(jsonObj);
        EditorModule.screenJsonSnapshot = JSON.stringify(jsonObj);
        ElMessage.success('AI生成的屏幕数据保存成功');
      } catch (error) {
        console.error('保存AI生成的屏幕数据失败:', error);
        ElMessage.error('保存失败，请稍后重试');
        throw error;
      }
    };

    // 从URL读取JSON并保存屏幕数据
    const fetchAndSaveScreenAI = async () => {
      const aiMessages = messages.value.filter(msg => msg.role === 'assistant' && !msg.isThinking);
      if (aiMessages.length === 0) {
        ElMessage.warning('暂无 AI 回答');
        return;
      }
      try {
        ElMessage.info('正在加载JSON数据...');
        const response = await fetch('http://10.89.33.97:5000/data.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonObj = await response.json();

        if(EditorModule.screen)
        {
          if(EditorModule.screen.id)
          {
            jsonObj.screen.id = EditorModule.screen.id
            
            // 设置所有组件的 projectId 为当前屏幕 ID
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach(component => {
                component.projectId = EditorModule.screen.id
              })
            }
          }
          if(EditorModule.screen.name)
          {
            jsonObj.screen.name = EditorModule.screen.name
          }
          
        }

        await saveScreenAI(jsonObj);
        console.log('从URL读取的 JSON 内容saveScreenAI:', jsonObj);
      } catch (error) {
        console.error('从URL读取JSON失败:', error);
        ElMessage.error('读取JSON失败，请检查网络或URL是否正确');
      }
    };

    // 将最后一条 AI 回答中的 JSON 输出到控制台
    const outputJsonToConsole = async () => {
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
          let jsonStr = jsonMatch[0];
          
          // 先进行基本的格式校准（处理markdown标记、引号问题等）
          let jsonObj = calibrateJsonString(jsonStr);
          
          if (!jsonObj) {
            // 如果校准失败，尝试直接解析
            try {
              jsonObj = JSON.parse(jsonStr);
            } catch (parseError) {
              console.warn('JSON校准失败且直接解析也失败:', parseError);
              ElMessage.warning('无法解析JSON内容');
              return;
            }
          }
            
            // if (dataSProject) {
            //   // 将值添加到 JSON 对象中，键名为 projectid
            //   jsonObj.projectid = dataSProject;
            // }
            // 添加 screen 数据（只包含id和name）
            if(EditorModule.screen)
            {
              if(EditorModule.screen.id)
              {
                jsonObj.screen.id = EditorModule.screen.id
                
                // 设置所有组件的 projectId 为当前屏幕 ID
                if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
                  jsonObj.coms.forEach(component => {
                    component.projectId = EditorModule.screen.id
                  })
                }
                
              }
              if(EditorModule.screen.name)
              {
                jsonObj.screen.name = EditorModule.screen.name
              }
              
            }
            
            // 使用JSONRepairTool修复大屏配置结构
            const repairTool = new JSONRepairTool();
            let repairedJson = repairTool.repairScreenConfig(jsonObj);
            
            // 根据模板修复组件配置（与校准JSON保持一致）
            const template = comsTemplate as unknown as Record<string, any>;
            if (repairedJson.coms && Array.isArray(repairedJson.coms)) {
              repairedJson.coms = repairedJson.coms.map((component: any) => {
                return refineComponentByTemplate(component, template);
              });
            }

            // JSON结构校验（如果开启校验功能）
            if (enableJsonValidation.value && !validateScreenJsonStructure(repairedJson)) {
              console.warn('JSON结构校验未通过，拒绝保存');
              return;
            }

            // 调用saveScreenAI方法保存AI生成的屏幕数据
            await saveScreenAI(repairedJson);
            console.log('AI 回答中的 JSON 内容saveScreenAI:', repairedJson);
            return;
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
    const handleClose = async () => {
      // 如果有正在进行的请求，取消它
      if (abortController.value) {
        abortController.value.abort();
      }
      dialogVisible.value = false;
      // 保留消息和会话ID，不移除
      emit('close');
      
      // 关闭弹窗后重新加载页面数据
      try {
        // 重新加载屏幕数据
        const screenId = EditorModule.screen?.id;
        if (screenId) {
          await EditorModule.loadScreen(screenId);
          FilterModule.loadFilters(screenId);
          UploadImagesModule.loadUploadImages(screenId);
          EditorModule.loadComs(screenId);
          if (EditorModule.screen.groupId) {
            ThreedModule.loadThreedModelList(EditorModule.screen.groupId);
          }
          // 重新计算画布缩放
          EditorModule.autoCanvasScale(() => ({
            offsetX: ToolbarModule.getPanelOffsetX,
            offsetY: ToolbarModule.getPanelOffsetY,
          }));
        }
      } catch (error) {
        console.error('重新加载页面数据失败:', error);
      }
    };

    // 测试模式开关 - 设置为true时直接使用本地测试数据
    const USE_TEST_DATA = true;

    // 创建JSON修复工具实例
    const jsonRepairTool = new JSONRepairTool();

    // 校准JSON功能
    const calibrateJson = async () => {
      let jsonObj: any = null;

      try {
        if (USE_TEST_DATA) {
          // 测试模式：使用fetch读取本地测试数据（支持非法JSON自动校准）
          // 使用fetch而非import可以绕过编译时JSON校验
          ElMessage.info('正在读取测试数据...');
          try {
            const response = await fetch('/src/components/dify-chatbot/test/testresponse.json');
            const jsonStr = await response.text();
            
            // 尝试直接解析，如果失败则进行校准
            try {
              jsonObj = JSON.parse(jsonStr);
            } catch (parseError) {
              console.log('JSON解析失败，尝试校准...');
              jsonObj = calibrateJsonString(jsonStr);
              
              if (!jsonObj) {
                throw new Error('JSON校准失败: ' + parseError.message);
              }
            }
          } catch (fetchError) {
            console.error('读取测试数据失败:', fetchError);
            throw new Error('无法读取测试数据: ' + fetchError.message);
          }
        } else {
          // 正式模式：从AI回答中提取JSON
          // 查找最后一条 AI 助手的消息
          const aiMessages = messages.value.filter(msg => msg.role === 'assistant' && !msg.isThinking);
          if (aiMessages.length === 0) {
            ElMessage.warning('暂无 AI 回答');
            return;
          }

          const lastAiMessage = aiMessages[aiMessages.length - 1];
          const content = lastAiMessage.content;

          // 1. 提取JSON字符串
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            ElMessage.warning('未找到JSON格式内容');
            return;
          }

          let jsonStr = jsonMatch[0];

          // 2. 校准JSON（修复常见的JSON格式问题）
          jsonObj = calibrateJsonString(jsonStr);
          
          if (!jsonObj) {
            ElMessage.error('JSON校准失败');
            return;
          }
        }

        // 3. 使用JSONRepairTool修复大屏配置结构
        const refinedJson = jsonRepairTool.repairScreenConfig(jsonObj);

        // 4. 根据模板修复组件配置
        const template = comsTemplate as unknown as Record<string, any>;
        if (refinedJson.coms && Array.isArray(refinedJson.coms)) {
          refinedJson.coms = refinedJson.coms.map((component: any) => {
            return refineComponentByTemplate(component, template);
          });
        }

        // 5. 更新屏幕ID和名称
        if(EditorModule.screen) {
          if(EditorModule.screen.id) {
            refinedJson.screen.id = EditorModule.screen.id;
            if (refinedJson.coms && Array.isArray(refinedJson.coms)) {
              refinedJson.coms.forEach(component => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if(EditorModule.screen.name) {
            refinedJson.screen.name = EditorModule.screen.name;
          }
        }

        // JSON结构校验（如果开启校验功能）
        if (enableJsonValidation.value && !validateScreenJsonStructure(refinedJson)) {
          console.warn('JSON结构校验未通过，拒绝保存');
          return;
        }

        // 6. 保存校准后的JSON
        await saveScreenAI(refinedJson);
        ElMessage.success('JSON校准并保存成功');
        console.log('校准后的JSON:', refinedJson);

      } catch (error) {
        console.error('校准JSON时发生错误:', error);
        ElMessage.error('校准失败: ' + error.message);
      }
    };

    // 根据模板修复单个组件
    const refineComponentByTemplate = (component: any, template: Record<string, any>): any => {
      const componentType = component.name || 'VMainTitle';
      const templateComponent = template[componentType];
      
      if (!templateComponent) {
        console.warn(`组件类型 ${componentType} 不在模板中，使用默认配置`);
        return component;
      }

      // 创建新组件对象，以原始组件为基础
      const newComponent: any = { ...component };

      // 合并基础属性，优先使用原始值
      newComponent.alias = component.alias !== undefined ? component.alias : templateComponent.alias;
      newComponent.icon = component.icon !== undefined ? component.icon : templateComponent.icon;
      newComponent.img = component.img !== undefined ? component.img : templateComponent.img;
      newComponent.locked = component.locked !== undefined ? component.locked : templateComponent.locked;
      newComponent.hided = component.hided !== undefined ? component.hided : templateComponent.hided;
      newComponent.eventhub = component.eventhub !== undefined ? component.eventhub : templateComponent.eventhub;
      newComponent.handles = component.handles || templateComponent.handles || {};
      newComponent.ichandles = component.ichandles || templateComponent.ichandles || {};
      // 优先使用原始数据，只有在原始数据不存在时才使用模板值
      newComponent.apis = component.apis !== undefined ? component.apis : (templateComponent.apis || {});
      newComponent.events = component.events !== undefined ? component.events : (templateComponent.events || {});
      newComponent.actions = component.actions !== undefined ? component.actions : (templateComponent.actions || {});

      // 保留特殊字段
      if (component.subComs) {
        newComponent.subComs = component.subComs;
      }
      if (component.parentId) {
        newComponent.parentId = component.parentId;
      }

      // 合并attr属性
      newComponent.attr = mergeAttr(component.attr, templateComponent.attr);

      // 合并config配置
      newComponent.config = mergeConfig(component.config || {}, templateComponent.config || {});

      // 处理apiData - 保留原有结构或使用默认值
      if (component.apiData) {
        newComponent.apiData = { ...component.apiData };
        if (newComponent.apiData.source) {
          newComponent.apiData.source.comId = newComponent.id;
        }
      } else if (templateComponent.apiData) {
        newComponent.apiData = { ...templateComponent.apiData };
        if (newComponent.apiData.source) {
          newComponent.apiData.source.comId = newComponent.id;
        }
      }

      return newComponent;
    };

    // 合并attr属性
    const mergeAttr = (source: any, template: any): any => {
      return {
        x: source?.x !== undefined ? source.x : template?.x || 0,
        y: source?.y !== undefined ? source.y : template?.y || 0,
        w: source?.w !== undefined ? source.w : template?.w || 300,
        h: source?.h !== undefined ? source.h : template?.h || 200,
        deg: source?.deg !== undefined ? source.deg : template?.deg || 0,
        opacity: source?.opacity !== undefined ? source.opacity : template?.opacity || 1,
        filpV: source?.filpV !== undefined ? source.filpV : template?.filpV || false,
        filpH: source?.filpH !== undefined ? source.filpH : template?.filpH || false
      };
    };

    // 合并config配置（递归）
    const mergeConfig = (source: any, template: any): any => {
      const result: any = {};

      // 遍历模板的所有键
      for (const key of Object.keys(template)) {
        if (typeof template[key] === 'object' && template[key] !== null && !Array.isArray(template[key])) {
          // 如果源对象也有这个键且是对象，递归合并
          result[key] = mergeConfig(source[key] || {}, template[key]);
        } else if (Array.isArray(template[key])) {
          // 如果是数组，使用源数组或模板数组
          result[key] = Array.isArray(source[key]) ? source[key] : template[key];
        } else {
          // 基本类型，优先使用源值，否则使用模板值
          result[key] = source[key] !== undefined ? source[key] : template[key];
        }
      }

      // 添加源对象中存在但模板中不存在的字段
      for (const key of Object.keys(source)) {
        if (!(key in result)) {
          result[key] = source[key];
        }
      }

      return result;
    };

    // 复制最后一条AI回答内容
    const copyLastMessageContent = async () => {
      // 查找最后一条 AI 助手的消息
      const aiMessages = messages.value.filter(msg => msg.role === 'assistant' && !msg.isThinking);
      if (aiMessages.length === 0) {
        ElMessage.warning('暂无 AI 回答内容可复制');
        return;
      }

      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const content = lastAiMessage.content;

      try {
        // 使用 Clipboard API 复制内容
        await navigator.clipboard.writeText(content);
        ElMessage.success('内容已复制到剪贴板');
      } catch (error) {
        console.error('复制失败:', error);
        // 降级方案：创建临时文本区域
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          ElMessage.success('内容已复制到剪贴板');
        } catch (e) {
          ElMessage.error('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
      }
    };

    // 临时保存payload数据
    const saveTempPayload = async () => {
      try {
        let jsonObj = payloadJson.default as unknown as { screen: { id: number; name: string }, coms: any[] };
        if(EditorModule.screen)
        {
          if(EditorModule.screen.id)
          {
            jsonObj.screen.id = EditorModule.screen.id
            
            // 设置所有组件的 projectId 为当前屏幕 ID
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach(component => {
                component.projectId = EditorModule.screen.id
              })
            }
            
          }
          if(EditorModule.screen.name)
          {
            jsonObj.screen.name = EditorModule.screen.name
          }
          
        }
        await saveScreenAI(jsonObj);
        console.log('写死的 JSON 内容saveScreenAI:', jsonObj);
      } catch (error) {
        console.error('保存payload失败:', error);
      }
    };

    // 原始保存 - 只调用calibrateJsonString校准JSON格式，不进行后续组件校对
    const saveRawJson = async () => {
      try {
        // 查找最后一条 AI 助手的消息
        const aiMessages = messages.value.filter(msg => msg.role === 'assistant' && !msg.isThinking);
        if (aiMessages.length === 0) {
          ElMessage.warning('暂无 AI 回答');
          return;
        }

        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const content = lastAiMessage.content;

        // 1. 提取JSON字符串
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          ElMessage.warning('未找到JSON格式内容');
          return;
        }

        let jsonStr = jsonMatch[0];

        // 2. 只调用calibrateJsonString校准JSON格式（处理markdown等格式问题）
        const jsonObj = calibrateJsonString(jsonStr);
        
        if (!jsonObj) {
          ElMessage.error('JSON校准失败');
          return;
        }

        // 3. 更新屏幕ID和名称
        if(EditorModule.screen) {
          if(EditorModule.screen.id) {
            jsonObj.screen.id = EditorModule.screen.id;
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach(component => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if(EditorModule.screen.name) {
            jsonObj.screen.name = EditorModule.screen.name;
          }
        }

        // JSON结构校验（如果开启校验功能）
        if (enableJsonValidation.value && !validateScreenJsonStructure(jsonObj)) {
          console.warn('JSON结构校验未通过，拒绝保存');
          return;
        }

        // 4. 保存校准后的JSON（不进行后续组件修复和模板校对）
        await saveScreenAI(jsonObj);
        ElMessage.success('原始保存成功');
        console.log('原始保存的JSON:', jsonObj);

      } catch (error) {
        console.error('原始保存时发生错误:', error);
        ElMessage.error('保存失败: ' + error.message);
      }
    };

    return {
      dialogVisible,
      userQuery,
      messages,
      isLoading,
      messageContainer,
      enableJsonValidation,
      fileInput,
      imagePreviewVisible,
      previewImageUrl,
      lastUploadedImage,
      isCadConverting,
      recommendQuestions,
      selectedQuestion,
      isSubmitting,
      isAwaitingFeedback,
      handleClose,
      sendMessage,
      sendMessage2,
      sendMessage3,
      sendMessage4,
      sendMessageWater,
      handleHumanApprove,
      handleHumanRevise,
      clearMessages,
      stopGeneration,
      outputJsonToConsole,
      saveTempPayload,
      fetchAndSaveScreenAI,
      calibrateJson,
      copyLastMessageContent,
      saveRawJson,
      handleEnter,
      formatContent,
      formatTime,
      triggerImageUpload,
      handleImageUpload,
      openImagePreview,
      cadToJson
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
  max-width: 90%;
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

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.top-bar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-row :deep(.el-textarea) {
  flex: 1;
}

.input-actions {
  display: flex;
  flex-direction: row;
  gap: 8px;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
  gap: 8px;
}

.image-preview-link {
  cursor: pointer;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.image-preview-link:hover {
  background-color: #f0f9ff;
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
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-dialog__headerbtn) {
  position: absolute;
  top: 50%;
  right: 20px;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 隐藏原来的关闭按钮 */
:deep(.el-dialog__headerbtn) {
  visibility: hidden;
}

/* 自定义关闭按钮 */
.my-close-btn {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 24px;
  color: #909399;
  line-height: 32px;
  text-align: center;
  z-index: 100;
}

.my-close-btn:hover {
  color: #606266;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #e4e7ed;
  padding: 12px 20px;
}

/* JSON校验开关样式 */
.json-validation-switch {
  margin-left: auto;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

/* 人工介入消息样式 */
.human-interaction-message {
  background: #fffbe6 !important;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #fef3c7;
}

.human-interaction-wrapper {
  width: 100%;
}

.agent-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fffbe6 0%, #fff3cd 100%);
  border-radius: 6px;
  margin-bottom: 12px;
  border-left: 4px solid #f59e0b;
}

.agent-icon {
  font-size: 16px;
}

.agent-text {
  font-weight: 600;
  color: #d97706;
  font-size: 13px;
}

.ai-message-content {
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  border: 1px solid #e5e7eb;
}

.human-feedback-section {
  background-color: #ffffff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.human-feedback-section .feedback-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  resize: vertical;
  transition: border-color 0.2s;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.human-feedback-section .feedback-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.feedback-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.feedback-actions :deep(.el-button) {
  min-width: 80px;
  font-size: 13px;
}

.expiry-note {
  font-size: 11px;
  color: #f59e0b;
  text-align: center;
  padding: 6px;
  background-color: #fffbeb;
  border-radius: 4px;
}
</style>