<template>
  <Teleport to="body">
    <div v-if="dialogVisible" class="custom-dialog-mask">
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
        <div class="custom-dialog">
          <div class="custom-dialog-header" @mousedown="handleDialogMouseDown">
            <span class="custom-dialog-title">{{ title }}</span>
            <button class="custom-dialog-close" @click="handleClose">×</button>
          </div>
          <div class="dify-api-container">
            <!-- 消息区域 -->
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
                      { 'human-interaction-message': message.isHumanInteraction },
                      { 'gateway-message': message.isGateway },
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
                      <button
                        class="copy-btn human-copy-btn"
                        @click="copyMessageContent(message)"
                        :title="'复制内容'"
                      >
                        <svg
                          t="1783476614918"
                          class="copy-icon"
                          viewBox="0 0 1024 1024"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                        >
                          <path
                            d="M912 17.28H340.48a96 96 0 0 0-96 96v83.2h64v-83.2a32 32 0 0 1 32-32h571.52a32 32 0 0 1 32 32v650.88a31.36 31.36 0 0 1-32 31.36h-164.48v64h164.48a96 96 0 0 0 96-95.36V113.28a96 96 0 0 0-96-96z"
                            fill="#909399"
                          ></path>
                          <path
                            d="M683.52 1006.72H112a96 96 0 0 1-96-96V259.84a96 96 0 0 1 96-95.36h571.52a96 96 0 0 1 96 95.36v650.88a96 96 0 0 1-96 96zM112 228.48a31.36 31.36 0 0 0-32 31.36v650.88a32 32 0 0 0 32 32h571.52a32 32 0 0 0 32-32V259.84a32 32 0 0 0-32-31.36z"
                            fill="#909399"
                          ></path>
                          <path
                            d="M603.52 423.68H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32zM603.52 617.6H192a32 32 0 0 1 0-64h411.52a32 32 0 0 1 0 64zM603.52 810.88H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32z"
                            fill="#909399"
                          ></path>
                        </svg>
                      </button>
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

                  <!-- 网关消息 -->
                  <div v-else-if="message.isGateway" class="gateway-message-wrapper">
                    <!-- AI提示标签 -->
                    <div class="gateway-indicator">
                      <span class="gateway-icon">🌐</span>
                      <span class="gateway-text">AI提示</span>
                    </div>

                    <!-- AI 消息内容 -->
                    <div class="gateway-message-content">
                      <div v-html="formatContent(message.content)"></div>
                    </div>

                    <!-- 操作区域 -->
                    <div
                      class="gateway-action-area"
                      v-if="
                        message.gatewayNextStep &&
                        message.gatewayNextStep >= 1 &&
                        message.gatewayNextStep <= 3
                      "
                    >
                      <div class="gateway-upload-section" v-if="!message.isGatewayActionDisabled">
                        <label class="gateway-upload-btn">
                          <input
                            type="file"
                            multiple
                            class="gateway-upload-input"
                            @change="(e) => handleGatewayUpload(e, message.conversationId || '')"
                          />
                          <span>📁 上传文件</span>
                        </label>
                      </div>

                      <!-- 已上传文件列表 -->
                      <div
                        v-if="message.gatewayImages && message.gatewayImages.length > 0"
                        class="gateway-uploaded-files"
                      >
                        <div
                          v-for="(file, index) in message.gatewayImages"
                          :key="index"
                          class="gateway-file-tag"
                          @click="previewGatewayFile(message.conversationId || '', index)"
                        >
                          <span class="gateway-file-icon">
                            <span v-if="isImageFile(file)">🖼️</span>
                            <span v-else-if="file.extension === 'txt'">📝</span>
                            <span v-else>📄</span>
                          </span>
                          <span class="gateway-file-name">{{ file.name }}</span>
                          <button
                            v-if="!message.isGatewayActionDisabled"
                            class="gateway-file-remove"
                            @click.stop="removeGatewayFile(message.conversationId || '', index)"
                            title="删除"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div class="gateway-action-buttons">
                        <div class="gateway-next-step">
                          <button
                            class="gateway-next-btn"
                            :disabled="message.isGatewayActionDisabled"
                            @click="
                              proceedToNextStep(
                                message.conversationId || '',
                                message.gatewayNextStep,
                              )
                            "
                          >
                            🚀 开始{{ getStepLabel(message.gatewayNextStep) }}
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- 复制按钮 -->
                    <button
                      class="copy-btn gateway-copy-btn"
                      @click="copyMessageContent(message)"
                      :title="'复制内容'"
                    >
                      <svg
                        t="1783476614918"
                        class="copy-icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                      >
                        <path
                          d="M912 17.28H340.48a96 96 0 0 0-96 96v83.2h64v-83.2a32 32 0 0 1 32-32h571.52a32 32 0 0 1 32 32v650.88a31.36 31.36 0 0 1-32 31.36h-164.48v64h164.48a96 96 0 0 0 96-95.36V113.28a96 96 0 0 0-96-96z"
                          fill="#909399"
                        ></path>
                        <path
                          d="M683.52 1006.72H112a96 96 0 0 1-96-96V259.84a96 96 0 0 1 96-95.36h571.52a96 96 0 0 1 96 95.36v650.88a96 96 0 0 1-96 96zM112 228.48a31.36 31.36 0 0 0-32 31.36v650.88a32 32 0 0 0 32 32h571.52a32 32 0 0 0 32-32V259.84a32 32 0 0 0-32-31.36z"
                          fill="#909399"
                        ></path>
                        <path
                          d="M603.52 423.68H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32zM603.52 617.6H192a32 32 0 0 1 0-64h411.52a32 32 0 0 1 0 64zM603.52 810.88H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32z"
                          fill="#909399"
                        ></path>
                      </svg>
                    </button>

                    <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>

                  <!-- 普通消息 -->
                  <template v-else>
                    <div class="message-header">
                      <div class="avatar" :class="message.role">
                        {{ message.role === "user" ? "👤" : "🤖" }}
                      </div>
                      <div class="message-role">
                        {{ message.role === "user" ? "用户" : "AI 助手" }}
                      </div>
                    </div>
                    <div class="message-content">
                      <!-- 思考中状态 -->
                      <div v-if="message.isThinking" class="thinking-indicator">
                        <span class="thinking-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                        <span class="thinking-text">{{ message.thinkingContent || "思考中" }}</span>
                      </div>
                      <!-- 正常内容 -->
                      <div
                        v-else
                        class="content-text"
                        v-html="formatContent(message.content)"
                      ></div>

                      <!-- 用户消息中的文件列表 -->
                      <div v-if="message.files && message.files.length > 0" class="message-files">
                        <div class="message-files-title">📎 附件</div>
                        <div class="message-files-list">
                          <div
                            v-for="(file, fileIndex) in message.files"
                            :key="fileIndex"
                            class="message-file-item"
                            @click="viewMessageFile(message, fileIndex)"
                          >
                            <div class="message-file-icon">
                              <span v-if="isImageFile(file)">🖼️</span>
                              <span v-else-if="file.extension === 'txt'">📝</span>
                              <span v-else>📄</span>
                            </div>
                            <div class="message-file-info">
                              <div class="message-file-name">{{ file.name }}</div>
                              <div class="message-file-size">{{ formatFileSize(file.size) }}</div>
                            </div>
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
                        <svg
                          t="1783476614918"
                          class="copy-icon"
                          viewBox="0 0 1024 1024"
                          version="1.1"
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                        >
                          <path
                            d="M912 17.28H340.48a96 96 0 0 0-96 96v83.2h64v-83.2a32 32 0 0 1 32-32h571.52a32 32 0 0 1 32 32v650.88a31.36 31.36 0 0 1-32 31.36h-164.48v64h164.48a96 96 0 0 0 96-95.36V113.28a96 96 0 0 0-96-96z"
                            fill="#909399"
                          ></path>
                          <path
                            d="M683.52 1006.72H112a96 96 0 0 1-96-96V259.84a96 96 0 0 1 96-95.36h571.52a96 96 0 0 1 96 95.36v650.88a96 96 0 0 1-96 96zM112 228.48a31.36 31.36 0 0 0-32 31.36v650.88a32 32 0 0 0 32 32h571.52a32 32 0 0 0 32-32V259.84a32 32 0 0 0-32-31.36z"
                            fill="#909399"
                          ></path>
                          <path
                            d="M603.52 423.68H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32zM603.52 617.6H192a32 32 0 0 1 0-64h411.52a32 32 0 0 1 0 64zM603.52 810.88H192a32 32 0 0 1-32-32 32 32 0 0 1 32-32h411.52a32 32 0 0 1 32 32 32 32 0 0 1-32 32z"
                            fill="#909399"
                          ></path>
                        </svg>
                      </button>
                    </div>
                    <div class="message-time" v-if="!message.isThinking">
                      {{ formatTime(message.timestamp) }}
                    </div>
                  </template>
                </div>
              </div>
            </div>
            </div>
        <!-- 输入区域 -->
        <div class="input-section">
          <div class="input-wrapper">
            <!-- 推荐问题下拉框和操作按钮行 -->
            <div class="top-bar">
              <!-- 水务模式下隐藏推荐问题下拉框 -->
              <!-- <select
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
            </select> -->
              <div class="top-bar-actions">
                <!-- 水务模式下保留：复制回答内容、清空对话、上传图片 -->
                <!-- <el-button
                type="primary"
                size="small"
                @click="copyLastMessageContent"
                :disabled="isLoading"
                >复制回答内容</el-button
              > -->
                <el-button
                  type="warning"
                  size="small"
                  @click="clearMessages"
                  :disabled="isLoading"
                  title="清空对话"
                  class="upload-button"
                  ><svg
                    t="1783560291301"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="8032"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M593.92 126.68928a69.632 69.632 0 0 1 69.632 69.632l-0.04096 94.208H798.72a110.592 110.592 0 0 1 110.592 110.592v122.88a28.672 28.672 0 0 1-28.672 28.672h-49.93024l37.4784 336.81408a28.672 28.672 0 0 1-28.50816 31.82592H184.32a28.672 28.672 0 0 1-28.50816-31.82592l37.43744-336.85504L143.36 552.67328a28.672 28.672 0 0 1-28.672-28.672v-122.88a110.592 110.592 0 0 1 110.592-110.592h135.12704l0.04096-94.208a69.632 69.632 0 0 1 69.632-69.632h163.84z m179.11808 425.984H250.96192l-34.6112 311.296h147.0464l19.456-179.8144a28.672 28.672 0 1 1 57.01632 6.144l-18.8416 173.6704h182.14912l-17.408-173.91616a28.672 28.672 0 1 1 57.05728-5.7344l17.98144 179.6096 146.8416 0.04096-34.6112-311.296z m25.68192-204.8H225.28a53.248 53.248 0 0 0-53.248 53.248v94.208h679.936v-94.208a53.248 53.248 0 0 0-53.248-53.248z m-204.8-163.84h-163.84a12.288 12.288 0 0 0-12.288 12.288v94.208h188.416v-94.208a12.288 12.288 0 0 0-12.288-12.288z"
                      p-id="8033"
                      fill="#ffffff"
                    ></path>
                  </svg>
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  @click="triggerImageUpload"
                  :disabled="isLoading || isAwaitingFeedback"
                  class="upload-button"
                  title="上传文件"
                >
                  <svg
                    t="1783924879903"
                    class="icon"
                    viewBox="0 0 1024 1024"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    p-id="2350"
                    width="20"
                    height="20"
                  >
                    <path
                      d="M770.609824 1023.841829a142.354032 142.354032 0 0 1-104.86747-239.787458 14.235403 14.235403 0 0 1 20.878591 19.455051A113.883225 113.883225 0 1 0 727.429101 775.038616a14.235403 14.235403 0 1 1-10.597467-26.414581 142.354032 142.354032 0 1 1 53.145505 275.375965zM444.935434 292.932963H276.957677a16.766141 16.766141 0 0 1 0-33.532283h167.977757a16.766141 16.766141 0 0 1 0 33.532283zM344.180414 360.1557h-67.222737a16.766141 16.766141 0 0 1 0-33.532283h67.222737a16.766141 16.766141 0 0 1 0 33.532283zM679.977757 494.601174H276.957677a16.924313 16.924313 0 0 1 0-33.690454H679.977757a16.924313 16.924313 0 0 1 0 33.690454zM679.977757 561.823911H276.957677a16.924313 16.924313 0 0 1 0-33.690454H679.977757a16.924313 16.924313 0 0 1 0 33.690454zM679.977757 629.046648H276.957677a16.924313 16.924313 0 0 1 0-33.690454H679.977757a16.924313 16.924313 0 0 1 0 33.690454zM411.086809 695.953043h-134.445474a16.924313 16.924313 0 0 1 0-33.690454H411.086809A16.924313 16.924313 0 0 1 411.086809 695.953043z"
                      fill="#ffffff"
                      p-id="2351"
                    ></path>
                    <path
                      d="M699.116466 207.204201m0-3.796107l0-25.307383q0-3.796108 3.796107-3.796108l194.075997 0q3.796108 0 3.796107 3.796108l0 25.307383q0 3.796108-3.796107 3.796107l-194.075997 0q-3.796108 0-3.796107-3.796107Z"
                      fill="#ffffff"
                      p-id="2352"
                    ></path>
                    <path
                      d="M731.857893 207.04603m-3.796107 0l-25.307384 0q-3.796108 0-3.796107-3.796107l0-110.087118q0-3.796108 3.796107-3.796107l25.307384 0q3.796108 0 3.796107 3.796107l0 110.087118q0 3.796108-3.796107 3.796107Z"
                      fill="#ffffff"
                      p-id="2353"
                    ></path>
                    <path
                      d="M907.514349 190.194241m-2.684253 2.684254l-17.895023 17.895022q-2.684253 2.684253-5.368506 0l-186.331921-186.331921q-2.684253-2.684253 0-5.368507l17.895022-17.895022q2.684253-2.684253 5.368507 0l186.331921 186.331921q2.684253 2.684253 0 5.368507Z"
                      fill="#ffffff"
                      p-id="2354"
                    ></path>
                    <path
                      d="M429.434662 997.427247m-16.449799 0a16.449799 16.449799 0 1 0 32.899598 0 16.449799 16.449799 0 1 0-32.899598 0Z"
                      fill="#ffffff"
                      p-id="2355"
                    ></path>
                    <path
                      d="M363.635465 980.661106H176.67717a33.215941 33.215941 0 0 1-33.21594-33.215941V71.335187a33.374112 33.374112 0 0 1 33.21594-33.374112h540.628978V5.219648H176.67717A66.115539 66.115539 0 0 0 110.561631 71.335187v876.426321a66.115539 66.115539 0 0 0 66.115539 66.115539H363.635465a15.817115 15.817115 0 1 0 0-33.215941zM594.248996 980.661106H494.917516a15.817115 15.817115 0 0 0 0 32.899598h99.33148a15.817115 15.817115 0 0 0 0-32.899598zM901.417362 714.617238V272.845227a15.817115 15.817115 0 0 0-32.899599 0v441.772011a15.817115 15.817115 0 1 0 32.899599 0z"
                      fill="#ffffff"
                      p-id="2356"
                    ></path>
                    <path
                      d="M754.160025 826.127896m3.796107 0l25.307384 0q3.796108 0 3.796107 3.796108l0 129.858511q0 3.796108-3.796107 3.796107l-25.307384 0q-3.796108 0-3.796107-3.796107l0-129.858511q0-3.796108 3.796107-3.796108Z"
                      fill="#ffffff"
                      p-id="2357"
                    ></path>
                    <path
                      d="M747.422242 817.383321m2.684253-2.684253l17.895023-17.895023q2.684253-2.684253 5.368507 0l72.139309 72.139309q2.684253 2.684253 0 5.368507l-17.895023 17.895023q-2.684253 2.684253-5.368507 0l-72.139309-72.13931q-2.684253-2.684253 0-5.368506Z"
                      fill="#ffffff"
                      p-id="2358"
                    ></path>
                    <path
                      d="M716.242933 895.111782m-2.684253-2.684254l-17.895022-17.895022q-2.684253-2.684253 0-5.368507l72.139309-72.139309q2.684253-2.684253 5.368506 0l17.895023 17.895023q2.684253 2.684253 0 5.368506l-72.139309 72.139309q-2.684253 2.684253-5.368507 0Z"
                      fill="#ffffff"
                      p-id="2359"
                    ></path>
                  </svg>
                </el-button>
                <!-- 水务模式下隐藏：CAD转JSON -->
                <!-- <el-button 
              v-if="!waterServiceMode"
              type="success" 
              size="small"
              @click="cadToJson" 
              :disabled="isLoading || isAwaitingFeedback || uploadedImages.length === 0"
              :loading="isCadConverting"
            >
              {{ isCadConverting ? '转换中' : 'CAD转JSON' }}
            </el-button> -->
                <!-- 已上传文件列表 -->
                <div v-if="uploadedImages.length > 0" class="uploaded-files-bar">
                  <div class="uploaded-files-list">
                    <div
                      v-for="(file, index) in uploadedImages"
                      :key="index"
                      class="uploaded-file-tag"
                      @click="previewUploadedFile(index)"
                    >
                      <span class="uploaded-file-icon">
                        <span v-if="isImageFile(file)">🖼️</span>
                        <span v-else-if="file.extension === 'txt'">📝</span>
                        <span v-else>📄</span>
                      </span>
                      <span class="uploaded-file-name">{{ file.name }}</span>
                      <button
                        class="uploaded-file-remove"
                        @click.stop="removeUploadedFile(index)"
                        title="删除"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
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
                    @click="stopGeneration()"
                    class="stop-button"
                    title="停止"
                  >
                    <svg
                      t="1783304242585"
                      class="stop-icon"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                    >
                      <path
                        d="M678.592 639.68c0 17.6-14.4 32-32 32h-268.992a32 32 0 0 1-32-32v-260.608a32 32 0 0 1 32-32h268.992c17.6 0 32 14.4 32 32v260.608z"
                        fill="#ffffff"
                      ></path>
                      <path
                        d="M1015.552 512.128a502.656 502.656 0 0 0-503.68-503.68 502.208 502.208 0 0 0-356.096 147.264 502.016 502.016 0 0 0-147.328 356.416 500.288 500.288 0 0 0 146.816 356.736 499.584 499.584 0 0 0 356.544 146.688c277.312-2.816 503.744-226.24 503.744-503.424z m-947.968 0a444.288 444.288 0 0 1 444.288-444.544c246.976 0 447.296 200.128 447.296 444.544 0 244.032-200.32 444.416-447.296 444.416a442.304 442.304 0 0 1-444.288-444.416z"
                        fill="#ffffff"
                      ></path>
                    </svg>
                  </el-button>
                  <!-- 助手下拉框 -->
                  <select
                    v-show="false"
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

                  <el-button
                    type="success"
                    size="small"
                    @click="sendDispatch"
                    :disabled="isLoading || isAwaitingFeedback || !userQuery.trim()"
                    class="send-button"
                    title="发送调度"
                    v-show="!isLoading && !isCadConverting"
                  >
                    <template v-if="isLoading">发送中</template>
                    <svg
                      v-else
                      t="1783304326600"
                      class="icon"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                    >
                      <path
                        d="M512 981.333333q11.52 0 23.04-0.554666t22.954667-1.706667q11.477333-1.109333 22.869333-2.816 11.392-1.706667 22.698667-3.925333 11.306667-2.261333 22.485333-5.077334 11.178667-2.773333 22.186667-6.144 11.008-3.328 21.888-7.210666 10.837333-3.882667 21.461333-8.277334 10.666667-4.437333 21.077333-9.386666 10.410667-4.906667 20.565334-10.325334 10.197333-5.418667 20.053333-11.349333 9.898667-5.930667 19.456-12.330667 9.6-6.4 18.858667-13.226666 9.258667-6.912 18.133333-14.208 8.96-7.296 17.493333-15.018667 8.533333-7.765333 16.64-15.914667 8.149333-8.106667 15.914667-16.64 7.68-8.533333 15.018667-17.493333 7.296-8.874667 14.165333-18.133333t13.269333-18.858667q6.4-9.557333 12.330667-19.456 5.930667-9.898667 11.349333-20.053333 5.418667-10.154667 10.368-20.565334 4.906667-10.410667 9.344-21.077333 4.394667-10.666667 8.277334-21.504 3.882667-10.837333 7.253333-21.888 3.328-11.008 6.101333-22.186667 2.816-11.178667 5.077334-22.485333 2.218667-11.306667 3.925333-22.698667t2.816-22.869333q1.152-11.434667 1.706667-22.954667Q981.333333 523.52 981.333333 512t-0.554666-23.04q-0.554667-11.52-1.706667-22.954667-1.109333-11.477333-2.816-22.869333-1.706667-11.392-3.925333-22.698667-2.261333-11.306667-5.077334-22.485333-2.773333-11.178667-6.144-22.186667-3.328-11.050667-7.210666-21.888-3.882667-10.837333-8.277334-21.504-4.437333-10.624-9.386666-21.034666-4.906667-10.410667-10.325334-20.565334-5.418667-10.197333-11.349333-20.053333-5.930667-9.898667-12.330667-19.456-6.4-9.6-13.226666-18.858667-6.912-9.258667-14.208-18.133333-7.296-8.96-15.018667-17.493333-7.765333-8.533333-15.914667-16.64-8.106667-8.149333-16.64-15.872-8.533333-7.765333-17.493333-15.061334-8.874667-7.296-18.133333-14.165333t-18.858667-13.269333q-9.557333-6.4-19.456-12.330667-9.898667-5.930667-20.053333-11.349333-10.154667-5.418667-20.565334-10.368-10.410667-4.906667-21.077333-9.344-10.624-4.394667-21.461333-8.277334-10.88-3.882667-21.888-7.253333-11.008-3.328-22.186667-6.101333-11.178667-2.816-22.485333-5.077334-11.306667-2.218667-22.698667-3.925333t-22.869333-2.816q-11.434667-1.109333-22.954667-1.706667Q523.52 42.666667 512 42.666667t-23.04 0.554666q-11.52 0.597333-22.954667 1.706667-11.477333 1.109333-22.869333 2.816-11.392 1.706667-22.698667 3.925333-11.306667 2.261333-22.485333 5.077334-11.178667 2.773333-22.186667 6.144-11.050667 3.328-21.888 7.210666-10.837333 3.882667-21.504 8.277334-10.624 4.437333-21.034666 9.386666-10.410667 4.906667-20.565334 10.325334-10.197333 5.418667-20.053333 11.349333-9.898667 5.930667-19.456 12.330667-9.6 6.4-18.858667 13.226666-9.258667 6.912-18.133333 14.208-8.96 7.296-17.493333 15.061334-8.533333 7.68-16.64 15.872-8.149333 8.106667-15.872 16.64-7.765333 8.533333-15.061334 17.493333-7.296 8.874667-14.165333 18.133333t-13.269333 18.858667q-6.4 9.557333-12.330667 19.456-5.930667 9.856-11.349333 20.053333-5.418667 10.154667-10.368 20.565334-4.906667 10.410667-9.344 21.034666-4.394667 10.666667-8.277334 21.504-3.882667 10.837333-7.253333 21.888-3.328 11.008-6.101333 22.186667-2.816 11.178667-5.077334 22.485333-2.218667 11.306667-3.925333 22.698667t-2.816 22.869333q-1.109333 11.434667-1.706667 22.954667Q42.666667 500.48 42.666667 512t0.554666 23.04q0.597333 11.52 1.706667 22.954667 1.109333 11.477333 2.816 22.869333 1.706667 11.392 3.925333 22.698667 2.261333 11.306667 5.077334 22.485333 2.773333 11.178667 6.144 22.186667 3.328 11.008 7.210666 21.888 3.882667 10.837333 8.277334 21.461333 4.437333 10.666667 9.386666 21.077333 4.906667 10.410667 10.325334 20.565334 5.418667 10.197333 11.349333 20.053333 5.930667 9.898667 12.330667 19.456 6.4 9.6 13.226666 18.858667 6.912 9.258667 14.208 18.133333 7.296 8.96 15.061334 17.493333 7.68 8.533333 15.872 16.64 8.106667 8.149333 16.64 15.914667 8.533333 7.68 17.493333 15.018667 8.874667 7.296 18.133333 14.165333t18.858667 13.269333q9.557333 6.4 19.456 12.330667 9.856 5.930667 20.053333 11.349333 10.154667 5.418667 20.565334 10.368 10.410667 4.906667 21.034666 9.344 10.666667 4.394667 21.504 8.277334 10.837333 3.882667 21.888 7.253333 11.008 3.328 22.186667 6.101333 11.178667 2.816 22.485333 5.077334 11.306667 2.218667 22.698667 3.925333t22.869333 2.816q11.434667 1.152 22.954667 1.706667 11.52 0.554667 23.04 0.554666z m-10.666667-673.322666a32 32 0 0 1 45.226667 0l150.613333 150.186666a32 32 0 1 1-45.226666 45.312l-96-95.744V725.333333a32 32 0 0 1-64 0V407.765333L395.946667 503.466667a32 32 0 1 1-45.226667-45.312l150.613333-150.186667z"
                        fill="#ffffff"
                      ></path>
                    </svg>
                  </el-button>
                </div>
              </div>

              <!-- 上传图片输入框（隐藏） -->
              <input
                ref="fileInput"
                type="file"
                multiple
                style="display: none"
                @change="handleImageUpload"
              />

              <!-- 图片预览弹窗 -->
              <el-dialog
                v-model="imagePreviewVisible"
                :title="`${getCurrentPreviewFile?.mime_type === 'text/plain' ? '文件' : '图片'}预览 (${isNaN(isGatewayPreview ? gatewayPreviewIndex : currentPreviewIndex) ? 1 : (isGatewayPreview ? gatewayPreviewIndex : currentPreviewIndex) + 1} / ${isGatewayPreview ? (Array.isArray(gatewayPreviewImages) ? gatewayPreviewImages.length : 0) : Array.isArray(uploadedImages) ? uploadedImages.length : 0})`"
                width="1100px"
                append-to-body
                :z-index="20000"
                @open="resetImageScale"
                @close="handlePreviewClose"
              >
                <div class="multi-image-preview-wrapper">
                  <!-- 主内容区域 -->
                  <div
                    v-if="getCurrentPreviewFile?.mime_type === 'text/plain'"
                    class="text-preview-container"
                  >
                    <div class="text-preview-header">
                      <span class="text-preview-filename">{{ getCurrentPreviewFile.name }}</span>
                      <button class="copy-text-btn" @click="copyPreviewText">📋 复制文本</button>
                    </div>
                    <pre class="text-preview-content">{{ getCurrentPreviewFile.textContent }}</pre>
                  </div>
                  <div
                    v-else
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
                      :alt="`图片 ${(isGatewayPreview ? gatewayPreviewIndex : currentPreviewIndex) + 1}`"
                      class="preview-image"
                      :class="{ 'is-dragging': isDragging }"
                      :style="{
                        transform: `translate(${offsetX}px, ${offsetY}px) scale(${imageScale})`,
                      }"
                      @click.stop="resetImageScale"
                    />
                  </div>
                </div>
                <div class="image-preview-hint">
                  {{
                    getCurrentPreviewFile?.mime_type === "text/plain"
                      ? "点击复制按钮复制文本内容"
                      : "滚轮缩放图片，右键拖动查看细节，点击图片重置"
                  }}
                </div>
              </el-dialog>

              <!-- 验证结果图片预览弹窗 -->
              <el-dialog
                v-model="validationResultImageVisible"
                title="验证结果图片"
                width="800px"
                append-to-body
                :z-index="20000"
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
                    :style="{
                      transform: `translate(${offsetX}px, ${offsetY}px) scale(${imageScale})`,
                    }"
                    @click.stop="resetImageScale"
                  />
                </div>
                <div class="image-preview-hint">滚轮缩放图片，拖动查看细节，点击图片重置</div>
                <div
                  v-if="validationResultJson"
                  style="
                    margin-top: 16px;
                    padding: 12px;
                    background-color: #f5f5f5;
                    border-radius: 8px;
                  "
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
                    <span
                      :style="{ color: validationResultJson.success ? '#67c23a' : '#f56c6c' }"
                      >{{ validationResultJson.success ? "成功" : "失败" }}</span
                    >
                  </p>
                </div>
              </el-dialog>

              <!-- 确认清空对话框 -->
              <el-dialog
                v-model="confirmDialogVisible"
                title="确认清空"
                width="400px"
                append-to-body
                :show-close="false"
                :close-on-click-modal="false"
                :close-on-press-escape="false"
              >
                <div class="confirm-dialog-content">
                  <div class="confirm-icon">⚠️</div>
                  <p>确定要清空所有对话内容吗？</p>
                  <p class="confirm-hint">此操作将删除所有消息和已上传的图片，且无法恢复。</p>
                </div>
                <template #footer>
                  <div class="confirm-dialog-footer">
                    <el-button type="primary" @click="confirmClear">确定</el-button>
                    <el-button @click="cancelClear">取消</el-button>
                  </div>
                </template>
              </el-dialog>

              <div class="dialog-footer">
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
                  <!-- 重置步骤按钮 -->
                  <el-button
                    v-if="currentStep > 1"
                    type="default"
                    size="small"
                    @click="resetSteps"
                    :disabled="isLoading || isAwaitingFeedback"
                    title="重置到步骤1"
                    class="reset-button"
                  >
                    重置
                  </el-button>
                  <el-button
                    v-if="!waterServiceMode"
                    type="success"
                    @click="fetchAndSaveScreenAI"
                    :disabled="isLoading || isAwaitingFeedback"
                    >AI生成画布</el-button
                  >
                </div>
              </div>
            </div>
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
import localforage from "localforage";

