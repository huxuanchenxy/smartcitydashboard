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
    
    <!-- 编辑器配置 -->
    <g-field-collapse label="编辑器">
      <g-field :level="2" label="默认工具">
        <g-select v-model="config.editor.tool" :data="toolOptions" />
      </g-field>
      <g-field :level="2" label="画笔大小">
        <g-input-number v-model="config.editor.brushSize" :min="1" :max="50" :step="1" />
      </g-field>
      <g-field :level="2" label="画笔灰度">
        <g-slider v-model="config.editor.brushColor" :min="0" :max="255" :step="1" />
      </g-field>
      <g-field :level="2" label="画笔形状">
        <g-select v-model="config.editor.brushShape" :data="shapeOptions" />
      </g-field>
      <g-field :level="2" label="橡皮擦大小">
        <g-input-number v-model="config.editor.eraserSize" :min="1" :max="50" :step="1" />
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
    
    <!-- 目标点配置 -->
    <g-field-collapse label="目标点位">
      <g-field :level="2" label="显示名称">
        <n-switch v-model:value="config.goals.showNames" />
      </g-field>
      <g-field :level="2" label="点位大小">
        <g-input-number v-model="config.goals.pointSize" :min="2" :max="20" :step="1" suffix="px" />
      </g-field>
      <g-field :level="2" label="点位颜色">
        <g-color-picker v-model="config.goals.pointColor" />
      </g-field>
    </g-field-collapse>
    
    <!-- 文件配置 -->
    <g-field-collapse label="文件">
      <g-field :level="2" label="PGM格式">
        <g-select v-model="config.file.format" :data="formatOptions" />
      </g-field>
      <g-field :level="2" label="最大灰度值">
        <g-input-number v-model="config.file.maxValue" :min="1" :max="255" :step="1" />
      </g-field>
    </g-field-collapse>
    
    <!-- 鼠标指针 -->
    <g-field label="鼠标指针">
      <g-select v-model="config.cursor" :data="cursorFamily" />
    </g-field>
  </div>
</template>

<script lang='ts'>
import { defineComponent, PropType, toRef, computed } from 'vue'
import {
  fontFamilys,
  cursorFamily
} from '@/data/select-options'
import { PgmEditor } from './pgm-editor'

export default defineComponent({
  name: 'VPgmEditorProp',
  props: {
    com: {
      type: Object as PropType<PgmEditor>,
      required: true,
    },
  },
  setup(props) {
    const config = toRef(props.com, 'config')
    
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
      formatOptions
    }
  },
})
</script>