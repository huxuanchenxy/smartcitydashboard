<template>
  <div class="pgm-config-dialog">
    <div class="dialog-header">
      <h3>PGM编辑器配置</h3>
      <button @click="closeDialog" class="close-btn">×</button>
    </div>
    
    <div class="main-content">
      <!-- 左侧工具栏 -->
      <div class="sidebar">
        <!-- Tab菜单 -->
        <div class="tab-menu">
          <div 
            class="tab-item" 
            :class="{ active: currentTool === 'brush' }" 
            @click="currentTool = 'brush'"
          >
            画笔
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTool === 'eraser' }" 
            @click="currentTool = 'eraser'"
          >
            橡皮擦
          </div>
          <div 
            class="tab-item" 
            :class="{ active: currentTool === 'goal' }" 
            @click="currentTool = 'goal'"
          >
            标记点
          </div>
        </div>
        
        <!-- 画笔设置 -->
        <div class="tool-group" v-show="currentTool === 'brush'">
          <h3>画笔设置</h3>
          <label>大小: {{ config.editor.brushSize }}</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            step="1" 
            v-model.number="config.editor.brushSize"
            @input="updateBrushSize"
          />
          <label>灰度: {{ config.editor.brushColor }}</label>
          <input 
            type="range" 
            min="0" 
            max="255" 
            step="1" 
            v-model.number="config.editor.brushColor"
            @input="updateBrushColor"
          />
          <label>形状:</label>
          <select v-model="config.editor.brushShape" @change="updateBrushShape">
            <option value="circle">圆形</option>
            <option value="square">方形</option>
          </select>
        </div>
        
        <!-- 橡皮擦设置 -->
        <div class="tool-group" v-show="currentTool === 'eraser'">
          <h3>橡皮擦设置</h3>
          <label>大小: {{ config.editor.eraserSize }}</label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            step="1" 
            v-model.number="config.editor.eraserSize"
            @input="updateEraserSize"
          />
        </div>
        
        <!-- 标记点设置 -->
        <div class="tool-group" v-show="currentTool === 'goal'">
          <h3>标记点设置</h3>
          <label>大小: {{ config.goals.pointSize }}</label>
          <input 
            type="range" 
            min="2" 
            max="20" 
            step="1" 
            v-model.number="config.goals.pointSize"
            @input="updateGoalPointSize"
          />
          <label>颜色: {{ config.goals.pointColor }}</label>
          <input 
            type="color" 
            v-model="config.goals.pointColor"
            @input="updateGoalPointColor"
          />
          <label>显示目标点:</label>
          <input 
            type="checkbox" 
            v-model="showGoalPoints"
            @change="toggleGoalPoints"
          />
        </div>
        

        
        <div class="tool-group" v-if="config.ros.enabled">
          <h3>ROS2控制</h3>
          <button @click="connectRos">连接</button>
          <button @click="disconnectRos">断开</button>
          <span :class="{ connected: rosConnected }">{{ rosConnected ? '已连接' : '未连接' }}</span>
        </div>
        
        <div class="tool-group">
          <h3>文件操作</h3>
          <button @click="saveFile">保存PGM文件</button>
          <button @click="saveGoalPointsImage" v-show="currentTool === 'goal'">保存目标点图像</button>
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
          <!-- 目标点叠加层 -->
          <canvas 
            ref="goalCanvas" 
            :width="config.global.canvasWidth" 
            :height="config.global.canvasHeight"
            :style="{ ...canvasStyle, ...goalCanvasStyle }"
          ></canvas>
        </div>
        
        <!-- 状态栏 -->
        <div class="status-bar">
          <div>机器人状态: {{ robotStatus }}</div>
          <div>ROS连接: {{ rosConnected ? '已连接' : '未连接' }}</div>
          <div>目标点位: {{ goalPoints.length }}</div>
          <div class="zoom-controls">
            <button @click="zoomIn" class="zoom-btn">+</button>
            <span>{{ zoomLevel }}%</span>
            <button @click="zoomOut" class="zoom-btn">-</button>
            <button @click="resetZoom" class="zoom-btn">重置</button>
          </div>
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
    const goalCanvas = ref<HTMLCanvasElement | null>(null)
    const canvasContainer = ref<HTMLElement | null>(null)
    const canvasEditor = ref<CanvasEditor | null>(null)
    const currentTool = ref<'brush' | 'eraser' | 'goal'>('brush')
    const pgmImage = ref<PgmImage | null>(null)
    const rosConnected = ref(false)
    const robotStatus = ref('idle')
    const goalPoints = ref<Array<{id: string, name: string, x: number, y: number, theta?: number}>>([])
    const zoomLevel = ref(100)
    const showGoalPoints = ref(true)
    
    const canvasStyle = computed(() => {
      return {
        transform: `scale(${zoomLevel.value / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.2s ease'
      }
    })
    
    const goalCanvasStyle = computed(() => {
      return {
        position: 'absolute' as const,
        top: '0',
        left: '0',
        pointerEvents: 'none' as const,
        opacity: showGoalPoints.value ? '1' : '0',
        background: 'transparent' as const
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
          canvasEditor.value.enableDrawing()
          canvasEditor.value.enableEraser()
          // 启用Canvas的鼠标事件
          if (canvas.value) {
            canvas.value.style.pointerEvents = 'auto'
          }
        } else if (newTool === 'brush') {
          console.log('Enabling brush')
          canvasEditor.value.enableDrawing()
          canvasEditor.value.enableBrush()
          // 启用Canvas的鼠标事件
          if (canvas.value) {
            canvas.value.style.pointerEvents = 'auto'
          }
        } else if (newTool === 'goal') {
          console.log('Enabling goal tool')
          // 禁用CanvasEditor的绘制功能
          canvasEditor.value.disableDrawing()
          // 启用Canvas的鼠标事件以捕获点击
          if (canvas.value) {
            canvas.value.style.pointerEvents = 'auto'
          }
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
    
    // 绘制目标点
    const drawGoalPoints = () => {
      if (!goalCanvas.value || !showGoalPoints.value) return
      
      const ctx = goalCanvas.value.getContext('2d')
      if (!ctx) return
      
      // 清空目标点画布
      ctx.clearRect(0, 0, goalCanvas.value.width, goalCanvas.value.height)
      
      // 绘制目标点
      goalPoints.value.forEach(point => {
        ctx.save()
        ctx.fillStyle = config.value.goals.pointColor
        ctx.beginPath()
        ctx.arc(point.x, point.y, config.value.goals.pointSize / 2, 0, Math.PI * 2)
        ctx.fill()
        
        // 绘制目标点名称
        if (config.value.goals.showNames) {
          ctx.fillStyle = '#000'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(point.name, point.x, point.y - config.value.goals.pointSize / 2 - 2)
        }
        ctx.restore()
      })
    }
    
    // 处理文件上传
    const handleFileUpload = async (url: string) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const image = await parsePgmFile(blob)
        pgmImage.value = image
        
        // 调整canvas尺寸以匹配容器大小
        if (canvas.value && goalCanvas.value && canvasContainer.value) {
          const containerWidth = canvasContainer.value.clientWidth;
          const containerHeight = canvasContainer.value.clientHeight;
          
          // 设置canvas的实际尺寸
          canvas.value.width = containerWidth;
          canvas.value.height = containerHeight;
          goalCanvas.value.width = containerWidth;
          goalCanvas.value.height = containerHeight;
          
          // 绘制图像并进行适当的缩放
          const ctx = canvas.value.getContext('2d');
          if (ctx) {
            // 清空画布
            ctx.clearRect(0, 0, containerWidth, containerHeight);
            
            // 计算缩放比例
            const scaleX = containerWidth / image.width;
            const scaleY = containerHeight / image.height;
            const scale = Math.min(scaleX, scaleY);
            
            // 计算偏移量，使图像居中
            const offsetX = (containerWidth - image.width * scale) / 2;
            const offsetY = (containerHeight - image.height * scale) / 2;
            
            // 绘制缩放后的图像
            const imageData = ctx.createImageData(image.width, image.height);
            imageData.data.set(image.data);
            
            // 创建临时canvas来绘制原始图像
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = image.width;
            tempCanvas.height = image.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.putImageData(imageData, 0, 0);
              
              // 将临时canvas中的图像缩放到主canvas
              ctx.drawImage(tempCanvas, offsetX, offsetY, image.width * scale, image.height * scale);
            }
          }
          
          // 绘制目标点
          drawGoalPoints()
        }
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
        
        // 重新绘制目标点
        drawGoalPoints()
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
      // 重新绘制目标点
      drawGoalPoints()
    }
    
    // 更新目标点大小
    const updateGoalPointSize = () => {
      drawGoalPoints()
    }
    
    // 更新目标点颜色
    const updateGoalPointColor = () => {
      drawGoalPoints()
    }
    
    // 切换目标点显示/隐藏
    const toggleGoalPoints = () => {
      drawGoalPoints()
    }
    
    // 保存目标点图像
    const saveGoalPointsImage = () => {
      if (!goalCanvas.value) return
      
      try {
        // 创建一个新的Canvas，只包含目标点
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = goalCanvas.value.width
        tempCanvas.height = goalCanvas.value.height
        const tempCtx = tempCanvas.getContext('2d')
        
        if (tempCtx) {
          // 清空临时Canvas
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height)
          
          // 绘制目标点
          goalPoints.value.forEach(point => {
            tempCtx.save()
            tempCtx.fillStyle = config.value.goals.pointColor
            tempCtx.beginPath()
            tempCtx.arc(point.x, point.y, config.value.goals.pointSize / 2, 0, Math.PI * 2)
            tempCtx.fill()
            
            // 绘制目标点名称
            if (config.value.goals.showNames) {
              tempCtx.fillStyle = '#000'
              tempCtx.font = '12px Arial'
              tempCtx.textAlign = 'center'
              tempCtx.textBaseline = 'bottom'
              tempCtx.fillText(point.name, point.x, point.y - config.value.goals.pointSize / 2 - 2)
            }
            tempCtx.restore()
          })
          
          // 将Canvas转换为图像并下载
          tempCanvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'goal-points.png'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }
          })
        }
      } catch (error) {
        console.error('Failed to save goal points image:', error)
      }
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
    
    // 更新画笔大小
    const updateBrushSize = () => {
      if (canvasEditor.value) {
        canvasEditor.value.setBrushSize(config.value.editor.brushSize)
      }
    }
    
    // 更新画笔颜色
    const updateBrushColor = () => {
      if (canvasEditor.value) {
        canvasEditor.value.setBrushColor(config.value.editor.brushColor)
      }
    }
    
    // 更新画笔形状
    const updateBrushShape = () => {
      if (canvasEditor.value) {
        canvasEditor.value.setBrushShape(config.value.editor.brushShape as 'circle' | 'square')
      }
    }
    
    // 更新橡皮擦大小
    const updateEraserSize = () => {
      if (canvasEditor.value) {
        canvasEditor.value.setEraserSize(config.value.editor.eraserSize)
      }
    }
    
    return {
      config,
      canvas,
      goalCanvas,
      canvasContainer,
      currentTool,
      rosConnected,
      robotStatus,
      goalPoints,
      zoomLevel,
      showGoalPoints,
      canvasStyle,
      goalCanvasStyle,
      handleFileUpload,
      saveFile,
      saveGoalPointsImage,
      clearCanvas,
      handleCanvasClick,
      zoomIn,
      zoomOut,
      resetZoom,
      handleWheel,
      updateBrushSize,
      updateBrushColor,
      updateBrushShape,
      updateEraserSize,
      updateGoalPointSize,
      updateGoalPointColor,
      toggleGoalPoints,
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
  max-width: 1800px;
  max-height: 95vh;
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
  height: 620px;
}

/* 左侧工具栏 */
.sidebar {
  width: 220px;
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

/* Tab菜单样式 */
.tab-menu {
  display: flex;
  margin-bottom: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.tab-item {
  flex: 1;
  padding: 8px 12px;
  text-align: center;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.tab-item:hover {
  color: #1890ff;
}

.tab-item.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  font-weight: 600;
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
}

.canvas-container canvas {
  background: #ffffff;
  border: 1px solid #d9d9d9;
  width: 100%;
  height: 100%;
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
  justify-content: space-between;
  align-items: center;
}

/* 缩放控制 */
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zoom-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
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