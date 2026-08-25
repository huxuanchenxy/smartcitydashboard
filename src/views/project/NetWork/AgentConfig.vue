<template>
  <div class="agent-config-page">
    <div ref="leftPanelRef" class="left-panel">
      <DifyApiDemoDialog
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
        <span class="panel-subtitle">选择技能添加到 Agent</span>
      </div>
      <div class="skills-grid">
        <div
          v-for="skill in skills"
          :key="skill.name"
          class="skill-card"
          @click="addSkill(skill)"
        >
          <div class="skill-avatar" :style="{ background: skill.color }">
            {{ skill.letter }}
          </div>
          <div class="skill-info">
            <div class="skill-name">{{ skill.name }}</div>
            <div class="skill-desc">{{ skill.desc }}</div>
          </div>
          <div class="skill-add">+</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import DifyApiDemoDialog from '@/components/dify-chatbot/DifyApiDemoDialog.vue'
import {
  getFontScale,
  setFontScale,
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  FONT_SCALE_STEP,
} from '@/components/dify-chatbot/font-scale'

interface Skill {
  name: string
  desc: string
  letter: string
  color: string
}

export default defineComponent({
  name: 'AgentConfig',
  components: {
    DifyApiDemoDialog,
  },
  setup() {
    const showDialog = ref(true)
    const leftPanelRef = ref<HTMLElement | null>(null)
    const initialPosition = ref<{ x: number; y: number; } | null>(null)
    const initialSize = ref<{ width: number; height: number; } | null>(null)

    const skills = ref<Skill[]>([
      {
        name: '文字转SQL',
        desc: '把自然语言转换为可执行的SQL查询',
        letter: '文',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        name: '设备别名归一',
        desc: '把多种设备说法自动归一为设备知识库唯一ID',
        letter: '设',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      {
        name: '时间语义解析',
        desc: '将自然时间说法解析为标准时间范围，供历史检索限定时间窗',
        letter: '时',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      {
        name: '数值条件结构化抽取',
        desc: '将数值条件输出为「字段-操作符-值」三元组，用于生成查询条件或联动规则',
        letter: '数',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      },
      {
        name: '相似故障检索',
        desc: '输入故障描述，从历史故障库召回相似案例，为根因研判提供参照',
        letter: '相',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      {
        name: '故障根因概率推断',
        desc: '结合故障现象与实时数据，输出可能根因并按概率排序，辅助快速定位故障',
        letter: '故',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      },
      {
        name: '图纸符号识别',
        desc: '从图纸区域切片中识别标准图例符号并映射到图例库编码',
        letter: '图',
        color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      },
      {
        name: '查询边界判定与澄清',
        desc: '判断查询是否超出 AI 能力范围，输出「可回答/需澄清/拒答」及缺失槽位，防止错误作答',
        letter: '查',
        color: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      },
    ])

    const addSkill = (skill: Skill) => {
      console.log('添加技能:', skill.name)
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

    onMounted(() => {
      window.addEventListener('keydown', onKeydown)
      if (leftPanelRef.value) {
        const rect = leftPanelRef.value.getBoundingClientRect()
        initialPosition.value = { x: rect.left, y: rect.top }
        initialSize.value = {
          width: rect.width,
          height: rect.height,
        }
      }
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', onKeydown)
    })

    return {
      showDialog,
      leftPanelRef,
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
  /* 与 right-panel 3:5 分屏：对话窗比早期对半分缩小 1/4，腾出的宽度给技能库 */
  flex: 3;
  position: relative;
  min-width: 0;
}

.right-panel {
  flex: 5;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
  background-color: #f8fafc;
  border-radius:16px;
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding: 4px 8px 4px 4px;
  margin: -4px;
}

.panel-header {
  margin-bottom: 20px;
}

.panel-header h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
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
  gap: 12px;
  padding: 16px;
  background-color: white;
  border-radius: 12px;
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
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
  min-width: 0;
}

.skill-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skill-add {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background-color: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 400;
  transition: all 0.2s;
  flex-shrink: 0;
}

.skill-card:hover .skill-add {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}
</style>
