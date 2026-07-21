<template>
  <Teleport to="body">
    <div
      v-if="dialogVisible"
      class="custom-dialog-mask"
      @click.self="handleClose"
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
        <div class="resize-handles">
          <div class="resize-handle resize-n" @mousedown.stop="startResize('n', $event)"></div>
          <div class="resize-handle resize-s" @mousedown.stop="startResize('s', $event)"></div>
          <div class="resize-handle resize-e" @mousedown.stop="startResize('e', $event)"></div>
          <div class="resize-handle resize-w" @mousedown.stop="startResize('w', $event)"></div>
          <div class="resize-handle resize-ne" @mousedown.stop="startResize('ne', $event)"></div>
          <div class="resize-handle resize-nw" @mousedown.stop="startResize('nw', $event)"></div>
          <div class="resize-handle resize-se" @mousedown.stop="startResize('se', $event)"></div>
          <div class="resize-handle resize-sw" @mousedown.stop="startResize('sw', $event)"></div>
        </div>
        <div class="custom-dialog" @mousedown="handleMouseDown">
          <div class="custom-dialog-header">
            <span class="custom-dialog-title">{{ title }}</span>
            <button class="custom-dialog-close" @click="handleClose">
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
                      <div class="message-role">{{ message.role === "user" ? (currentRole === 'project_manager' ? '项目经理' : currentRole === 'developer' ? '开发人员' : '使用人员') : "AI 助手" }}</div>
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
                        <svg t="1783476614918" class="copy-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M912 17.28H340.48a96 96 0 0 0-96 96v83.2h64v-83.2a32 32 0 0 1 32-32h571.52a32 32 0 0 1 32 32v650.88a31.36 31.36 0 0 1-32 31.36h-164.48v64h164.48a96 96 0 0 0 96-95.36V113.28a96 96 0 0 0-96-96z" fill="#909399"></path><path d="M683.52 1006.72H112a96 96 0 0 1-96-96V259.84a96 96 0 0 1 96-95.36h571.52a96 96 0 0 1 96 95.36v650.88a96 96 0 0 1-96 96zM112 228.48a31.36 31.36 0 0 0-32 31.36v650.88a32 32 0 0 0 32 32h571.52a32 32 0 0 0 32-32V259.84a32 32 0 0 0-32-31.36z" fill="#909399"></path><path d="M603.52 423.68H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32zM603.52 617.6H192a32 32 0 0 1 0-64h411.52a32 32 0 0 1 0 64zM603.52 810.88H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32z" fill="#909399"></path></svg>
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
                      <svg t="1784599493754" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="5433" width="28" height="28"><path d="M924.672 126.976q36.864 36.864 54.784 82.432t17.92 93.696-17.92 93.696-54.784 82.432l-392.192 389.12q-36.864 36.864-90.624 61.44t-113.664 28.672-122.368-16.384-115.712-73.728q-52.224-52.224-72.704-113.152t-16.384-121.344 28.16-113.664 60.928-90.112l348.16-345.088q9.216-9.216 27.136-4.608t27.136 13.824q8.192 9.216 13.312 27.136t-4.096 27.136l-347.136 344.064q-27.648 27.648-46.08 64.512t-21.504 78.848 12.288 84.992 55.296 82.944q35.84 35.84 79.36 50.688t86.528 12.288 81.92-18.944 66.56-44.032l391.168-388.096q27.648-27.648 39.424-57.344t11.264-58.88-13.824-56.832-36.864-51.2q-44.032-43.008-98.816-40.448t-110.08 57.856l-353.28 351.232q-23.552 23.552-23.04 52.224t18.944 47.104q22.528 22.528 51.712 18.432t47.616-22.528l320.512-318.464q9.216-9.216 27.136-4.608t27.136 13.824 14.336 27.136-4.096 27.136l-321.536 318.464q-36.864 36.864-70.656 51.2t-63.488 12.8-55.296-15.872-47.104-34.816q-17.408-16.384-31.232-41.984t-15.872-56.32 10.752-65.536 49.664-70.656q18.432-18.432 32.768-33.792 12.288-13.312 23.04-23.552t11.776-11.264l285.696-284.672q36.864-36.864 80.384-57.856t88.576-24.064 88.576 12.288 80.384 52.224z" p-id="5434" fill="#8a8a8a"></path></svg>
                        </el-button>
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
                        :disabled="isLoading || (!userQuery.trim() && uploadedFiles.length === 0)"
                        class="send-button"
                        title="发送"
                        v-show="!isLoading"
                      >
                        <svg t="1783304326600" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M512 981.333333q11.52 0 23.04-0.554666t22.954667-1.706667q11.477333-1.109333 22.869333-2.816 11.392-1.706667 22.698667-3.925333 11.306667-2.261333 22.485333-5.077334 11.178667-2.773333 22.186667-6.144 11.008-3.328 21.888-7.210666 10.837333-3.882667 21.461333-8.277334 10.666667-4.437333 21.077333-9.386666 10.410667-4.906667 20.565334-10.325334 10.197333-5.418667 20.053333-11.349333 9.898667-5.930667 19.456-12.330667 9.6-6.4 18.858667-13.226666 9.258667-6.912 18.133333-14.208 8.96-7.296 17.493333-15.018667 8.533333-7.765333 16.64-15.914667 8.149333-8.106667 15.914667-16.64 7.68-8.533333 15.018667-17.493333 7.296-8.874667 14.165333-18.133333t13.269333-18.858667q6.4-9.557333 12.330667-19.456 5.930667-9.898667 11.349333-20.053333 5.418667-10.154667 10.368-20.565334 4.906667-10.410667 9.344-21.077333 4.394667-10.666667 8.277334-21.504 3.882667-10.837333 7.253333-21.888 3.328-11.008 6.101333-22.186667 2.816-11.178667 5.077334-22.485333 2.218667-11.306667 3.925333-22.698667t2.816-22.869333q1.152-11.434667 1.706667-22.954667Q981.333333 523.52 981.333333 512t-0.554666-23.04q-0.554667-11.52-1.706667-22.954667-1.109333-11.477333-2.816-22.869333-1.706667-11.392-3.925333-22.698667-2.261333-11.306667-5.077334-22.485333-2.773333-11.178667-6.144-22.186667-3.328-11.050667-7.210666-21.888-3.882667-10.837333-8.277334-21.504-4.437333-10.624-9.386666-21.034666-4.906667-10.410667-10.325334-20.565334-5.418667-10.197333-11.349333-20.053333-5.930667-9.898667-12.330667-19.456-6.4-9.6-13.226666-18.858667-6.912-9.258667-14.208-18.133333-7.296-8.96-15.061334-17.493333-7.765333-8.533333-15.914667-16.64-8.106667-8.149333-16.64-15.872-8.533333-7.765333-17.493333-15.061334-8.874667-7.296-18.133333-14.165333t-18.858667-13.269333q-9.557333-6.4-19.456-12.330667-9.856-5.930667-20.053333-11.349333-10.154667-5.418667-20.565334-10.368-10.410667-4.906667-21.034666-9.344-10.624-4.394667-21.461333-8.277334-10.88-3.882667-21.888-7.253333-11.008-3.328-22.186667-6.101333-11.178667-2.816-22.485333-5.077334-11.306667-2.218667-22.698667-3.925333t-22.869333-2.816q-11.434667-1.109333-22.954667-1.706667Q523.52 42.666667 512 42.666667t-23.04 0.554666q-11.52 0.597333-22.954667 1.706667-11.477333 1.109333-22.869333 2.816-11.392 1.706667-22.698667 3.925333-11.306667 2.261333-22.485333 5.077334-11.178667 2.773333-22.186667 6.144-11.050667 3.328-21.888 7.210666-10.837333 3.882667-21.504 8.277334-10.624 4.437333-21.034666 9.386666-10.410667 4.906667-20.565334 10.325334-10.197333 5.418667-20.053333 11.349333-9.898667 5.930667-19.456 12.330667-9.6 6.4-18.858667 13.226666-9.258667 6.912-18.133333-14.208-8.96 7.296-17.493333-15.061334-8.533333 7.68-16.64 15.872-8.149333 8.106667-15.872 16.64-7.765333 8.533333-15.061334 17.493333-7.296 8.874667-14.165333 18.133333t-13.269333 18.858667q6.4 9.557333-12.330667 19.456-5.930667 9.856-11.349333 20.053333-5.418667 10.154667-10.368 20.565334-4.906667 10.410667-9.344 21.034666-4.394667 10.666667-8.277334 21.504-3.882667 10.837333-7.253333 21.888-3.328 11.008-6.101333 22.186667-2.816 11.178667-5.077334 22.485333-2.218667 11.306667-3.925333 22.698667t-2.816-22.869333q-1.109333-11.434667-1.706667-22.954667Q42.666667 500.48 42.666667 512t0.554666 23.04q0.597333 11.52 1.706667 22.954667 1.109333 11.477333 2.816 22.869333 1.706667 11.392 3.925333 22.698667 2.261333 11.306667 5.077334 22.485333 2.773333 11.178667 6.144 22.186667 3.328 11.008 7.210666 21.888 3.882667 10.837333 8.277334 21.461333 4.437333 10.666667 9.386666 21.077333 4.906667 10.410667 10.325334 20.565334 5.418667 10.197333 11.349333 20.053333 5.930667 9.898667 12.330667 19.456 6.4 9.6 13.226666 18.858667 6.912 9.258667 14.208 18.133333 7.296 8.96 15.061334 17.493333 7.68 8.533333 15.872 16.64 8.106667 8.149333 16.64 15.914667 8.533333 7.68 17.493333 15.018667 8.874667 7.296 18.133333 14.165333t18.858667 13.269333q9.557333 6.4 19.456 12.330667 9.856 5.930667 20.053333 11.349333 10.154667 5.418667 20.565334 10.368 10.410667 4.906667 21.034666 9.344 10.666667 4.394667 21.504 8.277334 10.837333 3.882667 21.888 7.253333 11.008 3.328 22.186667 6.101333 11.178667 2.816 22.485333 5.077334 11.306667 2.218667 22.698667 3.925333t22.869333 2.816q11.434667 1.152 22.954667 1.706667 11.52 0.554667 23.04 0.554666z m-10.666667-673.322666a32 32 0 0 1 45.226667 0l150.613333 150.186666a32 32 0 1 1-45.226666 45.312l-96-95.744V725.333333a32 32 0 0 1-64 0V407.765333L395.946667 503.466667a32 32 0 1 1-45.226667-45.312l150.613333-150.186667z" fill="#ffffff"></path></svg>
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

