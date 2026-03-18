<template>
  <div class="pgm-config-dialog">
    <div class="dialog-header">
      <h3>PGM编辑器配置</h3>
      <button @click="closeDialog" class="close-btn">×</button>
    </div>
    
    <div class="main-content">
      <!-- 左侧工具栏 -->
      <div class="sidebar">
        <div class="tool-group">
          <h3>编辑工具</h3>
          <button 
            :class="{ active: currentTool === 'brush' }" 
            @click="currentTool = 'brush'"
          >
            画笔
          </button>
          <button 
            :class="{ active: currentTool === 'eraser' }" 
            @click="currentTool = 'eraser'"
          >
            橡皮擦
          </button>
          <button 
            :class="{ active: currentTool === 'goal' }" 
            @click="currentTool = 'goal'"
          >
            目标点
          </button>
        </div>
        
        <div class="tool-group">
          <h3>缩放控制</h3>
          <button @click="zoomIn">放大</button>
          <button @click="zoomOut">缩小</button>
          <button @click="resetZoom">重置</button>
          <span>{{ zoomLevel }}%</span>
        </div>
        
        <div class="tool-group" v-if="config.ros.enabled">
          <h3>ROS2控制</h3>
          <button @click="connectRos">连接</button>
          <button @click="disconnectRos">断开</button>
          <span :class="{ connected: rosConnected }">{{ rosConnected ? '已连接' : '未连接' }}</span>
        </div>
        
        <div class="tool-group">
          <h3>文件操作</h3>
          <button @click="saveFile">保存到本地</button>
        </div>
      </div>
      
      <!-- 右侧画布和状态栏 -->
      <div class="content">
        <!-- 画布容器 -->
        <div class="canvas-container" ref="canvasContainer">
          <canvas 
            ref="canvas" 
            :width="config.global.canvasWidth" 
            :height="config.global.canvasHeight"
            :style="canvasStyle"
            @click="handleCanvasClick"
            @wheel="handleWheel"
          ></canvas>
        </div>
        
        <!-- 状态栏 -->
        <div class="status-bar">
          <div>机器人状态: {{ robotStatus }}</div>
          <div>ROS连接: {{ rosConnected ? '已连接' : '未连接' }}</div>
          <div>目标点位: {{ goalPoints.length }}</div>
        </div>
        
        <!-- 目标点位管理 -->
        <div class="goal-management" v-if="currentTool === 'goal'">
          <h3>目标点位管理</h3>
          <div class="goal-list">
            <div 
              v-for="(point, index) in goalPoints" 
              :key="point.id"
              class="goal-item"
            >
              <span>{{ point.name }}</span>
              <span>({{ point.x.toFixed(1) }}, {{ point.y.toFixed(1) }})</span>
              <button @click="editGoal(index)">编辑</button>
              <button @click="deleteGoal(index)">删除</button>
              <button @click="sendGoal(point)">发送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="dialog-footer">
      <button @click="closeDialog" class="cancel-btn">取消</button>
      <button @click="saveConfig" class="save-btn">保存</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, toRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { parsePgmFile, drawPgmToCanvas, createPgmFromCanvas, encodePgmImage, PgmImage } from './pgm-parser'
import { CanvasEditor } from './canvas-editor'
import { emitter } from '@/mitter'

