<template>
  <!-- 大屏预览页会把遮罩容器通过 provide 下发（挂在组件盒子之外，不受画布/组件 transform 影响）；
       其他场景仍挂到 body -->
  <Teleport :to="teleportTarget">
    <div
      v-if="dialogVisible"
      class="custom-dialog-mask"
      :class="{ 'no-mask': noMask, 'in-screen-layer': !!screenMaskLayer }"
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
        <div
          class="custom-dialog"
          :class="{ 'custom-dialog-fixed': fixed }"
          :style="chatFontStyle"
          @mousedown="handleMouseDown"
        >
          <div class="dify-api-container">
            <div class="chat-main">
              <div class="chat-main-header">
                <div class="chat-main-title-wrap">
                  <span class="chat-main-title">{{ title }}</span>
                </div>
                <div class="chat-main-actions">
                  <button
                    v-if="mdEditor"
                    class="pill-btn"
                    :class="{ active: mdEditorVisible }"
                    :title="mdEditorVisible ? '收起 Markdown 编辑器' : '打开 Markdown 编辑器'"
                    @click="mdEditorVisible = !mdEditorVisible"
                  >
                    {{ mdEditorVisible ? '收起文档' : '说明文档' }}
                  </button>
                  <button
                    v-if="!noMask"
                    class="round-icon-btn"
                    title="关闭"
                    @click="handleClose"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div class="message-section-wrapper">
                <div
                  ref="messageContainer"
                  class="message-section"
                  :class="{ 'is-empty': messages.length === 0 }"
                >
                  <div v-if="messages.length === 0" class="welcome-screen">
                    <div class="welcome-inner">
                      <div class="welcome-logo">
                        <span class="welcome-logo-inner">🤖</span>
                      </div>
                      <div class="welcome-slogan">智能演示助手</div>
                      <div class="welcome-title">今天，有什么可以帮你？</div>
                      <div class="welcome-subtitle">暂无消息，开始您的对话吧！</div>
                    </div>
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
                                    :disabled="message.interactionResolved"
                                    @click="btn.type === 'confirm' ? confirmSkillSelection(index, btn) : cancelSkillSelection(index, btn)"
                                  >
                                    {{ btn.text }}
                                  </button>
                                </div>
                                <div v-if="message.interactionResolved && message.interactionText" class="skill-selected-summary">
                                  {{ message.interactionText }}
                                </div>
                                <div v-if="message.interactionResolved && !message.interactionText && message.selectedSkills && message.selectedSkills.length > 0" class="skill-selected-summary">
                                  已选择：{{ message.selectedSkills.join('、') }}
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
                                    :disabled="message.interactionResolved"
                                    @click="btn.type === 'confirm' ? confirmSkillList(index, btn) : cancelSkillList(index, btn)"
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
                      <div v-if="!message.isThinking" class="message-footer">
                        <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                        <button
                          class="copy-btn"
                          title="复制内容"
                          @click="copyMessageContent(message)"
                        >
                          <ChatCopy />
                        </button>
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
            </div>

            <div class="input-section">
              <div class="input-wrapper">
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
                <div class="composer">
                  <el-input
                    v-model="userQuery"
                    type="textarea"
                    :rows="3"
                    placeholder="输入你的问题，让我们一起解决..."
                    resize="none"
                    :disabled="isLoading"
                    @keydown.enter.prevent="handleEnter"
                  />
                  <div class="composer-footer">
                    <button
                      class="attach-btn"
                      :disabled="isLoading"
                      title="上传文件"
                      @click="openFileDialog"
                    >
                      <ChatUpload class="attach-icon" />
                      <span class="attach-text">添加附件</span>
                    </button>
                    <div class="composer-footer-right">
                      <span v-if="isLoading" class="hint">AI 正在思考中，请稍候...</span>
                      <button
                        v-if="isLoading"
                        class="round-btn stop-btn"
                        title="停止"
                        @click="stopGeneration"
                      >
                        <ChatStop class="round-icon" />
                      </button>
                      <button
                        v-else
                        class="round-btn send-btn"
                        :disabled="!userQuery.trim() && uploadedFiles.length === 0"
                        title="发送"
                        @click="sendMessage"
                      >
                        <ChatSend class="round-icon" />
                      </button>
                    </div>
                  </div>
                </div>
                <div class="composer-hint">
                  <span class="composer-hint-text">生成内容仅供参考，请核实重要信息</span>
                </div>
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  class="hidden-file-input"
                  @change="handleFileSelect"
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Markdown 编辑器：停靠在本对话窗右侧并向右铺满视口，锚点随拖拽/缩放同步变化 -->
      <MdEditorDialog
        v-if="mdEditor"
        v-model:visible="mdEditorVisible"
        :dock-left="dialogPosition.x + dialogWidth"
        :dock-top="dialogPosition.y"
        :dock-height="dialogHeight"
        title="Agent 说明文档"
        file-name="agent.md"
        :storage-key="mdEditorStorageKey"
      />
    </div>
  </Teleport>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  computed,
  inject,
  onMounted,
  onUnmounted,
  nextTick,
} from 'vue'
import type { Ref } from 'vue'
import { ElInput } from 'element-plus'
import { DemoScriptEngine } from './demo-script'
import type { DemoScript } from './demo-script'
import ChatCopy from '@/icons/chat-copy.vue'
import ChatUpload from '@/icons/chat-upload.vue'
import ChatStop from '@/icons/chat-stop.vue'
import ChatSend from '@/icons/chat-send.vue'
import MdEditorDialog from './MdEditorDialog.vue'
import { getFontScale } from './font-scale'
import { assembleECharts } from 'flint-chart'
import type { ChartAssemblyInput } from 'flint-chart'
import * as echarts from 'echarts'

const SCRIPT_MOCK_URL = import.meta.env.VITE_APP_SCRIPT_MOCK_URL || '/mockdata.json'
// Flint 图表相关接口
interface FlintSpec {
  rawInput: ChartAssemblyInput
  echartsOption: any
}

// 按钮颜色配置接口
interface ButtonColorConfig {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  hoverBackgroundColor?: string
}

// 按钮配置接口
interface ButtonConfig {
  type: 'confirm' | 'cancel'
  text: string
  // 点击该按钮后，在面板下方显示的提示文本；为空/不配置则不显示
  resolvedText?: string
  color?: ButtonColorConfig
}

// HTML 交互内容接口
interface HtmlInteraction {
  type: string
  message: string
  skills?: Array<{
    name: string
    desc: string
  }>
  buttons?: ButtonConfig[]
}

interface ChartMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  isThinking?: boolean
  thinkingContent?: string
  files?: Array<{
    id: string
    name: string
    size: number
  }>
  flintSpecs?: FlintSpec[]
  htmlInteractions?: HtmlInteraction[]
  selectedSkills?: string[]
  interactionResolved?: boolean
  interactionText?: string
}