export default defineComponent({
  name: "DifyApiDemoDialog",
  components: {
    ElButton,
    ElInput,
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
    const messages = ref<
      Array<{
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
      }>
    >([]);
    const isLoading = ref(false);
    const messageContainer = ref<HTMLElement | null>(null);
    const dialogPosition = ref({ x: 100, y: 100 });
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

    const showWelcomeMessage = () => {
      const role = currentRole.value;
      const welcomeMessage = scriptEngine.getWelcomeMessage(role);
      if (welcomeMessage) {
        messages.value = [{
          role: "assistant",
          content: welcomeMessage,
          timestamp: Date.now(),
        }];
        setTimeout(scrollToBottom, 100);
      }
    };

    onMounted(() => {
      dialogVisible.value = props.visible;
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

    onUnmounted(() => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
    });

    const handleClose = () => {
      dialogVisible.value = false;
      emit("update:visible", false);
      emit("close");
    };

    const handleMouseDown = (e: MouseEvent) => {
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
    const dialogWidth = ref(600);
    const dialogHeight = ref(600);

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
        
        const thinkingIndex = messages.value.findIndex((msg) => msg.isThinking);
        if (thinkingIndex !== -1) {
          messages.value[thinkingIndex] = {
            role: "assistant" as const,
            content: "",
            timestamp: Date.now(),
            isThinking: false,
          };
          await scrollToBottom();
          
          const typingSpeed = 50;
          let index = 0;
          const interval = setInterval(() => {
            if (index < response.length) {
              messages.value[thinkingIndex].content = response.slice(0, index + 1);
              index++;
              scrollToBottom();
            } else {
              clearInterval(interval);
              isLoading.value = false;
            }
          }, typingSpeed);
        } else {
          const assistantMessage = {
            role: "assistant" as const,
            content: response,
            timestamp: Date.now(),
          };
          messages.value.push(assistantMessage);
          isLoading.value = false;
          await scrollToBottom();
        }
      }, 5000 + Math.random() * 1000);
    };

    const handleEnter = () => {
      sendMessage();
    };

    const formatContent = (content: string): string => {
      return content
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
      messages.value = [];
      showWelcomeMessage();
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

.custom-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.message-role {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.message-content {
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 16px;
  word-break: break-word;
  transition: all 0.2s ease;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  padding: 12px 16px;
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
</style>
