<template>
  <div class="datav-wrapper" :style="wrapperStyle">
    <!-- 工具栏 -->
    <!-- <div class="toolbar">
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
      
      <div class="tool-group">
        <h3>画笔设置</h3>
        <label>大小: <input type="range" v-model.number="config.editor.brushSize" min="1" max="20" /></label>
        <label>灰度: <input type="range" v-model.number="config.editor.brushColor" min="0" max="255" /></label>
        <label>形状: 
          <select v-model="config.editor.brushShape">
            <option value="circle">圆形</option>
            <option value="square">方形</option>
          </select>
        </label>
      </div>
      
      <div class="tool-group" v-if="config.ros.enabled">
        <h3>ROS2控制</h3>
        <button @click="connectRos">连接</button>
        <button @click="disconnectRos">断开</button>
        <span :class="{ connected: rosConnected }">{{ rosConnected ? '已连接' : '未连接' }}</span>
      </div>
    </div> -->
    
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
</template>

<script lang='ts'>
import { defineComponent, PropType, ref, toRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDataCenter, getFieldMap } from '@/mixins/data-center'
import { ApiModule } from '@/store/modules/api'
import { PgmEditor } from './pgm-editor'
import { useEventCenter } from '@/mixins/event-center'
import { parsePgmFile, encodePgmImage, createPgmFromCanvas, drawPgmToCanvas, PgmImage } from './pgm-parser'
import { CanvasEditor } from './canvas-editor'
import { emitter } from '@/mitter'

