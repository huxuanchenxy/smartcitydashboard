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
            :class="[
              'message-item',
              message.role === 'user' ? 'user-message' : 'assistant-message',
              { 'human-interaction-message': message.isHumanInteraction },
            ]"
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
                <div class="expiry-note">⚠️ 此操作将在1小时内过期。</div>
              </div>
            </div>

            <!-- 普通消息 -->
            <template v-else>
              <div class="message-header">
                <div class="avatar" :class="message.role">
                  {{ message.role === "user" ? "👤" : "🤖" }}
                </div>
                <div class="message-role">{{ message.role === "user" ? "用户" : "AI 助手" }}</div>
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
              style="
                width: 280px;
                height: 32px;
                padding: 0 12px;
                border: 1px solid #dcdfe6;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
              "
            >
              <option value="" disabled>选择推荐问题...</option>
              <option v-for="question in recommendQuestions" :key="question" :value="question">
                {{ question }}
              </option>
            </select>
            <div class="top-bar-actions">
              <!-- 水务模式下保留：复制回答内容、清空对话、上传图片 -->
              <el-button
                type="primary"
                size="small"
                @click="copyLastMessageContent"
                :disabled="isLoading"
                >复制回答内容</el-button
              >
              <el-button type="warning" size="small" @click="clearMessages" :disabled="isLoading"
                >清空对话</el-button
              >
              <el-button
                type="success"
                size="small"
                @click="triggerImageUpload"
                :disabled="isLoading || isAwaitingFeedback"
                >上传文件</el-button
              >
              <!-- 水务模式下隐藏：CAD转JSON -->
              <!-- <el-button 
              v-if="!waterServiceMode"
              type="success" 
              size="small"
              @click="cadToJson" 
              :disabled="isLoading || isAwaitingFeedback || !lastUploadedImage"
              :loading="isCadConverting"
            >
              {{ isCadConverting ? '转换中' : 'CAD转JSON' }}
            </el-button> -->
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
            <div class="input-actions" style="display: flex; flex-direction: column; gap: 8px">
              <!-- 步骤路径指示器 -->
              <div class="step-path-container" v-if="!waterServiceMode">
                <div class="step-path">
                  <!-- 步骤1：图纸识别 -->
                  <div
                    class="step-node"
                    :class="{ current: currentStep === 1, completed: currentStep > 1 }"
                  >
                    <div class="step-dot">
                      <span v-if="currentStep > 1" class="step-check">✓</span>
                      <span v-else class="step-number">1</span>
                    </div>
                    <span class="step-label">图纸识别</span>
                  </div>
                  <div class="step-connector" :class="{ active: currentStep > 1 }"></div>
                  <!-- 步骤2：点位绑定 -->
                  <div
                    class="step-node"
                    :class="{ current: currentStep === 2, completed: currentStep > 2 }"
                  >
                    <div class="step-dot">
                      <span v-if="currentStep > 2" class="step-check">✓</span>
                      <span v-else class="step-number">2</span>
                    </div>
                    <span class="step-label">点位绑定</span>
                  </div>
                  <div class="step-connector" :class="{ active: currentStep > 2 }"></div>
                  <!-- 步骤3：生成DSL -->
                  <div
                    class="step-node"
                    :class="{ current: currentStep === 3, completed: currentStep > 3 }"
                  >
                    <div class="step-dot">
                      <span v-if="currentStep > 3" class="step-check">✓</span>
                      <span v-else class="step-number">3</span>
                    </div>
                    <span class="step-label">生成DSL</span>
                  </div>
                </div>
              </div>
              <!-- 第二行：操作按钮 -->
              <div class="actions-row" style="display: flex; align-items: center; gap: 8px">
                <span class="hint" v-if="isLoading || isCadConverting"
                  >AI 正在思考中，请稍候...</span
                >
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
                <!-- 助手下拉框 -->
                <select
                  v-model="selectedSendType"
                  :disabled="isLoading || isAwaitingFeedback"
                  class="send-type-select"
                  style="
                    width: 90px;
                    height: 32px;
                    padding: 0 8px;
                    border-radius: 4px;
                    border: 1px solid #dcdfe6;
                    font-size: 13px;
                    z-index: 1000;
                  "
                >
                  <option
                    v-for="type in sendTypes"
                    :key="type.id"
                    :value="type.id"
                    :disabled="getSendTypeDisabled(type)"
                  >
                    {{ type.label }}
                  </option>
                </select>
                <!-- 重置步骤按钮 -->
                <el-button
                  v-if="currentStep > 1"
                  type="default"
                  size="small"
                  @click="resetSteps"
                  :disabled="isLoading || isAwaitingFeedback"
                  title="重置到步骤1"
                >
                  重置
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="sendDispatch"
                  :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                  class="send-button"
                  title="发送调度"
                >
                  {{ isLoading ? "发送中" : "发送" }}
                </el-button>
              </div>
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
      width="1000px"
      append-to-body
      @open="resetImageScale"
      @close="handlePreviewClose"
    >
      <div
        class="image-preview-container"
        @wheel.prevent="handleImageWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <img
          ref="imageRef"
          :src="previewImageUrl"
          alt="预览图片"
          class="preview-image"
          :class="{ 'is-dragging': isDragging }"
          :style="{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${imageScale})` }"
          @click.stop="resetImageScale"
        />
      </div>
      <div class="image-preview-hint">滚轮缩放图片，右键拖动查看细节，点击图片重置</div>
    </el-dialog>

    <!-- 验证结果图片预览弹窗 -->
    <el-dialog
      v-model="validationResultImageVisible"
      title="验证结果图片"
      width="800px"
      append-to-body
      @open="resetImageScale"
      @close="handlePreviewClose"
    >
      <div
        class="image-preview-container"
        @wheel.prevent="handleImageWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <img
          ref="imageRef"
          :src="validationResultImageUrl"
          alt="验证结果图片"
          class="preview-image"
          :class="{ 'is-dragging': isDragging }"
          :style="{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${imageScale})` }"
          @click.stop="resetImageScale"
        />
      </div>
      <div class="image-preview-hint">滚轮缩放图片，拖动查看细节，点击图片重置</div>
      <div
        v-if="validationResultJson"
        style="margin-top: 16px; padding: 12px; background-color: #f5f5f5; border-radius: 8px"
      >
        <h4 style="margin-bottom: 8px">验证结果摘要:</h4>
        <p v-if="validationResultJson.summary" style="font-size: 13px; line-height: 1.6">
          {{ validationResultJson.summary }}
        </p>
        <p
          v-if="validationResultJson.success !== undefined"
          style="font-size: 13px; margin-top: 8px"
        >
          状态:
          <span :style="{ color: validationResultJson.success ? '#67c23a' : '#f56c6c' }">{{
            validationResultJson.success ? "成功" : "失败"
          }}</span>
        </p>
      </div>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <!-- <el-button @click="handleClose">关闭</el-button> -->

        <!-- <el-button v-if="!waterServiceMode" type="primary" @click="outputJsonToConsole" :disabled="isLoading || isAwaitingFeedback">AI生成画布</el-button> -->
        <!-- <el-button v-if="!waterServiceMode" type="success" @click="saveRawJson" :disabled="isLoading || isAwaitingFeedback">原始保存</el-button> -->
        <!-- <el-button v-if="!waterServiceMode" type="info" @click="saveTempPayload" :disabled="isAwaitingFeedback">临时保存payload</el-button> -->
        <!-- 水务模式下隐藏：AI生成画布 -->
        <!-- <el-button v-if="!waterServiceMode" type="success" @click="fetchAndSaveScreenAI" :disabled="isLoading || isAwaitingFeedback">AI生成画布</el-button> -->
        <!-- <el-button v-if="!waterServiceMode" type="danger" @click="calibrateJson" :disabled="isLoading || isAwaitingFeedback">校准JSON</el-button> -->
        <!-- <el-button v-if="!waterServiceMode" type="primary" @click="extractValidationResult" :disabled="isLoading || isAwaitingFeedback">提取验证结果</el-button> -->

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
import {
  defineComponent,
  ref,
  watch,
  nextTick,
  onUnmounted,
  onMounted,
  PropType,
  computed,
} from "vue";
import { ElMessage } from "element-plus";
import { EditorModule } from "@/store/modules/editor";
import { FilterModule } from "@/store/modules/filter";
import { UploadImagesModule } from "@/store/modules/images";
import { ThreedModule } from "@/store/modules/threed";
import { ToolbarModule } from "@/store/modules/toolbar";
import { saveScreen } from "@/api/screen";
import * as payloadJson from "./payloadpie.json";
import comsTemplate from "./comstemplate.json";
import { calibrateJsonString, JSONRepairTool } from "./jsonCalibration";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isThinking?: boolean;
  isHumanInteraction?: boolean;
  formToken?: string;
  workflowRunId?: string;
  isProcessed?: boolean;
  humanInput?: string;
}

interface SendMessageConfig {
  apiKey: string;
  logPrefix: string;
  query?: string;
  clearQuery?: boolean;
  supportWorkflowPaused?: boolean;
  onWorkflowPaused?: (data: any, fullContent: string) => Promise<boolean>;
  skipUserMessage?: boolean;
  files?: any[];
}

interface SendType {
  id: string;
  label: string;
  title: string;
  config: SendMessageConfig;
  isWaterOnly?: boolean;
}

