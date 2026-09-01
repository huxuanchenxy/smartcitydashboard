<template>
  <div class="agent-config-page" :class="{ 'md-editor-open': mdEditorOpen }">
    <div ref="leftPanelRef" class="left-panel">
      <DifyRealDialog
        v-model:visible="showDialog"
        title="Agent 配置助手"
        :no-mask="true"
        :fixed="true"
        :initial-position="initialPosition"
        :initial-size="initialSize"
        :font-scale="fontScale"
        role="backend_ops"
        :md-editor="true"
        md-editor-storage-key="agent-config-md-doc"
        @md-editor-visible-change="handleMdEditorVisibleChange"
      />
    </div>
    <div class="right-panel">
      <div v-if="fontConfigVisible" class="font-config-card">
        <span class="font-config-label">对话字体大小</span>
        <div class="font-config-controls">
          <button class="font-scale-btn" :disabled="fontScale <= minFontScale" @click="decreaseFontScale">A−</button>
          <span class="font-scale-value">{{ Math.round(fontScale * 100) }}%</span>
          <button class="font-scale-btn" :disabled="fontScale >= maxFontScale" @click="increaseFontScale">A＋</button>
          <button class="font-scale-reset" @click="handleResetFontScale">重置</button>
        </div>
        <span class="font-config-hint">按 Ctrl+空格（若被输入法占用则用 Ctrl+Shift+空格）保存并收起；应用于对话页眉、消息内容、输入框及页脚区域</span>
      </div>
      <div class="panel-header">
        <h3>技能库</h3>
        <!-- <span class="panel-subtitle">选择技能添加到 Agent</span> -->
      </div>
      <div class="skills-grid">
        <div
          v-for="skill in skills"
          :key="skill.skillId || skill.name"
          class="skill-card"
          @click="addSkill(skill)"
        >
          <div class="skill-avatar" :style="{ background: skill.color }">
            {{ skill.letter }}
          </div>
          <el-tooltip placement="top-start" effect="dark" :show-after="300">
            <template #content>
              <div class="skill-tip">
                <div class="skill-tip-name">{{ skill.name }}</div>
                <div v-if="skill.desc" class="skill-tip-desc">{{ skill.desc }}</div>
              </div>
            </template>
            <div class="skill-info">
              <div class="skill-name">{{ skill.name }}</div>
              <div class="skill-desc">{{ skill.desc }}</div>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { ElTooltip } from 'element-plus'
import request from '@/utils/request'
import DifyRealDialog from '@/components/dify-chatbot/DifyRealDialog.vue'
import {
  getFontScale,
  setFontScale,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  FONT_SCALE_STEP,
} from '@/components/dify-chatbot/font-scale'

interface Skill {
  skillId: string
  name: string
  desc: string
  letter: string
  color: string
}

// 头像渐变色板：接口只返回 icon 单字，颜色按索引循环取用，保持卡片视觉不单调
const SKILL_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
]