export default defineComponent({
  name: 'VPgmEditor',
  props: {
    com: {
      type: Object as PropType<PgmEditor>,
      required: true,
    },
  },
  setup(props) {
    useDataCenter(props.com)
    useEventCenter(props.com)

    const canvas = ref<HTMLCanvasElement | null>(null)
    const canvasContainer = ref<HTMLElement | null>(null)
    const canvasEditor = ref<CanvasEditor | null>(null)
    const currentTool = ref<'brush' | 'eraser' | 'goal'>('brush')
    const pgmImage = ref<PgmImage | null>(null)
    const rosConnected = ref(false)
    const robotStatus = ref('idle')
    const goalPoints = ref<Array<{id: string, name: string, x: number, y: number, theta?: number}>>([])
    const zoomLevel = ref(100)
    
    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    
    const wrapperStyle = computed(() => {
      return {
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
        backgroundColor: config.value.global.backgroundColor,
        position: 'relative' as const,
        overflow: 'hidden' as const
      }
    })
    
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
          eraserSize: config.value.editor.eraserSize
        })
        
        // 加载默认数据
        loadDefaultData()
        
        // 页面加载时自动加载PGM文件
        if (config.value.file.url) {
          handleFileUpload(config.value.file.url)
        }
      }
      
      // 监听配置面板的文件操作事件
      emitter.on('pgm-file-upload', handleFileUpload)
      emitter.on('pgm-save-file', saveFile)
      emitter.on('pgm-clear-canvas', clearCanvas)
    })
    
    // 加载默认数据
    const loadDefaultData = async () => {
      try {
        const dv_data = ApiModule.dataMap[props.com.id]?.source ?? {}
        if (dv_data.imageData) {
          // 从数据中加载图像
          const imageData = new ImageData(
            new Uint8ClampedArray(dv_data.imageData),
            dv_data.width,
            dv_data.height
          )
          canvasEditor.value?.setImageData(imageData)
        }
        
        if (dv_data.goalPoints) {
          goalPoints.value = dv_data.goalPoints
        }
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
        
        // 更新数据
        updateComponentData(image)
      } catch (error) {
        console.error('Failed to load PGM file from URL:', error)
      }
    }
    
    // 保存文件
    const saveFile = () => {
      if (!canvas.value) return
      
      try {
        const image = createPgmFromCanvas(canvas.value, config.value.file.maxValue)
        const blob = encodePgmImage(image)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'edited.pgm'
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Failed to save PGM file:', error)
      }
    }
    
    // 清空画布
    const clearCanvas = () => {
      canvasEditor.value?.clear()
    }
    
    // 处理画布点击
    const handleCanvasClick = (e: MouseEvent) => {
      if (currentTool.value === 'goal') {
        const rect = canvas.value!.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const newGoal = {
          id: `goal_${Date.now()}`,
          name: `Goal ${goalPoints.value.length + 1}`,
          x,
          y
        }
        
        goalPoints.value.push(newGoal)
        updateGoalPoints()
      }
    }
    
    // 编辑目标点
    const editGoal = (index: number) => {
      const goal = goalPoints.value[index]
      const newName = prompt('Enter new name:', goal.name)
      if (newName) {
        goal.name = newName
        updateGoalPoints()
      }
    }
    
    // 删除目标点
    const deleteGoal = (index: number) => {
      goalPoints.value.splice(index, 1)
      updateGoalPoints()
    }
    
    // 发送目标点
    const sendGoal = (goal: {x: number, y: number, theta?: number}) => {
      // 这里应该调用ROS2服务发送目标
      console.log('Sending goal:', goal)
      robotStatus.value = 'moving'
      
      // 模拟机器人移动
      setTimeout(() => {
        robotStatus.value = 'idle'
      }, 2000)
    }
    
    // 连接ROS2
    const connectRos = () => {
      // 这里应该建立ROS2连接
      console.log('Connecting to ROS2...')
      rosConnected.value = true
    }
    
    // 断开ROS2
    const disconnectRos = () => {
      // 这里应该断开ROS2连接
      console.log('Disconnecting from ROS2...')
      rosConnected.value = false
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
    
    // 处理鼠标滚轮
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -10 : 10
      if ((zoomLevel.value > 10 || delta > 0) && (zoomLevel.value < 500 || delta < 0)) {
        zoomLevel.value += delta
      }
    }
    
    // 更新组件数据
    const updateComponentData = (image: PgmImage) => {
      const data = {
        imageData: Array.from(image.data),
        width: image.width,
        height: image.height,
        maxValue: image.maxValue,
        goalPoints: goalPoints.value
      }
      
      ApiModule.setData({ 
        comId: props.com.id, 
        data: { source: data } 
      })
    }
    
    // 更新目标点位
    const updateGoalPoints = () => {
      const dv_data = ApiModule.dataMap[props.com.id]?.source ?? {}
      const data = {
        ...dv_data,
        goalPoints: goalPoints.value
      }
      
      ApiModule.setData({ 
        comId: props.com.id, 
        data: { source: data } 
      })
    }
    
    // 监听配置变化
    watch(() => config.value.editor, (newConfig) => {
      if (canvasEditor.value) {
        canvasEditor.value.setBrushSize(newConfig.brushSize)
        canvasEditor.value.setBrushColor(newConfig.brushColor)
        canvasEditor.value.setBrushShape(newConfig.brushShape as 'circle' | 'square')
        canvasEditor.value.setEraserSize(newConfig.eraserSize)
      }
    }, { deep: true })
    
    // 监听工具变化
    watch(currentTool, (newTool) => {
      if (canvasEditor.value) {
        if (newTool === 'eraser') {
          canvasEditor.value.enableEraser()
        } else if (newTool === 'brush') {
          canvasEditor.value.enableBrush()
        }
      }
    })
    
    onUnmounted(() => {
      // 清理资源
      emitter.off('pgm-file-upload', handleFileUpload)
      emitter.off('pgm-save-file', saveFile)
      emitter.off('pgm-clear-canvas', clearCanvas)
    })

    return {
      canvas,
      canvasContainer,
      currentTool,
      config,
      attr,
      wrapperStyle,
      canvasStyle,
      zoomLevel,
      rosConnected,
      robotStatus,
      goalPoints,
      handleFileUpload,
      saveFile,
      clearCanvas,
      handleCanvasClick,
      editGoal,
      deleteGoal,
      sendGoal,
      connectRos,
      disconnectRos,
      zoomIn,
      zoomOut,
      resetZoom,
      handleWheel
    }
  },
})
</script>

<style scoped>
.datav-wrapper {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.tool-group h3 {
  margin: 0;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

button.active {
  background: #007bff;
  color: #fff;
  border-color: #007bff;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  position: relative;
  background: #fff;
  border: 1px solid #ddd;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

canvas {
  display: block;
  margin: 0 auto;
  border: 1px solid #eee;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px;
  background: #f5f5f5;
  border-top: 1px solid #ddd;
  font-size: 12px;
}

.goal-management {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 200px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.goal-management h3 {
  margin: 0 0 10px 0;
  font-size: 12px;
  font-weight: bold;
}

.goal-list {
  max-height: 200px;
  overflow-y: auto;
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px;
  border-bottom: 1px solid #eee;
  font-size: 12px;
}

.goal-item button {
  padding: 2px 5px;
  font-size: 10px;
  margin-right: 5px;
}

.connected {
  color: #28a745;
  font-weight: bold;
}
</style>