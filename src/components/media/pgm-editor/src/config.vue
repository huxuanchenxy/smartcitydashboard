<template>
  <div class="setting-panel-gui">
    <!-- 全局配置 -->
    <g-field-collapse label="全局">
      <g-field :level="2" label="字体">
        <g-select v-model="config.global.fontFamily" :data="fontFamilys" />
      </g-field>
      <g-field :level="2" label="画布宽度">
        <g-input-number v-model="config.global.canvasWidth" :min="100" :max="2000" :step="10" suffix="px" />
      </g-field>
      <g-field :level="2" label="画布高度">
        <g-input-number v-model="config.global.canvasHeight" :min="100" :max="2000" :step="10" suffix="px" />
      </g-field>
      <g-field :level="2" label="初始缩放">
        <g-input-number v-model="config.global.zoomLevel" :min="10" :max="500" :step="10" suffix="%" />
      </g-field>
      <g-field :level="2" label="背景颜色">
        <g-color-picker v-model="config.global.backgroundColor" />
      </g-field>
    </g-field-collapse>
    
    <!-- ROS2配置 -->
    <g-field-collapse label="ROS2">
      <g-field :level="2" label="启用ROS2">
        <n-switch v-model:value="config.ros.enabled" />
      </g-field>
      <g-field :level="2" label="WebSocket URL">
        <g-input v-model="config.ros.wsUrl" />
      </g-field>
      <g-field :level="2" label="位置话题">
        <g-input v-model="config.ros.poseTopic" />
      </g-field>
      <g-field :level="2" label="目标服务">
        <g-input v-model="config.ros.goalService" />
      </g-field>
    </g-field-collapse>
    
    <!-- 机器人配置 -->
    <g-field-collapse label="机器人">
      <g-field :level="2" label="图标大小">
        <g-input-number v-model="config.robot.iconSize" :min="5" :max="50" :step="1" suffix="px" />
      </g-field>
      <g-field :level="2" label="图标颜色">
        <g-color-picker v-model="config.robot.iconColor" />
      </g-field>
      <g-field :level="2" label="显示方向">
        <n-switch v-model:value="config.robot.showDirection" />
      </g-field>
    </g-field-collapse>
    
    <!-- 文件配置 -->
    <g-field-collapse label="PGM地图">
      <g-field :level="2" label="PGM格式">
        <g-select v-model="config.file.format" :data="formatOptions" />
      </g-field>
      <g-field :level="2" label="最大灰度值">
        <g-input-number v-model="config.file.maxValue" :min="1" :max="255" :step="1" />
      </g-field>
      <g-field :level="2" label="文件操作">
        <div class="file-operations">
          <g-input v-model="config.file.url" placeholder="输入PGM文件URL" />
          <button class="config-btn" @click="handleConfig">配置</button>
        </div>
      </g-field>
    </g-field-collapse>
  </div>
  
  <!-- 配置对话框 -->
  <div v-if="dialogVisible" class="dialog-overlay" @click="closeDialog">
    <div class="dialog-container" @click.stop>
      <PgmConfigDialog 
        :visible="dialogVisible"
        :config="config"
        @close="closeDialog"
        @save="saveConfig"
      />
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, PropType, toRef, computed, ref } from 'vue'
import {
  fontFamilys,
  cursorFamily
} from '@/data/select-options'
import { PgmEditor } from './pgm-editor'
import { emitter } from '@/mitter'
import PgmConfigDialog from './config-dialog.vue'

export default defineComponent({
  name: 'VPgmEditorProp',
  components: {
    PgmConfigDialog
  },
  props: {
    com: {
      type: Object as PropType<PgmEditor>,
      required: true,
    },
  },

  setup(props) {
    const config = toRef(props.com, 'config')
    const dialogVisible = ref(false)
    
    const handleFileUpload = () => {
      if (config.value.file.url) {
        emitter.emit('pgm-file-upload', config.value.file.url)
      }
    }
    
    const handleSaveFile = () => {
      emitter.emit('pgm-save-file')
    }
    
    const handleClearCanvas = () => {
      emitter.emit('pgm-clear-canvas')
    }
    
    const handleConfig = () => {
      dialogVisible.value = true
    }
    
    const closeDialog = () => {
      dialogVisible.value = false
    }
    
    const saveConfig = (newConfig: any) => {
      // 这里可以添加保存配置的逻辑
      dialogVisible.value = false
    }
    
    const toolOptions = computed(() => [
      { id: 'brush', value: '画笔' },
      { id: 'eraser', value: '橡皮擦' },
      { id: 'goal', value: '目标点' }
    ])
    
    const shapeOptions = computed(() => [
      { id: 'circle', value: '圆形' },
      { id: 'square', value: '方形' }
    ])
    
    const formatOptions = computed(() => [
      { id: 'P2', value: 'P2 (ASCII)' },
      { id: 'P5', value: 'P5 (Binary)' }
    ])

    return {
      config,
      fontFamilys,
      cursorFamily,
      toolOptions,
      shapeOptions,
      formatOptions,
      dialogVisible,
      handleFileUpload,
      handleSaveFile,
      handleClearCanvas,
      handleConfig,
      closeDialog,
      saveConfig
    }
  },
})
</script>

<style scoped>
/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-container {
  position: relative;
  width: 90%;
  max-width: 1160px;
  max-height: 90vh;
  z-index: 10000;
}
  /* 文件操作区域样式 */
  .file-operations {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  
  .file-operations :deep(.g-input) {
    flex: 1;
  }
  
  .config-btn {
    padding: 6px 16px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
  }
  
  .config-btn:hover {
    background: #40a9ff;
  }
  
  .config-btn:active {
    background: #096dd9;
  }
</style>