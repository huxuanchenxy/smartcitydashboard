<template>
  <Teleport to="body">
    <div
      v-if="dialogVisible"
      class="custom-dialog-mask"
      :class="{ 'no-mask': noMask }"
    >
      <div
        class="custom-dialog-wrapper"
        :style="{
          left: dialogPosition.x + 'px',
          top: dialogPosition.y + 'px',
          width: dialogWidth + 'px',
          height: dialogHeight + 'px',
        }"
      >
        <div v-if="!fixed" class="resize-handles">
          <div class="resize-handle resize-n" @mousedown.stop="startResize('n', $event)"></div>
          <div class="resize-handle resize-s" @mousedown.stop="startResize('s', $event)"></div>
          <div class="resize-handle resize-e" @mousedown.stop="startResize('e', $event)"></div>
          <div class="resize-handle resize-w" @mousedown.stop="startResize('w', $event)"></div>
          <div class="resize-handle resize-ne" @mousedown.stop="startResize('ne', $event)"></div>
          <div class="resize-handle resize-nw" @mousedown.stop="startResize('nw', $event)"></div>
          <div class="resize-handle resize-se" @mousedown.stop="startResize('se', $event)"></div>
          <div class="resize-handle resize-sw" @mousedown.stop="startResize('sw', $event)"></div>
        </div>
        <div class="custom-dialog" :class="{ 'custom-dialog-fixed': fixed }" @mousedown="handleMouseDown">
          <div class="custom-dialog-header">
            <span class="custom-dialog-title">{{ title }}</span>
            <button v-if="!noMask" class="custom-dialog-close" @click="handleClose">
              ×
            </button>
          </div>
          <div class="dify-api-container">
            <div class="message-section-wrapper">
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
                      <div class="message-role">{{ message.role === "user" ? (currentRole === 'project_manager' ? '项目经理' : currentRole === 'developer' ? '开发人员' : currentRole === 'backend_ops' ? '后台维护人员' : '使用人员') : "AI 助手" }}</div>
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
                      <div v-else>
                        <div class="content-text" v-html="formatContent(message.content)"></div>
                        <div v-if="message.flintSpecs && message.flintSpecs.length > 0" class="flint-charts-container">
                          <div
                            v-for="(spec, chartIdx) in message.flintSpecs"
                            :key="chartIdx"
                            :ref="(el) => setFlintChartRef(el, index, chartIdx)"
                            class="flint-chart-item"
                          ></div>
                        </div>
                        <!-- HTML 交互面板 -->
                        <div
                          v-if="message.htmlInteractions && message.htmlInteractions.length > 0"
                          class="html-interactions-container"
                        >
                          <div
                            v-for="(interaction, interIdx) in message.htmlInteractions"
                            :key="interIdx"
                            class="html-interaction-panel"
                            :class="{ resolved: message.interactionResolved }"
                          >
                            <!-- 技能选择面板（可勾选） -->
                            <div v-if="interaction.type === 'skill_select'" class="skill-select-panel">
                              <div class="skill-select-message">{{ interaction.message }}</div>
                              <div class="skill-select-list">
                                <div
                                  v-for="skill in interaction.skills"
                                  :key="skill.name"
                                  class="skill-select-item"
                                  :class="{ selected: message.selectedSkills && message.selectedSkills.includes(skill.name) }"
                                  @click="toggleSkill(index, skill.name)"
                                >
                                  <div class="skill-checkbox">
                                    <span v-if="message.selectedSkills && message.selectedSkills.includes(skill.name)">✓</span>
                                  </div>
                                  <div class="skill-select-info">
                                    <div class="skill-select-name">{{ skill.name }}</div>
                                    <div class="skill-select-desc">{{ skill.desc }}</div>
                                  </div>
                                </div>
                              </div>
                              <div class="skill-select-actions">
                                <button
                                  v-for="btn in getButtons(interaction)"
                                  :key="btn.type"
                                  class="skill-btn"
                                  :class="btn.type === 'confirm' ? 'skill-confirm-btn' : 'skill-cancel-btn'"
                                  :style="getButtonInlineStyle(btn)"
                                  @click="btn.type === 'confirm' ? confirmSkillSelection(index) : cancelSkillSelection(index)"
                                  :disabled="message.interactionResolved"
                                >
                                  {{ btn.text }}
                                </button>
                              </div>
                              <div v-if="message.interactionResolved && message.selectedSkills && message.selectedSkills.length > 0" class="skill-selected-summary">
                                已选择：{{ message.selectedSkills.join('、') }}
                              </div>
                              <div v-if="message.interactionResolved && (!message.selectedSkills || message.selectedSkills.length === 0)" class="skill-selected-summary">
                                已取消选择
                              </div>
                            </div>
                            <!-- 技能列表面板（只读列表，不可勾选） -->
                            <div v-else-if="interaction.type === 'skill_list'" class="skill-list-panel">
                              <div class="skill-select-message">{{ interaction.message }}</div>
                              <div class="skill-select-list">
                                <div
                                  v-for="skill in interaction.skills"
                                  :key="skill.name"
                                  class="skill-list-item"
                                >
                                  <div class="skill-list-info">
                                    <div class="skill-select-name">{{ skill.name }}</div>
                                    <div class="skill-select-desc">{{ skill.desc }}</div>
                                  </div>
                                </div>
                              </div>
                              <div v-if="interaction.buttons && interaction.buttons.length > 0" class="skill-select-actions">
                                <button
                                  v-for="btn in getButtons(interaction)"
                                  :key="btn.type"
                                  class="skill-btn"
                                  :class="btn.type === 'confirm' ? 'skill-confirm-btn' : 'skill-cancel-btn'"
                                  :style="getButtonInlineStyle(btn)"
                                  @click="btn.type === 'confirm' ? confirmSkillList(index, btn) : cancelSkillList(index, btn)"
                                  :disabled="message.interactionResolved"
                                >
                                  {{ btn.text }}
                                </button>
                              </div>
                              <div v-if="message.interactionResolved && message.interactionText" class="skill-selected-summary">
                                {{ message.interactionText }}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div v-if="message.files && message.files.length > 0" class="message-files">
                          <div
                            v-for="file in message.files"
                            :key="file.id"
                            class="message-file-item"
                          >
                            <span class="file-icon">📄</span>
                            <span class="file-name">{{ file.name }}</span>
                            <span class="file-size">{{ formatFileSize(file.size) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="message-actions">
                      <button
                        class="copy-btn"
                        @click="copyMessageContent(message)"
                        :title="'复制内容'"
                        v-if="!message.isThinking"
                      >
                        <ChatCopy />
                      </button>
                    </div>
                    <div class="message-time" v-if="!message.isThinking">
                      {{ formatTime(message.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- <div class="message-section-actions">
                <el-button type="warning" size="small" @click="clearMessages" :disabled="isLoading" title="清空对话">
                  <svg t="1783560291301" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M593.92 126.68928a69.632 69.632 0 0 1 69.632 69.632l-0.04096 94.208H798.72a110.592 110.592 0 0 1 110.592 110.592v122.88a28.672 28.672 0 0 1-28.672 28.672h-49.93024l37.4784 336.81408a28.672 28.672 0 0 1-28.50816 31.82592H184.32a28.672 28.672 0 0 1-28.50816-31.82592l37.43744-336.85504L143.36 552.67328a28.672 28.672 0 0 1-28.672-28.672v-122.88a110.592 110.592 0 0 1 110.592-110.592h135.12704l0.04096-94.208a69.632 69.632 0 0 1 69.632-69.632h163.84z m179.11808 425.984H250.96192l-34.6112 311.296h147.0464l19.456-179.8144a28.672 28.672 0 1 1 57.01632 6.144l-18.8416 173.6704h182.14912l-17.408-173.91616a28.672 28.672 0 1 1 57.05728-5.7344l17.98144 179.6096 146.8416 0.04096-34.6112-311.296z m25.68192-204.8H225.28a53.248 53.248 0 0 0-53.248 53.248v94.208h679.936v-94.208a53.248 53.248 0 0 0-53.248-53.248z m-204.8-163.84h-163.84a12.288 12.288 0 0 0-12.288 12.288v94.208h188.416v-94.208a12.288 12.288 0 0 0-12.288-12.288z" fill="#ffffff"></path></svg>
                </el-button>
              </div> -->
            </div>
            <div class="input-section">
              <div class="input-wrapper">
                <div class="input-row">
                  <div v-if="uploadedFiles.length > 0" class="uploaded-files-list">
                    <div
                      v-for="file in uploadedFiles"
                      :key="file.id"
                      class="uploaded-file-item"
                    >
                      <span class="file-icon">📄</span>
                      <span class="file-name">{{ file.name }}</span>
                      <span class="file-size">{{ formatFileSize(file.size) }}</span>
                      <button class="remove-file-btn" @click="removeFile(file.id)">
                        ×
                      </button>
                    </div>
                  </div>
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
                      <el-button
                        type="default"
                        size="small"
                        @click="openFileDialog"
                        :disabled="isLoading"
                        class="upload-button"
                        title="上传文件"
                        v-show="!isLoading"
                      >
                      <ChatUpload />
                        </el-button>
                      <span class="hint" v-if="isLoading">AI 正在思考中，请稍候...</span>
                      <el-button
                        v-if="isLoading"
                        type="danger"
                        size="small"
                        class="stop-button"
                        title="停止"
                      >
                        <ChatStop />
                      </el-button>
                      <el-button
                        type="success"
                        size="small"
                        @click="sendMessage"
                        :disabled="isLoading || (!userQuery.trim() && uploadedFiles.length === 0)"
                        class="send-button"
                        title="发送"
                        v-show="!isLoading"
                      >
                        <ChatSend />
                      </el-button>
                    </div>
                  </div>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  class="hidden-file-input"
                  @change="handleFileSelect"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
} from "vue";
import { ElButton, ElInput } from "element-plus";
import { DemoScriptEngine } from "./demo-script";
import type { DemoScript } from "./demo-script";
import ChatCopy from "@/icons/chat-copy.vue";
import ChatUpload from "@/icons/chat-upload.vue";
import ChatStop from "@/icons/chat-stop.vue";
import ChatSend from "@/icons/chat-send.vue";
import { assembleECharts } from "flint-chart";
import type { ChartAssemblyInput } from "flint-chart";
import * as echarts from "echarts";

const SCRIPT_MOCK_URL = import.meta.env.VITE_APP_SCRIPT_MOCK_URL || "/mockdata.json";
// Flint 图表相关接口
interface FlintSpec {
  rawInput: ChartAssemblyInput;
  echartsOption: any;
}

// 按钮颜色配置接口
interface ButtonColorConfig {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  hoverBackgroundColor?: string;
}

// 按钮配置接口
interface ButtonConfig {
  type: 'confirm' | 'cancel';
  text: string;
  // 点击该按钮后，在面板下方显示的提示文本；为空/不配置则不显示
  resolvedText?: string;
  color?: ButtonColorConfig;
}

// HTML 交互内容接口
interface HtmlInteraction {
  type: string;
  message: string;
  skills?: Array<{
    name: string;
    desc: string;
  }>;
  buttons?: ButtonConfig[];
}

interface ChartMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingContent?: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
  }>;
  flintSpecs?: FlintSpec[];
  htmlInteractions?: HtmlInteraction[];
  selectedSkills?: string[];
  interactionResolved?: boolean;
  interactionText?: string;
}

export default defineComponent({
  name: "DifyApiDemoDialog",
  components: {
    ElButton,
    ElInput,
    ChatCopy,
    ChatUpload,
    ChatStop,
    ChatSend,
  },
  props: {
    title: {
      type: String,
      default: "AI 智能助手",
    },
    visible: {
      type: Boolean,
      default: false,
    },
    noMask: {
      type: Boolean,
      default: false,
    },
    fixed: {
      type: Boolean,
      default: false,
    },
    initialPosition: {
      type: Object as () => { x: number; y: number },
      default: null,
    },
    initialSize: {
      type: Object as () => { width: number; height: number },
      default: null,
    },
    role: {
      type: String,
      default: "",
    },
    com: {
      type: Object as () => {
        buttonImage: string;
        buttonStyle: {
          backgroundColor: string;
          hoverBackgroundColor: string;
        };
        role: string;
      },
      default: () => ({
        buttonImage: "",
        buttonStyle: {
          backgroundColor: "#409eff",
          hoverBackgroundColor: "#66b1ff",
        },
        role: "",
      }),
    },
  },
  emits: ["close", "update:visible", "message-received", "message-sent"],
  setup(props, { emit }) {
    const dialogVisible = ref(false);
    const userQuery = ref("");
    const messages = ref<ChartMessage[]>([]);
    const flintChartRefs = ref<Map<string, HTMLElement>>(new Map());
    const flintChartInstances = ref<Map<string, echarts.ECharts>>(new Map());
    const isLoading = ref(false);
    const messageContainer = ref<HTMLElement | null>(null);
    const dialogPosition = ref(props.initialPosition ?? { x: window.innerWidth / 2 + 50, y: 100 });
    const dragOffset = ref({ x: 0, y: 0 });
    const isDragging = ref(false);

    const uploadedFiles = ref<
      Array<{
        id: string;
        name: string;
        size: number;
      }>
    >([]);
    const fileInputRef = ref<HTMLInputElement | null>(null);

    const scriptEngine = new DemoScriptEngine();
    const scriptLoaded = ref(false);
    const scriptLoadError = ref<string | null>(null);

    const loadScriptFromMock = async (): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        // 加 timestamp 防止浏览器/CDN 缓存旧 mockdata.json
        const url = `${SCRIPT_MOCK_URL}?t=${Date.now()}`;
        console.log('[Mock脚本] 请求URL:', url);
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache',
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('mockdata.json 返回：', data);

        if (data && data.states && data.initialState) {
          scriptEngine.setScript(data as DemoScript);
          scriptLoaded.value = true;
          scriptLoadError.value = null;
        } else {
          scriptLoaded.value = true;
          scriptLoadError.value = '返回数据格式无效（缺少 states 或 initialState），使用内置脚本';
        }
      } catch (e: any) {
        scriptLoaded.value = true;
        if (e?.name === 'AbortError') {
          scriptLoadError.value = '加载 mock 脚本超时，使用内置脚本';
        } else if (e?.message?.includes('CORS') || e?.message?.includes('Failed to fetch')) {
          scriptLoadError.value = '跨域或网络错误（CORS/无法连接 10.89.33.97:5000），使用内置脚本';
        } else {
          scriptLoadError.value = (e?.message || '加载 mock 脚本失败') + '，使用内置脚本';
        }
      }
    };

    const currentRole = computed(() => {
      return props.role || props.com.role;
    });

    const config = ref({
      buttonImage: props.com.buttonImage,
      buttonStyle: props.com.buttonStyle,
      role: currentRole.value,
    });

    watch(
      () => props.com,
      (newCom) => {
        config.value = {
          buttonImage: newCom.buttonImage,
          buttonStyle: newCom.buttonStyle,
          role: currentRole.value,
        };
      },
      { deep: true }
    );

    watch(
      () => props.role,
      (newRole) => {
        config.value.role = newRole || props.com.role;
      }
    );

    const scrollToBottom = async () => {
      await nextTick();
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
      }
    };

    const showWelcomeMessage = async () => {
      if (!scriptLoaded.value) {
        await new Promise<void>((resolve) => {
          const timer = setInterval(() => {
            if (scriptLoaded.value) {
              clearInterval(timer);
              resolve();
            }
          }, 50);
          setTimeout(() => {
            clearInterval(timer);
            resolve();
          }, 10000);
        });
      }

      const role = currentRole.value;
      const welcomeMessage = scriptEngine.getWelcomeMessage(role);
      const errorSuffix = scriptLoadError.value ? `\n\n⚠️ ${scriptLoadError.value}` : '';
      if (welcomeMessage || errorSuffix) {
        messages.value = [{
          role: "assistant",
          content: (welcomeMessage || '') + errorSuffix,
          timestamp: Date.now(),
        }];
        setTimeout(scrollToBottom, 100);
      }
    };

    // 窗口 resize 时同步调整图表大小
    const handleWindowResize = () => {
      flintChartInstances.value.forEach((instance) => {
        instance.resize();
      });
    };

    onMounted(() => {
      dialogVisible.value = props.visible;
      window.addEventListener('resize', handleWindowResize);
      loadScriptFromMock();
      if (dialogVisible.value) {
        showWelcomeMessage();
      }
    });

    watch(
      () => props.visible,
      (newVisible) => {
        dialogVisible.value = newVisible;
        if (newVisible) {
          showWelcomeMessage();
        }
      }
    );

    watch(
      () => props.initialPosition,
      (newPos) => {
        if (newPos) {
          dialogPosition.value = { ...newPos };
        }
      }
    );

    watch(
      () => props.initialSize,
      (newSize) => {
        if (newSize) {
          dialogWidth.value = newSize.width;
          dialogHeight.value = newSize.height;
        }
      }
    );

    // 清理所有 Flint 图表实例
    const disposeAllCharts = () => {
      // 清理 ResizeObserver
      resizeObservers.forEach((observer) => {
        observer.disconnect();
      });
      resizeObservers.length = 0;

      flintChartInstances.value.forEach((instance) => {
        instance.dispose();
      });
      flintChartInstances.value.clear();
      flintChartRefs.value.clear();
    };

    onUnmounted(() => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
      window.removeEventListener('resize', handleWindowResize);
      disposeAllCharts();
    });

    const handleClose = () => {
      dialogVisible.value = false;
      emit("update:visible", false);
      emit("close");
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (props.fixed) return;
      if (isResizing.value) return;
      isDragging.value = true;
      dragOffset.value = {
        x: e.clientX - dialogPosition.value.x,
        y: e.clientY - dialogPosition.value.y,
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.value) return;
      dialogPosition.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y,
      };
    };

    const handleMouseUp = () => {
      isDragging.value = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const isResizing = ref(false);
    const resizeDirection = ref('');
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
    const dialogWidth = ref(props.initialSize?.width ?? 600);
    const dialogHeight = ref(props.initialSize?.height ?? 600);

    const startResize = (direction: string, e: MouseEvent) => {
      isResizing.value = true;
      resizeDirection.value = direction;
      resizeStart.value = {
        x: e.clientX,
        y: e.clientY,
        width: dialogWidth.value,
        height: dialogHeight.value,
        left: dialogPosition.value.x,
        top: dialogPosition.value.y,
      };
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResize);
    };

    const handleResize = (e: MouseEvent) => {
      if (!isResizing.value) return;

      const dx = e.clientX - resizeStart.value.x;
      const dy = e.clientY - resizeStart.value.y;
      const minWidth = 400;
      const minHeight = 600;

      switch (resizeDirection.value) {
        case 'n': {
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy);
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight);
          dialogHeight.value = newHeight;
          dialogPosition.value.y = newTop;
          break;
        }
        case 's': {
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy);
          break;
        }
        case 'e': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          break;
        }
        case 'w': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx);
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth);
          dialogWidth.value = newWidth;
          dialogPosition.value.x = newLeft;
          break;
        }
        case 'ne': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy);
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight);
          dialogHeight.value = newHeight;
          dialogPosition.value.y = newTop;
          break;
        }
        case 'nw': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx);
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth);
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy);
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight);
          dialogWidth.value = newWidth;
          dialogPosition.value.x = newLeft;
          dialogHeight.value = newHeight;
          dialogPosition.value.y = newTop;
          break;
        }
        case 'se': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy);
          break;
        }
        case 'sw': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx);
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth);
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy);
          dialogWidth.value = newWidth;
          dialogPosition.value.x = newLeft;
          break;
        }
      }
    };

    const stopResize = () => {
      isResizing.value = false;
      resizeDirection.value = '';
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    };

    const sendMessage = async () => {
      if (!userQuery.value.trim() && uploadedFiles.value.length === 0) {
        return;
      }

      const userMessage = {
        role: "user" as const,
        content: userQuery.value.trim(),
        timestamp: Date.now(),
        files: uploadedFiles.value.length > 0 ? [...uploadedFiles.value] : undefined,
      };

      messages.value.push(userMessage);
      userQuery.value = "";
      uploadedFiles.value = [];

      isLoading.value = true;

      setTimeout(async () => {
        const thinkingMessage = {
          role: "assistant" as const,
          content: "",
          timestamp: Date.now(),
          isThinking: true,
          thinkingContent: "AI 正在思考中，请稍候...",
        };
        messages.value.push(thinkingMessage);
        await scrollToBottom();
      }, 500);

      setTimeout(async () => {
        const response = scriptEngine.getResponse(userMessage.content);
        const flintSpecs = parseFlintSpecs(response);
        const htmlInteractions = parseHtmlInteractions(response);
        // 关键：先清除 Flint/HTML 块，获取纯文本内容
        const textContent = stripHtmlBlocks(stripFlintBlocks(response)).trim();

        const thinkingIndex = messages.value.findIndex((msg) => msg.isThinking);
        if (thinkingIndex !== -1) {
          messages.value[thinkingIndex] = {
            role: "assistant" as const,
            content: "",
            timestamp: Date.now(),
            isThinking: false,
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          };
          await scrollToBottom();

          const typingSpeed = 50;
          let index = 0;
          const interval = setInterval(() => {
            // 使用纯文本内容（不含 Flint/HTML JSON）进行打字
            if (index < textContent.length) {
              messages.value[thinkingIndex].content = textContent.slice(0, index + 1);
              index++;
              scrollToBottom();
            } else {
              clearInterval(interval);
              isLoading.value = false;
              // 打字完成后渲染 Flint 图表
              if (flintSpecs.length > 0) {
                renderFlintCharts(thinkingIndex);
              }
            }
          }, typingSpeed);
        } else {
          const assistantMessage: ChartMessage = {
            role: "assistant" as const,
            // 使用纯文本内容（不含 Flint/HTML JSON）
            content: textContent,
            timestamp: Date.now(),
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          };
          messages.value.push(assistantMessage);
          isLoading.value = false;
          await scrollToBottom();
          // 立即渲染 Flint 图表
          if (flintSpecs.length > 0) {
            renderFlintCharts(messages.value.length - 1);
          }
        }
      }, 5000 + Math.random() * 1000);
    };

    const handleEnter = () => {
      sendMessage();
    };

    // 从消息内容中解析 Flint spec
    const parseFlintSpecs = (content: string): FlintSpec[] => {
      const specs: FlintSpec[] = [];
      const regex = /```flint\s*\n([\s\S]*?)\n```/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        try {
          const rawInput = JSON.parse(match[1]) as ChartAssemblyInput;
          const echartsOption = assembleECharts(rawInput);
          specs.push({ rawInput, echartsOption });
        } catch (e) {
          console.warn('Failed to parse Flint spec:', e);
        }
      }
      return specs;
    };

    // 从消息内容中解析 HTML 交互内容
    const parseHtmlInteractions = (content: string): HtmlInteraction[] => {
      const interactions: HtmlInteraction[] = [];
      const regex = /```html\s*\n([\s\S]*?)\n```/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        try {
          const interaction = JSON.parse(match[1]) as HtmlInteraction;
          interactions.push(interaction);
        } catch (e) {
          console.warn('Failed to parse HTML interaction:', e);
        }
      }
      return interactions;
    };

    // 清理消息内容中的 Flint 代码块
    const stripFlintBlocks = (content: string): string => {
      return content.replace(/```flint\s*\n[\s\S]*?\n```/g, '');
    };

    // 清理消息内容中的 HTML 代码块
    const stripHtmlBlocks = (content: string): string => {
      return content.replace(/```html\s*\n[\s\S]*?\n```/g, '');
    };

    // 设置图表 DOM 引用
    const setFlintChartRef = (el: any, messageIndex: number, chartIdx: number) => {
      if (el) {
        const key = `${messageIndex}-${chartIdx}`;
        flintChartRefs.value.set(key, el as HTMLElement);
      }
    };

    // 渲染 Flint 图表
    const renderFlintCharts = async (messageIndex: number) => {
      await nextTick();
      const msg = messages.value[messageIndex];
      if (!msg || !msg.flintSpecs || msg.flintSpecs.length === 0) return;

      msg.flintSpecs.forEach((spec, chartIdx) => {
        const key = `${messageIndex}-${chartIdx}`;
        const domEl = flintChartRefs.value.get(key);
        if (!domEl) return;

        // 确保容器有正确的宽度
        const rect = domEl.getBoundingClientRect();
        if (rect.width === 0) {
          // 宽度为0，等待下一帧再试
          requestAnimationFrame(() => renderFlintCharts(messageIndex));
          return;
        }

        const existingInstance = flintChartInstances.value.get(key);
        if (existingInstance) {
          existingInstance.dispose();
        }

        const chartInstance = echarts.init(domEl);
        chartInstance.setOption(spec.echartsOption);
        flintChartInstances.value.set(key, chartInstance);

        // 使用 ResizeObserver 监听容器尺寸变化
        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => {
            chartInstance.resize();
          });
          observer.observe(domEl);
          resizeObservers.push(observer);
        }
      });
    };

    // 存储 ResizeObserver 以便清理
    const resizeObservers: ResizeObserver[] = [];

    // 格式化内容（清理 Flint/HTML 块 + 标准格式化）
    const formatContent = (content: string): string => {
      const cleaned = stripHtmlBlocks(stripFlintBlocks(content));
      return cleaned
        .replace(/\n/g, "<br />")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.*?)`/g, "<code>$1</code>");
    };

    const formatTime = (timestamp: number): string => {
      const date = new Date(timestamp);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    };

    const copyMessageContent = (message: { content: string }) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(message.content).then(() => {
        }).catch(() => {
          fallbackCopy(message.content);
        });
      } else {
        fallbackCopy(message.content);
      }
    };

    const fallbackCopy = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
      }
      document.body.removeChild(textArea);
    };

    const clearMessages = () => {
      disposeAllCharts();
      messages.value = [];
      showWelcomeMessage();
    };

    // 切换技能选中状态
    const toggleSkill = (messageIndex: number, skillName: string) => {
      const msg = messages.value[messageIndex];
      if (!msg || !msg.selectedSkills || msg.interactionResolved) return;
      const idx = msg.selectedSkills.indexOf(skillName);
      if (idx === -1) {
        msg.selectedSkills.push(skillName);
      } else {
        msg.selectedSkills.splice(idx, 1);
      }
    };

    // 确认技能选择
    const confirmSkillSelection = (messageIndex: number) => {
      const msg = messages.value[messageIndex];
      if (!msg || msg.interactionResolved) return;
      const selected = msg.selectedSkills || [];
      msg.interactionResolved = true;
      // 将选择结果作为用户消息发送给脚本引擎
      const selectionText = selected.length > 0
        ? `已选择技能：${selected.join('、')}`
        : '取消选择';
      sendInteractionMessage(selectionText);
    };

    // 取消技能选择
    const cancelSkillSelection = (messageIndex: number) => {
      const msg = messages.value[messageIndex];
      if (!msg || msg.interactionResolved) return;
      msg.interactionResolved = true;
      msg.selectedSkills = [];
      sendInteractionMessage('取消选择');
    };

    // 确认技能列表
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的确认按钮
    // （如"确认联动"、"确认屏蔽"、"确认"等）都能匹配对应状态的关键词
    const confirmSkillList = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex];
      if (!msg || msg.interactionResolved) return;
      msg.interactionResolved = true;
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；为空则不展示提示文本
      msg.interactionText = btn?.resolvedText || undefined;
      sendInteractionMessage(btn?.text || '确认');
    };

    // 取消技能列表
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的取消按钮
    // （如"取消"、"生成清洁工单"等）都能匹配对应状态的关键词
    const cancelSkillList = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex];
      if (!msg || msg.interactionResolved) return;
      msg.interactionResolved = true;
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；为空则不展示提示文本
      msg.interactionText = btn?.resolvedText || undefined;
      sendInteractionMessage(btn?.text || '取消');
    };

    // 发送交互结果消息（不显示用户消息，直接触发脚本引擎返回结果）
    const sendInteractionMessage = (text: string) => {
      isLoading.value = true;
      setTimeout(async () => {
        const thinkingMessage = {
          role: "assistant" as const,
          content: "",
          timestamp: Date.now(),
          isThinking: true,
          thinkingContent: "AI 正在思考中，请稍候...",
        };
        messages.value.push(thinkingMessage);
        await scrollToBottom();
      }, 300);

      setTimeout(async () => {
        const response = scriptEngine.getResponse(text);
        const flintSpecs = parseFlintSpecs(response);
        const htmlInteractions = parseHtmlInteractions(response);
        const textContent = stripHtmlBlocks(stripFlintBlocks(response)).trim();

        const thinkingIndex = messages.value.findIndex((msg) => msg.isThinking);
        if (thinkingIndex !== -1) {
          messages.value[thinkingIndex] = {
            role: "assistant" as const,
            content: "",
            timestamp: Date.now(),
            isThinking: false,
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          };
          await scrollToBottom();

          const typingSpeed = 50;
          let index = 0;
          const interval = setInterval(() => {
            if (index < textContent.length) {
              messages.value[thinkingIndex].content = textContent.slice(0, index + 1);
              index++;
              scrollToBottom();
            } else {
              clearInterval(interval);
              isLoading.value = false;
              if (flintSpecs.length > 0) {
                renderFlintCharts(thinkingIndex);
              }
            }
          }, typingSpeed);
        }
      }, 2500 + Math.random() * 500);
    };

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files) return;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        uploadedFiles.value.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
        });
      }

      target.value = "";
    };

    const removeFile = (id: string) => {
      uploadedFiles.value = uploadedFiles.value.filter((file) => file.id !== id);
    };

    const openFileDialog = () => {
      fileInputRef.value?.click();
    };

    const formatFileSize = (size: number): string => {
      if (size < 1024) {
        return `${size} B`;
      } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
      } else {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      }
    };

    // 获取按钮配置，如果未配置则使用默认值
    const getButtons = (interaction: HtmlInteraction) => {
      if (interaction.buttons && interaction.buttons.length > 0) {
        return interaction.buttons;
      }
      // 默认按钮配置
      return [
        { type: 'confirm' as const, text: '确定' },
        { type: 'cancel' as const, text: '取消' }
      ];
    };

    // 获取按钮的内联样式（用于每个按钮单独配置颜色）
    const getButtonInlineStyle = (btn: ButtonConfig) => {
      if (!btn.color) {
        return {};
      }
      const style: Record<string, string> = {};
      if (btn.color.backgroundColor) {
        style.background = btn.color.backgroundColor;
      }
      if (btn.color.textColor) {
        style.color = btn.color.textColor;
      }
      if (btn.type === 'cancel' && btn.color.borderColor) {
        style.border = `1px solid ${btn.color.borderColor}`;
      }
      return style;
    };

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
      dialogPosition,
      handleMouseDown,
      uploadedFiles,
      fileInputRef,
      handleFileSelect,
      removeFile,
      openFileDialog,
      formatFileSize,
      dialogWidth,
      dialogHeight,
      startResize,
      currentRole,
      setFlintChartRef,
      toggleSkill,
      confirmSkillSelection,
      cancelSkillSelection,
      confirmSkillList,
      cancelSkillList,
      getButtons,
      getButtonInlineStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 9999;
}

.custom-dialog-mask.no-mask {
  background-color: transparent;
  pointer-events: none;
}

.custom-dialog-mask.no-mask .custom-dialog-wrapper {
  pointer-events: auto;
}

.custom-dialog-wrapper {
  position: absolute;
  background-color: transparent;
  z-index: 10000;
}

.custom-dialog {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.15), 0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.custom-dialog-fixed .custom-dialog-header {
  cursor: default;
}

.custom-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #3478F3 0%, #0D2A42 100%);
  color: white;
  cursor: move;
  user-select: none;
}

.custom-dialog-title {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-dialog-title::before {
  content: "🤖";
  font-size: 18px;
}

.custom-dialog-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.custom-dialog-close:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.dify-api-container {
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
  background-color: #f8fafc;
}

.message-section-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.message-section {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.message-section::-webkit-scrollbar {
  width: 6px;
}

.message-section::-webkit-scrollbar-track {
  background: transparent;
}

.message-section::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.message-section::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
}

.empty-icon {
  font-size: 56px;
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
}

.message-item.user-message {
  align-items: flex-end;
}

.message-item.assistant-message {
  align-items: flex-start;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.avatar.user {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.avatar.assistant {
  background: linear-gradient(135deg, #3478F3 0%, #0D2A42 100%);
}

.message-role {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.message-content {
  width: auto;
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 16px;
  word-break: break-word;
  transition: all 0.2s ease;
}

.assistant-message .message-content {
  width: 75%;
  min-width: 320px;
}

.user-message .message-content {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.assistant-message .message-content {
  background-color: white;
  color: #1e293b;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.thinking-dots {
  display: flex;
  gap: 6px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #3478F3 0%, #0D2A42 100%);
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
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.thinking-text {
  font-size: 13px;
  color: #94a3b8;
}

.content-text {
  font-size: 15px;
  line-height: 1.7;
}

.content-text code {
  background-color: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

.message-files {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.message-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.file-icon {
  font-size: 16px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #94a3b8;
}

.message-actions {
  margin-top: 6px;
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #94a3b8;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 6px;
}

.message-item:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.message-time {
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 6px;
}

.input-section {
  padding: 22px 16px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid #e2e8f0;
}

.remove-file-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: 16px;
  line-height: 1;
  padding: 4px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.remove-file-btn:hover {
  background: rgba(239, 68, 68, 0.2);
}

.hidden-file-input {
  display: none;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

.actions-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  font-size: 13px;
  color: #94a3b8;
}

.send-button {
  min-width: 44px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.stop-button {
  min-width: 44px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  color: white;
  font-weight: 500;
}

.upload-button {
  min-width: 44px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #64748b;
  transition: all 0.2s;
}

.upload-button:hover {
  background-color: #e2e8f0;
}

:deep(.el-button--warning) {
  color: #ffffff !important;
  background-color: #f5f7fa !important;
  border-color: #f5f7fa !important;
}

:deep(.el-input__inner) {
  border-radius: 12px !important;
  border: 1px solid #e2e8f0 !important;
  background-color: #f8fafc !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  transition: all 0.2s !important;
}

:deep(.el-input__inner:hover) {
  border-color: #cbd5e1 !important;
  background-color: #ffffff !important;
}

:deep(.el-input__inner:focus) {
  border-color: #3b82f6 !important;
  background-color: #ffffff !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

.message-section-actions {
  position: absolute;
  right: 16px;
  bottom: 16px;
  z-index: 10;
}

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
  z-index: 100;
}

.resize-handle {
  position: absolute;
  pointer-events: auto;
  background-color: transparent;
  transition: background-color 0.2s;
}

.resize-handle:hover {
  background-color: rgba(102, 126, 234, 0.3);
}

.resize-n {
  top: 0;
  left: 10%;
  right: 10%;
  height: 12px;
  cursor: n-resize;
}

.resize-s {
  bottom: 0;
  left: 10%;
  right: 10%;
  height: 12px;
  cursor: s-resize;
}

.resize-e {
  right: 0;
  top: 10%;
  bottom: 10%;
  width: 12px;
  cursor: e-resize;
}

.resize-w {
  left: 0;
  top: 10%;
  bottom: 10%;
  width: 12px;
  cursor: w-resize;
}

.resize-ne {
  top: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: ne-resize;
}

.resize-nw {
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: nw-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  cursor: se-resize;
}

.resize-sw {
  bottom: 0;
  left: 0;
  width: 20px;
  height: 20px;
  cursor: sw-resize;
}

/* Flint 图表样式 */
.flint-charts-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.flint-chart-item {
  width: 100%;
  height: 280px;
  min-height: 220px;
  box-sizing: border-box;
  flex-shrink: 0;
  background-color: #f8fafc;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s ease;
}

.flint-chart-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.assistant-message .flint-chart-item {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* HTML 交互面板样式 */
.html-interactions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.html-interaction-panel {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.html-interaction-panel.resolved {
  opacity: 0.75;
}

.skill-select-panel {
  padding: 16px;
}

.skill-select-message {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.skill-select-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.skill-select-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skill-select-item:hover {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.skill-select-item.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.skill-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 12px;
  color: white;
  transition: all 0.2s;
}

.skill-select-item.selected .skill-checkbox {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
}

.skill-select-info {
  flex: 1;
  min-width: 0;
}

.skill-select-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.skill-select-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.skill-select-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.skill-btn {
  padding: 7px 20px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.skill-confirm-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.skill-confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.skill-cancel-btn {
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.skill-cancel-btn:hover:not(:disabled) {
  background-color: #e2e8f0;
}

.skill-selected-summary {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  font-size: 12px;
  color: #15803d;
}

/* 技能列表面板样式（只读列表） */
.skill-list-panel {
  padding: 16px;
}

.skill-list-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 8px;
}

.skill-list-item:last-child {
  margin-bottom: 0;
}

.skill-list-info {
  flex: 1;
  min-width: 0;
}
</style>