export default defineComponent({
  name: 'DifyApiDemoDialog',
  components: {
    ElInput,
    ChatCopy,
    ChatUpload,
    ChatStop,
    ChatSend,
    MdEditorDialog,
  },
  props: {
    title: {
      type: String,
      default: 'AI 智能助手',
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
      type: Object as () => { x: number; y: number; },
      default: null,
    },
    initialSize: {
      type: Object as () => { width: number; height: number; },
      default: null,
    },
    role: {
      type: String,
      default: '',
    },
    // 是否在头部显示 Markdown 编辑器入口（停靠在本对话窗右侧）
    mdEditor: {
      type: Boolean,
      default: false,
    },
    mdEditorStorageKey: {
      type: String,
      default: '',
    },
    // 字体整体缩放倍率；<=0 表示未设置，回退读取 localStorage 中的持久化配置
    fontScale: {
      type: Number,
      default: 0,
    },
    com: {
      type: Object as () => {
        buttonImage: string
        buttonStyle: {
          backgroundColor: string
          hoverBackgroundColor: string
        }
        role: string
      },
      default: () => ({
        buttonImage: '',
        buttonStyle: {
          backgroundColor: '#409eff',
          hoverBackgroundColor: '#66b1ff',
        },
        role: '',
      }),
    },
  },
  emits: ['close', 'update:visible', 'message-received', 'message-sent', 'md-editor-visible-change'],
  setup(props, { emit }) {
    // 宿主（大屏预览页）提供的遮罩容器；拿不到则挂到 body
    const screenMaskLayer = inject<Ref<HTMLElement | null> | null>('screen-mask-layer', null)
    const teleportTarget = computed<HTMLElement | string>(
      () => screenMaskLayer?.value || 'body',
    )

    const dialogVisible = ref(false)
    const userQuery = ref('')
    const messages = ref<ChartMessage[]>([])
    const flintChartRefs = ref<Map<string, HTMLElement>>(new Map())
    const flintChartInstances = ref<Map<string, echarts.ECharts>>(new Map())
    const isLoading = ref(false)
    // 生成流程句柄：思考提示定时器 / 响应定时器 / 打字机定时器，停止或卸载时用于中止
    let thinkingTimer: ReturnType<typeof setTimeout> | null = null
    let responseTimer: ReturnType<typeof setTimeout> | null = null
    let typingTimer: ReturnType<typeof setInterval> | null = null
    // 当前正在打字输出的消息索引（sendMessage 与 sendInteractionMessage 共用）
    let typingMessageIndex = -1
    const messageContainer = ref<HTMLElement | null>(null)
    const mdEditorVisible = ref(false)

    // 编辑器开关状态变化时通知宿主，供宿主调整页面布局（如面板分屏比例）
    watch(mdEditorVisible, val => {
      emit('md-editor-visible-change', val)
    })

    /**
     * 大屏预览页会下发 --screen-fill-w（遮罩铺满所需的画布尺寸）：
     * 遮罩容器挂在画布内，坐标系是「未缩放的画布坐标」，canvasW/canvasH 即该坐标下的可见区域；
     * 非预览页（未下发变量）回退到窗口尺寸。
     */
    const getFillMetrics = () => {
      const rootStyle = getComputedStyle(document.documentElement)
      const fillW = parseFloat(rootStyle.getPropertyValue('--screen-fill-w')) || 0
      const fillH = parseFloat(rootStyle.getPropertyValue('--screen-fill-h')) || 0
      const onScreen = !!screenMaskLayer?.value
      const canvasW = onScreen ? fillW : window.innerWidth
      const canvasH = onScreen ? fillH : window.innerHeight
      return { fillW, fillH, onScreen, canvasW, canvasH }
    }

    // 弹窗位置：优先用宿主给的；否则在可见区域居中偏右（x 中心 + 50px）
    const getDefaultPosition = () => {
      if (props.initialPosition) return props.initialPosition
      const { canvasW } = getFillMetrics()
      return { x: canvasW / 2 + 50, y: 100 }
    }

    const dialogPosition = ref(getDefaultPosition())
    const dragOffset = ref({ x: 0, y: 0 })
    const isDragging = ref(false)

    // 弹窗尺寸：未指定时固定 600×600，并按可见区域收窄，保证缩放前后都不溢出屏幕
    const getDefaultSize = () => {
      const { onScreen, canvasW, canvasH } = getFillMetrics()
      if (!onScreen || !canvasW || !canvasH) {
        return { width: 600, height: 600 }
      }
      return {
        width: Math.min(600, canvasW * 0.8),
        height: Math.min(600, canvasH * 0.8),
      }
    }

    // 字体整体缩放：优先使用外部传入的 fontScale（实时联动），否则读取 localStorage
    const chatFontScale = computed(() => (props.fontScale > 0 ? props.fontScale : getFontScale()))
    // 通过 CSS 变量下发缩放倍率；as any 规避 CSSProperties 不识别自定义属性名的类型限制
    const chatFontStyle = computed(() => ({ '--chat-font-scale': chatFontScale.value } as any))

    const uploadedFiles = ref<
      Array<{
        id: string
        name: string
        size: number
      }>
    >([])
    const fileInputRef = ref<HTMLInputElement | null>(null)

    const scriptEngine = new DemoScriptEngine()
    const scriptLoaded = ref(false)
    const scriptLoadError = ref<string | null>(null)

    const loadScriptFromMock = async (): Promise<void> => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)
        // 加 timestamp 防止浏览器/CDN 缓存旧 mockdata.json
        const url = `${SCRIPT_MOCK_URL}?t=${Date.now()}`
        console.log('[Mock脚本] 请求URL:', url)
        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-cache',
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        console.log('mockdata.json 返回：', data)

        if (data && data.states && data.initialState) {
          scriptEngine.setScript(data as DemoScript)
          scriptLoaded.value = true
          scriptLoadError.value = null
        } else {
          scriptLoaded.value = true
          scriptLoadError.value = '返回数据格式无效（缺少 states 或 initialState），使用内置脚本'
        }
      } catch (e: any) {
        scriptLoaded.value = true
        if (e?.name === 'AbortError') {
          scriptLoadError.value = '加载 mock 脚本超时，使用内置脚本'
        } else if (e?.message?.includes('CORS') || e?.message?.includes('Failed to fetch')) {
          scriptLoadError.value = '跨域或网络错误（CORS/无法连接 127.0.0.1:5000），使用内置脚本'
        } else {
          scriptLoadError.value = `${e?.message || '加载 mock 脚本失败'  }，使用内置脚本`
        }
      }
    }

    const currentRole = computed(() => {
      return props.role || props.com.role
    })

    const config = ref({
      buttonImage: props.com.buttonImage,
      buttonStyle: props.com.buttonStyle,
      role: currentRole.value,
    })

    watch(
      () => props.com,
      newCom => {
        config.value = {
          buttonImage: newCom.buttonImage,
          buttonStyle: newCom.buttonStyle,
          role: currentRole.value,
        }
      },
      { deep: true },
    )

    watch(
      () => props.role,
      newRole => {
        config.value.role = newRole || props.com.role
      },
    )

    const scrollToBottom = async () => {
      await nextTick()
      if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight
      }
    }

    const showWelcomeMessage = async () => {
      if (!scriptLoaded.value) {
        await new Promise<void>(resolve => {
          const timer = setInterval(() => {
            if (scriptLoaded.value) {
              clearInterval(timer)
              resolve()
            }
          }, 50)
          setTimeout(() => {
            clearInterval(timer)
            resolve()
          }, 10000)
        })
      }

      const role = currentRole.value
      const welcomeMessage = scriptEngine.getWelcomeMessage(role)
      const errorSuffix = scriptLoadError.value ? `\n\n⚠️ ${scriptLoadError.value}` : ''
      if (welcomeMessage || errorSuffix) {
        messages.value = [{
          role: 'assistant',
          content: (welcomeMessage || '') + errorSuffix,
          timestamp: Date.now(),
        }]
        setTimeout(scrollToBottom, 100)
      }
    }

    // 窗口 resize 时同步调整图表大小
    const handleWindowResize = () => {
      flintChartInstances.value.forEach(instance => {
        instance.resize()
      })
    }

    onMounted(() => {
      dialogVisible.value = props.visible
      window.addEventListener('resize', handleWindowResize)
      loadScriptFromMock()
      if (dialogVisible.value) {
        showWelcomeMessage()
      }
    })

    watch(
      () => props.visible,
      newVisible => {
        dialogVisible.value = newVisible
        if (newVisible) {
          showWelcomeMessage()
        }
      },
    )

    watch(
      () => props.initialPosition,
      newPos => {
        if (newPos) {
          dialogPosition.value = { ...newPos }
        }
      },
    )

    watch(
      () => props.initialSize,
      newSize => {
        if (newSize) {
          dialogWidth.value = newSize.width
          dialogHeight.value = newSize.height
        }
      },
    )

    // 清理所有 Flint 图表实例
    const disposeAllCharts = () => {
      // 清理 ResizeObserver
      resizeObservers.forEach(observer => {
        observer.disconnect()
      })
      resizeObservers.length = 0

      flintChartInstances.value.forEach(instance => {
        instance.dispose()
      })
      flintChartInstances.value.clear()
      flintChartRefs.value.clear()
    }

    onUnmounted(() => {
      // 卸载时中止生成流程，防止定时器在组件销毁后继续操作响应式数据
      stopGeneration()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
      window.removeEventListener('resize', handleWindowResize)
      disposeAllCharts()
    })

    const handleClose = () => {
      // 关闭窗口时停止生成，避免后台定时器继续输出
      stopGeneration()
      dialogVisible.value = false
      emit('update:visible', false)
      emit('close')
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (props.fixed) return
      if (isResizing.value) return
      isDragging.value = true
      dragOffset.value = {
        x: e.clientX - dialogPosition.value.x,
        y: e.clientY - dialogPosition.value.y,
      }
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.value) return
      dialogPosition.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y,
      }
    }

    const handleMouseUp = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    const isResizing = ref(false)
    const resizeDirection = ref('')
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 })
    const defaultSize = getDefaultSize()
    const dialogWidth = ref(props.initialSize?.width ?? defaultSize.width)
    const dialogHeight = ref(props.initialSize?.height ?? defaultSize.height)

    // 大屏预览页窗口缩放会重建画布缩放比例，重新按下发变量校正默认位置/尺寸，
    // 避免弹窗跑偏或超出可见区域（拖动/手动调整过尺寸的情况不覆盖）
    const syncToViewport = () => {
      if (!getFillMetrics().onScreen) return
      if (!props.initialPosition) {
        dialogPosition.value = getDefaultPosition()
      }
      if (!props.initialSize) {
        const size = getDefaultSize()
        dialogWidth.value = size.width
        dialogHeight.value = size.height
      }
    }
    watch(dialogVisible, visible => {
      if (visible) syncToViewport()
    })
    onMounted(() => {
      window.addEventListener('resize', syncToViewport)
    })
    onUnmounted(() => {
      window.removeEventListener('resize', syncToViewport)
    })

    // 宿主重新测量（如窗口缩放）时同步对话窗位置/尺寸，避免只在初始化时读一次
    watch(
      () => props.initialPosition,
      pos => {
        if (pos) {
          dialogPosition.value = { x: pos.x, y: pos.y }
        }
      },
    )

    watch(
      () => props.initialSize,
      size => {
        if (size) {
          dialogWidth.value = size.width
          dialogHeight.value = size.height
        }
      },
    )

    const startResize = (direction: string, e: MouseEvent) => {
      isResizing.value = true
      resizeDirection.value = direction
      resizeStart.value = {
        x: e.clientX,
        y: e.clientY,
        width: dialogWidth.value,
        height: dialogHeight.value,
        left: dialogPosition.value.x,
        top: dialogPosition.value.y,
      }
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', stopResize)
    }

    const handleResize = (e: MouseEvent) => {
      if (!isResizing.value) return

      const dx = e.clientX - resizeStart.value.x
      const dy = e.clientY - resizeStart.value.y
      const minWidth = 400
      const minHeight = 600

      switch (resizeDirection.value) {
        case 'n': {
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy)
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight)
          dialogHeight.value = newHeight
          dialogPosition.value.y = newTop
          break
        }
        case 's': {
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy)
          break
        }
        case 'e': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx)
          break
        }
        case 'w': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx)
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth)
          dialogWidth.value = newWidth
          dialogPosition.value.x = newLeft
          break
        }
        case 'ne': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx)
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy)
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight)
          dialogHeight.value = newHeight
          dialogPosition.value.y = newTop
          break
        }
        case 'nw': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx)
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth)
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy)
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight)
          dialogWidth.value = newWidth
          dialogPosition.value.x = newLeft
          dialogHeight.value = newHeight
          dialogPosition.value.y = newTop
          break
        }
        case 'se': {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx)
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy)
          break
        }
        case 'sw': {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx)
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth)
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy)
          dialogWidth.value = newWidth
          dialogPosition.value.x = newLeft
          break
        }
      }
    }

    const stopResize = () => {
      isResizing.value = false
      resizeDirection.value = ''
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    }

    // 停止生成：中止思考提示/响应定时器与打字机输出，保留已输出内容
    const stopGeneration = () => {
      if (thinkingTimer !== null) {
        clearTimeout(thinkingTimer)
        thinkingTimer = null
      }
      if (responseTimer !== null) {
        clearTimeout(responseTimer)
        responseTimer = null
      }
      if (typingTimer !== null) {
        clearInterval(typingTimer)
        typingTimer = null
      }

      const thinkingIndex = messages.value.findIndex(msg => msg.isThinking)
      if (thinkingIndex !== -1) {
        // 还在"思考中"，直接移除占位消息
        messages.value.splice(thinkingIndex, 1)
      } else if (typingMessageIndex !== -1 && messages.value[typingMessageIndex]) {
        // 正在打字输出：保留已输出内容，补停止标记并渲染已解析的图表
        const msg = messages.value[typingMessageIndex]
        if (!msg.content) {
          msg.content = '（已停止生成）'
        } else if (!msg.content.endsWith('（已停止生成）')) {
          msg.content += '\n\n（已停止生成）'
        }
        if (msg.flintSpecs && msg.flintSpecs.length > 0) {
          renderFlintCharts(typingMessageIndex)
        }
      }
      typingMessageIndex = -1
      isLoading.value = false
      scrollToBottom()
    }

    const sendMessage = async () => {
      if (!userQuery.value.trim() && uploadedFiles.value.length === 0) {
        return
      }

      const userMessage = {
        role: 'user' as const,
        content: userQuery.value.trim(),
        timestamp: Date.now(),
        files: uploadedFiles.value.length > 0 ? [...uploadedFiles.value] : undefined,
      }

      messages.value.push(userMessage)
      userQuery.value = ''
      uploadedFiles.value = []

      // 立即滚动到底部，确保刚发送的消息在可视区域内
      await scrollToBottom()
      // 附件图片等异步渲染完成后再次校准滚动位置
      setTimeout(scrollToBottom, 100)

      isLoading.value = true

      thinkingTimer = setTimeout(async () => {
        thinkingTimer = null
        const thinkingMessage = {
          role: 'assistant' as const,
          content: '',
          timestamp: Date.now(),
          isThinking: true,
          thinkingContent: 'AI 正在思考中，请稍候...',
        }
        messages.value.push(thinkingMessage)
        await scrollToBottom()
      }, 500)

      responseTimer = setTimeout(async () => {
        responseTimer = null
        const response = scriptEngine.getResponse(userMessage.content)
        const flintSpecs = parseFlintSpecs(response)
        const htmlInteractions = parseHtmlInteractions(response)
        // 关键：先清除 Flint/HTML 块，获取纯文本内容
        const textContent = stripHtmlBlocks(stripFlintBlocks(response)).trim()

        const thinkingIndex = messages.value.findIndex(msg => msg.isThinking)
        if (thinkingIndex !== -1) {
          messages.value[thinkingIndex] = {
            role: 'assistant' as const,
            content: '',
            timestamp: Date.now(),
            isThinking: false,
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          }
          await scrollToBottom()

          const typingSpeed = 50
          let index = 0
          typingMessageIndex = thinkingIndex
          const interval = setInterval(() => {
            // 使用纯文本内容（不含 Flint/HTML JSON）进行打字
            if (index < textContent.length) {
              messages.value[thinkingIndex].content = textContent.slice(0, index + 1)
              index++
              scrollToBottom()
            } else {
              clearInterval(interval)
              typingTimer = null
              typingMessageIndex = -1
              isLoading.value = false
              // 打字完成后渲染 Flint 图表
              if (flintSpecs.length > 0) {
                renderFlintCharts(thinkingIndex)
              }
            }
          }, typingSpeed)
          typingTimer = interval
        } else {
          const assistantMessage: ChartMessage = {
            role: 'assistant' as const,
            // 使用纯文本内容（不含 Flint/HTML JSON）
            content: textContent,
            timestamp: Date.now(),
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          }
          messages.value.push(assistantMessage)
          isLoading.value = false
          await scrollToBottom()
          // 立即渲染 Flint 图表
          if (flintSpecs.length > 0) {
            renderFlintCharts(messages.value.length - 1)
          }
        }
      }, 5000 + Math.random() * 1000)
    }

    const handleEnter = () => {
      sendMessage()
    }

    // 从消息内容中解析 Flint spec
    const parseFlintSpecs = (content: string): FlintSpec[] => {
      const specs: FlintSpec[] = []
      const regex = /```flint\s*\n([\s\S]*?)\n```/g
      let match
      while ((match = regex.exec(content)) !== null) {
        try {
          const rawInput = JSON.parse(match[1]) as ChartAssemblyInput
          const echartsOption = assembleECharts(rawInput)
          specs.push({ rawInput, echartsOption })
        } catch (e) {
          console.warn('Failed to parse Flint spec:', e)
        }
      }
      return specs
    }

    // 从消息内容中解析 HTML 交互内容
    const parseHtmlInteractions = (content: string): HtmlInteraction[] => {
      const interactions: HtmlInteraction[] = []
      const regex = /```html\s*\n([\s\S]*?)\n```/g
      let match
      while ((match = regex.exec(content)) !== null) {
        try {
          const interaction = JSON.parse(match[1]) as HtmlInteraction
          interactions.push(interaction)
        } catch (e) {
          console.warn('Failed to parse HTML interaction:', e)
        }
      }
      return interactions
    }

    // 清理消息内容中的 Flint 代码块
    const stripFlintBlocks = (content: string): string => {
      return content.replace(/```flint\s*\n[\s\S]*?\n```/g, '')
    }

    // 清理消息内容中的 HTML 代码块
    const stripHtmlBlocks = (content: string): string => {
      return content.replace(/```html\s*\n[\s\S]*?\n```/g, '')
    }

    // 设置图表 DOM 引用
    const setFlintChartRef = (el: any, messageIndex: number, chartIdx: number) => {
      if (el) {
        const key = `${messageIndex}-${chartIdx}`
        flintChartRefs.value.set(key, el as HTMLElement)
      }
    }

    // 渲染 Flint 图表
    const renderFlintCharts = async (messageIndex: number) => {
      await nextTick()
      const msg = messages.value[messageIndex]
      if (!msg || !msg.flintSpecs || msg.flintSpecs.length === 0) return

      msg.flintSpecs.forEach((spec, chartIdx) => {
        const key = `${messageIndex}-${chartIdx}`
        const domEl = flintChartRefs.value.get(key)
        if (!domEl) return

        // 确保容器有正确的宽度
        const rect = domEl.getBoundingClientRect()
        if (rect.width === 0) {
          // 宽度为0，等待下一帧再试
          requestAnimationFrame(() => renderFlintCharts(messageIndex))
          return
        }

        const existingInstance = flintChartInstances.value.get(key)
        if (existingInstance) {
          existingInstance.dispose()
        }

        // 根据容器实际尺寸重新生成 ECharts 配置，
        // 确保 flint-chart 计算的像素值（如饼图半径）与容器匹配
        const actualW = domEl.clientWidth || 400
        const actualH = domEl.clientHeight || 300
        let chartOption = spec.echartsOption
        const specW = chartOption._width || 0
        const specH = chartOption._height || 0
        if (Math.abs(actualW - specW) > 20 || Math.abs(actualH - specH) > 20) {
          try {
            const reassembled = assembleECharts({
              ...spec.rawInput,
              chart_spec: {
                ...spec.rawInput.chart_spec,
                canvasSize: { width: actualW, height: actualH },
              },
            })
            chartOption = reassembled
          } catch (e) {
            console.warn('Failed to re-assemble Flint chart:', e)
          }
        }

        // 读取 chartProperties 中的自定义配置（mockdata 可配）
        const rawChartProps = spec.rawInput?.chart_spec?.chartProperties || {}
        const customYAxisLabel = rawChartProps.yAxisLabel as string | undefined
        const customXAxisLabel = rawChartProps.xAxisLabel as string | undefined
        const customLegendTitle = rawChartProps.legendTitle as string | undefined

        // 修正 static series（数组形式 y 编码）产生的合成轴名
        // flint-chart 内部用 __flint_series_value 作为 unpivot 后的值列名，
        // 折线图模板直接将其作为 y 轴标签，此处替换为原始字段名或自定义标签
        const yAxisArr = Array.isArray(chartOption.yAxis) ? chartOption.yAxis : [chartOption.yAxis]
        const rawYEnc = spec.rawInput?.chart_spec?.encodings?.y
        if (Array.isArray(rawYEnc)) {
          const fieldNames = rawYEnc.map((e: any) => e?.field || '').filter(Boolean)
          const yLabel = customYAxisLabel || (fieldNames.length > 0 ? fieldNames.join(' / ') : '值')
          for (const ya of yAxisArr) {
            if (ya && typeof ya.name === 'string' && ya.name.includes('flint_series_value')) {
              ya.name = yLabel
              ya.nameGap = 55
            }
          }
        } else if (customYAxisLabel) {
          for (const ya of yAxisArr) {
            if (ya) ya.name = customYAxisLabel
          }
        }
        const xAxisArr = Array.isArray(chartOption.xAxis) ? chartOption.xAxis : [chartOption.xAxis]
        const rawXEnc = spec.rawInput?.chart_spec?.encodings?.x
        if (customXAxisLabel !== undefined) {
          // 显式配置了 x 轴标签（空字符串表示隐藏字段名标题）
          for (const xa of xAxisArr) {
            if (xa) xa.name = customXAxisLabel
          }
        } else if (Array.isArray(rawXEnc)) {
          const xFieldNames = rawXEnc.map((e: any) => e?.field || '').filter(Boolean)
          const xLabel = xFieldNames.length > 0 ? xFieldNames.join(' / ') : '值'
          for (const xa of xAxisArr) {
            if (xa && typeof xa.name === 'string' && xa.name.includes('flint_series_value')) {
              xa.name = xLabel
            }
          }
        }

        // 清除 flint-chart 自动生成的合成列名图例标题（如 __flint_series_key）
        // ecApplyLayoutToSpec 会用 color 字段名作为 graphic 文本添加到右上角
        if (chartOption.graphic) {
          const graphics = Array.isArray(chartOption.graphic) ? chartOption.graphic : [chartOption.graphic]
          const filtered = graphics.filter((g: any) => {
            const text = g?.style?.text
            if (typeof text === 'string' && text.includes('flint_series_key')) {
              return false
            }
            return true
          })
          chartOption.graphic = filtered.length > 0 ? filtered : undefined
        }
        // 如果用户配置了自定义图例标题，添加到 graphic 中
        if (customLegendTitle && chartOption.legend) {
          const legendTop = chartOption.legend.top ?? 0
          const legendLeft = chartOption.legend.left ?? 'right'
          const titleGraphic = {
            type: 'text' as const,
            left: legendLeft,
            top: Math.max(0, legendTop - 18),
            z: 100,
            style: {
              text: customLegendTitle,
              fontSize: 12,
              fontWeight: 'bold',
              fill: '#333',
              textAlign: 'left',
            },
          }
          chartOption.graphic = chartOption.graphic
            ? [...(Array.isArray(chartOption.graphic) ? chartOption.graphic : [chartOption.graphic]), titleGraphic]
            : [titleGraphic]
        }

        // 双 Y 轴支持：当 chartProperties.dualYAxis 为 true 时，
        // 将数组形式 y 编码的各系列分配到左右两个 y 轴
        if (rawChartProps.dualYAxis && Array.isArray(rawYEnc) && chartOption.series) {
          const fieldNames = rawYEnc.map((e: any) => e?.field || '').filter(Boolean)
          const leftLabel = customYAxisLabel || fieldNames[0] || 'Y1'
          const rightLabel = (rawChartProps.yAxis2Label as string) || fieldNames[1] || 'Y2'
          const leftYAxis = Array.isArray(chartOption.yAxis) ? chartOption.yAxis[0] : chartOption.yAxis

          // 从两个系列中提取数据值，计算对齐的刻度
          const getSeriesValues = (s: any): number[] => {
            if (!s || !Array.isArray(s.data)) return []
            return s.data.map((d: any) => {
              if (typeof d === 'number') return d
              if (d && typeof d === 'object' && 'value' in d) return d.value
              return 0
            })
          }

          const leftValues = getSeriesValues(chartOption.series[0])
          const rightValues = getSeriesValues(chartOption.series[1])

          // 计算"美观"的刻度范围和间隔，使双轴刻度对齐
          const computeNiceScale = (values: number[]) => {
            if (values.length === 0) {
              return { min: 0, max: 100, interval: 25 }
            }
            const min = Math.min(...values)
            const max = Math.max(...values)
            if (min === max) {
              const pad = Math.abs(max) * 0.1 || 1
              return { min: min - pad, max: max + pad, interval: pad * 2 }
            }
            const range = max - min
            const roughInterval = range / 5
            const mag = Math.pow(10, Math.floor(Math.log10(roughInterval)))
            const norm = roughInterval / mag
            let niceInterval: number
            if (norm < 1.5) niceInterval = mag
            else if (norm < 3) niceInterval = 2 * mag
            else if (norm < 7) niceInterval = 5 * mag
            else niceInterval = 10 * mag
            const niceMin = Math.floor(min / niceInterval) * niceInterval
            const niceMax = Math.ceil(max / niceInterval) * niceInterval
            return { min: niceMin, max: niceMax, interval: niceInterval }
          }

          const leftScale = computeNiceScale(leftValues)
          const rightScale = computeNiceScale(rightValues)

          // 使用相同的分割数使双轴刻度对齐
          const leftTickCount = Math.round((leftScale.max - leftScale.min) / leftScale.interval)
          const rightInterval = (rightScale.max - rightScale.min) / leftTickCount

          // 确保右轴的最小值与左轴对齐（都是 interval 的整数倍）
          const rightMin = Math.floor(rightScale.min / rightInterval) * rightInterval
          const rightMax = Math.ceil(rightScale.max / rightInterval) * rightInterval

          // 从左轴继承视觉样式，确保右轴样式一致
          const leftAxisStyle = {
            axisLine: leftYAxis?.axisLine ?? { show: true, lineStyle: {} },
            axisTick: leftYAxis?.axisTick ?? { show: true, lineStyle: {} },
            axisLabel: leftYAxis?.axisLabel ?? { show: true },
            splitLine: leftYAxis?.splitLine ?? { show: true, lineStyle: {} },
            nameTextStyle: leftYAxis?.nameTextStyle ?? {},
          }

          chartOption.yAxis = [
            {
              ...leftYAxis,
              type: 'value',
              name: leftLabel,
              nameGap: 55,
              nameLocation: 'middle',
              position: 'left',
              min: leftScale.min,
              max: leftScale.max,
              interval: leftScale.interval,
              axisLine: leftAxisStyle.axisLine,
              axisTick: leftAxisStyle.axisTick,
              axisLabel: leftAxisStyle.axisLabel,
              nameTextStyle: leftAxisStyle.nameTextStyle,
            },
            {
              ...leftAxisStyle,
              type: 'value',
              name: rightLabel,
              nameGap: 55,
              nameLocation: 'middle',
              nameRotate: 90,
              position: 'right',
              min: rightMin,
              max: rightMax,
              interval: rightInterval,
              splitLine: { show: false },
            },
          ]
          // 将第 2 个系列分配到右轴
          if (chartOption.series.length >= 2) {
            chartOption.series[1].yAxisIndex = 1
          }
          // 右轴需要额外的 grid 右边距
          if (chartOption.grid) {
            const grids = Array.isArray(chartOption.grid) ? chartOption.grid : [chartOption.grid]
            for (const g of grids) {
              if (g) g.right = (typeof g.right === 'number' ? g.right : 40) + 50
            }
          } else {
            chartOption.grid = { right: 70 }
          }
        }

        // 补充图例（flint-chart 默认不生成 legend）
        if (!chartOption.legend && chartOption.series) {
          const hasPie = chartOption.series.some((s: any) => s.type === 'pie')
          if (hasPie) {
            chartOption.legend = {
              orient: 'horizontal',
              bottom: 0,
              icon: 'circle',
              itemWidth: 10,
              itemHeight: 10,
              textStyle: { fontSize: 12 },
            }
          } else {
            chartOption.legend = {
              orient: 'horizontal',
              bottom: 0,
              textStyle: { fontSize: 12 },
            }
          }
        }

        // 对话框场景布局压缩：flint-chart 默认边距偏保守，这里收紧让图表尽量铺满容器
        const seriesList = Array.isArray(chartOption.series)
          ? chartOption.series
          : chartOption.series
            ? [chartOption.series]
            : []
        const hasPieSeries = seriesList.some((s: any) => s && s.type === 'pie')
        if (hasPieSeries) {
          // 饼图：放大半径（flint 保守比例在对话框容器里留白过多），
          // 上下预留外部标签空间，左右预留标签文字空间
          for (const s of seriesList) {
            if (!s || s.type !== 'pie') continue
            const r = s.radius
            let innerPx = 0
            let outerPx = 0
            if (Array.isArray(r)) {
              innerPx = parseFloat(r[0]) || 0
              outerPx = parseFloat(r[1]) || 0
            } else if (typeof r === 'string') {
              outerPx = parseFloat(r) || 0
            }
            if (outerPx > 0) {
              const maxOuter = Math.min((actualH - 84) / 2, (actualW - 160) / 2)
              const newOuter = Math.round(Math.max(outerPx, maxOuter))
              const ratio = innerPx > 0 ? innerPx / outerPx : 0
              s.radius = ratio > 0 ? [`${Math.round(newOuter * ratio)}px`, `${newOuter}px`] : `${newOuter}px`
            }
          }
        } else if (chartOption.xAxis || chartOption.yAxis) {
          // 笛卡尔图表：图例移到底部居中（释放右侧整列留白），收紧四周 grid
          if (chartOption.legend) {
            delete chartOption.legend.right
            chartOption.legend = {
              ...chartOption.legend,
              orient: 'horizontal',
              left: 'center',
              top: 'auto',
              bottom: 0,
            }
          }
          const yAxisList = Array.isArray(chartOption.yAxis) ? chartOption.yAxis : [chartOption.yAxis]
          const xAxisList = Array.isArray(chartOption.xAxis) ? chartOption.xAxis : [chartOption.xAxis]
          const isDualY = yAxisList.filter(Boolean).length > 1
          const hasYTitle = yAxisList.some((y: any) => y && y.name)
          const hasXTitle = xAxisList.some((x: any) => x && x.name)
          const grids = Array.isArray(chartOption.grid) ? chartOption.grid : [chartOption.grid || {}]
          for (const g of grids) {
            if (!g) continue
            g.containLabel = true
            // 轴标题（nameGap 40/55）在 grid 之外，需额外预留
            g.left = isDualY ? 70 : hasYTitle ? 56 : 10
            g.right = isDualY ? 64 : 10
            g.top = 16
            g.bottom = (hasXTitle ? 48 : 28) + 24 // x 轴标题 + 底部图例
          }
        }

        const chartInstance = echarts.init(domEl)
        chartInstance.setOption(chartOption)
        flintChartInstances.value.set(key, chartInstance)

        // 使用 ResizeObserver 监听容器尺寸变化
        if (typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => {
            chartInstance.resize()
          })
          observer.observe(domEl)
          resizeObservers.push(observer)
        }
      })
    }

    // 存储 ResizeObserver 以便清理
    const resizeObservers: ResizeObserver[] = []

    // 格式化内容（清理 Flint/HTML 块 + 标准格式化）
    const formatContent = (content: string): string => {
      const cleaned = stripHtmlBlocks(stripFlintBlocks(content))
      return cleaned
        .replace(/\n/g, '<br />')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }

    const formatTime = (timestamp: number): string => {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }

    const copyMessageContent = (message: { content: string; }) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(message.content).then(() => {
        }).catch(() => {
          fallbackCopy(message.content)
        })
      } else {
        fallbackCopy(message.content)
      }
    }

    const fallbackCopy = (text: string) => {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
      }
      document.body.removeChild(textArea)
    }

    const clearMessages = () => {
      // 若仍在生成中，先停止输出，避免残留的打字机/响应定时器继续写入已清空的消息列表
      stopGeneration()
      disposeAllCharts()
      messages.value = []
      showWelcomeMessage()
    }

    // 切换技能选中状态
    const toggleSkill = (messageIndex: number, skillName: string) => {
      const msg = messages.value[messageIndex]
      if (!msg || !msg.selectedSkills || msg.interactionResolved) return
      const idx = msg.selectedSkills.indexOf(skillName)
      if (idx === -1) {
        msg.selectedSkills.push(skillName)
      } else {
        msg.selectedSkills.splice(idx, 1)
      }
    }

    // 确认技能选择
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的确认按钮
    // （如"确认"等）都能匹配对应状态的关键词
    const confirmSkillSelection = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex]
      if (!msg || msg.interactionResolved) return
      const selected = msg.selectedSkills || []
      msg.interactionResolved = true
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；
      // resolvedText 支持 {selected} 占位符，自动替换为用户实际勾选的技能；
      // 若 resolvedText 为空但有选中项，仍显示选中项摘要；否则不显示提示文本
      if (btn?.resolvedText) {
        msg.interactionText = btn.resolvedText.replace(/\{selected\}/g, selected.length > 0 ? selected.join('、') : '（未选择）')
      } else if (selected.length > 0) {
        msg.interactionText = `已选择：${selected.join('、')}`
      } else {
        msg.interactionText = undefined
      }
      sendInteractionMessage(btn?.text || '确认')
    }

    // 取消技能选择
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的取消按钮
    // 都能匹配对应状态的关键词
    const cancelSkillSelection = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex]
      if (!msg || msg.interactionResolved) return
      msg.interactionResolved = true
      msg.selectedSkills = []
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；为空则不展示提示文本
      msg.interactionText = btn?.resolvedText || undefined
      sendInteractionMessage(btn?.text || '取消')
    }

    // 确认技能列表
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的确认按钮
    // （如"确认联动"、"确认屏蔽"、"确认"等）都能匹配对应状态的关键词
    const confirmSkillList = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex]
      if (!msg || msg.interactionResolved) return
      msg.interactionResolved = true
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；为空则不展示提示文本
      msg.interactionText = btn?.resolvedText || undefined
      sendInteractionMessage(btn?.text || '确认')
    }

    // 取消技能列表
    // 使用按钮实际文本作为消息发送给脚本引擎，使不同场景的取消按钮
    // （如"取消"、"生成清洁工单"等）都能匹配对应状态的关键词
    const cancelSkillList = (messageIndex: number, btn?: ButtonConfig) => {
      const msg = messages.value[messageIndex]
      if (!msg || msg.interactionResolved) return
      msg.interactionResolved = true
      // 优先使用 mockdata.json 中按钮配置的 resolvedText；为空则不展示提示文本
      msg.interactionText = btn?.resolvedText || undefined
      sendInteractionMessage(btn?.text || '取消')
    }

    // 发送交互结果消息（不显示用户消息，直接触发脚本引擎返回结果）
    const sendInteractionMessage = (text: string) => {
      isLoading.value = true
      thinkingTimer = setTimeout(async () => {
        thinkingTimer = null
        const thinkingMessage = {
          role: 'assistant' as const,
          content: '',
          timestamp: Date.now(),
          isThinking: true,
          thinkingContent: 'AI 正在思考中，请稍候...',
        }
        messages.value.push(thinkingMessage)
        await scrollToBottom()
      }, 300)

      responseTimer = setTimeout(async () => {
        responseTimer = null
        const response = scriptEngine.getResponse(text)
        const flintSpecs = parseFlintSpecs(response)
        const htmlInteractions = parseHtmlInteractions(response)
        const textContent = stripHtmlBlocks(stripFlintBlocks(response)).trim()

        const thinkingIndex = messages.value.findIndex(msg => msg.isThinking)
        if (thinkingIndex !== -1) {
          messages.value[thinkingIndex] = {
            role: 'assistant' as const,
            content: '',
            timestamp: Date.now(),
            isThinking: false,
            flintSpecs: flintSpecs.length > 0 ? flintSpecs : undefined,
            htmlInteractions: htmlInteractions.length > 0 ? htmlInteractions : undefined,
            selectedSkills: htmlInteractions.length > 0 ? [] : undefined,
            interactionResolved: false,
          }
          await scrollToBottom()

          const typingSpeed = 50
          let index = 0
          typingMessageIndex = thinkingIndex
          const interval = setInterval(() => {
            if (index < textContent.length) {
              messages.value[thinkingIndex].content = textContent.slice(0, index + 1)
              index++
              scrollToBottom()
            } else {
              clearInterval(interval)
              typingTimer = null
              typingMessageIndex = -1
              isLoading.value = false
              if (flintSpecs.length > 0) {
                renderFlintCharts(thinkingIndex)
              }
            }
          }, typingSpeed)
          typingTimer = interval
        }
      }, 2500 + Math.random() * 500)
    }

    const handleFileSelect = (event: Event) => {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (!files) return

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        uploadedFiles.value.push({
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
        })
      }

      target.value = ''
    }

    const removeFile = (id: string) => {
      uploadedFiles.value = uploadedFiles.value.filter(file => file.id !== id)
    }

    const openFileDialog = () => {
      fileInputRef.value?.click()
    }

    const formatFileSize = (size: number): string => {
      if (size < 1024) {
        return `${size} B`
      } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`
      } else {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`
      }
    }

    // 获取按钮配置，如果未配置则使用默认值
    const getButtons = (interaction: HtmlInteraction) => {
      if (interaction.buttons && interaction.buttons.length > 0) {
        return interaction.buttons
      }
      // 默认按钮配置
      return [
        { type: 'confirm' as const, text: '确定' },
        { type: 'cancel' as const, text: '取消' },
      ]
    }

    // 获取按钮的内联样式（用于每个按钮单独配置颜色）
    const getButtonInlineStyle = (btn: ButtonConfig) => {
      if (!btn.color) {
        return {}
      }
      const style: Record<string, string> = {}
      if (btn.color.backgroundColor) {
        style.background = btn.color.backgroundColor
      }
      if (btn.color.textColor) {
        style.color = btn.color.textColor
      }
      if (btn.type === 'cancel' && btn.color.borderColor) {
        style.border = `1px solid ${btn.color.borderColor}`
      }
      return style
    }

    return {
      dialogVisible,
      teleportTarget,
      screenMaskLayer,
      userQuery,
      messages,
      isLoading,
      messageContainer,
      mdEditorVisible,
      sendMessage,
      stopGeneration,
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
      chatFontScale,
      chatFontStyle,
    }
  },
})
</script>

