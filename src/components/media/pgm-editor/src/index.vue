<template>
  <div class="datav-wrapper" :style="wrapperStyle">
        <!-- 画布容器 -->
    <div 
      class="canvas-container" 
      ref="canvasContainer"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <!-- ⭐ 统一变换层 -->
      <div class="transform-layer" :style="transformStyle">
        <canvas 
          ref="canvas" 
          :width="canvasSize.width" 
          :height="canvasSize.height"
        ></canvas>

        <canvas 
          ref="goalCanvas" 
          :width="canvasSize.width" 
          :height="canvasSize.height"
          class="goal-canvas"
        ></canvas>
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
import { parsePgmFile, drawPgmToCanvas, createPgmFromCanvas, encodePgmImage, PgmImage } from './pgm-parser'
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
    const robotPosition = ref<{x: number, y: number, theta: number}>({
      x: 200, // 初始假数据
      y: 100, // 初始假数据
      theta: 45 // 初始假数据
    })
    
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
    
    // ====== ⭐ 核心：缩放 + 平移 ======
    const scale = ref(1)
    const offset = ref({ x: 0, y: 0 })
    const isDragging = ref(false)
    const lastMouse = ref({ x: 0, y: 0 })

    const transformStyle = computed(() => ({
      transform: `translate(${offset.value.x}px, ${offset.value.y}px) scale(${scale.value})`,
      transformOrigin: '0 0'
    }))
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
        background: 'transparent' as const,
        zIndex: 10
      }
    })
    
    // 计算canvas的大小
    const canvasSize = computed(() => {
      const width = canvasContainer.value?.clientWidth || config.value.global.canvasWidth
      const height = canvasContainer.value?.clientHeight || config.value.global.canvasHeight
      return { width, height }
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
        
        // 禁用绘制功能，只在config-dialog中允许绘制
        canvasEditor.value.disableDrawing()
        
        // 加载默认数据
        loadDefaultData()
        
        // 页面加载时自动加载PGM文件
        if (config.value.file.url) {
          handleFileUpload(config.value.file.url)
        }
        
        // 页面加载时自动加载goalUrl图像
        if (config.value.goals.goalUrlEnabled && config.value.goals.goalUrl) {
          loadGoalUrlImage(config.value.goals.goalUrl)
        }
      }
      
      // 监听配置面板的文件操作事件
      emitter.on('pgm-file-upload', handleFileUpload)
      emitter.on('pgm-save-file', saveFile)
      emitter.on('pgm-clear-canvas', clearCanvas)
      
      // 监听组件大小变化（使用防抖避免频繁触发）
      let resizeTimeout: number | null = null
      const resizeObserver = new ResizeObserver((entries) => {
        // 防抖处理
        if (resizeTimeout) {
          clearTimeout(resizeTimeout)
        }
        
        resizeTimeout = window.setTimeout(() => {
          // 确保canvas和goalCanvas存在
          if (!canvas.value || !goalCanvas.value) return
          
          // 获取新的尺寸
          const entry = entries[0]
          const { width, height } = entry.contentRect
          
          // 验证尺寸有效性（避免为0或过小）
          if (width < 10 || height < 10) return
          
          // ⭐ 避免重复 resize
          if (
            canvas.value.width === width &&
            canvas.value.height === height
          ) return
          
          canvas.value.width = width
          canvas.value.height = height
          goalCanvas.value.width = width
          goalCanvas.value.height = height
          
          // ✅ 用缓存重绘（关键！！）
          if (pgmImage.value) {
            drawPgmToCanvas(pgmImage.value, canvas.value)
            drawRobot()
          }
          
          drawGoalPoints()
          
          if (config.value.goals.goalUrlEnabled && config.value.goals.goalUrl) {
            loadGoalUrlImage(config.value.goals.goalUrl)
          }
          
        }, 100)
      })
      
      if (canvasContainer.value) {
        resizeObserver.observe(canvasContainer.value)
      }
      
      // 清理
      onUnmounted(() => {
        resizeObserver.disconnect()
      })
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
    
    // 绘制机器人
    const drawRobot = () => {
      if (!canvas.value || !pgmImage.value) return
      
      const ctx = canvas.value.getContext('2d')
      if (!ctx) return
      
      const { x, y, theta } = robotPosition.value
      const iconSize = config.value.robot.iconSize
      const iconColor = config.value.robot.iconColor
      
      // 保存当前状态
      ctx.save()
      
      // 移动到机器人位置
      ctx.translate(x, y)
      
      // 旋转机器人方向
      if (config.value.robot.showDirection) {
        ctx.rotate(theta)
      }
      
      // 绘制机器人图标
      ctx.fillStyle = iconColor
      ctx.beginPath()
      ctx.arc(0, 0, iconSize / 2, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制方向指示器
      if (config.value.robot.showDirection) {
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(iconSize / 2, 0)
        ctx.lineTo(-iconSize / 4, -iconSize / 4)
        ctx.lineTo(-iconSize / 4, iconSize / 4)
        ctx.closePath()
        ctx.fill()
      }
      
      // 恢复状态
      ctx.restore()
    }
    
    // 处理文件上传
    const handleFileUpload = async (url: string) => {
      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const image = await parsePgmFile(blob)
        pgmImage.value = image
        drawPgmToCanvas(image, canvas.value!)
        drawRobot() // 绘制机器人
        
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
    
    // 处理鼠标滚轮
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const rect = canvasContainer.value!.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = Math.min(5, Math.max(0.2, scale.value * zoomFactor))

      // ⭐ 核心：以鼠标为中心缩放
      offset.value.x =
        mouseX - (mouseX - offset.value.x) * (newScale / scale.value)

      offset.value.y =
        mouseY - (mouseY - offset.value.y) * (newScale / scale.value)

      scale.value = newScale
    }

    const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  lastMouse.value = { x: e.clientX, y: e.clientY }
}

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.value) return

      const dx = e.clientX - lastMouse.value.x
      const dy = e.clientY - lastMouse.value.y

      offset.value.x += dx
      offset.value.y += dy

      lastMouse.value = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      isDragging.value = false
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
    
    // 绘制目标点
    const drawGoalPoints = () => {
      if (!goalCanvas.value || !showGoalPoints.value) return
      
      const ctx = goalCanvas.value.getContext('2d')
      if (!ctx) return
      
      // 重新加载goalUrl图像（如果启用）
      if (config.value.goals.goalUrlEnabled && config.value.goals.goalUrl) {
        loadGoalUrlImage(config.value.goals.goalUrl)
      } else {
        // 清空目标点画布
        ctx.clearRect(0, 0, goalCanvas.value.width, goalCanvas.value.height)
      }
      
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
    
    // 监听config.file.url变化，重新加载PGM文件
    watch(() => config.value.file.url, (newUrl) => {
      if (newUrl) {
        handleFileUpload(newUrl)
      }
    })
    
    // 监听goalUrl变化，加载目标点图像
    watch(() => [config.value.goals.goalUrlEnabled, config.value.goals.goalUrl], ([enabled, url]) => {
      if (!!enabled && url) {
        loadGoalUrlImage(url)
      } else {
        clearGoalCanvas()
      }
    }, { deep: true })
    
    // 加载goalUrl图像
    const loadGoalUrlImage = (url: string | boolean) => {
      if (!goalCanvas.value || typeof url !== 'string') return
      
      const img = new Image()
      img.onload = () => {
        const ctx = goalCanvas.value?.getContext('2d')
        if (ctx) {
          // 清空画布
          ctx.clearRect(0, 0, goalCanvas.value.width, goalCanvas.value.height)
          // 绘制图像
          ctx.drawImage(img, 0, 0, goalCanvas.value.width, goalCanvas.value.height)
        }
      }
      img.onerror = () => {
        console.error('Failed to load goalUrl image')
      }
      img.src = url
    }
    
    // 清空目标点画布
    const clearGoalCanvas = () => {
      if (!goalCanvas.value) return
      
      const ctx = goalCanvas.value.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, goalCanvas.value.width, goalCanvas.value.height)
      }
    }
    
    onUnmounted(() => {
      // 清理资源
      emitter.off('pgm-file-upload', handleFileUpload)
      emitter.off('pgm-save-file', saveFile)
      emitter.off('pgm-clear-canvas', clearCanvas)
    })

    return {
      canvas,
      goalCanvas,
      canvasContainer,
      config,
      attr,
      wrapperStyle,
      canvasStyle,
      goalCanvasStyle,
      transformStyle,
      canvasSize,
      zoomLevel,
      rosConnected,
      robotStatus,
      goalPoints,
      showGoalPoints,
      robotPosition,
      handleFileUpload,
      saveFile,
      clearCanvas,
      drawGoalPoints,
      handleWheel,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp
    }
  },
})
</script>

<style scoped>
.datav-wrapper {
  width: 100%;
  height: 100%;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

/* ⭐ 核心层 */
.transform-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
  z-index: 9999;
}
/* ⭐ 两canvas重叠 */
.transform-layer canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.goal-canvas {
  pointer-events: none;
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

/* .canvas-container {
  user-select: none;
  cursor: grab;
} */

.canvas-container {
  position: relative;
}
.canvas-container:active {
  cursor: grabbing;
}
/* 移除全局的canvas transform设置，让样式对象中的transform生效 */

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








.connected {
  color: #28a745;
  font-weight: bold;
}
</style>