export default defineComponent({
  name: "DifyApiDialog",
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
      default: "900px",
    },
    apiKey: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY,
    },
    // 发送2功能的第一次调用 API Key（对应第一个 chatflow）
    apiKeyFlow1: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW1 || "",
    },
    // 发送2功能的第二次调用 API Key（对应第二个 chatflow）
    apiKeyFlow2: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW2 || "",
    },
    // 新程序专用 API Key
    apiKeyFlow3: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW3 || "",
    },
    // difyapidialog 专用 API Key
    apiKeyFlow4: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW4 || "",
    },
    // difyapidialog 专用 API Key (FLOWa1)
    apiKeyFlowA1: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOWa1 || "",
    },
    // difyapidialog 专用 API Key (FLOWb1)
    apiKeyFlowB1: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOWb1 || "",
    },
    // difyapidialog 专用 API Key (FLOWb2)
    apiKeyFlowB2: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOWb2 || "",
    },
        // difyapidialog 专用 API Key (FLOWb3)
    apiKeyFlowB3: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOWb3 || "",
    },
    // 水务专用 API Key
    apiKeyFlowWater: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW_WATER || "",
    },
    // 水务业务模式开关（开启时仅显示水务相关控件）
    waterServiceMode: {
      type: Boolean,
      default:
        import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE === "true" ||
        import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE === "1" ||
        false,
    },
    baseUrl: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_BASE_URL || "http://10.89.34.9",
    },
    userId: {
      type: String,
      default: "huyz",
    },
    conversationId: {
      type: String,
      default: "",
    },
    data: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },
  },
  emits: ["update:visible", "close", "message-sent", "message-received", "conversation-created"],
  setup(props, { emit }) {
    const dialogVisible = ref(props.visible);
    const userQuery = ref("");
    const messages = ref<Message[]>([]);
    const conversationId = ref(props.conversationId);
    const isLoading = ref(false);
    const messageContainer = ref<HTMLElement>();
    const abortController = ref<AbortController | null>(null);
    const timeoutTimer = ref<number | null>(null);
    // SSE 超时时间，从环境变量读取，默认 90 秒
    const SSE_TIMEOUT_MS = Number(import.meta.env.VITE_APP_DIFY_SSE_TIMEOUT_MS) || 90000;

    // 调试日志：验证 waterServiceMode 和 SSE 超时的值
    console.log("=== DifyApiDialog 初始化 ===");
    console.log("waterServiceMode prop:", props.waterServiceMode);
    console.log(
      "VITE_APP_DIFY_WATER_SERVICE_MODE:",
      import.meta.env.VITE_APP_DIFY_WATER_SERVICE_MODE,
    );
    console.log("VITE_APP_DIFY_SSE_TIMEOUT_MS:", SSE_TIMEOUT_MS);
    const currentTaskId = ref<string | null>(null);
    // JSON保存前校验开关 - 开启时会在saveScreenAI前校验JSON结构是否符合最低要求
    const enableJsonValidation = ref(true);
    // 图片上传相关
    const fileInput = ref<HTMLInputElement | null>(null);
    const imagePreviewVisible = ref(false);
    const previewImageUrl = ref("");
    const lastUploadedImage = ref<any>(null); // 保存最后一次上传的图片信息
    const isCadConverting = ref(false); // CAD转JSON转换状态

    // 流程步骤管理
    const currentStep = ref(1); // 当前步骤：1=助手5，2=助手6，3=助手7
    const stepResults = ref<Record<number, string>>({}); // 保存各步骤的结果
    const needAutoProceedToStep2 = ref(false); // 是否需要自动进入步骤2
    const needAutoProceedToStep3 = ref(false); // 是否需要自动进入步骤3

    // 助手5的识别结果（从"识别结果:"到"验证结果:"之间的内容）
    const assistant5RecognitionResult = ref("");

    const imageScale = ref(1);
    const offsetX = ref(0);
    const offsetY = ref(0);
    const isDragging = ref(false);
    const lastMouseX = ref(0);
    const lastMouseY = ref(0);
    const imageRef = ref<HTMLImageElement | null>(null);

    const handleImageWheel = (e: WheelEvent) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.1, Math.min(5, imageScale.value + delta));

      if (newScale !== imageScale.value) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const imageWidth = imageRef.value?.naturalWidth || 1000;
        const imageHeight = imageRef.value?.naturalHeight || 1000;
        const containerWidth = rect.width;
        const containerHeight = rect.height;

        const scaleDiff = newScale / imageScale.value;

        const imageCenterX = containerWidth / 2 + offsetX.value;
        const imageCenterY = containerHeight / 2 + offsetY.value;

        const newOffsetX = mouseX - (mouseX - imageCenterX) * scaleDiff;
        const newOffsetY = mouseY - (mouseY - imageCenterY) * scaleDiff;

        imageScale.value = newScale;
        offsetX.value = newOffsetX - containerWidth / 2;
        offsetY.value = newOffsetY - containerHeight / 2;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (imageScale.value <= 1) return;
      isDragging.value = true;
      lastMouseX.value = e.clientX;
      lastMouseY.value = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.value) return;
      const deltaX = e.clientX - lastMouseX.value;
      const deltaY = e.clientY - lastMouseY.value;
      offsetX.value += deltaX;
      offsetY.value += deltaY;
      lastMouseX.value = e.clientX;
      lastMouseY.value = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging.value = false;
    };

    const resetImageScale = () => {
      imageScale.value = 1;
      offsetX.value = 0;
      offsetY.value = 0;
    };

    const handlePreviewClose = () => {
      resetImageScale();
    };

    // 人工介入相关
    const isSubmitting = ref(false);
    const isAwaitingFeedback = ref(false); // 是否正在等待用户反馈

    // 消息持久化相关
    const isHydrating = ref(false);
    const STORAGE_KEY_PREFIX = "dify-chat-messages-";

    const getStorageKey = () => {
      const screenId = EditorModule.screen?.id || "default";
      return STORAGE_KEY_PREFIX + screenId;
    };

    const getStepStorageKey = () => {
      const screenId = EditorModule.screen?.id || "default";
      return STORAGE_KEY_PREFIX + screenId + "-steps";
    };

    const getUploadImageStorageKey = () => {
      const screenId = EditorModule.screen?.id || "default";
      return "dify_uploaded_image-" + screenId;
    };

    const saveMessagesToStorage = () => {
      if (isHydrating.value) return;
      try {
        localStorage.setItem(getStorageKey(), JSON.stringify(messages.value));
      } catch (e) {
        console.error("保存消息到 localStorage 失败:", e);
      }
    };

    const saveStepStateToStorage = () => {
      if (isHydrating.value) return;
      try {
        const stepState = {
          currentStep: currentStep.value,
          stepResults: stepResults.value,
          assistant5RecognitionResult: assistant5RecognitionResult.value,
        };
        localStorage.setItem(getStepStorageKey(), JSON.stringify(stepState));
        console.log("步骤状态已保存:", stepState);
      } catch (e) {
        console.error("保存步骤状态到 localStorage 失败:", e);
      }
    };

    const loadMessagesFromStorage = () => {
      try {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            messages.value = parsed;
          }
        }
      } catch (e) {
        console.error("从 localStorage 恢复消息失败:", e);
      }
    };

    const loadStepStateFromStorage = () => {
      try {
        const saved = localStorage.getItem(getStepStorageKey());
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed) {
            if (parsed.currentStep) {
              currentStep.value = parsed.currentStep;
            }
            if (parsed.stepResults) {
              stepResults.value = parsed.stepResults;
            }
            if (parsed.assistant5RecognitionResult) {
              assistant5RecognitionResult.value = parsed.assistant5RecognitionResult;
            }
            console.log("步骤状态已恢复:", parsed);
          }
        }
      } catch (e) {
        console.error("从 localStorage 恢复步骤状态失败:", e);
      }
    };

    watch(
      () => messages.value,
      () => {
        saveMessagesToStorage();
      },
      { deep: true },
    );

    watch(
      [currentStep, stepResults, assistant5RecognitionResult],
      () => {
        saveStepStateToStorage();
      },
      { deep: true },
    );

    watch(
      () => EditorModule.screen?.id,
      () => {
        lastUploadedImage.value = null;
        previewImageUrl.value = "";
        restoreUploadedImage();
      },
    );

    onMounted(() => {
      isHydrating.value = true;
      loadMessagesFromStorage();
      loadStepStateFromStorage();
      isHydrating.value = false;

      // 根据恢复的步骤状态更新选中的发送类型
      if (currentStep.value === 1) {
        selectedSendType.value = "send5";
      } else if (currentStep.value === 2) {
        selectedSendType.value = "send6";
      } else if (currentStep.value === 3) {
        selectedSendType.value = "send7";
      }

      // 设置全局base64图片预览函数
      (window as any).__previewBase64Image = (id: string) => {
        const data = (window as any).__base64PreviewData?.[id];
        if (data) {
          validationResultImageUrl.value = `data:image/png;base64,${data}`;
          validationResultImageVisible.value = true;
        } else {
          ElMessage.warning("无法找到图片数据");
        }
      };

      // 设置全局识别结果JSON展开函数
      (window as any).__toggleRecognitionJson = (id: string) => {
        const element = document.getElementById(id);
        const contentId = id + "-content";
        const contentElement = document.getElementById(contentId);
        if (element && contentElement) {
          if (contentElement.style.display === "none") {
            contentElement.style.display = "block";
            element.textContent = "收起";
          } else {
            contentElement.style.display = "none";
            element.textContent = "展开";
          }
        }
      };

      // 恢复上传的图片信息
      restoreUploadedImage();

      // 监听剪贴板粘贴事件
      document.addEventListener("paste", handlePaste);
    });

    onUnmounted(() => {
      document.removeEventListener("paste", handlePaste);
    });

    // 推荐问题相关
    const recommendQuestions = [
      "城市数据大屏",
      "水务智能监控",
      "医疗健康平台",
      "智慧教育系统",
      "交通智能管控",
      "园区智慧管理",
    ];
    const selectedQuestion = ref("");

    const sendTypes = ref<SendType[]>([
      // {
      //   id: 'send1',
      //   label: '助手1',
      //   title: '大json',
      //   config: {
      //     apiKey: props.apiKey,
      //     logPrefix: '发送'
      //   }
      // },
      // {
      //   id: 'send2',
      //   label: '助手2',
      //   title: '回答再次询问',
      //   config: {
      //     apiKey: props.apiKey,
      //     logPrefix: '发送2'
      //   }
      // },
      // {
      //   id: 'send3',
      //   label: '助手3',
      //   title: '快速环保',
      //   config: {
      //     apiKey: props.apiKeyFlow4 || props.apiKey,
      //     logPrefix: '发送3'
      //   }
      // },
      // {
      //   id: 'send4',
      //   label: '助手4',
      //   title: '有暂停',
      //   config: {
      //     apiKey: props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey,
      //     logPrefix: '发送4',
      //     supportWorkflowPaused: true
      //   }
      // },
      {
        id: "send5",
        label: "图纸识别",
        title: "图纸识别",
        config: {
          apiKey: props.apiKeyFlowB1 || "",
          logPrefix: "发送5",
          supportWorkflowPaused: true,
        },
      },
      {
        id: "send6",
        label: "点位绑定",
        title: "点位绑定",
        config: {
          apiKey: props.apiKeyFlowB2 || "",
          logPrefix: "发送6",
          supportWorkflowPaused: true,
        },
      },
      {
        id: "send7",
        label: "生成DSL",
        title: "生成DSL",
        config: {
          apiKey: props.apiKeyFlowB3 || "",
          logPrefix: "发送7",
          supportWorkflowPaused: true,
        },
      },
      {
        id: "sendWater",
        label: "助手(水务)",
        title: "水务专用",
        config: {
          apiKey: props.apiKeyFlowWater || "",
          logPrefix: "发送Water",
        },
        isWaterOnly: true,
      },
    ]);

    const selectedSendType = ref<string>(props.waterServiceMode ? "sendWater" : "send5");

    const selectOptions = computed(() => {
      return sendTypes.value.map((t) => {
        let disabled = t.isWaterOnly && !props.waterServiceMode;

        // 根据当前步骤限制可选的助手
        if (currentStep.value === 1) {
          disabled = disabled || t.id !== "send5";
        } else if (currentStep.value === 2) {
          disabled = disabled || t.id !== "send6";
        } else if (currentStep.value === 3) {
          disabled = disabled || t.id !== "send7";
        }

        return {
          label: t.label,
          value: t.id,
          disabled,
        };
      });
    });

    const getSendTypeDisabled = (type: any) => {
      let disabled = type.isWaterOnly ? !props.waterServiceMode : props.waterServiceMode;

      // 根据当前步骤限制可选的助手
      if (currentStep.value === 1) {
        disabled = disabled || type.id !== "send5";
      } else if (currentStep.value === 2) {
        disabled = disabled || type.id !== "send6";
      } else if (currentStep.value === 3) {
        disabled = disabled || type.id !== "send7";
      }

      return disabled;
    };

    const resetSteps = () => {
      currentStep.value = 1;
      stepResults.value = {};
      assistant5RecognitionResult.value = "";
      selectedSendType.value = props.waterServiceMode ? "sendWater" : "send5";
      localStorage.removeItem(getStepStorageKey());
      ElMessage.info("已重置到步骤1");
    };

    // 监听推荐问题选择变化
    watch(selectedQuestion, (newVal) => {
      if (newVal && newVal.trim()) {
        userQuery.value = newVal;
        selectedQuestion.value = ""; // 清空选择
      }
    });

    // 监听 visible 变化
    watch(
      () => props.visible,
      (newVal) => {
        dialogVisible.value = newVal;
      },
    );

    watch(dialogVisible, (newVal) => {
      emit("update:visible", newVal);
    });

    // 监听 conversationId 变化
    watch(
      () => props.conversationId,
      (newVal) => {
        if (newVal) conversationId.value = newVal;
      },
    );

    // 监听助手类型变化，重置 conversationId
    watch(selectedSendType, () => {
      conversationId.value = "";
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
        return "";
      }
      if (typeof content !== "string") {
        return String(content);
      }

      // 先处理换行
      let result = content.replace(/\n/g, " ");

      // 移除 {{#$output.usercomments#}} 标记
      result = result.replace(/\{\{#\$output\.usercomments#\}\}/g, "");

      // 隐藏识别结果到验证结果之间的JSON字符串
      const recognitionToValidationPattern = /识别结果:([\s\S]*?)(?=验证结果：|$)/g;
      result = result.replace(recognitionToValidationPattern, (match, jsonContent) => {
        const id = "recognition-json-" + Math.random().toString(36).substring(2, 9);
        const escapedContent = jsonContent
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        return `识别结果：<a href="#" id="${id}" class="hidden-content-link" onclick="window.__toggleRecognitionJson('${id}'); return false;">展开</a><div id="${id}-content" class="hidden-content" style="display:none;white-space:pre-wrap;word-break:break-all;">${escapedContent}</div>`;
      });

      // 检测并替换base64字符串为预览链接
      // 匹配 "image": "xxxxx" 格式的base64字符串（在JSON中）
      const base64Pattern = /"image"\s*:\s*"([A-Za-z0-9+/=]{50,})"/g;
      result = result.replace(base64Pattern, (match, base64Data) => {
        // 生成一个唯一ID用于点击事件
        const id = "base64-preview-" + Math.random().toString(36).substring(2, 9);
        // 将base64数据存储到全局对象中
        if (typeof window !== "undefined") {
          (window as any).__base64PreviewData = (window as any).__base64PreviewData || {};
          (window as any).__base64PreviewData[id] = base64Data;
        }
        return `"image": "<a href="#" id="${id}" class="base64-preview-link" onclick="window.__previewBase64Image('${id}'); return false;">预览图片</a>"`;
      });

      // 也处理直接出现的长base64字符串（不在JSON中的情况）
      const standaloneBase64Pattern = /(?:"|')?([A-Za-z0-9+/=]{100,})(?:"|')?/g;
      result = result.replace(standaloneBase64Pattern, (match, base64Data) => {
        // 只处理看起来像base64的字符串（长度足够长且不是普通文本）
        if (base64Data.length >= 100 && /^[A-Za-z0-9+/=]+$/.test(base64Data)) {
          const id = "base64-preview-" + Math.random().toString(36).substring(2, 9);
          if (typeof window !== "undefined") {
            (window as any).__base64PreviewData = (window as any).__base64PreviewData || {};
            (window as any).__base64PreviewData[id] = base64Data;
          }
          return `<a href="#" id="${id}" class="base64-preview-link" onclick="window.__previewBase64Image('${id}'); return false;">预览图片</a>`;
        }
        return match;
      });

      return result;
    };

    // 格式化时间
    const formatTime = (timestamp: number) => {
      return new Date(timestamp).toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // 处理回车发送（Shift+Enter 换行）
    const handleEnter = (e: KeyboardEvent) => {
      if (!e.shiftKey) {
        sendDispatch();
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
      return "";
    };

    // 通用的发送消息函数
    const sendRequest = async (config: SendMessageConfig): Promise<string> => {
      const {
        apiKey,
        logPrefix,
        query: configQuery,
        clearQuery = true,
        supportWorkflowPaused = false,
        onWorkflowPaused,
        skipUserMessage = false,
        files: configFiles,
      } = config;

      const query = configQuery || userQuery.value.trim();

      if (isLoading.value) {
        console.warn(`${logPrefix} 请求被拒绝：已有请求正在处理中`);
        ElMessage.warning("请求处理中，请稍候");
        return "";
      }

      if (!query && !configFiles) {
        ElMessage.warning("请输入查询内容");
        return "";
      }

      console.log(`=== ${logPrefix} 调用开始 ===`);
      console.log(`${logPrefix} query:`, query);
      console.log(`${logPrefix} files:`, configFiles);

      // 添加用户消息（可配置跳过）
      if (!skipUserMessage) {
        messages.value.push({
          role: "user",
          content: query,
          timestamp: Date.now(),
        });
      }

      // 添加 AI 思考中的占位消息
      const thinkingMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isThinking: true,
      };
      messages.value.push(thinkingMsg);

      await scrollToBottom();

      if (clearQuery && !configQuery) {
        userQuery.value = "";
      }
      isLoading.value = true;

      // 创建 AbortController 用于取消请求
      abortController.value = new AbortController();

      let isTimeoutAbort = false;

      const resetTimeout = () => {
        if (timeoutTimer.value) {
          clearTimeout(timeoutTimer.value);
        }
        timeoutTimer.value = window.setTimeout(() => {
          console.error(`${logPrefix} SSE 连接超时，自动断开`);
          isTimeoutAbort = true;
          if (abortController.value) {
            abortController.value.abort(new Error("SSE_TIMEOUT"));
          }
        }, SSE_TIMEOUT_MS);
      };

      resetTimeout();

      // 定义需要在 try-finally 中共享的变量
      let isPaused = false;
      let pauseData: any = null;
      let currentFormToken = "";
      let currentWorkflowRunId = "";

      try {
        // 构建 files 参数（优先使用config中的files，否则使用上传的图片）
        let files = configFiles;
        if (!files && lastUploadedImage.value) {
          files = [
            {
              type: "image",
              transfer_method: "local_file",
              upload_file_id: lastUploadedImage.value.id,
            },
          ];
        }

        const requestBody = {
          inputs: props.data,
          query: query,
          response_mode: "streaming",
          conversation_id: conversationId.value || "",
          user: props.userId,
          files: files,
        };
        console.log("apiKey", apiKey);
        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("无法读取响应流");
        }

        console.log(`${logPrefix} 开始流式响应`);

        let fullContent = "";
        let newConversationId = "";
        let pendingData = "";
        let hasError = false;

        // 流式处理每个数据块
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          resetTimeout();

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          // 保留最后一行（可能是不完整的）
          pendingData = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              // 处理 error 事件
              if (data.event === "error") {
                hasError = true;
                const errorMsg = data.message || "服务发生未知错误";
                const errorCode = data.code || "unknown";
                const errorDetail = `[Dify Error] code: ${errorCode}, status: ${data.status || "N/A"}, message: ${errorMsg}`;

                console.error(errorDetail);

                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.isThinking = false;
                  lastMsg.content = `请求失败：${errorMsg}`;
                }

                ElMessage.error(errorDetail);
                continue;
              }

              // 如果已经出现过 error 事件，跳过后续数据处理
              if (hasError) continue;

              // 处理 workflow_paused 事件 - 工作流暂停，需要人工介入
              if (supportWorkflowPaused && data.event === "workflow_paused") {
                console.log("⏸️ 检测到工作流暂停");
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
                  console.log("🔑 Form Token:", formToken);
                }

                // 收集当前消息内容
                if (data.answer) {
                  fullContent += data.answer;
                }

                // 更新消息状态
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === "assistant") {
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
              if (data.event === "message" && data.answer) {
                // 保存 task_id 用于停止请求
                if (data.task_id) {
                  currentTaskId.value = data.task_id;
                }
                fullContent += data.answer;
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.isThinking = false;
                  lastMsg.content = fullContent;
                  await scrollToBottom();
                }
              }

              // 处理 workflow_finished 事件 - 最终完成
              if (data.event === "workflow_finished" && data.data) {
                console.log(`${logPrefix} 找到 workflow_finished 事件`);
                console.log(`${logPrefix} workflow_finished 数据:`, JSON.stringify(data.data));

                const lastMsg = messages.value[messages.value.length - 1];

                // 检查工作流是否失败
                if (data.data.status === "failed") {
                  hasError = true;
                  const errorMsg = data.data.error
                    ? data.data.error.replace(/<[^>]*>/g, "").substring(0, 200)
                    : "工作流执行失败";
                  console.error(`${logPrefix} 工作流执行失败:`, errorMsg);

                  if (lastMsg?.role === "assistant") {
                    lastMsg.isThinking = false;
                    lastMsg.content = `❌ 工作流执行失败：${errorMsg}`;
                  }
                  ElMessage.error(`工作流执行失败：${errorMsg}`);
                } else if (data.data.outputs && data.data.outputs.answer) {
                  // 工作流成功，获取答案
                  fullContent = data.data.outputs.answer;
                  if (lastMsg?.role === "assistant") {
                    lastMsg.isThinking = false;
                    lastMsg.content = fullContent;
                  }
                  await scrollToBottom();

                  // 步骤1完成后标记需要进入步骤2（非人工介入场景）
                  if (currentStep.value === 1 && !isPaused) {
                    stepResults.value[1] = fullContent;
                    needAutoProceedToStep2.value = true;
                  }
                } else if (lastMsg?.role === "assistant") {
                  // 没有返回答案，结束思考状态
                  lastMsg.isThinking = false;
                  if (!lastMsg.content.trim()) {
                    lastMsg.content = "工作流已完成，但未返回答案";
                  }
                }
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
          console.log("📢 检测到工作流暂停，添加人工介入消息");

          // 提取暂停时的消息内容
          let content = "";
          if (pauseData.data && pauseData.data.reasons && pauseData.data.reasons.length > 0) {
            const reason = pauseData.data.reasons[0];
            if (reason.form_content) {
              content = reason.form_content.replace(/\\n/g, "\n").replace(/\*\*/g, "");
            }
          }

          // 如果没有提取到内容，使用已收集的消息
          if (!content.trim()) {
            content = fullContent || "AI 需要您的反馈以继续处理...";
          }

          // 更新最后一条消息为人工介入消息
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === "assistant") {
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
            emit("conversation-created", newConversationId);
          }

          isLoading.value = false;
          return fullContent; // 等待用户操作
        }

        // 处理最后可能残留的数据
        if (pendingData.trim() && pendingData.startsWith("data: ")) {
          try {
            const data = JSON.parse(pendingData.slice(6));

            // 处理残留数据中的 error 事件
            if (data.event === "error") {
              hasError = true;
              const errorMsg = data.message || "服务发生未知错误";
              const errorCode = data.code || "unknown";
              const errorDetail = `[Dify Error] code: ${errorCode}, status: ${data.status || "N/A"}, message: ${errorMsg}`;

              console.error(errorDetail);

              const lastMsg = messages.value[messages.value.length - 1];
              if (lastMsg?.role === "assistant") {
                lastMsg.isThinking = false;
                lastMsg.content = `请求失败：${errorMsg}`;
              }

              ElMessage.error(errorDetail);
            }

            if (!hasError && data.event === "message" && data.answer) {
              fullContent += data.answer;
              const lastMsg = messages.value[messages.value.length - 1];
              if (lastMsg?.role === "assistant") {
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
          emit("conversation-created", newConversationId);
        }

        // 如果发生了错误，不再触发 message-received 成功事件
        if (!hasError) {
          console.log(`=== ${logPrefix} 调用完成 ===`);
          console.log(`${logPrefix} 回答:`, fullContent);
          emit("message-received", fullContent);
        }

        // 在返回之前检查是否需要自动进入步骤2或步骤3
        if (needAutoProceedToStep2.value && !isPaused) {
          needAutoProceedToStep2.value = false;
          await autoProceedToStep2();
        } else if (needAutoProceedToStep3.value && !isPaused) {
          needAutoProceedToStep3.value = false;
          await autoProceedToStep3();
        }

        return fullContent;
      } catch (error: any) {
        console.error(`${logPrefix} 发送消息失败:`, error);

        // 检查是否是超时导致的取消
        const isTimeoutError =
          error.message === "SSE_TIMEOUT" || (error.name === "AbortError" && isTimeoutAbort);

        // 如果是超时导致的取消，调用 stopGeneration(true) 显示超时提示
        if (isTimeoutError) {
          await stopGeneration(true);
          return "";
        }

        // 如果是用户取消，不显示错误，保留已收到的内容
        if (error.name === "AbortError") {
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.isThinking = false;

            if (!lastMsg.content.trim()) {
              // 用户手动停止
              lastMsg.content = "已停止生成";
            }

            // 显式触发响应式更新和持久化
            messages.value = [...messages.value];
            saveMessagesToStorage();
          }
          return "";
        }

        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === "assistant") {
          lastMsg.isThinking = false;
          lastMsg.content = `❌ ${logPrefix} 请求失败：${error.message || "服务暂时不可用"}`;
          ElMessage.error(`${logPrefix} 发送消息失败: ` + error.message);

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }

        return "";
      } finally {
        if (timeoutTimer.value) {
          clearTimeout(timeoutTimer.value);
          timeoutTimer.value = null;
        }

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
        logPrefix: "发送",
      });
    };

    // 发送消息2 - 连续调用两次接口，第一次的回答作为第二次的query
    const sendMessage2 = async () => {
      if (!userQuery.value.trim() || isLoading.value) return;

      const query = userQuery.value.trim();

      console.log("=== 发送2 第一次调用开始 ===");
      console.log("发送2 query:", query);

      // 添加用户消息
      messages.value.push({
        role: "user",
        content: query,
        timestamp: Date.now(),
      });

      // 添加第一次调用的 AI 消息（显示思考中状态）
      messages.value.push({
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isThinking: true,
      });

      await scrollToBottom();

      userQuery.value = "";
      isLoading.value = true;
      abortController.value = new AbortController();

      let firstCallAnswer = "";

      try {
        // 使用 apiKeyFlow1，如果未配置则回退到 apiKey
        const apiKey1 = props.apiKeyFlow1 || props.apiKey;

        // 构建 files 参数（如果有上传的图片）
        const files = lastUploadedImage.value
          ? [
              {
                type: "image",
                transfer_method: "local_file",
                upload_file_id: lastUploadedImage.value.id,
              },
            ]
          : undefined;

        const requestBody = {
          inputs: props.data,
          query: query,
          response_mode: "streaming",
          conversation_id: conversationId.value || "",
          user: props.userId,
          files: files,
        };

        const response1 = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey1}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal,
        });

        if (!response1.ok) {
          throw new Error(`第一次调用 HTTP error! status: ${response1.status}`);
        }

        const reader1 = response1.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader1) {
          throw new Error("第一次调用无法读取响应流");
        }

        console.log("发送2 第一次调用开始流式响应");

        let fullContent1 = "";
        let pendingData = "";

        while (true) {
          const { done, value } = await reader1.read();
          if (done) break;

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          pendingData = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.event === "error") {
                console.error("发送2 第一次调用错误:", data.message || "未知错误");
                continue;
              }

              if (data.event === "message" && data.answer) {
                fullContent1 += data.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent1,
                  isThinking: false,
                };
                await scrollToBottom();
              }

              if (data.event === "workflow_finished" && data.data) {
                console.log("发送2 第一次调用找到 workflow_finished 事件");
                console.log("发送2 workflow_finished 数据:", JSON.stringify(data.data));

                const msgIndex = messages.value.length - 1;

                if (data.data.status === "failed") {
                  const errorMsg = data.data.error
                    ? data.data.error.replace(/<[^>]*>/g, "").substring(0, 200)
                    : "工作流执行失败";
                  console.error("发送2 工作流执行失败:", errorMsg);

                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: `❌ 工作流执行失败：${errorMsg}`,
                    isThinking: false,
                  };
                  ElMessage.error(`工作流执行失败：${errorMsg}`);
                } else if (data.data.outputs && data.data.outputs.answer) {
                  fullContent1 = data.data.outputs.answer;
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: fullContent1,
                    isThinking: false,
                  };
                  await scrollToBottom();
                } else {
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    isThinking: false,
                    content: messages.value[msgIndex].content || "工作流已完成，但未返回答案",
                  };
                }
              }
            } catch (e) {
              console.warn("发送2 第一次调用解析数据失败:", e);
            }
          }
        }

        if (pendingData.trim() && pendingData.startsWith("data: ")) {
          try {
            const data = JSON.parse(pendingData.slice(6));
            if (data.event === "message" && data.answer) {
              fullContent1 += data.answer;
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: fullContent1,
                isThinking: false,
              };
              await scrollToBottom();
            }
            if (data.event === "workflow_finished" && data.data) {
              const msgIndex = messages.value.length - 1;

              if (data.data.status === "failed") {
                const errorMsg = data.data.error
                  ? data.data.error.replace(/<[^>]*>/g, "").substring(0, 200)
                  : "工作流执行失败";
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: `❌ 工作流执行失败：${errorMsg}`,
                  isThinking: false,
                };
                ElMessage.error(`工作流执行失败：${errorMsg}`);
              } else if (data.data.outputs && data.data.outputs.answer) {
                fullContent1 = data.data.outputs.answer;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent1,
                  isThinking: false,
                };
                await scrollToBottom();
              } else {
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  isThinking: false,
                  content: messages.value[msgIndex].content || "工作流已完成，但未返回答案",
                };
              }
            }
          } catch (e) {
            console.warn("发送2 第一次调用解析残留数据失败:", e);
          }
        }

        firstCallAnswer = fullContent1;
        console.log("=== 发送2 第一次调用完成 ===");
        console.log("发送2 第一次回答:", firstCallAnswer);

        // 添加第二次调用的 AI 消息
        messages.value.push({
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          isThinking: true,
        });

        console.log("=== 发送2 第二次调用开始 ===");
        console.log("发送2 第二次 query (来自第一次回答):", firstCallAnswer);

        // 使用 apiKeyFlow2，如果未配置则回退到 apiKey
        const apiKey2 = props.apiKeyFlow2 || props.apiKey;

        // 复用第一次调用的 files 参数（上传的图片在两次调用之间不会改变）
        const requestBody2 = {
          inputs: props.data,
          query: firstCallAnswer,
          response_mode: "streaming",
          conversation_id: conversationId.value || "",
          user: props.userId,
          files: files,
        };

        const response2 = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey2}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody2),
          signal: abortController.value.signal,
        });

        if (!response2.ok) {
          throw new Error(`第二次调用 HTTP error! status: ${response2.status}`);
        }

        const reader2 = response2.body?.getReader();

        if (!reader2) {
          throw new Error("第二次调用无法读取响应流");
        }

        console.log("发送2 第二次调用开始流式响应");

        let fullContent2 = "";
        pendingData = "";
        let hasError = false;

        while (true) {
          const { done, value } = await reader2.read();
          if (done) break;

          const chunk = pendingData + decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          pendingData = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "" || !line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.event === "error") {
                hasError = true;
                const errorMsg = data.message || "服务发生未知错误";
                const errorDetail = `[Dify Error] ${errorMsg}`;
                console.error("发送2 第二次调用错误:", errorDetail);
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: `请求失败：${errorMsg}`,
                  isThinking: false,
                };
                ElMessage.error(errorDetail);
                continue;
              }

              if (hasError) continue;

              if (data.event === "message" && data.answer) {
                if (data.task_id) {
                  currentTaskId.value = data.task_id;
                }
                fullContent2 += data.answer;
                const msgIndex = messages.value.length - 1;
                messages.value[msgIndex] = {
                  ...messages.value[msgIndex],
                  content: fullContent2,
                  isThinking: false,
                };
                await scrollToBottom();
              }

              if (data.event === "workflow_finished" && data.data) {
                console.log("发送2 第二次调用找到 workflow_finished 事件");
                console.log("发送2 第二次调用 workflow_finished 数据:", JSON.stringify(data.data));

                const msgIndex = messages.value.length - 1;

                if (data.data.status === "failed") {
                  const errorMsg = data.data.error
                    ? data.data.error.replace(/<[^>]*>/g, "").substring(0, 200)
                    : "工作流执行失败";
                  console.error("发送2 第二次调用工作流执行失败:", errorMsg);

                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: `❌ 工作流执行失败：${errorMsg}`,
                    isThinking: false,
                  };
                  ElMessage.error(`工作流执行失败：${errorMsg}`);
                } else if (data.data.outputs && data.data.outputs.answer) {
                  fullContent2 = data.data.outputs.answer;
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: fullContent2,
                    isThinking: false,
                  };
                  await scrollToBottom();
                } else {
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    isThinking: false,
                    content: messages.value[msgIndex].content || "工作流已完成，但未返回答案",
                  };
                }
              }
            } catch (e) {
              console.warn("发送2 第二次调用解析数据失败:", e);
            }
          }
        }

        if (pendingData.trim() && pendingData.startsWith("data: ")) {
          try {
            const data = JSON.parse(pendingData.slice(6));

            if (data.event === "error") {
              hasError = true;
              const errorMsg = data.message || "服务发生未知错误";
              ElMessage.error(errorMsg);
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: `请求失败：${errorMsg}`,
                isThinking: false,
              };
            }

            if (!hasError && data.event === "message" && data.answer) {
              fullContent2 += data.answer;
              const msgIndex = messages.value.length - 1;
              messages.value[msgIndex] = {
                ...messages.value[msgIndex],
                content: fullContent2,
                isThinking: false,
              };
              await scrollToBottom();
            }
          } catch (e) {
            console.warn("发送2 第二次调用解析残留数据失败:", e);
          }
        }

        console.log("=== 发送2 第二次调用完成 ===");
        console.log("发送2 最终回答:", fullContent2);

        if (!hasError) {
          emit("message-received", fullContent2);
        }
      } catch (error: any) {
        console.error("发送2 发送消息失败:", error);

        if (error.name === "AbortError") {
          const msgIndex = messages.value.length - 1;
          if (msgIndex >= 0 && messages.value[msgIndex]?.role === "assistant") {
            messages.value[msgIndex] = {
              ...messages.value[msgIndex],
              isThinking: false,
              content: messages.value[msgIndex].content.trim() || "Dify响应超时",
            };
          }
          ElMessage.info("已停止生成");
          return;
        }

        const msgIndex = messages.value.length - 1;
        if (msgIndex >= 0 && messages.value[msgIndex]?.role === "assistant") {
          messages.value[msgIndex] = {
            ...messages.value[msgIndex],
            isThinking: false,
            content: "抱歉，服务暂时不可用，请稍后重试。",
          };
        }

        ElMessage.error("发送2 发送消息失败: " + error.message);
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
        logPrefix: "发送3",
      });
    };

    // 发送消息4 - 使用 FLOWa1 的 API Key，支持工作流暂停和人工介入
    const sendMessage4 = async (queryText?: string) => {
      await sendRequest({
        apiKey: props.apiKeyFlowA1 || props.apiKeyFlow4 || props.apiKey,
        logPrefix: "发送4",
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true,
      });
    };

    const sendMessage5 = async (queryText?: string) => {
      await sendRequest({
        apiKey: props.apiKeyFlowB1 || "",
        logPrefix: "发送5",
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true,
      });
    };

    const sendMessage6 = async (queryText?: string, files?: any[]) => {
      await sendRequest({
        apiKey: props.apiKeyFlowB2 || "",
        logPrefix: "发送6",
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true,
        skipUserMessage: true,
        files: files,
      });
    };

    const sendMessage7 = async (queryText?: string, files?: any[]) => {
      await sendRequest({
        apiKey: props.apiKeyFlowB3 || "",
        logPrefix: "发送7",
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true,
        skipUserMessage: true,
        files: files,
      });
    };

    // 自动从步骤1进入步骤2
    const autoProceedToStep2 = async () => {
      console.log("=== 自动进入步骤2 ===");

      // 切换到助手6
      selectedSendType.value = "send6";
      currentStep.value = 2;

      await nextTick();

      // 获取步骤1的结果作为步骤2的输入
      const step1Result = stepResults.value[1];

      await scrollToBottom();

      // 获取传输模式配置
      const transferMode = import.meta.env.VITE_APP_DIFY_STEP2_TRANSFER_MODE || "query";
      console.log(`=== 步骤2传输模式: ${transferMode} ===`);

      if (transferMode === "file") {
        // 传file方式：先上传识别结果为txt文件，然后使用files参数调用sendMessage6
        if (step1Result) {
          try {
            const apiKey = props.apiKeyFlowB2;
            console.log("=== 上传识别结果文件 ===");

            const uploadResult = await uploadRecognitionResultAsFile(step1Result, apiKey);

            // 构建files参数
            const files = [
              {
                type: "document",
                transfer_method: "local_file",
                upload_file_id: uploadResult.id,
              },
            ];

            // 调用助手6，使用files参数
            await sendMessage6("请根据上传的识别结果文件进行验证", files);
          } catch (error: any) {
            console.error("文件上传失败:", error);
            ElMessage.error("文件上传失败，将使用query方式继续");
            await sendMessage6(step1Result);
          }
        } else {
          ElMessage.warning("步骤1没有返回识别结果，将使用空输入继续");
          await sendMessage6("");
        }
      } else {
        // 传query方式：直接将识别结果作为query传入sendMessage6（默认方式）
        if (step1Result) {
          await sendMessage6(step1Result);
        } else {
          ElMessage.warning("步骤1没有返回识别结果，将使用空输入继续");
          await sendMessage6("");
        }
      }
    };

    // 自动从步骤2进入步骤3
    const autoProceedToStep3 = async () => {
      console.log("=== 自动进入步骤3 ===");

      // 切换到助手7
      selectedSendType.value = "send7";
      currentStep.value = 3;

      await nextTick();

      // 获取步骤2的结果作为步骤3的输入
      const step2Result = stepResults.value[2];

      await scrollToBottom();

      // 获取传输模式配置
      const transferMode = import.meta.env.VITE_APP_DIFY_STEP2_TRANSFER_MODE || "query";
      console.log(`=== 步骤3传输模式: ${transferMode} ===`);

      if (transferMode === "file") {
        // 传file方式：先上传识别结果为txt文件，然后使用files参数调用sendMessage7
        if (step2Result) {
          try {
            const apiKey = props.apiKeyFlowB3;
            console.log("=== 上传识别结果文件 ===");

            const uploadResult = await uploadRecognitionResultAsFile(step2Result, apiKey);

            // 构建files参数
            const files = [
              {
                type: "document",
                transfer_method: "local_file",
                upload_file_id: uploadResult.id,
              },
            ];

            // 调用助手7，使用files参数
            await sendMessage7("请根据上传的识别结果文件生成DSL", files);
          } catch (error: any) {
            console.error("文件上传失败:", error);
            ElMessage.error("文件上传失败，将使用query方式继续");
            await sendMessage7(step2Result);
          }
        } else {
          ElMessage.warning("步骤2没有返回识别结果，将使用空输入继续");
          await sendMessage7("");
        }
      } else {
        // 传query方式：直接将识别结果作为query传入sendMessage7（默认方式）
        if (step2Result) {
          await sendMessage7(step2Result);
        } else {
          ElMessage.warning("步骤2没有返回识别结果，将使用空输入继续");
          await sendMessage7("");
        }
      }
    };

    // 发送消息Water - 使用水务专用 API Key
    const sendMessageWater = async () => {
      await sendRequest({
        apiKey: props.apiKeyFlowWater || props.apiKey,
        logPrefix: "发送Water",
      });
    };

    const sendDispatch = async () => {
      const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
      if (!sendType) {
        ElMessage.warning("请选择发送类型");
        return;
      }

      if (sendType.id === "send2") {
        await sendMessage2();
      } else {
        await sendRequest(sendType.config);
      }
    };

    // 提交表单
    const submitForm = async (
      formToken: string,
      inputs: Record<string, any>,
      action: string,
    ): Promise<any> => {
      const submitUrl = `${props.baseUrl}/api/form/human_input/${formToken}`;

      // 获取当前选择的发送类型对应的 API Key
      const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
      const usedApiKey = sendType?.config.apiKey || props.apiKey;

      console.log(`📤 提交表单到: ${submitUrl}`);
      console.log(`📤 使用 API Key: ${usedApiKey ? "***" + usedApiKey.slice(-4) : "未设置"}`);
      console.log("📤 提交数据:", JSON.stringify({ inputs, action }, null, 2));

      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${usedApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs, action }),
      });

      if (!response.ok) {
        throw new Error(`表单提交失败 (${response.status})`);
      }

      const result = await response.json();
      console.log("✅ 表单提交成功");
      console.log("📥 返回数据:", JSON.stringify(result, null, 2));
      return result;
    };

    // 等待工作流完成
    const waitForWorkflowCompletion = async (
      workflowRunId: string,
      formToken?: string,
      intervalMs: number = 10000,
      maxRetries: number = 30,
    ): Promise<any> => {
      console.log(`\n⏳ 开始轮询工作流状态 (ID: ${workflowRunId})...`);

      // 获取当前选择的发送类型对应的 API Key
      const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
      const usedApiKey = sendType?.config.apiKey || props.apiKey;
      console.log(`📤 使用 API Key: ${usedApiKey ? "***" + usedApiKey.slice(-4) : "未设置"}`);

      let retries = 0;
      let finalResult = null;

      while (retries < maxRetries) {
        retries++;
        const url = `${props.baseUrl}/v1/workflows/run/${workflowRunId}`;

        try {
          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${usedApiKey}`,
            },
          });

          if (!response.ok) {
            throw new Error(`查询失败 (${response.status})`);
          }

          const result = await response.json();
          const status = result.status;

          console.log(`   🔁 第 ${retries} 次查询: 状态 = ${status}`);

          if (status === "succeeded") {
            console.log("   ✅ 工作流执行成功！");
            finalResult = result;
            break;
          } else if (status === "failed") {
            console.error("   ❌ 工作流执行失败");
            console.error("   错误信息:", result.error);
            finalResult = result;
            break;
          } else if (status === "stopped") {
            console.warn("   ⚠️ 工作流已停止");
            finalResult = result;
            break;
          }
        } catch (error) {
          console.error(`   ⚠️ 查询出错: ${error.message}`);
        }

        if (!finalResult) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
        }
      }

      // 如果轮询30次后仍未完成，且有formToken，则尝试调用human_input接口
      if (!finalResult && formToken) {
        console.log(`\n🔄 轮询超时，尝试调用 human_input 接口恢复工作流 (formToken: ${formToken})`);

        const humanInputMaxRetries = 5;
        for (let hiRetry = 1; hiRetry <= humanInputMaxRetries; hiRetry++) {
          console.log(`   📤 第 ${hiRetry} 次调用 human_input 接口...`);

          try {
            const humanInputUrl = `${props.baseUrl}/api/form/human_input/${formToken}`;
            const response = await fetch(humanInputUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${usedApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ inputs: {}, action: "approve" }),
            });

            if (!response.ok) {
              throw new Error(`human_input 调用失败 (${response.status})`);
            }

            const hiResult = await response.json();
            console.log(`   📥 human_input 返回:`, JSON.stringify(hiResult, null, 2));

            // 等待一下再查询状态
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // 查询工作流状态
            const statusUrl = `${props.baseUrl}/v1/workflows/run/${workflowRunId}`;
            const statusResponse = await fetch(statusUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${usedApiKey}`,
              },
            });

            if (statusResponse.ok) {
              const statusResult = await statusResponse.json();
              console.log(`   🔍 human_input 后查询状态: ${statusResult.status}`);

              if (statusResult.status === "succeeded") {
                console.log("   ✅ human_input 调用成功，工作流已完成！");
                finalResult = statusResult;
                break;
              } else if (statusResult.status === "failed") {
                console.error("   ❌ human_input 后工作流执行失败");
                finalResult = statusResult;
                break;
              }
            }
          } catch (error) {
            console.error(`   ⚠️ human_input 调用出错: ${error.message}`);
          }

          // 如果还没成功，等待一下再重试
          if (!finalResult && hiRetry < humanInputMaxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!finalResult) {
        throw new Error(`轮询 ${maxRetries} 次后工作流仍未完成`);
      }

      return finalResult;
    };

    // 提取助手5的识别结果（从"识别结果:"到"验证结果:"之间的内容）
    const extractRecognitionResult = (content: string): string => {
      console.log("助手5原始内容:", content);

      // 支持中文全角冒号（：）和英文半角冒号（:），以及可能的Markdown格式（如**识别结果：**）
      const match = content.match(/识别结果[：:](?:\*\*)?[\s\S]*?(?=验证结果[：:])/);
      if (match && match[0]) {
        let result = match[0];
        // 移除开头的"识别结果："或"识别结果:"以及可能的**
        result = result.replace(/^识别结果[：:](?:\*\*)?\s*/, "");
        return result.trim();
      }

      return "";
    };

    // 处理人工介入 - Approve
    const handleHumanApprove = async (msgIndex: number) => {
      const message = messages.value[msgIndex];
      if (!message?.formToken) {
        ElMessage.error("无法获取表单令牌");
        return;
      }

      isSubmitting.value = true;
      isLoading.value = true;

      // 标记消息为已处理，防止重复提交
      message.isProcessed = true;

      // 添加用户反馈消息
      messages.value.push({
        role: "user",
        content: `✅ 确认 - ${message.humanInput || "确认继续"}`,
        timestamp: Date.now(),
      });

      // 添加 AI 思考中消息
      const thinkingMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isThinking: true,
      };
      messages.value.push(thinkingMsg);

      await scrollToBottom();

      try {
        // 提交表单
        await submitForm(message.formToken, { usercomments: message.humanInput || "" }, "approve");

        // 等待工作流处理
        console.log("⏳ 等待工作流处理完成...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 查询工作流运行结果
        if (message.workflowRunId) {
          const finalResult = await waitForWorkflowCompletion(message.workflowRunId);
          console.log("\n🎉 流程执行完成！");

          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.isThinking = false;

            // 从助手5的中间结果中提取识别结果
            const recognitionResult = extractRecognitionResult(message.content);

            if (finalResult.status === "succeeded") {
              // 当workflow成功时，显示助手5的识别结果（而不是接口返回的answer）
              if (recognitionResult) {
                // 保存识别结果
                assistant5RecognitionResult.value = recognitionResult;
                // 根据当前步骤显示不同的提示文字
                const completeText = currentStep.value === 1 ? "图片识别完毕" : currentStep.value === 2 ? "点位绑定完毕" : "生成DSL完毕";
                // 显示折叠内容提示
                lastMsg.content = `<div class="recognition-result-wrapper">
                  <div class="recognition-result-collapsed" onclick="this.classList.toggle('expanded'); this.querySelector('.collapse-icon').textContent = this.classList.contains('expanded') ? '▼' : '▶'; this.parentElement.querySelector('.recognition-result-content').style.display = this.classList.contains('expanded') ? 'block' : 'none';">
                    <span class="collapse-icon">▶</span>
                    <span class="collapse-text">${completeText}，点击展开具体内容</span>
                  </div>
                  <div class="recognition-result-content" style="display: none;">
                    ${recognitionResult}
                  </div>
                </div>`;
              } else {
                // 如果没有提取到识别结果，显示默认提示
                lastMsg.content = "工作流执行成功完成！";
              }
            } else if (finalResult.error) {
              lastMsg.content = `工作流执行失败：${finalResult.error}`;
            } else {
              lastMsg.content = "工作流已完成，但没有返回结果。";
            }

            // 显式触发响应式更新和持久化
            messages.value = [...messages.value];
            saveMessagesToStorage();
          }

          await scrollToBottom();
          emit("message-received", lastMsg?.content || "");

          // 步骤完成后标记需要进入下一步
          if (currentStep.value === 1 && finalResult.status === "succeeded") {
            stepResults.value[1] = assistant5RecognitionResult.value;
            needAutoProceedToStep2.value = true;
          } else if (currentStep.value === 2 && finalResult.status === "succeeded") {
            stepResults.value[2] = assistant5RecognitionResult.value;
            needAutoProceedToStep3.value = true;
          }
        } else {
          const lastMsg = messages.value[messages.value.length - 1];
          if (lastMsg?.role === "assistant") {
            lastMsg.isThinking = false;
            lastMsg.content = "已确认，工作流继续执行中...";
          }
        }
      } catch (error: any) {
        console.error("人工介入 Approve 失败:", error);

        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === "assistant") {
          lastMsg.isThinking = false;
          lastMsg.content = `提交失败：${error.message}`;

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }

        ElMessage.error("提交失败：" + error.message);
      } finally {
        isSubmitting.value = false;
        isLoading.value = false;
        isAwaitingFeedback.value = false; // 重置等待反馈状态
        // 确保最后滚动到底部
        setTimeout(() => scrollToBottom(), 100);
      }

      // 在finally块之后执行自动进入步骤2或步骤3
      if (needAutoProceedToStep2.value) {
        needAutoProceedToStep2.value = false;
        await autoProceedToStep2();
      } else if (needAutoProceedToStep3.value) {
        needAutoProceedToStep3.value = false;
        await autoProceedToStep3();
      }
    };

    // 处理人工介入 - Revise
    const handleHumanRevise = async (msgIndex: number) => {
      const message = messages.value[msgIndex];

      // 获取当前选择的发送类型对应的 API Key
      const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
      if (!message?.formToken) {
        ElMessage.error("无法获取表单令牌");
        return;
      }

      isSubmitting.value = true;
      isLoading.value = true;

      // 标记消息为已处理，防止重复提交
      message.isProcessed = true;

      // 获取修改意见
      const reviseQuery = message.humanInput || "继续";

      // 添加用户反馈消息
      messages.value.push({
        role: "user",
        content: reviseQuery,
        timestamp: Date.now(),
      });

      await scrollToBottom();
      // 再次确保滚动（使用 setTimeout 确保 DOM 更新）
      setTimeout(() => scrollToBottom(), 50);

      try {
        // 提交表单
        await submitForm(message.formToken, { usercomments: reviseQuery }, "revise");

        // 继续对话，将用户反馈作为新的查询
        console.log("🔄 用户选择 Revise，继续对话...");

        // 添加 AI 思考中消息
        const thinkingMsg: Message = {
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          isThinking: true,
        };
        messages.value.push(thinkingMsg);

        await scrollToBottom();
        // 再次确保滚动
        setTimeout(() => scrollToBottom(), 50);

        // 使用相同的 conversation_id 再次调用 chat-messages 接口
        const apiKey = sendType?.config.apiKey || props.apiKey;

        // 创建 AbortController 用于取消请求
        abortController.value = new AbortController();

        // 构建 files 参数（如果有上传的图片）
        const files = lastUploadedImage.value
          ? [
              {
                type: "image",
                transfer_method: "local_file",
                upload_file_id: lastUploadedImage.value.id,
              },
            ]
          : [];

        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: props.data || {},
            query: reviseQuery,
            response_mode: "streaming",
            conversation_id: conversationId.value || "",
            user: props.userId,
            files: files,
          }),
          signal: abortController.value.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Revise 请求失败 (${response.status}):`, errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("无法读取响应流");
        }

        console.log("Revise 开始流式响应");

        let fullContent = "";
        let isPaused = false;
        let pauseData: any = null;
        let currentFormToken = "";
        let currentWorkflowRunId = "";
        let pendingData = "";

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log("Revise 流式响应完成");
              break;
            }

            const chunk = pendingData + decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            // 保留最后一行（可能是不完整的）
            pendingData = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim() || line === "data: [DONE]") {
                continue;
              }

              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));

                  // 处理工作流暂停事件
                  if (data.event === "workflow_paused") {
                    isPaused = true;
                    isAwaitingFeedback.value = true;
                    pauseData = data;

                    // 提取 form_token（使用专门的提取函数）
                    const formToken = extractFormToken(data);
                    if (formToken) {
                      currentFormToken = formToken;
                      console.log("🔑 Form Token:", formToken);
                    } else {
                      // 如果提取失败，使用 task_id 作为备用
                      currentFormToken = data.task_id || "";
                      console.log("⚠️ 无法提取 form_token，使用 task_id:", currentFormToken);
                    }

                    // 保存 workflow_run_id
                    if (data.data && data.data.workflow_run_id) {
                      currentWorkflowRunId = data.data.workflow_run_id;
                    } else {
                      currentWorkflowRunId = data.workflow_run_id || "";
                    }

                    console.log("🔔 工作流暂停，需要人工介入:", pauseData);

                    // 提取暂停时的消息内容（form_content）
                    let pauseContent = "";
                    if (
                      pauseData.data &&
                      pauseData.data.reasons &&
                      pauseData.data.reasons.length > 0
                    ) {
                      const reason = pauseData.data.reasons[0];
                      if (reason.form_content) {
                        pauseContent = reason.form_content
                          .replace(/\\n/g, "\n")
                          .replace(/\*\*/g, "");
                      }
                    }

                    // 更新当前消息内容
                    if (thinkingMsg) {
                      thinkingMsg.isThinking = false;
                      thinkingMsg.content =
                        pauseContent || fullContent || "工作流已暂停，等待人工介入";
                      thinkingMsg.isHumanInteraction = true;
                      thinkingMsg.formToken = currentFormToken;
                      thinkingMsg.workflowRunId = currentWorkflowRunId;

                      // 显式触发响应式更新和持久化
                      messages.value = [...messages.value];
                      saveMessagesToStorage();
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
                  if (data.event === "workflow_finished" || data.event === "message_end") {
                    if (thinkingMsg) {
                      thinkingMsg.isThinking = false;
                      // 检查工作流是否失败
                      if (data.data && data.data.status === "failed") {
                        const errorMsg = data.data.error || "工作流执行失败";
                        thinkingMsg.content = `❌ ${errorMsg}`;
                        ElMessage.error("工作流执行失败：" + errorMsg);
                      }

                      // 显式触发响应式更新和持久化
                      messages.value = [...messages.value];
                      saveMessagesToStorage();
                    }
                  }
                } catch (parseError) {
                  console.error("解析 SSE 数据失败:", parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
          abortController.value = null;
        }

        // 处理残留数据中的 workflow_finished 事件（处理分块传输导致的残留）
        if (pendingData.trim() && pendingData.startsWith("data: ")) {
          try {
            const data = JSON.parse(pendingData.slice(6));
            if (data.event === "workflow_finished" && thinkingMsg) {
              thinkingMsg.isThinking = false;
              if (data.data && data.data.status === "failed") {
                const errorMsg = data.data.error || "工作流执行失败";
                thinkingMsg.content = `❌ ${errorMsg}`;
                ElMessage.error("工作流执行失败：" + errorMsg);
              }
            }
          } catch (e) {
            console.warn("处理残留数据失败:", e);
          }
        }

        // 如果工作流暂停，保持人工介入状态
        if (isPaused && pauseData) {
          console.log("Revise 工作流暂停，等待用户操作");
          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        } else {
          // 正常完成
          if (thinkingMsg) {
            thinkingMsg.isThinking = false;
            // 如果没有任何内容，提示超时
            if (!fullContent.trim()) {
              thinkingMsg.content = "⏰ Dify响应超时";
              ElMessage.warning("Dify响应超时");
            }
          }
          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
          emit("message-received", fullContent);
        }
      } catch (error: any) {
        console.error("人工介入 Revise 失败:", error);

        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg?.role === "assistant") {
          lastMsg.isThinking = false;
          lastMsg.content = `提交失败：${error.message}`;

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }

        ElMessage.error("提交失败：" + error.message);
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

    // 监听剪贴板粘贴事件（支持 Ctrl+V / Cmd+V）
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await uploadFile(file, "paste");
          }
          break;
        }
      }
    };

    // 从localStorage恢复上传的图片信息
    const restoreUploadedImage = () => {
      try {
        const savedImageStr = localStorage.getItem(getUploadImageStorageKey());
        if (!savedImageStr) return;

        const savedImage = JSON.parse(savedImageStr);
        if (!savedImage.id) return;

        const { base64Data, ...imageInfo } = savedImage;
        lastUploadedImage.value = imageInfo;

        if (base64Data) {
          previewImageUrl.value = base64Data;
        } else {
          localStorage.removeItem(getUploadImageStorageKey());
          lastUploadedImage.value = null;
        }
      } catch (error) {
        localStorage.removeItem(getUploadImageStorageKey());
        lastUploadedImage.value = null;
      }
    };

    // 处理文件上传（支持文件输入和剪贴板粘贴）
    const uploadFile = async (file: File, source: string = "input") => {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        ElMessage.error("请选择有效的图片格式（png/jpeg/jpg/webp/gif）");
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error("图片大小不能超过2MB");
        return;
      }

      isLoading.value = true;

      try {
        const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
        const apiKey = sendType?.config.apiKey || props.apiKey;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user", props.userId || "abc-123");

        const response = await fetch(`${props.baseUrl}/v1/files/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`上传失败 HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        lastUploadedImage.value = {
          id: result.id,
          name: result.name,
          size: result.size,
          extension: result.extension,
          mime_type: result.mime_type,
          created_at: result.created_at,
        };

        try {
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64Data = e.target?.result as string;
            const imageData = {
              ...lastUploadedImage.value,
              base64Data: base64Data,
            };
            localStorage.setItem(getUploadImageStorageKey(), JSON.stringify(imageData));
            previewImageUrl.value = base64Data;
          };
          reader.readAsDataURL(file);
        } catch (e) {}

        ElMessage.success(`图片 "${result.name}" 上传成功！点击旁边的链接查看预览`);
      } catch (error: any) {
        ElMessage.error("图片上传失败：" + error.message);
      } finally {
        isLoading.value = false;
      }
    };

    // 将识别结果上传为txt文件
    const uploadRecognitionResultAsFile = async (content: string, apiKey: string): Promise<any> => {
      console.log("=== 上传识别结果为txt文件 ===");

      try {
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const file = new File([blob], `recognition_result_${Date.now()}.txt`, {
          type: "text/plain",
        });

        const formData = new FormData();
        formData.append("file", file);
        formData.append("user", props.userId || "abc-123");

        const response = await fetch(`${props.baseUrl}/v1/files/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`上传失败 HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("文件上传成功:", result);

        return result;
      } catch (error: any) {
        console.error("文件上传失败:", error);
        throw error;
      }
    };

    // 处理图片上传（文件输入）
    const handleImageUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (!file) return;

      await uploadFile(file, "input");

      target.value = "";
    };

    // 打开图片预览
    const openImagePreview = () => {
      if (!lastUploadedImage.value) {
        ElMessage.warning("暂无已上传的图片");
        return;
      }
      imagePreviewVisible.value = true;
    };

    // CAD转JSON
    const cadToJson = async () => {
      if (!lastUploadedImage.value) {
        ElMessage.warning("请先上传图片");
        return;
      }

      isCadConverting.value = true;

      // 添加用户消息
      messages.value.push({
        role: "user",
        content: `📐 CAD转JSON (图片: ${lastUploadedImage.value.name})`,
        timestamp: Date.now(),
      });

      // 添加AI消息（思考中状态）
      const msgIndex = messages.value.length;
      messages.value.push({
        role: "assistant",
        content: "",
        isThinking: true,
        timestamp: Date.now(),
      });

      await scrollToBottom();

      // 创建 AbortController 用于取消请求
      abortController.value = new AbortController();

      try {
        const apiKey = props.apiKeyFlow3 || props.apiKey;

        const requestBody = {
          inputs: {},
          query: "cad转json",
          response_mode: "streaming",
          conversation_id: "",
          user: props.userId || "abc-123",
          files: [
            {
              type: "image",
              transfer_method: "local_file",
              upload_file_id: lastUploadedImage.value.id,
            },
          ],
        };

        console.log("请求体:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${props.baseUrl}/v1/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: abortController.value.signal,
        });

        if (!response.ok) {
          throw new Error(`请求失败 HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法获取响应流");
        }

        const decoder = new TextDecoder("utf-8");
        let fullContent = "";

        console.log("=== CAD转JSON 开始流式响应 ===");

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log("=== CAD转JSON 流式响应结束 ===");
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.substring(6));

              // 保存 taskId 用于停止生成
              if (data.task_id) {
                currentTaskId.value = data.task_id;
              }

              if (data.event === "message") {
                if (data.answer) {
                  fullContent += data.answer;
                  messages.value[msgIndex] = {
                    ...messages.value[msgIndex],
                    content: fullContent,
                    isThinking: false,
                  };
                  await scrollToBottom();
                }
              } else if (data.event === "error") {
                throw new Error(data.message || "转换失败");
              } else if (data.event === "end") {
                console.log("=== CAD转JSON 找到 end 事件 ===");
                break;
              }
            } catch (jsonError) {
              console.warn("解析JSON失败:", line, jsonError);
            }
          }
        }

        console.log("=== CAD转JSON 完成 ===");
        console.log("转换结果:", fullContent);

        // 确保消息状态正确
        messages.value[msgIndex] = {
          ...messages.value[msgIndex],
          content: fullContent,
          isThinking: false,
        };

        await scrollToBottom();

        ElMessage.success("CAD转JSON完成！");
      } catch (error: any) {
        // 如果是用户主动取消，不显示错误
        if (error.name === "AbortError") {
          console.log("CAD转JSON已停止");
          ElMessage.info("CAD转JSON已停止");
          return;
        }

        console.error("CAD转JSON失败:", error);

        // 更新消息显示错误
        messages.value[messages.value.length - 1] = {
          ...messages.value[messages.value.length - 1],
          content: `CAD转JSON失败：${error.message}`,
          isThinking: false,
        };

        await scrollToBottom();

        ElMessage.error("CAD转JSON失败：" + error.message);
      } finally {
        isCadConverting.value = false;
        abortController.value = null;
        currentTaskId.value = null;
      }
    };

    // 清空消息
    const clearMessages = () => {
      try {
        localStorage.removeItem(getStorageKey());
        localStorage.removeItem(getUploadImageStorageKey());
        localStorage.removeItem(getStepStorageKey());
      } catch (e) {
        console.error("清空 localStorage 失败:", e);
      }
      messages.value = [];
      lastUploadedImage.value = null;
      previewImageUrl.value = "";
      resetSteps();
      ElMessage.success("对话已清空");
    };

    // 停止生成
    const stopGeneration = async (isTimeout: boolean = false) => {
      if (!isLoading.value && !isCadConverting.value) return;

      // 先调用官方停止接口
      if (currentTaskId.value) {
        try {
          const response = await fetch(
            `${props.baseUrl}/v1/chat-messages/${currentTaskId.value}/stop`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${props.apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user: props.userId,
              }),
            },
          );

          const result = await response.json();
          if (result.result === "success") {
            console.log("停止请求成功");
          }
        } catch (error) {
          console.error("调用停止接口失败:", error);
        }
      }

      // 取消本地请求
      if (abortController.value) {
        abortController.value.abort();
      }

      // 将最后一条 AI 消息的 isThinking 设置为 false
      if (messages.value.length > 0) {
        const lastMsg = messages.value[messages.value.length - 1];
        if (lastMsg.role === "assistant" && lastMsg.isThinking) {
          messages.value[messages.value.length - 1] = {
            ...lastMsg,
            isThinking: false,
            // 如果是超时导致的停止，显示超时提示
            content: isTimeout
              ? `⏱️ Dify响应超时（超过${SSE_TIMEOUT_MS / 1000}秒），自动断开`
              : lastMsg.content || "已停止生成",
          };

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }
      }

      // 如果是 CAD转JSON，清理状态
      if (isCadConverting.value) {
        isCadConverting.value = false;
        abortController.value = null;
        currentTaskId.value = null;
      }

      if (isTimeout) {
        ElMessage.warning(`Dify响应超时（超过${SSE_TIMEOUT_MS / 1000}秒），请稍后重试`);
      } else {
        ElMessage.info("已停止生成");
      }
    };

    // 校验屏幕JSON是否符合最低结构要求
    // 返回true表示通过校验，false表示未通过
    const validateScreenJsonStructure = (jsonObj: any): boolean => {
      // 检查是否为对象
      if (!jsonObj || typeof jsonObj !== "object") {
        ElMessage.warning("JSON结构无效：根对象不存在或不是有效对象");
        return false;
      }

      // 检查screen对象
      if (!jsonObj.screen || typeof jsonObj.screen !== "object") {
        ElMessage.warning("JSON结构无效：缺少screen对象或screen不是有效对象");
        return false;
      }

      // 检查screen.id
      if (jsonObj.screen.id === undefined || jsonObj.screen.id === null) {
        ElMessage.warning("JSON结构无效：screen对象缺少id字段");
        return false;
      }

      // 检查screen.name
      if (jsonObj.screen.name === undefined || jsonObj.screen.name === null) {
        ElMessage.warning("JSON结构无效：screen对象缺少name字段");
        return false;
      }

      // 检查coms数组
      if (!Array.isArray(jsonObj.coms)) {
        ElMessage.warning("JSON结构无效：coms不是有效的数组");
        return false;
      }

      return true;
    };

    // 保存AI生成的屏幕数据
    const saveScreenAI = async (jsonObj: any) => {
      try {
        await saveScreen(jsonObj);
        EditorModule.screenJsonSnapshot = JSON.stringify(jsonObj);
        ElMessage.success("AI生成的屏幕数据保存成功");
      } catch (error) {
        console.error("保存AI生成的屏幕数据失败:", error);
        ElMessage.error("保存失败，请稍后重试");
        throw error;
      }
    };

    // 从URL读取JSON并保存屏幕数据
    const fetchAndSaveScreenAI = async () => {
      const aiMessages = messages.value.filter(
        (msg) => msg.role === "assistant" && !msg.isThinking,
      );
      if (aiMessages.length === 0) {
        ElMessage.warning("暂无 AI 回答");
        return;
      }
      try {
        ElMessage.info("正在加载JSON数据...");
        const response = await fetch("http://10.89.33.97:5000/data.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonObj = await response.json();

        if (EditorModule.screen) {
          if (EditorModule.screen.id) {
            jsonObj.screen.id = EditorModule.screen.id;

            // 设置所有组件的 projectId 为当前屏幕 ID
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach((component) => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if (EditorModule.screen.name) {
            jsonObj.screen.name = EditorModule.screen.name;
          }
        }

        await saveScreenAI(jsonObj);
        console.log("从URL读取的 JSON 内容saveScreenAI:", jsonObj);
      } catch (error) {
        console.error("从URL读取JSON失败:", error);
        ElMessage.error("读取JSON失败，请检查网络或URL是否正确");
      }
    };

    // 将最后一条 AI 回答中的 JSON 输出到控制台
    const outputJsonToConsole = async () => {
      // 查找最后一条 AI 助手的消息
      const aiMessages = messages.value.filter(
        (msg) => msg.role === "assistant" && !msg.isThinking,
      );
      if (aiMessages.length === 0) {
        ElMessage.warning("暂无 AI 回答");
        return;
      }

      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const content = lastAiMessage.content;

      // 尝试从内容中提取 JSON
      try {
        // 从浏览器缓存中获取 DataS-Project 值
        const dataSProject = localStorage.getItem("DataS-Project");
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
              console.warn("JSON校准失败且直接解析也失败:", parseError);
              ElMessage.warning("无法解析JSON内容");
              return;
            }
          }

          // if (dataSProject) {
          //   // 将值添加到 JSON 对象中，键名为 projectid
          //   jsonObj.projectid = dataSProject;
          // }
          // 添加 screen 数据（只包含id和name）
          if (EditorModule.screen) {
            if (EditorModule.screen.id) {
              jsonObj.screen.id = EditorModule.screen.id;

              // 设置所有组件的 projectId 为当前屏幕 ID
              if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
                jsonObj.coms.forEach((component) => {
                  component.projectId = EditorModule.screen.id;
                });
              }
            }
            if (EditorModule.screen.name) {
              jsonObj.screen.name = EditorModule.screen.name;
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
            console.warn("JSON结构校验未通过，拒绝保存");
            return;
          }

          // 调用saveScreenAI方法保存AI生成的屏幕数据
          await saveScreenAI(repairedJson);
          console.log("AI 回答中的 JSON 内容saveScreenAI:", repairedJson);
          return;
        }

        // 如果没有找到 JSON 格式，提示用户
        ElMessage.warning("回答内容中未找到有效的 JSON 格式");
        console.log("AI 回答内容（非 JSON）:", content);
      } catch (error) {
        console.error("处理 JSON 时发生错误:", error);
        ElMessage.warning("处理 JSON 时发生错误");
      }
    };

    // 关闭对话框
    const handleClose = async () => {
      // 如果有正在进行的请求，取消它
      if (abortController.value) {
        abortController.value.abort();
      }
      dialogVisible.value = false;
      // 重置步骤状态
      currentStep.value = 1;
      stepResults.value = {};
      selectedSendType.value = props.waterServiceMode ? "sendWater" : "send5";
      // 保留消息和会话ID，不移除
      emit("close");

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
        console.error("重新加载页面数据失败:", error);
      }
    };

    // 测试模式开关 - 设置为true时直接使用本地测试数据
    const USE_TEST_DATA = true;

    // 创建JSON修复工具实例
    const jsonRepairTool = new JSONRepairTool();

    // 组件销毁时清理资源
    onUnmounted(() => {
      console.log("=== DifyApiDialog 组件销毁 ===");

      if (abortController.value) {
        abortController.value.abort();
        abortController.value = null;
      }

      if (timeoutTimer.value) {
        clearTimeout(timeoutTimer.value);
        timeoutTimer.value = null;
      }

      currentTaskId.value = null;

      // 清理全局base64预览相关数据
      if (typeof window !== "undefined") {
        delete (window as any).__previewBase64Image;
        delete (window as any).__base64PreviewData;
        delete (window as any).__toggleRecognitionJson;
      }
    });

    // 校准JSON功能
    const calibrateJson = async () => {
      let jsonObj: any = null;

      try {
        if (USE_TEST_DATA) {
          // 测试模式：使用fetch读取本地测试数据（支持非法JSON自动校准）
          // 使用fetch而非import可以绕过编译时JSON校验
          ElMessage.info("正在读取测试数据...");
          try {
            const response = await fetch("/src/components/dify-chatbot/test/testresponse.json");
            const jsonStr = await response.text();

            // 尝试直接解析，如果失败则进行校准
            try {
              jsonObj = JSON.parse(jsonStr);
            } catch (parseError) {
              console.log("JSON解析失败，尝试校准...");
              jsonObj = calibrateJsonString(jsonStr);

              if (!jsonObj) {
                throw new Error("JSON校准失败: " + parseError.message);
              }
            }
          } catch (fetchError) {
            console.error("读取测试数据失败:", fetchError);
            throw new Error("无法读取测试数据: " + fetchError.message);
          }
        } else {
          // 正式模式：从AI回答中提取JSON
          // 查找最后一条 AI 助手的消息
          const aiMessages = messages.value.filter(
            (msg) => msg.role === "assistant" && !msg.isThinking,
          );
          if (aiMessages.length === 0) {
            ElMessage.warning("暂无 AI 回答");
            return;
          }

          const lastAiMessage = aiMessages[aiMessages.length - 1];
          const content = lastAiMessage.content;

          // 1. 提取JSON字符串
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            ElMessage.warning("未找到JSON格式内容");
            return;
          }

          let jsonStr = jsonMatch[0];

          // 2. 校准JSON（修复常见的JSON格式问题）
          jsonObj = calibrateJsonString(jsonStr);

          if (!jsonObj) {
            ElMessage.error("JSON校准失败");
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
        if (EditorModule.screen) {
          if (EditorModule.screen.id) {
            refinedJson.screen.id = EditorModule.screen.id;
            if (refinedJson.coms && Array.isArray(refinedJson.coms)) {
              refinedJson.coms.forEach((component) => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if (EditorModule.screen.name) {
            refinedJson.screen.name = EditorModule.screen.name;
          }
        }

        // JSON结构校验（如果开启校验功能）
        if (enableJsonValidation.value && !validateScreenJsonStructure(refinedJson)) {
          console.warn("JSON结构校验未通过，拒绝保存");
          return;
        }

        // 6. 保存校准后的JSON
        await saveScreenAI(refinedJson);
        ElMessage.success("JSON校准并保存成功");
        console.log("校准后的JSON:", refinedJson);
      } catch (error) {
        console.error("校准JSON时发生错误:", error);
        ElMessage.error("校准失败: " + error.message);
      }
    };

    // 根据模板修复单个组件
    const refineComponentByTemplate = (component: any, template: Record<string, any>): any => {
      const componentType = component.name || "VMainTitle";
      const templateComponent = template[componentType];

      if (!templateComponent) {
        console.warn(`组件类型 ${componentType} 不在模板中，使用默认配置`);
        return component;
      }

      // 创建新组件对象，以原始组件为基础
      const newComponent: any = { ...component };

      // 合并基础属性，优先使用原始值
      newComponent.alias =
        component.alias !== undefined ? component.alias : templateComponent.alias;
      newComponent.icon = component.icon !== undefined ? component.icon : templateComponent.icon;
      newComponent.img = component.img !== undefined ? component.img : templateComponent.img;
      newComponent.locked =
        component.locked !== undefined ? component.locked : templateComponent.locked;
      newComponent.hided =
        component.hided !== undefined ? component.hided : templateComponent.hided;
      newComponent.eventhub =
        component.eventhub !== undefined ? component.eventhub : templateComponent.eventhub;
      newComponent.handles = component.handles || templateComponent.handles || {};
      newComponent.ichandles = component.ichandles || templateComponent.ichandles || {};
      // 优先使用原始数据，只有在原始数据不存在时才使用模板值
      newComponent.apis =
        component.apis !== undefined ? component.apis : templateComponent.apis || {};
      newComponent.events =
        component.events !== undefined ? component.events : templateComponent.events || {};
      newComponent.actions =
        component.actions !== undefined ? component.actions : templateComponent.actions || {};

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
        filpH: source?.filpH !== undefined ? source.filpH : template?.filpH || false,
      };
    };

    // 合并config配置（递归）
    const mergeConfig = (source: any, template: any): any => {
      const result: any = {};

      // 遍历模板的所有键
      for (const key of Object.keys(template)) {
        if (
          typeof template[key] === "object" &&
          template[key] !== null &&
          !Array.isArray(template[key])
        ) {
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
      const aiMessages = messages.value.filter(
        (msg) => msg.role === "assistant" && !msg.isThinking,
      );
      if (aiMessages.length === 0) {
        ElMessage.warning("暂无 AI 回答内容可复制");
        return;
      }

      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const content = lastAiMessage.content;

      try {
        // 使用 Clipboard API 复制内容
        await navigator.clipboard.writeText(content);
        ElMessage.success("内容已复制到剪贴板");
      } catch (error) {
        console.error("复制失败:", error);
        // 降级方案：创建临时文本区域
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          ElMessage.success("内容已复制到剪贴板");
        } catch (e) {
          ElMessage.error("复制失败，请手动复制");
        }
        document.body.removeChild(textarea);
      }
    };

    // 临时保存payload数据
    const saveTempPayload = async () => {
      try {
        let jsonObj = payloadJson.default as unknown as {
          screen: { id: number; name: string };
          coms: any[];
        };
        if (EditorModule.screen) {
          if (EditorModule.screen.id) {
            jsonObj.screen.id = EditorModule.screen.id;

            // 设置所有组件的 projectId 为当前屏幕 ID
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach((component) => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if (EditorModule.screen.name) {
            jsonObj.screen.name = EditorModule.screen.name;
          }
        }
        await saveScreenAI(jsonObj);
        console.log("写死的 JSON 内容saveScreenAI:", jsonObj);
      } catch (error) {
        console.error("保存payload失败:", error);
      }
    };

    const validationResultImageVisible = ref(false);
    const validationResultImageUrl = ref("");
    const validationResultJson = ref<any>(null);

    const extractValidationResult = () => {
      const aiMessages = messages.value.filter(
        (msg) => msg.role === "assistant" && !msg.isThinking,
      );
      if (aiMessages.length === 0) {
        ElMessage.warning("暂无 AI 回答");
        return;
      }

      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const content = lastAiMessage.content;

      const startMarker = "验证结果：";
      const endMarker = "{{#$output.usercomments#}}";

      const startIndex = content.indexOf(startMarker);
      const endIndex = content.indexOf(endMarker);

      if (startIndex === -1) {
        ElMessage.warning('未找到"验证结果："标记');
        return;
      }

      let jsonStr = content.substring(startIndex + startMarker.length);

      if (endIndex !== -1 && endIndex > startIndex) {
        jsonStr = jsonStr.substring(0, endIndex - startIndex - startMarker.length);
      }

      jsonStr = jsonStr.trim();

      try {
        const jsonObj = JSON.parse(jsonStr);
        validationResultJson.value = jsonObj;

        if (jsonObj.image) {
          const base64Data = jsonObj.image;
          let imageUrl = "";

          if (base64Data.startsWith("data:image")) {
            imageUrl = base64Data;
          } else {
            imageUrl = `data:image/png;base64,${base64Data}`;
          }

          validationResultImageUrl.value = imageUrl;
          validationResultImageVisible.value = true;
        } else {
          ElMessage.warning("验证结果中没有包含图片数据");
        }

        console.log("提取的验证结果JSON:", jsonObj);
      } catch (e) {
        console.error("解析验证结果JSON失败:", e);
        ElMessage.error("解析验证结果JSON失败：" + (e as Error).message);
      }
    };

    // 原始保存 - 只调用calibrateJsonString校准JSON格式，不进行后续组件校对
    const saveRawJson = async () => {
      try {
        // 查找最后一条 AI 助手的消息
        const aiMessages = messages.value.filter(
          (msg) => msg.role === "assistant" && !msg.isThinking,
        );
        if (aiMessages.length === 0) {
          ElMessage.warning("暂无 AI 回答");
          return;
        }

        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const content = lastAiMessage.content;

        // 1. 提取JSON字符串
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          ElMessage.warning("未找到JSON格式内容");
          return;
        }

        let jsonStr = jsonMatch[0];

        // 2. 只调用calibrateJsonString校准JSON格式（处理markdown等格式问题）
        const jsonObj = calibrateJsonString(jsonStr);

        if (!jsonObj) {
          ElMessage.error("JSON校准失败");
          return;
        }

        // 3. 更新屏幕ID和名称
        if (EditorModule.screen) {
          if (EditorModule.screen.id) {
            jsonObj.screen.id = EditorModule.screen.id;
            if (jsonObj.coms && Array.isArray(jsonObj.coms)) {
              jsonObj.coms.forEach((component) => {
                component.projectId = EditorModule.screen.id;
              });
            }
          }
          if (EditorModule.screen.name) {
            jsonObj.screen.name = EditorModule.screen.name;
          }
        }

        // JSON结构校验（如果开启校验功能）
        if (enableJsonValidation.value && !validateScreenJsonStructure(jsonObj)) {
          console.warn("JSON结构校验未通过，拒绝保存");
          return;
        }

        // 4. 保存校准后的JSON（不进行后续组件修复和模板校对）
        await saveScreenAI(jsonObj);
        ElMessage.success("原始保存成功");
        console.log("原始保存的JSON:", jsonObj);
      } catch (error) {
        console.error("原始保存时发生错误:", error);
        ElMessage.error("保存失败: " + error.message);
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
      sendTypes,
      selectedSendType,
      selectOptions,
      currentStep,
      getSendTypeDisabled,
      resetSteps,
      isSubmitting,
      isAwaitingFeedback,
      validationResultImageVisible,
      validationResultImageUrl,
      validationResultJson,
      handleClose,
      sendMessage,
      sendMessage2,
      sendMessage3,
      sendMessage4,
      sendMessage5,
      sendMessage6,
      sendMessage7,
      sendMessageWater,
      sendDispatch,
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
      extractValidationResult,
      handleEnter,
      formatContent,
      formatTime,
      triggerImageUpload,
      handleImageUpload,
      openImagePreview,
      cadToJson,
      imageScale,
      offsetX,
      offsetY,
      isDragging,
      handleImageWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      resetImageScale,
      handlePreviewClose,
    };
  },
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
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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

.thinking-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.thinking-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
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

/* base64预览链接样式 */
.base64-preview-link {
  color: #409eff;
  cursor: pointer;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: #f0f9ff;
  text-decoration: none;
  transition: all 0.2s;
  display: inline-block;
}

.base64-preview-link:hover {
  color: #66b1ff;
  background-color: #ecf5ff;
}

.hint {
  font-size: 12px;
  color: #909399;
}

.send-button {
  min-width: 80px;
}

.send-type-select {
  height: 32px;
}

.send-type-select :deep(.n-base-selection-label) {
  height: 32px;
  font-size: 13px;
}

.send-type-select :deep(.n-base-selection) {
  height: 32px;
  min-height: 32px;
}

.send-type-select :deep(.n-base-selection__border) {
  height: 32px;
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

.error-retry-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.error-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.timeout-tag {
  background-color: #fff7ed;
  color: #ea580c;
}

.error-tag {
  background-color: #fef2f2;
  color: #dc2626;
}

.image-preview-container {
  width: 100%;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 600px;
  transition: transform 0.1s ease;
  cursor: pointer;
  transform-origin: center center;
  user-select: none;
}

.preview-image.is-dragging {
  cursor: grabbing;
}

.image-preview-container:not(.is-dragging) {
  cursor: grab;
}

.image-preview-hint {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 识别结果折叠样式 - 使用:deep()确保v-html插入的内容能应用样式 */
:deep(.recognition-result-wrapper) {
  background-color: #f5f5f5;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

:deep(.recognition-result-collapsed) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

:deep(.recognition-result-collapsed:hover) {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}

:deep(.recognition-result-collapsed.expanded) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-bottom: 1px solid #e4e7ed;
}

:deep(.collapse-icon) {
  font-size: 14px;
  color: #409eff;
  font-weight: bold;
  transition: transform 0.3s;
}

:deep(.collapse-text) {
  color: #409eff;
  font-weight: 500;
  font-size: 14px;
}

:deep(.recognition-result-content) {
  padding: 16px;
  background-color: white;
  line-height: 1.8;
  font-size: 13px;
  color: #333;
  white-space: pre-wrap;
  max-height: 500px;
  overflow-y: auto;
}

/* 步骤路径指示器样式 */
.step-path-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.step-path {
  display: flex;
  align-items: center;
  gap: 0;
}

.step-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;
}

.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #e4e7ed;
  border: 2px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.step-node.current .step-dot {
  background-color: #67c23a;
  border-color: #67c23a;
  box-shadow:
    0 0 0 4px rgba(103, 194, 58, 0.2),
    0 0 12px rgba(103, 194, 58, 0.4);
  animation: pulse-green 2s infinite;
}

.step-node.completed .step-dot {
  background-color: #67c23a;
  border-color: #67c23a;
}

.step-number {
  font-size: 13px;
  font-weight: 600;
  color: #909399;
}

.step-node.current .step-number {
  color: white;
}

.step-check {
  font-size: 16px;
  color: white;
  font-weight: bold;
}

.step-label {
  font-size: 12px;
  color: #909399;
  transition: all 0.3s ease;
}

.step-node.current .step-label {
  color: #67c23a;
  font-weight: 600;
}

.step-node.completed .step-label {
  color: #67c23a;
}

.step-connector {
  width: 60px;
  height: 3px;
  background-color: #e4e7ed;
  margin: 0 4px;
  transition: all 0.3s ease;
}

.step-connector.active {
  background-color: #67c23a;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.4);
}

@keyframes pulse-green {
  0% {
    box-shadow:
      0 0 0 4px rgba(103, 194, 58, 0.2),
      0 0 12px rgba(103, 194, 58, 0.4);
  }
  50% {
    box-shadow:
      0 0 0 6px rgba(103, 194, 58, 0.1),
      0 0 20px rgba(103, 194, 58, 0.6);
  }
  100% {
    box-shadow:
      0 0 0 4px rgba(103, 194, 58, 0.2),
      0 0 12px rgba(103, 194, 58, 0.4);
  }
}
</style>