<style lang="scss" scoped>
/* =========================================================================
   AI 智能助手对话窗｜视觉规范（浅色 · 蓝色主色），与 DifyRealDialog 保持一致
   品牌蓝 #2f6bff ｜ 主区底色 #f6f8fc ｜ 卡片白底 + 1px 细边框
   所有尺寸均乘以 --chat-font-scale，保证「字体缩放」功能整体一致
   ========================================================================= */
.custom-dialog {
  --chat-primary: #2f6bff;
  --chat-primary-strong: #1c56e6;
  --chat-primary-soft: #eef4ff;
  --chat-bg: #f6f8fc;
  --chat-card: #fff;
  --chat-border: #e8eef8;
  --chat-border-soft: #eff3fa;
  --chat-title: #1b2434;
  --chat-text: #2b3747;
  --chat-text-sub: #6c7c93;
  --chat-text-light: #9aa8bb;

  /* 内容列最大宽度：欢迎页 / 消息列表 / 输入区共用 */
  --chat-content-max: 1040px;
}

/* 组件内统一使用 border-box，避免 width:100% + padding 溢出 */
.custom-dialog,
.custom-dialog * {
  box-sizing: border-box;
}

.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 9999;
}

/* 大屏预览页：遮罩挂在画布内的 .datav-mask-layer（不受组件自身 transform 限制），
   但仍会被画布（body）整体缩放，需按预览页下发的比例铺开后再反向还原成满屏 */
