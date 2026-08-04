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
        role="backend_ops"
      />
    </div>
    <div class="right-panel">
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
import { defineComponent, ref, onMounted } from 'vue'
import DifyApiDemoDialog from '@/components/dify-chatbot/DifyApiDemoDialog.vue'

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
    const initialPosition = ref<{ x: number; y: number } | null>(null)
    const initialSize = ref<{ width: number; height: number } | null>(null)

    const skills = ref<Skill[]>([
      {
        name: '知识库检索',
        desc: '从企业知识库中智能检索相关文档、制度与规范，快速定位所需信息',
        letter: '知',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        name: '实时数据',
        desc: '实时采集与展示业务运行关键指标，动态掌握全局运营态势',
        letter: '实',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      },
      {
        name: '图纸定位',
        desc: '在工程图纸中快速定位设备与部件位置，支持坐标查找与标注',
        letter: '图',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      },
      {
        name: '历史趋势',
        desc: '分析历史数据变化趋势，预测未来走向，辅助科学决策',
        letter: '史',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      },
      {
        name: '关联研判',
        desc: '多维度数据关联分析，智能研判事件关联关系与影响范围',
        letter: '关',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      },
      {
        name: '预测计算',
        desc: '基于历史数据与算法模型，预测未来业务指标与风险变化',
        letter: '预',
        color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      },
      {
        name: '模板规则',
        desc: '内置业务模板与规则库，快速套用标准化流程与配置',
        letter: '模',
        color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      },
      {
        name: '指令下发',
        desc: '快速下发工作指令至指定部门或人员，跟踪执行进度',
        letter: '指',
        color: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
      },
      {
        name: '文档生成',
        desc: '自动生成各类业务文档、报告与总结，提升办公效率',
        letter: '文',
        color: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
      },
      {
        name: '交互确认',
        desc: '关键操作需人工确认，确保流程合规与数据安全',
        letter: '确',
        color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
      },
    ])

    const addSkill = (skill: Skill) => {
      console.log('添加技能:', skill.name)
    }

    onMounted(() => {
      if (leftPanelRef.value) {
        const rect = leftPanelRef.value.getBoundingClientRect()
        initialPosition.value = { x: rect.left, y: rect.top }
        initialSize.value = {
          width: rect.width,
          height: rect.height,
        }
      }
    })

    return {
      showDialog,
      leftPanelRef,
      initialPosition,
      initialSize,
      skills,
      addSkill,
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
  flex: 1;
  position: relative;
  min-width: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
  overflow: hidden;
  background-color: #f8fafc;
  border-radius:16px;
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
