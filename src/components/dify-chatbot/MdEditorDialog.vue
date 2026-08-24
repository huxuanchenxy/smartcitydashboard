<template>
  <Teleport to="body">
    <transition name="md-dialog-fade">
      <div v-if="visible" class="md-editor-dialog-mask" @mousedown.self="handleClose">
        <div class="md-editor-dialog">
          <div class="md-editor-dialog-header">
            <div class="md-editor-dialog-title">
              <span class="title-icon">📝</span>
              <span class="title-text">{{ title }}</span>
              <span v-if="dirty" class="title-dirty">未保存</span>
            </div>
            <div class="md-editor-dialog-actions">
              <button class="header-btn" title="打开本地 .md 文件" @click="openFile">📂 打开</button>
              <button class="header-btn" title="下载为 .md 文件" @click="downloadFile">⬇ 存为文件</button>
              <button class="header-btn close-btn" title="关闭 (Esc)" @click="handleClose">✕</button>
            </div>
          </div>
          <div class="md-editor-dialog-body">
            <MdEditor
              :model-value="draft"
              style="height: 100%"
              :toolbars-exclude="toolbarsExclude"
              preview-theme="default"
              @update:model-value="onInput"
            />
          </div>
          <div class="md-editor-dialog-footer">
            <span class="word-count">共 {{ draft.length }} 字符</span>
            <div class="footer-actions">
              <button class="btn btn-cancel" @click="handleClose">取消</button>
              <button class="btn btn-save" @click="handleSave">保存</button>
            </div>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            accept=".md,.markdown,.txt"
            style="display: none"
            @change="handleFileChange"
          >
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onUnmounted } from 'vue'
// md-editor-v3@2.2.0 仅提供默认导出
import MdEditor from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { saveAs } from 'file-saver'
import type { ToolbarNames } from 'md-editor-v3/lib/MdEditor/type'

export default defineComponent({
  name: 'MdEditorDialog',
  components: {
    MdEditor,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: 'Markdown 编辑器',
    },
    fileName: {
      type: String,
      default: 'document.md',
    },
  },
  emits: ['update:visible', 'update:modelValue', 'save'],
  setup(props, { emit }) {
    const draft = ref(props.modelValue)
    const initial = ref(props.modelValue)
    const fileInputRef = ref<HTMLInputElement | null>(null)

    const dirty = computed(() => draft.value !== initial.value)

    watch(
      () => props.visible,
      val => {
        if (val) {
          // 每次打开时与外部内容同步，避免弹层内残留上次草稿
          draft.value = props.modelValue
          initial.value = props.modelValue
        }
      },
    )

    const onInput = (val: string) => {
      draft.value = val
    }

    const handleClose = () => {
      if (dirty.value && !window.confirm('当前内容尚未保存，确定要关闭吗？')) {
        return
      }
      emit('update:visible', false)
    }

    const handleSave = () => {
      emit('update:modelValue', draft.value)
      emit('save', draft.value)
      initial.value = draft.value
      emit('update:visible', false)
    }

    const openFile = () => {
      if (dirty.value && !window.confirm('打开新文件将覆盖当前未保存内容，是否继续？')) {
        return
      }
      fileInputRef.value && fileInputRef.value.click()
    }

    const handleFileChange = (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files && input.files[0]
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          draft.value = reader.result
        }
      }
      reader.readAsText(file, 'utf-8')
      input.value = ''
    }

    const downloadFile = () => {
      const blob = new Blob([draft.value], { type: 'text/markdown;charset=utf-8' })
      saveAs(blob, props.fileName)
    }

    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    watch(
      () => props.visible,
      val => {
        if (val) {
          document.addEventListener('keydown', onKeydown)
        } else {
          document.removeEventListener('keydown', onKeydown)
        }
      },
    )

    onUnmounted(() => {
      document.removeEventListener('keydown', onKeydown)
    })

    return {
      draft,
      dirty,
      fileInputRef,
      // github、save 为用不到的工具栏按钮；save 的默认行为是往 localStorage 存草稿，保存由页脚按钮接管
      toolbarsExclude: ['github', 'save'] as ToolbarNames[],
      onInput,
      handleClose,
      handleSave,
      openFile,
      handleFileChange,
      downloadFile,
    }
  },
})
</script>

<style scoped>
.md-editor-dialog-mask {
  position: fixed;
  inset: 0;
  /* 需高于 DifyApiDemoDialog 的 wrapper(z-index: 10000)，否则会被对话窗压在下面 */
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.md-editor-dialog {
  display: flex;
  flex-direction: column;
  width: min(1000px, 92vw);
  height: min(680px, 88vh);
  overflow: hidden;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(15, 23, 42, 0.25);
}

.md-editor-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%);
}

.md-editor-dialog-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.title-icon {
  font-size: 17px;
}

.title-dirty {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #d97706;
  background-color: #fef3c7;
  border-radius: 999px;
}

.md-editor-dialog-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-btn {
  height: 30px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.header-btn.close-btn {
  width: 30px;
  padding: 0;
  font-size: 14px;
  color: #94a3b8;
}

.header-btn.close-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.15);
}

.md-editor-dialog-body {
  flex: 1;
  min-height: 0;
}

.md-editor-dialog-body :deep(.md-editor) {
  border: none;
  border-radius: 0;
}

.md-editor-dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid #e2e8f0;
  background-color: #f8fafc;
}

.word-count {
  font-size: 12px;
  color: #94a3b8;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.btn {
  min-width: 84px;
  height: 34px;
  padding: 0 18px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  border: 1px solid #e2e8f0;
  background-color: #fff;
  color: #64748b;
}

.btn-cancel:hover {
  border-color: #cbd5e1;
  color: #334155;
}

.btn-save {
  border: none;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
}

.btn-save:hover {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

.md-dialog-fade-enter-active,
.md-dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}

.md-dialog-fade-enter-active .md-editor-dialog,
.md-dialog-fade-leave-active .md-editor-dialog {
  transition: transform 0.25s ease;
}

.md-dialog-fade-enter-from,
.md-dialog-fade-leave-to {
  opacity: 0;
}

.md-dialog-fade-enter-from .md-editor-dialog,
.md-dialog-fade-leave-to .md-editor-dialog {
  transform: scale(0.96) translateY(8px);
}
</style>