.custom-dialog-mask.in-screen-layer {
  width: var(--screen-fill-w, 100vw);
  height: var(--screen-fill-h, 100vh);
  margin-left: var(--screen-fill-left, 0);
  margin-top: var(--screen-fill-top, 0);
  transform: scale(var(--screen-fill-scale-x, 1), var(--screen-fill-scale-y, 1));
  transform-origin: left top;
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

/* 弹窗本身再抵消一次遮罩的反向缩放，保持视觉大小正常 */
.custom-dialog-mask.in-screen-layer .custom-dialog-wrapper {
  transform: scale(
    calc(1 / var(--screen-fill-scale-x, 1)),
    calc(1 / var(--screen-fill-scale-y, 1))
  );
  transform-origin: left top;
}

.custom-dialog-wrapper .custom-dialog {
  width: 100%;
  height: 100%;
  background-color: var(--chat-card);
  border-radius: 18px;
  box-shadow: 0 24px 70px rgba(19, 45, 92, 0.18), 0 6px 20px rgba(19, 45, 92, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* 基准字号随缩放倍率变化，未单独声明字号的文字也跟随缩放 */
  font-size: calc(14px * var(--chat-font-scale, 1));
  color: var(--chat-text);
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}

.custom-dialog-fixed .chat-main-header {
  cursor: default;
}

.dify-api-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background-color: var(--chat-bg);
  overflow: hidden;
}

/* ===================== 顶栏 ===================== */
.chat-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--chat-bg);
}