export default defineComponent({
  name: 'AgentConfig',
  components: {
    DifyRealDialog,
    ElTooltip,
  },
  setup() {
    const showDialog = ref(true)
    const leftPanelRef = ref<HTMLElement | null>(null)
    const initialPosition = ref<{ x: number; y: number; } | null>(null)
    const initialSize = ref<{ width: number; height: number; } | null>(null)

    // 技能库列表：全部来自接口，无本地静态兜底
    const skills = ref<Skill[]>([])

    // 技能库接口 GET /api/skill/list，返回 { code, msg, data: [...] }，
    // 地址可通过环境变量 VITE_APP_DIFY_SESSION_HOST 覆盖；直连方式下请确保后端已开启 CORS
    const fetchSkillList = async (): Promise<void> => {
      try {
        const base = import.meta.env.VITE_APP_DIFY_SESSION_HOST || 'http://10.89.34.77:8080'
        const resp = await request.get(`${base}/api/skill/list`)
        const body = resp?.data
        const list = body?.data
        if (body?.code === 200 && Array.isArray(list)) {
          const fetched = list
            .filter((item: any) => item && !item.isDeleted && item.name)
            .map((item: any, index: number) => ({
              skillId: item.skillId || '',
              name: item.name,
              desc: item.description || '',
              letter: item.icon || (item.name || '').slice(0, 1),
              color: SKILL_COLORS[index % SKILL_COLORS.length],
            }))
          skills.value = fetched
          console.log('[AgentConfig] 技能库加载完成，共', fetched.length, '个技能')
        } else {
          console.warn('[AgentConfig] 技能库接口返回异常:', resp)
        }
      } catch (error) {
        // 接口失败保持空列表，调试信息只走 console
        console.error('[AgentConfig] 技能库接口请求失败:', error)
      }
    }

    const addSkill = (skill: Skill) => {
      console.log('添加技能:', skill.name, 'skillId:', skill.skillId)
    }

    // 字体整体缩放配置：默认隐藏，Ctrl+空格 唤起；再次按 Ctrl+空格 保存到 localStorage 并收起
    const fontConfigVisible = ref(false)
    const fontScale = ref(getFontScale())

    // 调整时仅实时预览，不落盘
    const changeFontScale = (delta: number) => {
      // 规避 0.1 步长的浮点误差
      const next = Math.round((fontScale.value + delta) * 10) / 10
      fontScale.value = Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, next))
    }

    const increaseFontScale = () => {
      changeFontScale(FONT_SCALE_STEP)
    }

    const decreaseFontScale = () => {
      changeFontScale(-FONT_SCALE_STEP)
    }

    const handleResetFontScale = () => {
      fontScale.value = 1
    }

    const toggleFontConfig = () => {
      if (fontConfigVisible.value) {
        // 收起时保存当前配置，下次打开仍生效
        setFontScale(fontScale.value)
        fontScale.value = getFontScale()
        fontConfigVisible.value = false
      } else {
        fontConfigVisible.value = true
      }
    }

    const onKeydown = (event: KeyboardEvent) => {
      const isSpace = event.code === 'Space' || event.key === ' ' || event.keyCode === 32
      // Ctrl+空格 可能被 Windows 输入法切换热键拦截而到不了页面，
      // 因此同时放行 Ctrl+Shift+空格 作为备用组合
      if (isSpace && event.ctrlKey && !event.altKey) {
        event.preventDefault()
        toggleFontConfig()
      }
    }

    // 按左面板实时尺寸测量对话窗位置/大小；窗口缩放时重测，避免对话窗遮住技能库或留出空隙
    const measurePanel = () => {
      if (!leftPanelRef.value) {
        return
      }
      const rect = leftPanelRef.value.getBoundingClientRect()
      initialPosition.value = { x: rect.left, y: rect.top }
      initialSize.value = {
        width: rect.width,
        height: rect.height,
      }
    }

    // MD 编辑器是否展开：展开时面板切为 3:5，给停靠的编辑器腾出空间；默认 1:1 对半分
    const mdEditorOpen = ref(false)

    const handleMdEditorVisibleChange = (open: boolean) => {
      mdEditorOpen.value = open
      // 等面板 flex 过渡结束后重测，使对话窗同步新面板尺寸（兼做无过渡时的兜底）
      window.setTimeout(measurePanel, 300)
    }

    onMounted(() => {
      window.addEventListener('keydown', onKeydown)
      measurePanel()
      window.addEventListener('resize', measurePanel)
      fetchSkillList()
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown)
      window.removeEventListener('resize', measurePanel)
    })

    return {
      showDialog,
      leftPanelRef,
      mdEditorOpen,
      handleMdEditorVisibleChange,
      initialPosition,
      initialSize,
      skills,
      addSkill,
      fontConfigVisible,
      fontScale,
      minFontScale: MIN_FONT_SCALE,
      maxFontScale: MAX_FONT_SCALE,
      increaseFontScale,
      decreaseFontScale,
      handleResetFontScale,
    }
  },
})
</script>

<style scoped>
.agent-config-page {
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
}

.left-panel {
  /* 默认 2:1 分屏（对话窗占 2 份，技能库占 1 份）；MD 编辑器展开时通过 .md-editor-open 切为 3:5 给停靠的编辑器腾地方 */
  flex: 2;
  position: relative;
  min-width: 0;
  transition: flex 0.25s ease;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow: hidden;
  background-color: #f8fafc;
  border-radius: 16px;
  transition: flex 0.25s ease;
}

.agent-config-page.md-editor-open .left-panel {
  flex: 3;
}

.agent-config-page.md-editor-open .right-panel {
  flex: 5;
}

.font-config-card {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.font-config-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.font-config-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-scale-btn {
  min-width: 40px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.font-scale-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.font-scale-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.font-scale-value {
  min-width: 44px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
}

.font-scale-reset {
  height: 30px;
  padding: 0 12px;
  margin-left: 4px;
  border: none;
  border-radius: 8px;
  background-color: #f1f5f9;
  color: #64748b;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.font-scale-reset:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.font-config-hint {
  width: 100%;
  font-size: 12px;
  color: #94a3b8;
}

.skills-grid {
  flex: 1;
  display: grid;

  /* 单列布局：技能卡片纵向排列，腾出的横向空间留给左侧对话窗 */
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  overflow-y: auto;
  padding: 4px 8px 8px 4px;
  margin: -4px;
}

.panel-header {
  margin-bottom: 10px;
}

.panel-header h3 {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.panel-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

.skills-grid::-webkit-scrollbar {
  width: 6px;
}

.skills-grid::-webkit-scrollbar-track {
  background: transparent;
}

.skills-grid::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: white;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.skill-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.12);
  transform: translateY(-1px);
  border-top: 2px solid #3b82f6;
}

.skill-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 悬停提示：卡片内文字被截断时，完整内容在气泡中展示 */
.skill-tip {
  max-width: 240px;
}

.skill-tip-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
}

.skill-tip-desc {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
}

</style>