const indexedDBStore = localforage.createInstance({
  name: "DifyChatDB",
  version: 1,
  storeName: "dify_chat_data",
  description: "Dify chatbot data storage using IndexedDB",
  driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingContent?: string;
  isHumanInteraction?: boolean;
  isGateway?: boolean;
  isGatewayActionDisabled?: boolean;
  formToken?: string;
  workflowRunId?: string;
  isProcessed?: boolean;
  humanInput?: string;
  gatewayImages?: any[];
  gatewayNextStep?: number;
  conversationId?: string;
  files?: any[];
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
  isGateway?: boolean;
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
    // difyapidialog 专用 API Key (FLOW_getway)
    apiKeyFlowGetway: {
      type: String,
      default: import.meta.env.VITE_APP_DIFY_API_KEY_FLOW_getway || "",
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
      default: import.meta.env.VITE_APP_DIFY_USER_ID || "huyz",
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

    const dialogPosition = ref({ x: (window.innerWidth - 900) / 2, y: (window.innerHeight - 700) / 2 });
    const dragOffset = ref({ x: 0, y: 0 });
    const isDialogDragging = ref(false);
    const isResizing = ref(false);
    const resizeDirection = ref("");
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });
    const dialogWidth = ref(900);
    const dialogHeight = ref(700);
    const timeoutTimer = ref<number | null>(null);
    // SSE 超时时间，从环境变量读取，默认 90 秒
    const SSE_TIMEOUT_MS = Number(import.meta.env.VITE_APP_DIFY_SSE_TIMEOUT_MS) || 90000;
    // 标记用户是否手动停止
    const isUserManualStop = ref(false);

    const getEventDisplayName = (event: string, data: any): string => {
      if (!event) return "处理中";

      const eventMap: Record<string, string> = {
        loop_started: "循环开始",
        loop_ended: "循环结束",
        node_started: "当前节点",
        node_ended: "节点结束",
        tool_calling: "工具调用中",
        tool_called: "工具调用完成",
        agent_thinking: "思考中",
        agent_planning: "规划中",
        agent_executing: "执行中",
        agent_reviewing: "回顾中",
      };

      let displayName = eventMap[event] || event.replace(/_/g, " ");

      if (data) {
        if (data.title) {
          displayName += ` - ${data.title}`;
        } else if (data.node_type) {
          const nodeTypeMap: Record<string, string> = {
            loop: "循环",
            tool: "工具",
            llm: "LLM",
            condition: "条件判断",
            delay: "延迟",
            webhook: "Webhook",
            code: "代码",
          };
          displayName += ` - ${nodeTypeMap[data.node_type] || data.node_type}`;
        }
        if (data.metadata && data.metadata.loop_length) {
          displayName += ` (共${data.metadata.loop_length}次)`;
        }
        if (data.inputs && data.inputs.loop_count !== undefined) {
          displayName += ` #${data.inputs.loop_count}`;
        }
      }

      return displayName;
    };

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
    const uploadedImages = ref<any[]>([]); // 保存所有上传的图片信息
    const currentPreviewIndex = ref(0); // 当前预览图片索引
    const isCadConverting = ref(false); // CAD转JSON转换状态
    const isGatewayPreview = ref(false); // 是否正在预览网关上传的图片

    // 确认对话框
    const confirmDialogVisible = ref(false);

    // 流程步骤管理
    const currentStep = ref(1); // 当前步骤：1=助手5，2=助手6，3=助手7
    const stepResults = ref<Record<number, string>>({}); // 保存各步骤的结果
    const needAutoProceedToStep2 = ref(false); // 是否需要自动进入步骤2
    const needAutoProceedToStep3 = ref(false); // 是否需要自动进入步骤3

    // 网关模式相关状态
    const lasttask = ref(-1); // 上一次任务标识
    const lastquerytask = ref(-1); // 上一次查询任务标识
    const gatewayNextStep = ref(-1); // 当前网关返回的下一步
    const gatewayUploadedImages = ref<any[]>([]); // 网关模式下当前步骤上传的文件
    const gatewayPreviewImages = ref<any[]>([]); // 网关模式下预览的图片
    const gatewayPreviewIndex = ref(0); // 网关模式下预览的索引

    // nextstep 与 API Key 的映射关系
    const stepApiKeyMap: Record<number, { apiKey: string; logPrefix: string; label: string }> = {
      1: { apiKey: props.apiKeyFlowB1 || "", logPrefix: "发送5", label: "图纸识别" },
      2: { apiKey: props.apiKeyFlowB2 || "", logPrefix: "发送6", label: "点位绑定" },
      3: { apiKey: props.apiKeyFlowB3 || "", logPrefix: "发送7", label: "生成DSL" },
    };

    const getStepLabel = (nextStep: number) => {
      const stepConfig = stepApiKeyMap[nextStep];
      return stepConfig?.label || "";
    };

    const handleGatewayUpload = async (event: Event, conversationId: string) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i], "gateway", undefined, conversationId);
      }
      target.value = "";
    };

    const viewGatewayImages = (conversationId: string) => {
      const msg = messages.value.find((m) => m.conversationId === conversationId);
      if (!msg || !msg.gatewayImages || msg.gatewayImages.length === 0) return;
      gatewayPreviewImages.value = [...msg.gatewayImages];
      gatewayPreviewIndex.value = 0;
      isGatewayPreview.value = true;
      imagePreviewVisible.value = true;
    };

    const proceedToNextStep = async (conversationId: string, nextStep: number) => {
      const msg = messages.value.find((m) => m.conversationId === conversationId);
      if (!msg) return;

      const stepConfig = stepApiKeyMap[nextStep];
      console.log(`\n🚀 准备执行 proceedToNextStep:`);
      console.log(
        `  - 当前步骤 (currentStep): ${currentStep.value} (${getStepLabel(currentStep.value)})`,
      );
      console.log(`  - 要切换到的步骤 (nextStep): ${nextStep} (${getStepLabel(nextStep)})`);
      console.log(`  - 目标消息 (isGateway): ${msg.isGateway}`);
      console.log(`  - 目标消息 gatewayNextStep: ${msg.gatewayNextStep}`);
      console.log(
        `  - 使用的 API Key: ${stepConfig?.apiKey ? "***" + stepConfig.apiKey.slice(-4) : "未设置"}`,
      );

      messages.value.forEach((m) => {
        if (m.isGateway) {
          m.isGatewayActionDisabled = true;
        }
      });

      if (!stepConfig || !stepConfig.apiKey) {
        ElMessage.warning("未配置该步骤的 API Key");
        return;
      }

      currentStep.value = nextStep;
      if (props.waterServiceMode) {
        selectedSendType.value = "sendWater";
      } else {
        const stepSendTypeMap: Record<number, string> = {
          1: "send5",
          2: "send6",
          3: "send7",
        };
        selectedSendType.value = stepSendTypeMap[nextStep] || "send5";
      }

      const stepLabel = getStepLabel(nextStep);

      await sendRequest({
        apiKey: stepConfig.apiKey,
        logPrefix: stepConfig.logPrefix,
        query: `请帮我${stepLabel}`,
        supportWorkflowPaused: true,
        isGateway: false,
        skipUserMessage: true,
        files: (msg.gatewayImages || []).map((img: any) => ({
          type: "image",
          transfer_method: "local_file",
          upload_file_id: img.id,
        })),
      });
    };

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
      isGatewayPreview.value = false;
    };

    // 人工介入相关
    const isSubmitting = ref(false);
    const isAwaitingFeedback = ref(false); // 是否正在等待用户反馈

    // 消息持久化相关
    const isHydrating = ref(false);
    const STORAGE_KEY_PREFIX = "dify-chat-messages-";
    const getScreenId = () => {
      const hash = window.location.hash;
      if (hash) {
        const parts = hash
          .replace("#", "")
          .split("/")
          .filter((p) => p);
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (/^\d+$/.test(lastPart)) {
            return lastPart;
          }
        }
      }
      return EditorModule.screen?.id || "default";
    };
    const getStorageKey = () => {
      const screenId = getScreenId();
      console.log("拿到的screeid", screenId);
      return STORAGE_KEY_PREFIX + screenId;
    };

    const getStepStorageKey = () => {
      const screenId = getScreenId();
      return STORAGE_KEY_PREFIX + screenId + "-steps";
    };

    const getUploadImageStorageKey = () => {
      const screenId = getScreenId();
      return "dify_uploaded_image-" + screenId;
    };

    let saveMessagesTimer: number | null = null;
    const saveMessagesToStorage = () => {
      if (isHydrating.value) return;
      if (saveMessagesTimer) {
        clearTimeout(saveMessagesTimer);
      }
      saveMessagesTimer = window.setTimeout(async () => {
        try {
          const messagesToSave = messages.value.map((msg) => {
            const { thinkingContent, ...rest } = msg;
            return rest;
          });
          const plainData = JSON.parse(JSON.stringify(messagesToSave));
          await indexedDBStore.setItem(getStorageKey(), plainData);
        } catch (e) {
          console.error("保存消息到 IndexedDB 失败:", e);
        }
      }, 5000);
    };

    const saveStepStateToStorage = async () => {
      if (isHydrating.value) return;
      try {
        const stepState = {
          currentStep: currentStep.value,
          stepResults: stepResults.value,
          assistant5RecognitionResult: assistant5RecognitionResult.value,
        };
        const plainData = JSON.parse(JSON.stringify(stepState));
        await indexedDBStore.setItem(getStepStorageKey(), plainData);
      } catch (e) {
        console.error("保存步骤状态到 IndexedDB 失败:", e);
      }
    };

    const loadMessagesFromStorage = async () => {
      try {
        const saved = await indexedDBStore.getItem(getStorageKey());
        if (saved) {
          if (Array.isArray(saved)) {
            messages.value = saved;
          }
        }
      } catch (e) {
        console.error("从 IndexedDB 恢复消息失败:", e);
      }
    };

    const loadStepStateFromStorage = async () => {
      try {
        const saved = await indexedDBStore.getItem(getStepStorageKey());
        if (saved) {
          const parsed = saved as {
            currentStep?: number;
            stepResults?: Record<number, string>;
            assistant5RecognitionResult?: string;
          };
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
      } catch (e) {
        console.error("从 IndexedDB 恢复步骤状态失败:", e);
      }
    };

    watch(
      () => messages.value,
      () => {
        const lastMsg = messages.value[messages.value.length - 1];
        if (!lastMsg || !lastMsg.isThinking) {
          saveMessagesToStorage();
        }
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
      async () => {
        uploadedImages.value = [];
        await restoreUploadedImage();
      },
    );

    onMounted(async () => {
      isHydrating.value = true;
      await loadMessagesFromStorage();
      await loadStepStateFromStorage();
      isHydrating.value = false;

      // 根据恢复的步骤状态更新选中的发送类型（使用网关助手进行统一调度）
      if (currentStep.value === 1) {
        selectedSendType.value = props.waterServiceMode ? "sendWater" : "sendGetway";
      } else if (currentStep.value === 2) {
        selectedSendType.value = props.waterServiceMode ? "sendWater" : "sendGetway";
      } else if (currentStep.value === 3) {
        selectedSendType.value = props.waterServiceMode ? "sendWater" : "sendGetway";
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

      // 通过 conversationId 查找消息
      const findMessageByConversationId = (conversationId: string) => {
        return messages.value.find((msg) => msg.conversationId === conversationId);
      };

      // 网关上传文件函数
      (window as any).__gatewayUploadFiles = async (
        input: HTMLInputElement,
        conversationId: string,
      ) => {
        const files = input.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
          await uploadFile(files[i], "gateway", undefined, conversationId);
        }
        input.value = "";

        // 更新对应消息中的操作区域
        updateGatewayActionArea(conversationId);
      };

      // 更新网关消息中的操作区域
      const updateGatewayActionArea = (conversationId?: string) => {
        let targetMsg;
        if (conversationId) {
          targetMsg = findMessageByConversationId(conversationId);
        } else {
          targetMsg = messages.value[messages.value.length - 1];
        }

        if (!targetMsg || targetMsg.role !== "assistant") return;

        const nextStep = targetMsg.gatewayNextStep;
        const nextStepConfig = stepApiKeyMap[nextStep || 0];
        if (nextStep && nextStep >= 1 && nextStep <= 3 && nextStepConfig) {
          const hasImages = (targetMsg.gatewayImages || []).length > 0;
          const actionArea = `<div class="gateway-action-area"><div class="gateway-upload-section"><label class="gateway-upload-btn"><input type="file" multiple accept="image/*,.dwg,.dxf,.pdf" class="gateway-upload-input" onchange="window.__gatewayUploadFiles(this, '${targetMsg.conversationId}')"/><span>📁 上传文件</span></label></div><div class="gateway-view-section"><button class="gateway-view-btn" onclick="window.__viewGatewayImages('${targetMsg.conversationId}')" ${!hasImages ? "disabled" : ""}>🖼️ 查看 (${(targetMsg.gatewayImages || []).length})</button></div><div class="gateway-next-step"><button class="gateway-next-btn" onclick="window.__proceedToNextStep('${targetMsg.conversationId}', ${nextStep})">🚀 开始${nextStepConfig.label}</button></div></div>`;

          let content = targetMsg.content;
          if (content.includes("GATEWAY_ACTION_PLACEHOLDER")) {
            // 删除占位符后面的所有内容（包括旧的操作区域）
            const placeholderIndex = content.indexOf("<!-- GATEWAY_ACTION_PLACEHOLDER -->");
            if (placeholderIndex !== -1) {
              content = content.substring(
                0,
                placeholderIndex + "<!-- GATEWAY_ACTION_PLACEHOLDER -->".length,
              );
              // 添加新的操作区域和结束标签
              content = content + actionArea + "</div>";
              targetMsg.content = content;
            }
          }
        }
      };

      // 查看网关上传的文件
      (window as any).__viewGatewayImages = (conversationId: string) => {
        const msg = findMessageByConversationId(conversationId);
        if (!msg || !msg.gatewayImages || msg.gatewayImages.length === 0) return;
        gatewayPreviewImages.value = [...msg.gatewayImages];
        gatewayPreviewIndex.value = 0;
        isGatewayPreview.value = true;
        imagePreviewVisible.value = true;
      };

      // 网关下一步操作函数
      (window as any).__proceedToNextStep = async (conversationId: string, nextStep: number) => {
        const msg = findMessageByConversationId(conversationId);
        if (!msg) return;

        const stepConfig = stepApiKeyMap[nextStep];
        if (!stepConfig || !stepConfig.apiKey) {
          ElMessage.warning("未配置该步骤的 API Key");
          return;
        }

        currentStep.value = nextStep;
        selectedSendType.value = props.waterServiceMode ? "sendWater" : "sendGetway";

        await sendRequest({
          apiKey: stepConfig.apiKey,
          logPrefix: stepConfig.logPrefix,
          supportWorkflowPaused: true,
          isGateway: false,
          files: (msg.gatewayImages || []).map((img: any) => ({
            type: "image",
            transfer_method: "local_file",
            upload_file_id: img.id,
          })),
        });

        // 清空该消息的网关上传文件
        if (msg.gatewayImages) {
          msg.gatewayImages = [];
        }
      };

      // 恢复上传的图片信息
      restoreUploadedImage();

      // 监听剪贴板粘贴事件
      document.addEventListener("paste", handlePaste);
    });

    onUnmounted(() => {
      document.removeEventListener("paste", handlePaste);
      if (saveMessagesTimer) {
        clearTimeout(saveMessagesTimer);
      }
    });

    // 推荐问题相关
    const recommendQuestions = [
      "请帮我识别我上传的图片",
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
        id: "sendGetway",
        label: "网关助手",
        title: "网关专用",
        config: {
          apiKey: props.apiKeyFlowGetway || "",
          logPrefix: "发送Getway",
          supportWorkflowPaused: true,
          isGateway: true,
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

    const selectedSendType = ref<string>(props.waterServiceMode ? "sendWater" : "sendGetway");

    const previewImageUrl = computed(() => {
      const images = isGatewayPreview.value ? gatewayPreviewImages.value : uploadedImages.value;
      if (!Array.isArray(images) || images.length === 0) return "";
      const maxIndex = images.length - 1;
      const index = isGatewayPreview.value
        ? isNaN(gatewayPreviewIndex.value)
          ? 0
          : gatewayPreviewIndex.value
        : isNaN(currentPreviewIndex.value)
          ? 0
          : currentPreviewIndex.value;
      const validIndex = Math.max(0, Math.min(index, maxIndex));
      return images[validIndex]?.base64Data || "";
    });

    const getCurrentPreviewFile = computed(() => {
      const images = isGatewayPreview.value ? gatewayPreviewImages.value : uploadedImages.value;
      if (!Array.isArray(images) || images.length === 0) return null;
      const maxIndex = images.length - 1;
      const index = isGatewayPreview.value
        ? isNaN(gatewayPreviewIndex.value)
          ? 0
          : gatewayPreviewIndex.value
        : isNaN(currentPreviewIndex.value)
          ? 0
          : currentPreviewIndex.value;
      const validIndex = Math.max(0, Math.min(index, maxIndex));
      return images[validIndex] || null;
    });

    const copyPreviewText = async () => {
      if (getCurrentPreviewFile.value?.textContent) {
        try {
          await navigator.clipboard.writeText(getCurrentPreviewFile.value.textContent);
          ElMessage.success("文本已复制到剪贴板");
        } catch (e) {
          ElMessage.error("复制失败");
        }
      }
    };

    const selectOptions = computed(() => {
      return sendTypes.value.map((t) => {
        let disabled = t.isWaterOnly && !props.waterServiceMode;

        // 根据当前步骤限制可选的助手（网关模式不限制）
        if (!props.waterServiceMode) {
          if (currentStep.value === 1) {
            disabled = disabled || (t.id !== "send5" && t.id !== "sendGetway");
          } else if (currentStep.value === 2) {
            disabled = disabled || (t.id !== "send6" && t.id !== "sendGetway");
          } else if (currentStep.value === 3) {
            disabled = disabled || (t.id !== "send7" && t.id !== "sendGetway");
          }
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

      // 根据当前步骤限制可选的助手（网关模式不限制）
      if (!props.waterServiceMode) {
        if (currentStep.value === 1) {
          disabled = disabled || (type.id !== "send5" && type.id !== "sendGetway");
        } else if (currentStep.value === 2) {
          disabled = disabled || (type.id !== "send6" && type.id !== "sendGetway");
        } else if (currentStep.value === 3) {
          disabled = disabled || (type.id !== "send7" && type.id !== "sendGetway");
        }
      }

      return disabled;
    };

    const resetSteps = async () => {
      currentStep.value = 1;
      stepResults.value = {};
      assistant5RecognitionResult.value = "";
      selectedSendType.value = props.waterServiceMode ? "sendWater" : "sendGetway";
      await indexedDBStore.removeItem(getStepStorageKey());

      messages.value.forEach((msg) => {
        if (msg.isGateway) {
          msg.isGatewayActionDisabled = true;
        }
      });

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

    const tryFormatJson = (text: string): string => {
      let workingText = text;
      workingText = workingText
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\\"/g, '"')
        .replace(/\\\\/g, "\\");

      try {
        const trimmed = workingText.trim();
        if (
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
          const parsed = JSON.parse(trimmed);
          return JSON.stringify(parsed, null, 2);
        }
        const firstBrace = trimmed.indexOf("{");
        const lastBrace = trimmed.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
          const jsonPart = trimmed.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(jsonPart);
          return JSON.stringify(parsed, null, 2);
        }
        const firstBracket = trimmed.indexOf("[");
        const lastBracket = trimmed.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1 && firstBracket < lastBracket) {
          const jsonPart = trimmed.substring(firstBracket, lastBracket + 1);
          const parsed = JSON.parse(jsonPart);
          return JSON.stringify(parsed, null, 2);
        }
      } catch (e) {
        console.warn("JSON格式化失败:", e);
      }
      return workingText;
    };

    const highlightJson = (jsonStr: string): string => {
      let result = jsonStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      result = result
        .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: null/g, ': <span class="json-null">null</span>');

      return result;
    };

    const formatContent = (content: any) => {
      if (content === null || content === undefined) {
        return "";
      }
      if (typeof content !== "string") {
        return String(content);
      }

      if (
        content.includes("recognition-result-wrapper") ||
        content.includes('<span class="json-key">')
      ) {
        return content;
      }

      let result = content.replace(/\n/g, " ");

      result = result.replace(/\{\{#\$output\.usercomments#\}\}/g, "");

      const recognitionToValidationPattern = /识别结果:([\s\S]*?)(?=验证结果：|$)/g;
      result = result.replace(recognitionToValidationPattern, (match, jsonContent) => {
        const id = "recognition-json-" + Math.random().toString(36).substring(2, 9);
        const formattedJson = tryFormatJson(jsonContent);
        const highlightedJson = highlightJson(formattedJson);
        return `识别结果：<a href="#" id="${id}" class="hidden-content-link" onclick="window.__toggleRecognitionJson('${id}'); return false;">展开</a><div id="${id}-content" class="hidden-content json-content" style="display:none;">${highlightedJson}</div>`;
      });

      const base64Pattern = /"image"\s*:\s*"([A-Za-z0-9+/=]{50,})"/g;
      result = result.replace(base64Pattern, (match, base64Data) => {
        const id = "base64-preview-" + Math.random().toString(36).substring(2, 9);
        if (typeof window !== "undefined") {
          (window as any).__base64PreviewData = (window as any).__base64PreviewData || {};
          (window as any).__base64PreviewData[id] = base64Data;
        }
        return `"image": "<a href="#" id="${id}" class="base64-preview-link" onclick="window.__previewBase64Image('${id}'); return false;">预览图片</a>"`;
      });

      const standaloneBase64Pattern = /(?:"|')?([A-Za-z0-9+/=]{100,})(?:"|')?/g;
      result = result.replace(standaloneBase64Pattern, (match, base64Data) => {
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

      const standaloneJsonPattern = /(\{[\s\S]*\})/g;
      result = result.replace(standaloneJsonPattern, (jsonContent) => {
        try {
          JSON.parse(jsonContent);
          const id = "json-content-" + Math.random().toString(36).substring(2, 9);
          const formattedJson = tryFormatJson(jsonContent);
          const highlightedJson = highlightJson(formattedJson);
          return `<a href="#" id="${id}" class="hidden-content-link" onclick="window.__toggleRecognitionJson('${id}'); return false;">展开</a><div id="${id}-content" class="hidden-content json-content" style="display:none;">${highlightedJson}</div>`;
        } catch {
          return jsonContent;
        }
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
        isGateway = false,
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
        const userMsg: Message = {
          role: "user",
          content: query,
          timestamp: Date.now(),
        };

        // 如果有上传的文件，将文件信息添加到用户消息中
        if (uploadedImages.value.length > 0) {
          userMsg.files = uploadedImages.value.map((img) => ({
            id: img.id,
            name: img.name,
            size: img.size,
            extension: img.extension,
            mime_type: img.mime_type,
            base64Data: img.base64Data,
            textContent: img.textContent,
          }));
        }

        messages.value.push(userMsg);

        // 发送后清空上传的文件
        if (uploadedImages.value.length > 0) {
          uploadedImages.value = [];
          try {
            await indexedDBStore.setItem(getUploadImageStorageKey(), []);
          } catch (error) {
            console.error("清空上传文件缓存失败:", error);
          }
        }
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
      // 重置手动停止标记
      isUserManualStop.value = false;

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
            abortController.value.abort();
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
        if (!files && uploadedImages.value.length > 0) {
          files = uploadedImages.value.map((img) => ({
            type: "image",
            transfer_method: "local_file",
            upload_file_id: img.id,
          }));
        }

        const inputs = isGateway
          ? {
              lasttask: lasttask.value,
              lastquerytask: lastquerytask.value,
            }
          : props.data;
        const requestBody = {
          inputs: inputs,
          query: query,
          response_mode: "streaming",
          conversation_id: isGateway ? "" : conversationId.value || "",
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

              // 保存 task_id 用于停止请求（所有事件类型都可能包含 task_id）
              if (data.task_id) {
                currentTaskId.value = data.task_id;
              }

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

              // 处理其他事件类型 - 更新思考过程
              if (
                !data.event ||
                ["message", "workflow_finished", "workflow_paused", "error"].indexOf(data.event) ===
                  -1
              ) {
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === "assistant" && lastMsg.isThinking) {
                  const eventDisplayName = getEventDisplayName(data.event, data.data);
                  lastMsg.thinkingContent = eventDisplayName;
                }
              }

              // 处理普通消息 - 实时更新
              if (data.event === "message" && data.answer) {
                // 保存 task_id 用于停止请求
                if (data.task_id) {
                  currentTaskId.value = data.task_id;
                }

                let answerContent = data.answer;
                // console.log(`isGateway：`,isGateway);
                // console.log(`data.answer：`, data.answer);
                // 网关模式：解析网关返回的 JSON 格式
                if (isGateway) {
                  try {
                    let answerStr = data.answer;
                    // 去除可能的 SSE 前缀或其他包装字符
                    answerStr = answerStr.trim();
                    if (answerStr.startsWith("data:")) {
                      answerStr = answerStr.substring(5).trim();
                    }
                    // 去除可能的转义字符
                    if (answerStr.startsWith('"') && answerStr.endsWith('"')) {
                      answerStr = answerStr.slice(1, -1).replace(/\\"/g, '"');
                    }

                    const gatewayData = JSON.parse(answerStr);
                    // console.log(`解析后的 gatewayData：`, gatewayData);
                    // console.log(`gatewayData.prompt：`, gatewayData.prompt);
                    // console.log(`gatewayData.content：`, gatewayData.content);

                    let displayContent = "";
                    if (gatewayData.prompt !== undefined && gatewayData.prompt !== "") {
                      displayContent += gatewayData.prompt;
                    }
                    if (gatewayData.content !== undefined && gatewayData.content !== "") {
                      const contentStr =
                        typeof gatewayData.content === "string"
                          ? gatewayData.content
                          : JSON.stringify(gatewayData.content);
                      displayContent += "\n\n" + contentStr;
                    }

                    // 更新网关状态
                    if (gatewayData.nextstep !== undefined) {
                      lasttask.value = gatewayData.nextstep;
                      lastquerytask.value = gatewayData.nextstep;
                      gatewayNextStep.value = gatewayData.nextstep;
                      currentStep.value = gatewayData.nextstep;

                      const stepConfig = stepApiKeyMap[gatewayData.nextstep];
                      console.log(`\n📢 网关返回消息，更新状态:`);
                      console.log(
                        `  - gatewayData.nextstep: ${gatewayData.nextstep} (${getStepLabel(gatewayData.nextstep)})`,
                      );
                      console.log(`  - 更新后的 currentStep: ${currentStep.value}`);
                      console.log(
                        `  - 当前步骤 API Key: ${stepConfig?.apiKey ? "***" + stepConfig.apiKey.slice(-4) : "未设置"}`,
                      );
                    }

                    // 获取 conversation_id
                    const convId = data.conversation_id || `conv-${Date.now()}`;

                    // 设置消息为网关模式，由模板的v-if控制显示
                    answerContent = displayContent;

                    // 将 conversation_id、nextstep 和空的文件列表添加到消息中
                    const msgIndex = messages.value.length - 1;
                    const currentMsg = messages.value[msgIndex];
                    messages.value[msgIndex] = {
                      ...currentMsg,
                      isGateway: true,
                      gatewayNextStep: gatewayNextStep.value,
                      gatewayImages: currentMsg.gatewayImages || [],
                      conversationId: currentMsg.conversationId || convId,
                    };
                  } catch (e) {
                    console.warn(`${logPrefix} 网关模式解析 answer 失败，使用原始内容`, e);
                    console.warn(`原始 answer：`, data.answer);
                  }
                }
                // console.log(`最终 answerContent：`, answerContent);

                fullContent += data.answer;
                const lastMsg = messages.value[messages.value.length - 1];
                if (lastMsg?.role === "assistant") {
                  lastMsg.isThinking = false;
                  lastMsg.content = isGateway ? answerContent : fullContent;
                  await scrollToBottom();
                }
              }

              // 处理 workflow_finished 事件 - 最终完成
              if (data.event === "workflow_finished" && data.data) {
                console.log(`${logPrefix} 找到 workflow_finished 事件`);
                // console.log(`${logPrefix} workflow_finished 数据:`, JSON.stringify(data.data));

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

                  // 网关模式：解析网关返回的 JSON 格式
                  if (isGateway) {
                    try {
                      let answerStr = fullContent.trim();
                      if (answerStr.startsWith("data:")) {
                        answerStr = answerStr.substring(5).trim();
                      }
                      if (answerStr.startsWith('"') && answerStr.endsWith('"')) {
                        answerStr = answerStr.slice(1, -1).replace(/\\"/g, '"');
                      }

                      const gatewayData = JSON.parse(answerStr);
                      let displayContent = "";
                      if (gatewayData.prompt !== undefined && gatewayData.prompt !== "") {
                        displayContent += gatewayData.prompt;
                      }
                      if (gatewayData.content !== undefined && gatewayData.content !== "") {
                        const contentStr =
                          typeof gatewayData.content === "string"
                            ? gatewayData.content
                            : JSON.stringify(gatewayData.content);
                        displayContent += "\n\n" + contentStr;
                      }

                      // 更新网关状态
                      if (gatewayData.nextstep !== undefined) {
                        lasttask.value = gatewayData.nextstep;
                        lastquerytask.value = gatewayData.nextstep;
                        gatewayNextStep.value = gatewayData.nextstep;
                        currentStep.value = gatewayData.nextstep;
                      }

                      // 使用消息已有的 conversationId，或者从 workflow_finished 事件中获取
                      const convId =
                        lastMsg?.conversationId || data.conversation_id || `conv-${Date.now()}`;

                      // 设置消息为网关模式，由模板的v-if控制显示
                      fullContent = displayContent;

                      // 将 conversation_id、nextstep 和空的文件列表添加到消息中
                      if (lastMsg?.role === "assistant") {
                        lastMsg.isGateway = true;
                        lastMsg.conversationId = lastMsg.conversationId || convId;
                        lastMsg.gatewayNextStep = gatewayNextStep.value;
                        lastMsg.gatewayImages = lastMsg.gatewayImages || [];
                      }
                    } catch (e) {
                      console.warn(`${logPrefix} workflow_finished 网关模式解析失败`, e);
                    }
                  }

                  if (lastMsg?.role === "assistant") {
                    lastMsg.isThinking = false;
                    lastMsg.content = fullContent;
                    if (!lastMsg.isGateway && isGateway) {
                      lastMsg.isGateway = true;
                    }
                    if (!lastMsg.conversationId) {
                      lastMsg.gatewayNextStep = gatewayNextStep.value;
                      lastMsg.gatewayImages = [];
                    }
                  }
                  await scrollToBottom();

                  // 步骤1完成后标记需要进入步骤2（非人工介入场景，网关模式不自动推进）
                  if (currentStep.value === 1 && !isPaused && !isGateway) {
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

        // 更新会话 ID（网关模式下不更新全局 conversationId，保持每次调用都是新会话）
        if (newConversationId && !conversationId.value && !isGateway) {
          conversationId.value = newConversationId;
          emit("conversation-created", newConversationId);
        }

        // 如果发生了错误，不再触发 message-received 成功事件
        if (!hasError) {
          console.log(`=== ${logPrefix} 调用完成 ===`);
          console.log(`${logPrefix} 回答:`, fullContent);
          emit("message-received", fullContent);
        }

        // 在返回之前检查是否需要自动进入步骤2或步骤3（网关模式不自动推进）
        if (needAutoProceedToStep2.value && !isPaused && !isGateway) {
          needAutoProceedToStep2.value = false;
          await autoProceedToStep2();
        } else if (needAutoProceedToStep3.value && !isPaused && !isGateway) {
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
              lastMsg.content = "已手动停止";
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

    // 发送消息Getway - 使用网关专用 API Key
    const sendMessageGetway = async (queryText?: string, skipUserMsg = false) => {
      messages.value.forEach((msg) => {
        if (msg.isGateway) {
          msg.isGatewayActionDisabled = true;
        }
      });
      await sendRequest({
        apiKey: props.apiKeyFlowGetway || "",
        logPrefix: "发送Getway",
        query: queryText,
        clearQuery: !queryText,
        supportWorkflowPaused: true,
        isGateway: true,
        skipUserMessage: skipUserMsg,
      });
    };

    const sendDispatch = async () => {
      const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
      if (!sendType) {
        ElMessage.warning("请选择发送类型");
        return;
      }

      if (props.waterServiceMode && sendType.id === "sendWater") {
        await sendMessageWater();
      } else if (
        sendType.id === "sendGetway" ||
        (currentStep.value >= 1 && currentStep.value <= 3) ||
        currentStep.value === -1
      ) {
        await sendMessageGetway(userQuery.value.trim());
      } else {
        await sendRequest(sendType.config);
      }
    };

    // 提交表单
    const submitForm = async (
      formToken: string,
      inputs: Record<string, any>,
      action: string,
      apiKey?: string,
    ): Promise<any> => {
      const submitUrl = `${props.baseUrl}/api/form/human_input/${formToken}`;

      const usedApiKey =
        apiKey ||
        (() => {
          const stepConfig = stepApiKeyMap[currentStep.value];
          if (stepConfig?.apiKey) {
            return stepConfig.apiKey;
          }
          const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
          return sendType?.config.apiKey || props.apiKey;
        })();

      console.log(`📤 提交表单到: ${submitUrl}`);
      console.log(`📤 使用 API Key: ${usedApiKey ? "***" + usedApiKey.slice(-4) : "未设置"}`);
      // console.log("📤 提交数据:", JSON.stringify({ inputs, action }, null, 2));

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
      // console.log("📥 返回数据:", JSON.stringify(result, null, 2));
      return result;
    };

    // 等待工作流完成
    const waitForWorkflowCompletion = async (
      workflowRunId: string,
      formToken?: string,
      intervalMs: number = 10000,
      maxRetries: number = 30,
      apiKey?: string,
    ): Promise<any> => {
      console.log(`\n⏳ 开始轮询工作流状态 (ID: ${workflowRunId})...`);

      const usedApiKey =
        apiKey ||
        (() => {
          const stepConfig = stepApiKeyMap[currentStep.value];
          if (stepConfig?.apiKey) {
            return stepConfig.apiKey;
          }
          const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
          return sendType?.config.apiKey || props.apiKey;
        })();
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
            // console.log(`   📥 human_input 返回:`, JSON.stringify(hiResult, null, 2));

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
      // console.log("助手5原始内容:", content);

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
      // 重置手动停止标记
      isUserManualStop.value = false;

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
                const completeText =
                  currentStep.value === 1
                    ? "图片识别完毕"
                    : currentStep.value === 2
                      ? "点位绑定完毕"
                      : "生成DSL完毕";
                // 存储原始文本，由formatContent函数动态格式化
                lastMsg.content = `${completeText}\n\n${recognitionResult}`;
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

          // 步骤完成后调用网关获取下一步指令
          console.log("⏰ 检查是否调用网关:", {
            status: finalResult.status,
            currentStep: currentStep.value,
            lasttask: lasttask.value,
            lastquerytask: lastquerytask.value,
          });
          if (finalResult.status === "succeeded") {
            stepResults.value[currentStep.value] = assistant5RecognitionResult.value;
            lasttask.value = currentStep.value;
            lastquerytask.value = -1;

            // 步骤3完成后，重置currentStep为-1（用于网关的lasttask）
            if (currentStep.value === 3) {
              currentStep.value = -1;
              console.log("🔄 步骤3完成，重置currentStep为-1");
            }

            console.log("🚀 准备调用网关:", {
              lasttask: lasttask.value,
              lastquerytask: lastquerytask.value,
              currentStep: currentStep.value,
            });
            isLoading.value = false;
            await sendMessageGetway("继续", true);
            isLoading.value = true;
            console.log("✅ 网关调用完成");
          } else {
            console.log("❌ 工作流未成功，不调用网关:", finalResult.status);
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

          // 如果是用户手动停止，显示"已手动停止"
          if (error.name === "AbortError" && isUserManualStop.value) {
            lastMsg.content = "已手动停止";
            ElMessage.info("已手动停止");
          } else {
            lastMsg.content = `提交失败：${error.message}`;
            ElMessage.error("提交失败：" + error.message);
          }

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }
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
        ElMessage.error("无法获取表单令牌");
        return;
      }

      isSubmitting.value = true;
      isLoading.value = true;
      // 重置手动停止标记
      isUserManualStop.value = false;

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
        const stepConfig = stepApiKeyMap[currentStep.value];
        const apiKey = stepConfig?.apiKey || props.apiKey;

        // 创建 AbortController 用于取消请求
        abortController.value = new AbortController();

        // 构建 files 参数（如果有上传的图片）
        const files =
          uploadedImages.value.length > 0
            ? uploadedImages.value.map((img) => ({
                type: "image",
                transfer_method: "local_file",
                upload_file_id: img.id,
              }))
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

                  // 保存 task_id 用于停止请求
                  if (data.task_id) {
                    currentTaskId.value = data.task_id;
                  }

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
                    const msgIndex = messages.value.length - 1;
                    const lastMsg = messages.value[msgIndex];
                    if (lastMsg?.role === "assistant") {
                      messages.value[msgIndex] = {
                        ...lastMsg,
                        isThinking: false,
                        content: pauseContent || fullContent || "工作流已暂停，等待人工介入",
                        isHumanInteraction: true,
                        formToken: currentFormToken,
                        workflowRunId: currentWorkflowRunId,
                      };
                      saveMessagesToStorage();
                    }

                    await scrollToBottom();
                    // 再次确保滚动到最新的人工介入区域
                    setTimeout(() => scrollToBottom(), 100);
                    break;
                  }

                  // 处理其他事件类型 - 更新思考过程
                  if (
                    data.event &&
                    [
                      "message",
                      "workflow_finished",
                      "workflow_paused",
                      "error",
                      "message_end",
                    ].indexOf(data.event) === -1
                  ) {
                    const msgIndex = messages.value.length - 1;
                    const lastMsg = messages.value[msgIndex];
                    if (lastMsg?.role === "assistant" && lastMsg.isThinking) {
                      const eventDisplayName = getEventDisplayName(data.event, data.data);
                      messages.value[msgIndex] = {
                        ...lastMsg,
                        thinkingContent: eventDisplayName,
                      };
                    }
                  }

                  // 处理消息内容
                  if (data.answer) {
                    fullContent += data.answer;
                    const msgIndex = messages.value.length - 1;
                    const lastMsg = messages.value[msgIndex];
                    if (lastMsg?.role === "assistant") {
                      messages.value[msgIndex] = {
                        ...lastMsg,
                        content: fullContent,
                        isThinking: false,
                      };
                    }
                    await scrollToBottom();
                  }

                  // 处理工作流完成事件
                  if (data.event === "workflow_finished" || data.event === "message_end") {
                    const msgIndex = messages.value.length - 1;
                    const lastMsg = messages.value[msgIndex];
                    if (lastMsg?.role === "assistant") {
                      let newContent = lastMsg.content;
                      // 检查工作流是否失败
                      if (data.data && data.data.status === "failed") {
                        const errorMsg = data.data.error || "工作流执行失败";
                        newContent = `❌ ${errorMsg}`;
                        ElMessage.error("工作流执行失败：" + errorMsg);
                        fullContent = newContent;
                      }

                      messages.value[msgIndex] = {
                        ...lastMsg,
                        isThinking: false,
                        content: newContent,
                      };
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
            if (data.event === "workflow_finished") {
              const msgIndex = messages.value.length - 1;
              const lastMsg = messages.value[msgIndex];
              if (lastMsg?.role === "assistant") {
                let newContent = lastMsg.content;
                if (data.data && data.data.status === "failed") {
                  const errorMsg = data.data.error || "工作流执行失败";
                  newContent = `❌ ${errorMsg}`;
                  ElMessage.error("工作流执行失败：" + errorMsg);
                  fullContent = newContent;
                }
                messages.value[msgIndex] = {
                  ...lastMsg,
                  isThinking: false,
                  content: newContent,
                };
              }
            }
          } catch (e) {
            console.warn("处理残留数据失败:", e);
          }
        }

        // 如果工作流暂停，保持人工介入状态
        if (isPaused && pauseData) {
          console.log("Revise 工作流暂停，等待用户操作");
          saveMessagesToStorage();
        } else {
          // 正常完成
          const msgIndex = messages.value.length - 1;
          const lastMsg = messages.value[msgIndex];
          if (lastMsg?.role === "assistant") {
            let newContent = lastMsg.content;
            // 如果没有任何内容，根据情况显示不同提示
            if (!fullContent.trim()) {
              if (isUserManualStop.value) {
                newContent = "已手动停止";
                ElMessage.info("已手动停止");
              } else {
                newContent = "⏰ Dify响应超时";
                ElMessage.warning("Dify响应超时");
              }
            }
            messages.value[msgIndex] = {
              ...lastMsg,
              isThinking: false,
              content: newContent,
            };
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

          // 如果是用户手动停止，显示"已手动停止"
          if (error.name === "AbortError" && isUserManualStop.value) {
            lastMsg.content = "已手动停止";
            ElMessage.info("已手动停止");
          } else {
            lastMsg.content = `提交失败：${error.message}`;
            ElMessage.error("提交失败：" + error.message);
          }

          // 显式触发响应式更新和持久化
          messages.value = [...messages.value];
          saveMessagesToStorage();
        }
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

    const restoreUploadedImage = async () => {
      try {
        const savedImages = await indexedDBStore.getItem(getUploadImageStorageKey());
        if (!savedImages) return;

        if (!Array.isArray(savedImages)) return;

        uploadedImages.value = savedImages;
      } catch (error) {
        await indexedDBStore.removeItem(getUploadImageStorageKey());
        uploadedImages.value = [];
      }
    };

    // 处理文件上传（支持文件输入和剪贴板粘贴）
    const uploadFile = async (
      file: File,
      source: string = "input",
      msgIndex?: number,
      conversationId?: string,
    ) => {
      const validTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/gif",
        "text/plain",
      ];
      if (!validTypes.includes(file.type)) {
        ElMessage.error("请选择有效的文件格式（png/jpeg/jpg/webp/gif/txt）");
        return;
      }

      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        ElMessage.error("文件大小不能超过2MB");
        return;
      }

      isLoading.value = true;

      try {
        let apiKey = "";
        let nextStep = currentStep.value;
        let targetMsg: any = null;

        if (conversationId) {
          targetMsg = messages.value.find((msg) => msg.conversationId === conversationId);
        } else if (msgIndex !== undefined && messages.value[msgIndex]) {
          targetMsg = messages.value[msgIndex];
        }

        // 网关模式下，根据当前步骤（currentStep）使用对应步骤的 API Key
        // 判断是否为网关模式：消息是网关消息（isGateway）或当前步骤 >= 1 && <= 3
        const isGatewayMode =
          targetMsg?.isGateway || (currentStep.value >= 1 && currentStep.value <= 3);
        if (isGatewayMode && currentStep.value >= 1 && currentStep.value <= 3) {
          const stepConfig = stepApiKeyMap[currentStep.value];
          apiKey = stepConfig?.apiKey || "";
        }
        // 非网关模式或未设置 nextstep，使用选中的发送类型的 API Key
        if (!apiKey) {
          const sendType = sendTypes.value.find((t) => t.id === selectedSendType.value);
          apiKey = sendType?.config.apiKey || props.apiKey;
        }

        console.log(`\n📤 准备上传文件:`);
        console.log(
          `  - 当前步骤 (currentStep): ${currentStep.value} (${getStepLabel(currentStep.value)})`,
        );
        console.log(`  - 网关模式 (isGatewayMode): ${isGatewayMode}`);
        console.log(`  - 目标消息 (isGateway): ${targetMsg?.isGateway}`);
        console.log(`  - 选中发送类型 (selectedSendType): ${selectedSendType.value}`);
        console.log(`  - 使用的 API Key: ${apiKey ? "***" + apiKey.slice(-4) : "未设置"}`);
        console.log(`  - 文件: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

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

        let fileInfo = {
          id: result.id,
          name: result.name,
          size: result.size,
          extension: result.extension,
          mime_type: result.mime_type,
          created_at: result.created_at,
          base64Data: "",
          textContent: "",
        };

        try {
          if (file.type === "text/plain") {
            const textContent = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve((e.target?.result as string) || "");
              };
              reader.onerror = () => {
                resolve("");
              };
              reader.readAsText(file, "utf-8");
            });
            fileInfo = { ...fileInfo, textContent };
          } else {
            const base64Data = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve((e.target?.result as string) || "");
              };
              reader.onerror = () => {
                resolve("");
              };
              reader.readAsDataURL(file);
            });
            fileInfo = { ...fileInfo, base64Data };
          }
        } catch (e) {}

        const isTxtFile = file.type === "text/plain";

        // 网关模式下，仅当从聊天框内上传（有 conversationId）时保存到对应消息的 gatewayImages
        // 从聊天框外上传（无 conversationId）时，始终保存到全局 uploadedImages，与网关逻辑独立
        if (isGatewayMode && conversationId && currentStep.value >= 1 && currentStep.value <= 3) {
          // 使用 targetMsg（已通过 conversationId 或 msgIndex 找到）
          if (!targetMsg) {
            // 如果没有找到对应消息，尝试通过 conversationId 查找
            if (conversationId) {
              targetMsg = messages.value.find((msg) => msg.conversationId === conversationId);
            }
          }

          if (targetMsg && targetMsg.role === "assistant") {
            if (!targetMsg.gatewayImages) {
              targetMsg.gatewayImages = [];
            }
            targetMsg.gatewayImages.push(fileInfo);
            const count = targetMsg.gatewayImages.length;
            ElMessage.success(
              `${isTxtFile ? "文件" : "图片"} "${result.name}" 上传成功！当前步骤共 ${count} ${isTxtFile ? "个文件" : "张图片"}`,
            );
          } else {
            // 回退到全局数组
            gatewayUploadedImages.value.push(fileInfo);
            const count = gatewayUploadedImages.value.length;
            ElMessage.success(
              `${isTxtFile ? "文件" : "图片"} "${result.name}" 上传成功！当前步骤共 ${count} ${isTxtFile ? "个文件" : "张图片"}`,
            );
          }
        } else {
          uploadedImages.value.push(fileInfo);

          try {
            const stored =
              ((await indexedDBStore.getItem(getUploadImageStorageKey())) as any[]) || [];
            const allImagesData = uploadedImages.value.map((img, index) => {
              return index === uploadedImages.value.length - 1 ? fileInfo : stored[index] || img;
            });
            const plainData = JSON.parse(JSON.stringify(allImagesData));
            await indexedDBStore.setItem(getUploadImageStorageKey(), plainData);
          } catch (storageError: any) {
            if (storageError.name === "QuotaExceededError") {
              console.warn("IndexedDB 配额不足，仅保存文件元信息");
              const plainMeta = JSON.parse(
                JSON.stringify(
                  uploadedImages.value.map((img) => {
                    const { base64Data, textContent, ...meta } = img;
                    return meta;
                  }),
                ),
              );
              await indexedDBStore.setItem(getUploadImageStorageKey(), plainMeta);
            } else {
              console.error("保存文件信息到 IndexedDB 失败:", storageError);
            }
          }

          const count = uploadedImages.value.length;
          ElMessage.success(
            `${isTxtFile ? "文件" : "图片"} "${result.name}" 上传成功！当前共 ${count} ${isTxtFile ? "个文件" : "张图片"}`,
          );
        }
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
        // console.log("文件上传成功:", result);

        return result;
      } catch (error: any) {
        console.error("文件上传失败:", error);
        throw error;
      }
    };

    // 预览已上传的文件
    const previewUploadedFile = (index: number) => {
      const file = uploadedImages.value[index];
      if (!file) return;

      gatewayPreviewImages.value = JSON.parse(JSON.stringify(uploadedImages.value));
      gatewayPreviewIndex.value = index;
      isGatewayPreview.value = true;
      imagePreviewVisible.value = true;
    };

    // 预览网关消息中的文件
    const previewGatewayFile = (conversationId: string, index: number) => {
      const msg = messages.value.find((m) => m.conversationId === conversationId);
      if (!msg || !msg.gatewayImages || !msg.gatewayImages[index]) return;

      gatewayPreviewImages.value = JSON.parse(JSON.stringify(msg.gatewayImages));
      gatewayPreviewIndex.value = index;
      isGatewayPreview.value = true;
      imagePreviewVisible.value = true;
    };

    // 删除网关消息中的文件
    const removeGatewayFile = async (conversationId: string, index: number) => {
      const msg = messages.value.find((m) => m.conversationId === conversationId);
      if (!msg || !msg.gatewayImages) return;

      msg.gatewayImages.splice(index, 1);
      await saveMessagesToStorage();
      ElMessage.success("文件删除成功");
    };

    // 判断是否为图片文件
    const isImageFile = (file: any): boolean => {
      const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
      return (
        imageExtensions.includes(file.extension?.toLowerCase() || "") ||
        file.mime_type?.startsWith("image/")
      );
    };

    // 格式化文件大小
    const formatFileSize = (bytes: number): string => {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    // 查看消息中的文件
    const viewMessageFile = (message: any, fileIndex: number) => {
      const file = message.files[fileIndex];
      if (!file) return;

      if (isImageFile(file)) {
        gatewayPreviewImages.value = [file];
        gatewayPreviewIndex.value = 0;
        isGatewayPreview.value = true;
        imagePreviewVisible.value = true;
      } else if (file.textContent) {
        gatewayPreviewImages.value = [file];
        gatewayPreviewIndex.value = 0;
        isGatewayPreview.value = true;
        imagePreviewVisible.value = true;
      } else {
        ElMessage.info("无法预览该文件类型");
      }
    };

    // 处理图片上传（文件输入）
    const handleImageUpload = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (!files || files.length === 0) return;

      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i], "input");
      }

      target.value = "";
    };

    // 打开图片预览
    const openImagePreview = (index: number = 0) => {
      if (!Array.isArray(uploadedImages.value) || uploadedImages.value.length === 0) {
        ElMessage.warning("暂无已上传的图片");
        return;
      }
      const maxIndex = uploadedImages.value.length - 1;
      const validIndex = isNaN(index) ? 0 : Math.max(0, Math.min(index, maxIndex));
      currentPreviewIndex.value = validIndex;
      imagePreviewVisible.value = true;
    };

    // 上一张
    const prevImage = () => {
      if (currentPreviewIndex.value > 0) {
        currentPreviewIndex.value--;
        resetImageScale();
      }
    };

    // 下一张
    const nextImage = () => {
      if (currentPreviewIndex.value < uploadedImages.value.length - 1) {
        currentPreviewIndex.value++;
        resetImageScale();
      }
    };

    // 选择指定图片
    const selectImage = (index: number) => {
      if (index >= 0 && index < uploadedImages.value.length) {
        currentPreviewIndex.value = index;
        resetImageScale();
      }
    };

    // 删除上传的文件
    const removeUploadedFile = async (index: number) => {
      uploadedImages.value.splice(index, 1);

      try {
        const plainData = JSON.parse(JSON.stringify(uploadedImages.value));
        await indexedDBStore.setItem(getUploadImageStorageKey(), plainData);
        ElMessage.success("文件删除成功");
      } catch (error) {
        console.error("删除文件时更新 IndexedDB 失败:", error);
      }
    };

    // CAD转JSON
    const cadToJson = async () => {
      if (uploadedImages.value.length === 0) {
        ElMessage.warning("请先上传图片");
        return;
      }

      isCadConverting.value = true;

      // 添加用户消息
      const imageNames = uploadedImages.value.map((img) => img.name).join(", ");
      messages.value.push({
        role: "user",
        content: `📐 CAD转JSON (图片: ${imageNames})`,
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
          files: uploadedImages.value.map((img) => ({
            type: "image",
            transfer_method: "local_file",
            upload_file_id: img.id,
          })),
        };

        // console.log("请求体:", JSON.stringify(requestBody, null, 2));

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

              if (
                !data.event ||
                ["message", "workflow_finished", "workflow_paused", "error", "end"].indexOf(
                  data.event,
                ) === -1
              ) {
                if (
                  messages.value[msgIndex]?.role === "assistant" &&
                  messages.value[msgIndex].isThinking
                ) {
                  const eventDisplayName = getEventDisplayName(data.event, data.data);
                  messages.value[msgIndex].thinkingContent = eventDisplayName;
                }
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
        // console.log("转换结果:", fullContent);

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
      confirmDialogVisible.value = true;
    };

    // 确认清空
    const confirmClear = async () => {
      confirmDialogVisible.value = false;
      try {
        await indexedDBStore.removeItem(getStorageKey());
        await indexedDBStore.removeItem(getUploadImageStorageKey());
        await indexedDBStore.removeItem(getStepStorageKey());
      } catch (e) {
        console.error("清空 IndexedDB 失败:", e);
      }
      messages.value = [];
      uploadedImages.value = [];
      await resetSteps();
      ElMessage.success("对话已清空");
    };

    // 取消清空
    const cancelClear = () => {
      confirmDialogVisible.value = false;
    };

    // 停止生成
    const stopGeneration = async (isTimeout: boolean = false) => {
      if (!isLoading.value && !isCadConverting.value) return;

      // 设置手动停止标记（非超时情况）
      if (!isTimeout) {
        isUserManualStop.value = true;
      }

      console.log("currentTaskId.value ", currentTaskId.value);
      // 根据当前步骤获取对应的 API Key
      let usedApiKey = props.apiKey;
      if (currentStep.value === 1) {
        usedApiKey = props.apiKeyFlowB1 || props.apiKey;
      } else if (currentStep.value === 2) {
        usedApiKey = props.apiKeyFlowB2 || props.apiKey;
      } else if (currentStep.value === 3) {
        usedApiKey = props.apiKeyFlowB3 || props.apiKey;
      }

      // 先调用官方停止接口
      if (currentTaskId.value) {
        try {
          const response = await fetch(
            `${props.baseUrl}/v1/chat-messages/${currentTaskId.value}/stop`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${usedApiKey}`,
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
              : lastMsg.content || "已手动停止",
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
        ElMessage.info("已手动停止");
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

    const handleDialogMouseDown = (e: MouseEvent) => {
      if (isResizing.value) return;
      isDialogDragging.value = true;
      dragOffset.value = {
        x: e.clientX - dialogPosition.value.x,
        y: e.clientY - dialogPosition.value.y,
      };
      document.addEventListener("mousemove", handleDialogMouseMove);
      document.addEventListener("mouseup", handleDialogMouseUp);
    };

    const handleDialogMouseMove = (e: MouseEvent) => {
      if (!isDialogDragging.value) return;
      dialogPosition.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y,
      };
    };

    const handleDialogMouseUp = () => {
      isDialogDragging.value = false;
      document.removeEventListener("mousemove", handleDialogMouseMove);
      document.removeEventListener("mouseup", handleDialogMouseUp);
    };

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
      const minHeight = 500;

      switch (resizeDirection.value) {
        case "n": {
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy);
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight);
          dialogHeight.value = newHeight;
          dialogPosition.value.y = newTop;
          break;
        }
        case "s": {
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy);
          break;
        }
        case "e": {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          break;
        }
        case "w": {
          const newWidth = Math.max(minWidth, resizeStart.value.width - dx);
          const newLeft = resizeStart.value.left + (resizeStart.value.width - newWidth);
          dialogWidth.value = newWidth;
          dialogPosition.value.x = newLeft;
          break;
        }
        case "ne": {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          const newHeight = Math.max(minHeight, resizeStart.value.height - dy);
          const newTop = resizeStart.value.top + (resizeStart.value.height - newHeight);
          dialogHeight.value = newHeight;
          dialogPosition.value.y = newTop;
          break;
        }
        case "nw": {
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
        case "se": {
          dialogWidth.value = Math.max(minWidth, resizeStart.value.width + dx);
          dialogHeight.value = Math.max(minHeight, resizeStart.value.height + dy);
          break;
        }
        case "sw": {
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
      resizeDirection.value = "";
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
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
        delete (window as any).__gatewayUploadFiles;
        delete (window as any).__viewGatewayImages;
        delete (window as any).__proceedToNextStep;
      }

      // 清理拖拽和缩放事件监听器
      document.removeEventListener("mousemove", handleDialogMouseMove);
      document.removeEventListener("mouseup", handleDialogMouseUp);
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResize);
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
      await copyMessageContent(lastAiMessage);
    };

    // 复制指定消息内容
    const copyMessageContent = async (message: Message) => {
      if (!message.content || message.isThinking) {
        ElMessage.warning("暂无内容可复制");
        return;
      }

      // 清理HTML标签，只保留纯文本
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = message.content;
      const plainText = tempDiv.textContent || tempDiv.innerText || message.content;

      try {
        // 使用 Clipboard API 复制内容
        await navigator.clipboard.writeText(plainText);
        ElMessage.success("内容已复制到剪贴板");
      } catch (error) {
        console.error("复制失败:", error);
        // 降级方案：创建临时文本区域
        const textarea = document.createElement("textarea");
        textarea.value = plainText;
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
      uploadedImages,
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
      confirmClear,
      cancelClear,
      confirmDialogVisible,
      stopGeneration,
      outputJsonToConsole,
      saveTempPayload,
      fetchAndSaveScreenAI,
      calibrateJson,
      copyLastMessageContent,
      copyMessageContent,
      saveRawJson,
      getStepLabel,
      handleGatewayUpload,
      viewGatewayImages,
      proceedToNextStep,
      extractValidationResult,
      handleEnter,
      formatContent,
      formatTime,
      triggerImageUpload,
      handleImageUpload,
      openImagePreview,
      prevImage,
      nextImage,
      selectImage,
      currentPreviewIndex,
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
      getCurrentPreviewFile,
      copyPreviewText,
      gatewayPreviewImages,
      gatewayPreviewIndex,
      isGatewayPreview,
      removeUploadedFile,
      previewUploadedFile,
      previewGatewayFile,
      removeGatewayFile,
      isImageFile,
      formatFileSize,
      viewMessageFile,
      dialogPosition,
      dialogWidth,
      dialogHeight,
      isDialogDragging,
      isResizing,
      handleDialogMouseDown,
      startResize,
    };
  },
});
</script>

<style scoped>
.custom-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
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
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.15),
    0 4px 24px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 10;
}

.custom-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #3478f3 0%, #0d2a42 100%);
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

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  z-index: 1;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  background-color: transparent;
  z-index: 10002;
  pointer-events: auto;
}

.resize-n {
  top: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: n-resize;
}

.resize-s {
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  cursor: s-resize;
}

.resize-e {
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: e-resize;
}

.resize-w {
  left: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: w-resize;
}

.resize-ne {
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: ne-resize;
}

.resize-nw {
  top: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: nw-resize;
}

.resize-se {
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

.resize-sw {
  bottom: 0;
  left: 0;
  width: 12px;
  height: 12px;
  cursor: sw-resize;
}

.dify-api-container {
  width: 100%;
  height: calc(100% - 56px);
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  border-radius: 0;
  overflow: hidden;
}

/* 消息区域 */
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
  background-color: #f8fafc;
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
  background: linear-gradient(135deg, #3478f3 0%, #0d2a42 100%);
}

.message-role {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.message-content {
  padding: 14px 18px;
  border-radius: 16px;
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  white-space: pre-wrap;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  transition: all 0.2s ease;
}

.content-text {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
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

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  align-self: flex-end;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
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

.copy-icon {
  transition: all 0.2s;
}

.copy-btn:hover .copy-icon {
  fill: #3b82f6;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
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

.copy-icon {
  transition: all 0.2s;
}

.copy-btn:hover .copy-icon {
  fill: #3b82f6;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
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

.copy-icon {
  transition: all 0.2s;
}

.copy-btn:hover .copy-icon {
  fill: #3b82f6;
}

/* 思考中动画 */
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.thinking-dots {
  display: flex;
  gap: 6px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #3478f3 0%, #0d2a42 100%);
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
  color: #64748b;
}

/* 输入区域 */
.input-section {
  padding: 16px 20px;
  background-color: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  flex-direction: column;
  gap: 12px;
}

.input-row :deep(.el-textarea) {
  width: 100%;
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

:deep(.el-textarea__inner) {
  border-radius: 12px;
  resize: none;
  font-size: 14px;
  line-height: 1.5;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

:deep(.el-textarea__inner:focus) {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.el-input__inner) {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  padding: 12px 16px;
  font-size: 14px;
  transition: all 0.2s;
}

:deep(.el-input__inner:hover) {
  border-color: #cbd5e1;
  background-color: #ffffff;
}

:deep(.el-input__inner:focus) {
  border-color: #3b82f6;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  min-width: 44px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  color: white;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-button:hover {
  background-color: #e2e8f0;
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
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reset-button {
  font-size: 12px;
  padding: 4px 12px;
  min-width: auto;
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
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  position: relative;
}

.human-copy-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
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

/* 网关消息样式 */
.gateway-message-wrapper {
  width: 100%;
}

.gateway-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 6px;
  margin-bottom: 12px;
  border-left: 4px solid #3b82f6;
}

.gateway-icon {
  font-size: 16px;
}

.gateway-text {
  font-weight: 600;
  color: #1d4ed8;
  font-size: 13px;
}

.gateway-message-content {
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  border: 1px solid #e0e7ff;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  position: relative;
}

.gateway-content {
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
}

.gateway-action-area {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e0e7ff;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.gateway-upload-section {
  flex-shrink: 0;
}

.gateway-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 16px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  color: #1d4ed8;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.gateway-upload-btn:hover {
  background-color: #dbeafe;
  border-color: #93c5fd;
}

.gateway-upload-input {
  display: none;
}

.gateway-view-section {
  flex-shrink: 0;
}

.gateway-view-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background-color: #f0f9ff;
  border: 1px solid #7dd3fc;
  border-radius: 4px;
  color: #0369a1;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.gateway-view-btn:hover:not(:disabled) {
  background-color: #e0f2fe;
  border-color: #0ea5e9;
}

.gateway-view-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.gateway-action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gateway-next-step {
  flex-shrink: 0;
}

.gateway-next-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.gateway-next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.gateway-next-btn:active {
  transform: translateY(0);
}

.gateway-next-btn:disabled {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  cursor: not-allowed;
  opacity: 0.7;
}

.gateway-next-btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

.gateway-uploaded-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gateway-file-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.gateway-file-tag:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.gateway-file-icon {
  font-size: 14px;
}

.gateway-file-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
}

.gateway-file-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  background-color: #ef4444;
  color: #ffffff;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.gateway-file-remove:hover {
  background-color: #dc2626;
  transform: scale(1.1);
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

.text-preview-container {
  width: 100%;
  max-height: 600px;
  background-color: #f5f5f5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.text-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #e4e7ed;
  border-radius: 8px 8px 0 0;
}

.text-preview-filename {
  font-weight: 600;
  color: #303133;
}

.copy-text-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: #409eff;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-text-btn:hover {
  background-color: #66b1ff;
}

.text-preview-content {
  flex: 1;
  padding: 16px;
  margin: 0;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
}

.thumbnail-txt-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.multi-image-preview-wrapper {
  position: relative;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.7);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-prev {
  left: 10px;
}

.nav-next {
  right: 10px;
}

.thumbnail-list {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  overflow-x: auto;
}

.thumbnail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  min-width: 80px;
}

.thumbnail-item:hover {
  background-color: #e4e7ed;
}

.thumbnail-item.active {
  background-color: #409eff;
}

.thumbnail-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 2px solid transparent;
}

.thumbnail-item.active .thumbnail-img {
  border-color: #ffffff;
}

.thumbnail-name {
  font-size: 11px;
  color: #606266;
  margin-top: 4px;
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.thumbnail-item.active .thumbnail-name {
  color: #ffffff;
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
  background-color: #f8fafc;
  line-height: 1.8;
  font-size: 13px;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 500px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

:deep(.gateway-content-wrapper) {
  margin-top: 8px;
}

:deep(.gateway-content-collapsed) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
  border-radius: 6px;
}

:deep(.gateway-content-collapsed:hover) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

:deep(.gateway-content) {
  padding: 12px;
  background-color: #f8fafc;
  line-height: 1.8;
  font-size: 13px;
  color: #1e293b;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
}

/* 步骤路径指示器样式 */
.step-path-container {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 8px 0;
  gap: 20px;
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

:deep(.json-pre) {
  background-color: #f8fafc;
  color: #1e293b;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  margin: 8px 0;
  white-space: pre;
  border: 1px solid #e2e8f0;
}

:deep(.json-code) {
  display: block;
}

:deep(.json-content) {
  background-color: #f8fafc;
  color: #1e293b;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre;
  border: 1px solid #e2e8f0;
}

:deep(.json-key) {
  color: #2563eb;
}

:deep(.json-string) {
  color: #dc2626;
}

:deep(.json-number) {
  color: #059669;
}

:deep(.json-boolean) {
  color: #7c3aed;
}

:deep(.json-null) {
  color: #64748b;
}

/* 确认清空对话框样式 */
.confirm-dialog-content {
  text-align: center;
  padding: 24px;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.confirm-dialog-content p {
  font-size: 16px;
  color: #303133;
  margin: 0 0 8px 0;
}

.confirm-hint {
  font-size: 13px !important;
  color: #909399 !important;
}

.confirm-dialog-footer {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.uploaded-files-bar {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.uploaded-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.uploaded-file-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  font-size: 12px;
}

.uploaded-file-icon {
  font-size: 14px;
}

.uploaded-file-name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #374151;
}

.uploaded-file-remove {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  transition: all 0.2s;
}

.uploaded-file-remove:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.message-files {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
}

.message-files-title {
  font-size: 12px;
  color: #e5e7eb;
  margin-bottom: 8px;
}

.message-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.message-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background-color: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.message-file-item:hover {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.message-file-icon {
  font-size: 16px;
}

.message-file-info {
  display: flex;
  flex-direction: column;
}

.message-file-name {
  font-size: 13px;
  color: #334155;
}

.message-file-size {
  font-size: 11px;
  color: #94a3b8;
}
</style>
