<template>
  <DifyRealDialog
    v-if="useRealDialog"
    v-bind="$attrs"
    :title="title"
    :visible="visible"
    :no-mask="noMask"
    :fixed="fixed"
    :inline="inline"
    :initial-position="initialPosition"
    :initial-size="initialSize"
    :viewport-ratio="viewportRatio"
    :role="role"
    :md-editor="mdEditor"
    :md-editor-storage-key="mdEditorStorageKey"
    :font-scale="fontScale"
    :subtitle="subtitle"
    :suggestions="suggestions"
    :sidebar-width="sidebarWidth"
    :login-account="loginAccount"
    :auth-token="authToken"
    :anonymous="anonymous"
    :com="com"
    @update:visible="onUpdateVisible"
    @close="onClose"
    @message-received="onMessageReceived"
    @message-sent="onMessageSent"
    @md-editor-visible-change="onMdEditorVisibleChange"
  />
  <DifyApiDemoDialog
    v-else
    v-bind="$attrs"
    :title="title"
    :visible="visible"
    :no-mask="noMask"
    :fixed="fixed"
    :inline="inline"
    :initial-position="initialPosition"
    :initial-size="initialSize"
    :role="role"
    :md-editor="mdEditor"
    :md-editor-storage-key="mdEditorStorageKey"
    :font-scale="fontScale"
    :com="com"
    @update:visible="onUpdateVisible"
    @close="onClose"
    @message-received="onMessageReceived"
    @message-sent="onMessageSent"
    @md-editor-visible-change="onMdEditorVisibleChange"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import DifyApiDemoDialog from './DifyApiDemoDialog.vue'
import DifyRealDialog from './DifyRealDialog.vue'
import { resolveDifyDialogType } from '@/utils/dify-dialog'

interface SuggestionCard {
  title: string
  desc: string
  prompt: string
}

/**
 * 供业务页使用的对话框切换壳：
 * 按 VITE_APP_DIFY_DIALOG_TYPE（或 dialogType prop 显式指定）在 Demo / Real 两个对话框间切换。
 * 对外保持与两个 Dialog 一致的 props / events，业务页只改组件名即可。
 */
export default defineComponent({
  name: 'DifyDialogSwitch',
  inheritAttrs: false,
  components: { DifyApiDemoDialog, DifyRealDialog },
  props: {
    // env / demo / real；默认跟随环境变量
    dialogType: {
      type: String,
      default: 'env',
    },
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
    inline: {
      type: Boolean,
      default: false,
    },
    initialPosition: {
      type: Object as () => { x: number; y: number; } | null,
      default: null,
    },
    initialSize: {
      type: Object as () => { width: number; height: number; } | null,
      default: null,
    },
    viewportRatio: {
      type: Number,
      default: 1,
    },
    role: {
      type: String,
      default: '',
    },
    mdEditor: {
      type: Boolean,
      default: false,
    },
    mdEditorStorageKey: {
      type: String,
      default: '',
    },
    fontScale: {
      type: Number,
      default: 0,
    },
    subtitle: {
      type: String,
      default: '你的智能工作伙伴',
    },
    suggestions: {
      type: Array as () => SuggestionCard[] | null,
      default: null,
    },
    sidebarWidth: {
      type: Number,
      default: 260,
    },
    loginAccount: {
      type: String,
      default: '',
    },
    authToken: {
      type: String,
      default: '',
    },
    anonymous: {
      type: Boolean,
      default: false,
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
  emits: ['update:visible', 'close', 'message-received', 'message-sent', 'md-editor-visible-change'],
  setup(props, { emit }) {
    const useRealDialog = computed(
      () => resolveDifyDialogType(props.dialogType, 'demo') === 'real',
    )

    return {
      useRealDialog,
      onUpdateVisible: (value: boolean) => emit('update:visible', value),
      onClose: () => emit('close'),
      onMessageReceived: (payload?: unknown) => emit('message-received', payload as any),
      onMessageSent: (payload?: unknown) => emit('message-sent', payload as any),
      onMdEditorVisibleChange: (value: boolean) => emit('md-editor-visible-change', value),
    }
  },
})
</script>