.chat-main-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(12px * var(--chat-font-scale, 1));
  padding: calc(13px * var(--chat-font-scale, 1)) calc(20px * var(--chat-font-scale, 1));
  background-color: var(--chat-card);
  border-bottom: 1px solid var(--chat-border-soft);
  cursor: move;
  user-select: none;
}

.chat-main-title-wrap {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--chat-font-scale, 1));
  min-width: 0;
}

.chat-main-title {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--chat-font-scale, 1));
  font-size: calc(16px * var(--chat-font-scale, 1));
  font-weight: 600;
  color: #2a3547;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-main-title::before {
  content: "🤖";
  font-size: calc(17px * var(--chat-font-scale, 1));
  line-height: 1;
}

.chat-main-actions {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--chat-font-scale, 1));
}

.pill-btn {
  height: calc(30px * var(--chat-font-scale, 1));
  padding: 0 calc(14px * var(--chat-font-scale, 1));
  border: 1px solid #e2ecfd;
  border-radius: calc(9px * var(--chat-font-scale, 1));
  background-color: #f2f7ff;
  color: var(--chat-primary);
  font-size: calc(12.5px * var(--chat-font-scale, 1));
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.pill-btn:hover {
  background-color: #e8f1ff;
  border-color: #cfe0ff;
}

.pill-btn.active {
  background-color: #e2edff;
  border-color: #b7d1ff;
}

.round-icon-btn {
  width: calc(30px * var(--chat-font-scale, 1));
  height: calc(30px * var(--chat-font-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--chat-border);
  border-radius: 50%;
  background-color: var(--chat-card);
  color: #7d8b9f;
  font-size: calc(18px * var(--chat-font-scale, 1));
  line-height: 1;
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

.round-icon-btn:hover {
  background-color: #fff1f1;
  border-color: #ffd6d6;
  color: #ef4444;
}

/* ===================== 消息区 ===================== */
.message-section-wrapper {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}

.message-section {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: calc(24px * var(--chat-font-scale, 1)) calc(28px * var(--chat-font-scale, 1));
}

/* 空态（欢迎页）时去掉内边距，交给欢迎页自行控制 */
.message-section.is-empty {
  padding: 0;
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

/* ---------- 空态：品牌欢迎页 ---------- */
.welcome-screen {
  box-sizing: border-box;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(20px * var(--chat-font-scale, 1)) calc(28px * var(--chat-font-scale, 1)) calc(56px * var(--chat-font-scale, 1));
}

.welcome-inner {
  width: 100%;
  max-width: var(--chat-content-max, 1040px);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.welcome-logo {
  width: calc(88px * var(--chat-font-scale, 1));
  height: calc(88px * var(--chat-font-scale, 1));
  border-radius: calc(26px * var(--chat-font-scale, 1));
  background: linear-gradient(180deg, #f4f8ff 0%, #e7f0ff 100%);
  border: 1px solid #dde8fb;
  box-shadow: 0 12px 26px rgba(47, 107, 255, 0.14), inset 0 1px 0 #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: calc(22px * var(--chat-font-scale, 1));
}

.welcome-logo-inner {
  display: flex;
  font-size: calc(40px * var(--chat-font-scale, 1));
  line-height: 1;
}

.welcome-slogan {
  font-size: calc(14.5px * var(--chat-font-scale, 1));
  font-weight: 600;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #5b8cff 0%, #8f7dff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: calc(12px * var(--chat-font-scale, 1));
}

.welcome-title {
  font-size: calc(27px * var(--chat-font-scale, 1));
  font-weight: 700;
  color: var(--chat-title);
  line-height: 1.3;
  letter-spacing: 0.5px;
  margin-bottom: calc(12px * var(--chat-font-scale, 1));
}

.welcome-subtitle {
  font-size: calc(14px * var(--chat-font-scale, 1));
  color: #8494a8;
  line-height: 1.6;
}

/* ---------- 消息列表 ---------- */
.message-list {
  display: flex;
  flex-direction: column;
  gap: calc(22px * var(--chat-font-scale, 1));
  max-width: var(--chat-content-max, 1040px);
  margin: 0 auto;
}

.message-item {
  display: flex;
  flex-direction: column;
}

.message-item.user-message {
  align-items: flex-end;
}

.message-item.assistant-message {
  align-items: stretch;
}

.message-header {
  display: flex;
  align-items: center;
  gap: calc(8px * var(--chat-font-scale, 1));
  margin-bottom: calc(8px * var(--chat-font-scale, 1));
}

.avatar {
  flex-shrink: 0;
  width: calc(30px * var(--chat-font-scale, 1));
  height: calc(30px * var(--chat-font-scale, 1));
  border-radius: calc(10px * var(--chat-font-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(15px * var(--chat-font-scale, 1));
}

.avatar.user {
  background-color: #eef2fa;
  color: #5b6b83;
}

.avatar.assistant {
  background: linear-gradient(135deg, #4a83ff 0%, #2564e0 100%);
  color: #fff;
  box-shadow: 0 4px 10px rgba(47, 107, 255, 0.24);
}

.message-role {
  font-size: calc(12.5px * var(--chat-font-scale, 1));
  color: #8494a8;
  font-weight: 500;
}

.message-content {
  max-width: 75%;
  padding: calc(14px * var(--chat-font-scale, 1)) calc(18px * var(--chat-font-scale, 1));
  border-radius: calc(14px * var(--chat-font-scale, 1));
  word-break: break-word;
  transition: all 0.2s ease;
}

/* 助手回复：整幅白底卡片，便于承载表格 / 图表 / 交互面板 */
.assistant-message .message-content {
  width: 100%;
  max-width: 100%;
  background-color: var(--chat-card);
  border: 1px solid var(--chat-border);
  border-radius: calc(16px * var(--chat-font-scale, 1));
  box-shadow: 0 2px 10px rgba(28, 60, 120, 0.04);
  color: var(--chat-text);
}

/* 用户提问：右侧蓝色气泡 */
.user-message .message-content {
  background: linear-gradient(135deg, #3b7bff 0%, #1f5fe8 100%);
  color: #fff;
  border-bottom-right-radius: calc(5px * var(--chat-font-scale, 1));
  box-shadow: 0 6px 16px rgba(47, 107, 255, 0.24);
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
  width: 6px;
  height: 6px;
  background: linear-gradient(135deg, #4a83ff 0%, #2564e0 100%);
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
  font-size: calc(12px * var(--chat-font-scale, 1));
  color: var(--chat-text-light);
}

.content-text {
  font-size: calc(15px * var(--chat-font-scale, 1));
  line-height: 1.7;
}

.content-text code {
  background-color: #f1f5f9;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: calc(13px * var(--chat-font-scale, 1));
  font-family: "SF Mono", Monaco, "Courier New", monospace;
}

.message-files {
  display: flex;
  flex-direction: column;
  gap: calc(8px * var(--chat-font-scale, 1));
  margin-top: calc(10px * var(--chat-font-scale, 1));
  max-width: 78%;
}

.message-file-item {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--chat-font-scale, 1));
  font-size: calc(13px * var(--chat-font-scale, 1));
  padding: calc(8px * var(--chat-font-scale, 1)) calc(12px * var(--chat-font-scale, 1));
  background-color: #f8fafd;
  border: 1px solid var(--chat-border);
  border-radius: calc(10px * var(--chat-font-scale, 1));
  min-width: 0;
}

/* 用户气泡内的附件：实心白底卡片 + 深色文字 */
.user-message .message-file-item {
  background-color: #fff;
  border-color: #fff;
  color: var(--chat-title);
}

.file-icon {
  font-size: calc(15px * var(--chat-font-scale, 1));
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--chat-text-light);
  flex-shrink: 0;
}

.user-message .file-size {
  color: var(--chat-text-sub);
}

/* 时间 + 复制：同一行 */
.message-footer {
  display: flex;
  align-items: center;
  gap: calc(6px * var(--chat-font-scale, 1));
  margin-top: calc(8px * var(--chat-font-scale, 1));
}

.copy-btn {
  display: flex;
  background: none;
  border: none;
  cursor: pointer;
  padding: calc(5px * var(--chat-font-scale, 1));
  color: #a4b1c4;
  opacity: 0;
  border-radius: calc(7px * var(--chat-font-scale, 1));
  transition: opacity 0.2s, color 0.2s, background-color 0.2s;

  svg {
    width: calc(15px * var(--chat-font-scale, 1));
    height: calc(15px * var(--chat-font-scale, 1));
  }
}

.message-footer:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  color: var(--chat-primary);
  background-color: var(--chat-primary-soft);
}

.message-time {
  font-size: calc(11px * var(--chat-font-scale, 1));
  color: #b6c2d3;
}

/* ===================== 输入区 ===================== */
.input-section {
  flex-shrink: 0;
  padding: 0 calc(28px * var(--chat-font-scale, 1)) calc(14px * var(--chat-font-scale, 1));
  background-color: transparent;
}

.input-wrapper {
  max-width: var(--chat-content-max, 1040px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: calc(10px * var(--chat-font-scale, 1));
}

.uploaded-files-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.uploaded-file-item {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--chat-font-scale, 1));
  padding: calc(8px * var(--chat-font-scale, 1)) calc(12px * var(--chat-font-scale, 1));
  background-color: var(--chat-card);
  border: 1px solid var(--chat-border);
  border-radius: calc(10px * var(--chat-font-scale, 1));
  font-size: calc(13px * var(--chat-font-scale, 1));
}

.remove-file-btn {
  background: rgba(239, 68, 68, 0.1);
  border: none;
  cursor: pointer;
  color: #ef4444;
  font-size: calc(16px * var(--chat-font-scale, 1));
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

/* 输入卡片：textarea + 底部操作行，整体为一张白底圆角卡 */
.composer {
  background-color: var(--chat-card);
  border: 1px solid var(--chat-border);
  border-radius: calc(18px * var(--chat-font-scale, 1));
  padding: calc(14px * var(--chat-font-scale, 1)) calc(16px * var(--chat-font-scale, 1)) calc(10px * var(--chat-font-scale, 1));
  box-shadow: 0 4px 16px rgba(28, 60, 120, 0.05);
  transition: border-color 0.18s, box-shadow 0.18s;
}

.composer:focus-within {
  border-color: #bcd3ff;
  box-shadow: 0 8px 22px rgba(47, 107, 255, 0.12);
}

.composer :deep(.el-textarea) {
  width: 100%;
}

/* 去掉 Element Plus textarea 的默认边框/底色，融入卡片 */
.composer :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent !important;
  padding: 0 !important;
  font-size: calc(15px * var(--chat-font-scale, 1)) !important;
  line-height: 1.65 !important;
  color: var(--chat-text) !important;
  font-family: inherit !important;
  resize: none !important;
}

.composer :deep(.el-textarea__inner::placeholder) {
  color: #a8b5c8 !important;
}

.composer :deep(.el-textarea__inner:disabled) {
  background-color: transparent !important;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(12px * var(--chat-font-scale, 1));
  margin-top: calc(10px * var(--chat-font-scale, 1));
}

/* 添加附件：纯文字按钮 + 图标 */
.attach-btn {
  display: inline-flex;
  align-items: center;
  gap: calc(7px * var(--chat-font-scale, 1));
  padding: calc(5px * var(--chat-font-scale, 1)) calc(8px * var(--chat-font-scale, 1));
  border: none;
  border-radius: calc(8px * var(--chat-font-scale, 1));
  background: transparent;
  color: #63748c;
  font-size: calc(13.5px * var(--chat-font-scale, 1));
  font-family: inherit;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.attach-btn:hover:not(:disabled) {
  background-color: var(--chat-primary-soft);
  color: var(--chat-primary);
}

.attach-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.attach-icon {
  width: calc(17px * var(--chat-font-scale, 1));
  height: calc(17px * var(--chat-font-scale, 1));
}

/* 图标组件内写死的 fill 由 CSS 接管，跟随按钮文字颜色 */
.attach-btn :deep(.attach-icon path) {
  fill: currentColor !important;
}

.composer-footer-right {
  display: flex;
  align-items: center;
  gap: calc(10px * var(--chat-font-scale, 1));
}

.hint {
  font-size: calc(12.5px * var(--chat-font-scale, 1));
  color: var(--chat-text-light);
}

/* 发送 / 停止：圆形按钮 */
.round-btn {
  flex-shrink: 0;
  width: calc(38px * var(--chat-font-scale, 1));
  height: calc(38px * var(--chat-font-scale, 1));
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #4a83ff 0%, #2564e0 100%);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(47, 107, 255, 0.3);
  transition: box-shadow 0.2s, transform 0.12s, background 0.2s;
}

.round-btn:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(47, 107, 255, 0.42);
  transform: translateY(-1px);
}

.round-btn:active:not(:disabled) {
  transform: translateY(0);
}

.round-btn:disabled {
  background: #c7d8f8;
  box-shadow: none;
  cursor: not-allowed;
}

.stop-btn {
  background: linear-gradient(135deg, #f2685f 0%, #dc2626 100%);
  box-shadow: 0 6px 14px rgba(220, 38, 38, 0.28);
}

.stop-btn:hover:not(:disabled) {
  box-shadow: 0 8px 20px rgba(220, 38, 38, 0.4);
}

.round-icon {
  width: calc(20px * var(--chat-font-scale, 1));
  height: calc(20px * var(--chat-font-scale, 1));
}

/* 输入区下方：免责提示（居中） */
.composer-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(10px * var(--chat-font-scale, 1));
}

.composer-hint-text {
  font-size: calc(12px * var(--chat-font-scale, 1));
  color: var(--chat-text-light);
}

.hidden-file-input {
  display: none;
}

/* ===================== 缩放手柄 ===================== */
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
  background-color: rgba(47, 107, 255, 0.3);
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

/* ===================== Flint 图表 ===================== */
.flint-charts-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.flint-chart-item {
  width: 100%;
  height: 360px;
  min-height: 300px;
  box-sizing: border-box;
  flex-shrink: 0;
  background-color: #f8fafd;
  border-radius: 12px;
  border: 1px solid var(--chat-border);
  box-shadow: 0 2px 8px rgba(28, 60, 120, 0.04);
  transition: box-shadow 0.2s ease;
}

.flint-chart-item:hover {
  box-shadow: 0 4px 16px rgba(28, 60, 120, 0.08);
}

/* ===================== HTML 交互面板 ===================== */
.html-interactions-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 14px;
}

.html-interaction-panel {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--chat-border);
  background-color: #f8fafd;
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
  color: var(--chat-title);
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
  background-color: var(--chat-card);
  border: 1px solid var(--chat-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skill-select-item:hover {
  border-color: #93c5fd;
  background-color: #eff6ff;
}

.skill-select-item.selected {
  border-color: var(--chat-primary);
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
  background: linear-gradient(135deg, #4a83ff 0%, #2564e0 100%);
  border-color: var(--chat-primary);
}

.skill-select-info {
  flex: 1;
  min-width: 0;
}

.skill-select-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--chat-title);
  margin-bottom: 2px;
}

.skill-select-desc {
  font-size: 12px;
  color: var(--chat-text-sub);
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
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.skill-confirm-btn {
  background: linear-gradient(135deg, #4a83ff 0%, #2564e0 100%);
  color: white;
}

.skill-confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(47, 107, 255, 0.4);
}

.skill-cancel-btn {
  background-color: #f1f5f9;
  color: var(--chat-text-sub);
  border: 1px solid var(--chat-border);
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
  background-color: var(--chat-card);
  border: 1px solid var(--chat-border);
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