export default defineComponent({
  name: 'PgmConfigDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    config: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    const config = toRef(props, 'config')
    const canvas = ref<HTMLCanvasElement | null>(null)
    const canvasContainer = ref<HTMLElement | null>(null)
    const canvasEditor = ref<CanvasEditor | null>(null)
    const currentTool = ref<'brush' | 'eraser' | 'goal'>('brush')
    const pgmImage = ref<PgmImage | null>(null)
    const rosConnected = ref(false)
    const robotStatus = ref('idle')
    const goalPoints = ref<Array<{id: string, name: string, x: number, y: number, theta?: number}>>([])
    const zoomLevel = ref(100)
    
    const canvasStyle = computed(() => {
      return {
        transform: `scale(${zoomLevel.value / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease'
      }
    })
    
    // 初始化Canvas编辑器
    onMounted(() => {
      if (canvas.value) {
        canvasEditor.value = new CanvasEditor({
          canvas: canvas.value,
          brushSize: config.value.editor.brushSize,
          brushColor: config.value.editor.brushColor,
          brushShape: config.value.editor.brushShape as 'circle' | 'square',
          eraserSize: config.value.editor.eraserSize,
          zoomLevel: zoomLevel.value
        })
        
        // 加载默认数据
        loadDefaultData()
        
        // 页面加载时自动加载PGM文件
        if (config.value.file.url) {
          handleFileUpload(config.value.file.url)
        }
      }
    })
    
    // 监听缩放变化
    watch(zoomLevel, (newZoom) => {
      if (canvasEditor.value) {
        canvasEditor.value.setZoomLevel(newZoom)
      }
    })
    
    // 监听工具变化
    watch(currentTool, (newTool) => {
      console.log('Current tool changed to:', newTool)
      if (canvasEditor.value) {
        if (newTool === 'eraser') {
          console.log('Enabling eraser')
          canvasEditor.value.enableEraser()
        } else if (newTool === 'brush') {
          console.log('Enabling brush')
          canvasEditor.value.enableBrush()
        }
      }
    })
    
    // 加载默认数据
    const loadDefaultData = async () => {
      try {
        // 这里可以添加加载默认数据的逻辑
      } catch (error) {
        console.error('Failed to load default data:', error)
      }
    }
    
    // 处理文件上传
    const handleFileUpload = async (url: string) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const image = await parsePgmFile(blob)
        pgmImage.value = image
        drawPgmToCanvas(image, canvas.value!)
      } catch (error) {
        console.error('Failed to load PGM file from URL:', error)
      }
    }
    
    // 保存文件
    const saveFile = () => {
      if (!canvas.value) return
      
      try {
        // 如果没有加载PGM文件，使用默认的maxValue
        const maxValue = pgmImage.value ? pgmImage.value.maxValue : 255
        const image = createPgmFromCanvas(canvas.value, maxValue)
        const blob = encodePgmImage(image)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'map.pgm'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to save PGM file:', error)
      }
    }
    
    // 清空画布
    const clearCanvas = () => {
      if (!canvas.value) return
      
      const ctx = canvas.value.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
      }
    }
    
    // 处理画布点击
    const handleCanvasClick = (e: MouseEvent) => {
      if (currentTool.value === 'goal') {
        // 添加目标点
        const rect = canvas.value!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        goalPoints.value.push({
          id: Date.now().toString(),
          name: `目标点 ${goalPoints.value.length + 1}`,
          x: x / (zoomLevel.value / 100),
          y: y / (zoomLevel.value / 100)
        })
      }
    }
    
    // 处理鼠标滚轮
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -10 : 10
      if ((zoomLevel.value > 10 || delta > 0) && (zoomLevel.value < 500 || delta < 0)) {
        zoomLevel.value += delta
      }
    }
    
    // 放大
    const zoomIn = () => {
      if (zoomLevel.value < 500) {
        zoomLevel.value += 10
      }
    }
    
    // 缩小
    const zoomOut = () => {
      if (zoomLevel.value > 10) {
        zoomLevel.value -= 10
      }
    }
    
    // 重置缩放
    const resetZoom = () => {
      zoomLevel.value = 100
    }
    
    // 连接ROS2
    const connectRos = () => {
      // 这里可以添加连接ROS2的逻辑
      rosConnected.value = true
      robotStatus.value = 'connected'
    }
    
    // 断开ROS2
    const disconnectRos = () => {
      // 这里可以添加断开ROS2的逻辑
      rosConnected.value = false
      robotStatus.value = 'disconnected'
    }
    
    // 编辑目标点
    const editGoal = (index: number) => {
      // 这里可以添加编辑目标点的逻辑
    }
    
    // 删除目标点
    const deleteGoal = (index: number) => {
      goalPoints.value.splice(index, 1)
    }
    
    // 发送目标点
    const sendGoal = (point: {id: string, name: string, x: number, y: number, theta?: number}) => {
      // 这里可以添加发送目标点的逻辑
    }
    
    const closeDialog = () => {
      emit('close')
    }
    
    const saveConfig = () => {
      emit('save', config.value)
    }
    
    return {
      config,
      canvas,
      canvasContainer,
      currentTool,
      rosConnected,
      robotStatus,
      goalPoints,
      zoomLevel,
      canvasStyle,
      handleFileUpload,
      saveFile,
      clearCanvas,
      handleCanvasClick,
      zoomIn,
      zoomOut,
      resetZoom,
      handleWheel,
      connectRos,
      disconnectRos,
      editGoal,
      deleteGoal,
      sendGoal,
      closeDialog,
      saveConfig
    }
  }
})
</script>

<style scoped>
.pgm-config-dialog {
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主内容区域 */
.main-content {
  display: flex;
  width: 100%;
  height: 600px;
}

/* 左侧工具栏 */
.sidebar {
  width: 180px;
  padding: 12px;
  border-right: 1px solid #e8e8e8;
  background: #f9f9f9;
  overflow-y: auto;
}

/* 右侧内容区域 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 工具组 */
.tool-group {
  margin-bottom: 16px;
}

.tool-group h3 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
}

.tool-group button {
  display: block;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-bottom: 4px;
  text-align: left;
}

.tool-group button.active {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}

.tool-group label {
  font-size: 11px;
  margin-right: 8px;
}

.tool-group input[type="range"] {
  width: 100%;
}

.tool-group select {
  width: 100%;
  padding: 2px 4px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
}

.tool-group span {
  display: block;
  font-size: 11px;
  margin-top: 4px;
}

/* 画布容器 */
.canvas-container {
  position: relative;
  width: 100%;
  flex: 1;
  overflow: auto;
  border: 1px solid #e8e8e8;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-container canvas {
  background: #ffffff;
  border: 1px solid #d9d9d9;
}

/* 状态栏 */
.status-bar {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  border-top: 1px solid #e8e8e8;
  background: #f9f9f9;
  font-size: 12px;
  color: #666;
}

/* 目标点位管理 */
.goal-management {
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  background: #f9f9f9;
}

.goal-management h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.goal-item button {
  padding: 2px 8px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.connected {
  color: #28a745;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #e8e8e8;
}

.cancel-btn,
.save-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn {
  background: #fff;
  color: #333;
}

.save-btn {
  background: #1890ff;
  color: #fff;
  border-color: #1890ff;
}
</style>