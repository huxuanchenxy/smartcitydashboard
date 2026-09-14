<template>
  <div id="datav-loading" :style="{
    background: 'rgb(15, 42, 66)',
    display: loading ? 'block' : 'none',
  }">
    <a target="_blank" href="javascript:;">
      <img class="datav-logo" :src="`data/originPic/datav-loading.gif`">
    </a>
  </div>
  <div class="datav-layout" :style="{ visibility: loading ? 'hidden' : 'visible' }">
    <a v-if="pageConfig.useWatermark" href="/" target="_blank" class="datav-watermark">
      <img :src="LOGO">
    </a>
    <div class="scene">
      <div v-for="com in coms" :key="com.id" :style="{
        left: com.attr.x + 'px',
        top: com.attr.y + 'px',
        width: com.attr.w + 'px',
        height: com.attr.h + 'px',
        opacity: com.attr.opacity,
        transform: `rotate(${com.attr.deg}deg) ${com.attr.filpH ? 'scaleX(-1)' : ''
          } ${com.attr.filpV ? 'scaleY(-1)' : ''}`,
        filter: styleFilter,
        //animation: (com.special != '' ? com.special : getAnimation(com.config.animation)),
        animation: (com.special != '' ? com.special:'none'),
        display: com.hided ? 'none' : 'block',
      }" class="-datav-com absolute" @click="checkEvents(com, 'click')" @mouseenter="checkEvents(com, 'mouseEnter')"
        @mouseleave="checkEvents(com, 'mouseLeave')">
        <component :is="com.name" :com="com" />
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import {
  defineComponent,
  ref,
  computed,
  onMounted,
  getCurrentInstance,
  PropType,
  watch,
} from 'vue'
import { globalConfig } from '@/config'
import { EditorModule } from '@/store/modules/editor'
import { FilterModule } from '@/store/modules/filter'
import { PageConfig } from '@/domains/editor'
import { ZoomMode } from '@/utils/enums'
import { setStyle, on } from '@/utils/dom'
import { HandleItemField, IcHandleItemField } from '@/components/data-handle'
import { DatavComponent } from '@/components/datav-component'
import { useRoute } from 'vue-router'
import { getRandomInt } from '@/utils/util'

const cdn = import.meta.env.VITE_APP_CDN

export default defineComponent({
  name: 'Preview',
  props: {
    screenData: {
      type: Object as PropType<any>,
      required: true,
    },
  },
  setup(props) {
    // 拿到mitter
    const mitter =
      getCurrentInstance()?.appContext.config.globalProperties.mitter
    const route = useRoute();
    //const loading = ref(true)
    const loading = ref(false)
    const pageConfig = computed(() => EditorModule.pageConfig)
    const coms = computed(() => {
      let list = EditorModule.coms.filter(r => !r.parentId)
      //console.log('list',list)
      return list
    })
    const styleFilter = computed(() => {
      const sf = pageConfig.value.styleFilterParams
      let filter = ''
      if (sf.enable) {
        filter = `hue-rotate(${sf.hue}deg) contrast(${sf.contrast}%) opacity(${sf.opacity}%) saturate(${sf.saturate}%) brightness(${sf.brightness}%)`
      }
      return filter
    })

    const comEvent = (fields: HandleItemField[]) => {
      fields.forEach(field => {
        // emit自定义事件
        mitter.emit(field.targetComId, field)
      })
    }

    const checkEvents = (com: DatavComponent, type: string) => {
      switch (type) {
        case "click":
          if (com.handles &&
            com.handles.click &&
            com.handles.click.fields.length > 0) {
            comEvent(com.handles.click.fields)
          }
          if (com.ichandles && com.ichandles.event && com.ichandles.event.fields.length > 0) {
            com.ichandles.event.fields.forEach(field => {
              if (field.targetMethodTriggle == 'event' && field.targetMethodName == 'click') {
                mitter.emit(field.targetComId, field)
              }
            })
          }
          break;
        case "mouseEnter":
          if (com.handles &&
            com.handles.mouseEnter &&
            com.handles.mouseEnter.fields.length > 0) {
            comEvent(com.handles.mouseEnter.fields)
          }
          if (com.ichandles && com.ichandles.event &&  com.ichandles.event.fields.length > 0) {
            com.ichandles.event.fields.forEach(field => {
              if (field.targetMethodTriggle == 'event' && field.targetMethodName == 'mouseEnter') {
                mitter.emit(field.targetComId, field)
              }
            })
          }
          break;
        case "mouseLeave":
          if (com.handles &&
            com.handles.mouseLeave &&
            com.handles.mouseLeave.fields.length > 0) {
            comEvent(com.handles.mouseLeave.fields)
          }
          if (com.ichandles && com.ichandles.event &&  com.ichandles.event.fields.length > 0) {
            com.ichandles.event.fields.forEach(field => {
              if (field.targetMethodTriggle == 'event' && field.targetMethodName == 'mouseLeave') {
                mitter.emit(field.targetComId, field)
              }
            })
          }
          break;
      }
    }

    const resizeAuto = (width: number, height: number) => {
      const cw = document.documentElement.clientWidth
      const ch = document.documentElement.clientHeight
      const ratioX = cw / width
      const ratioY = ch / height
      setStyle(document.body, {
        transform: `scale(${ratioX}, ${ratioY})`,
        transformOrigin: 'left top',
        backgroundSize: '100% 100%',
      } as CSSStyleDeclaration)
    }

    // 等比缩放并完整放入视口（contain 策略）：ratio 取宽/高两个方向的较小值，
    // 保证画布四个角落在非全屏时也全部可见；缩放后居中，四周按需留白（类似视频黑边）。
    // 配合 html overflow:hidden，既不裁剪内容也不产生滚动条，彻底解决内嵌组件底部被切的问题。
    const resizeContain = (width: number, height: number) => {
      const cw = document.documentElement.clientWidth
      const ch = document.documentElement.clientHeight
      const ratio = Math.min(cw / width, ch / height)
      const offsetX = (cw - width * ratio) / 2
      const offsetY = (ch - height * ratio) / 2
      setStyle(document.body, {
        transform: `translate(${offsetX.toFixed(3)}px, ${offsetY.toFixed(3)}px) scale(${ratio})`,
        transformOrigin: 'left top',
        backgroundSize: '100% 100%',
        backgroundPosition: 'left top',
        marginLeft: '0',
      } as CSSStyleDeclaration)
    }

    const resizeNone = () => {
      setStyle(document.body, {
        overflow: 'hidden',
        position: 'relative',
      } as CSSStyleDeclaration)
    }

    const resize = (config: PageConfig) => {
      switch (config.zoomMode) {
        case ZoomMode.auto:
          // 全屏铺满：非等比拉伸填满视口（画面可能变形，但内容完整无裁剪）
          resizeAuto(config.width, config.height)
          break
        case ZoomMode.width:
        case ZoomMode.height:
        case ZoomMode.full:
          // 等比模式统一走 contain 完整显示：既保持画布比例不变形，又保证四角可见、无滚动条
          resizeContain(config.width, config.height)
          break
        default:
          resizeNone()
          break
      }
    }

    const initPageInfo = (config: PageConfig) => {
      document.title = EditorModule.screen.name
      document
        .querySelector('meta[name="viewport"]')
        .setAttribute('content', `width=${config.width}`)

      setStyle(document.documentElement, {
        // 预览页下 body 已被 transform: scale() 缩放到适配视口，视觉上无需滚动；
        // 但 body 布局尺寸仍为画布原始尺寸（如 1920×1080），若 overflowY 为 visible
        // 会因布局尺寸大于视口产生「隐形滚动」（滚动条被隐藏但滚轮/拖动仍生效），
        // 导致内嵌组件（如 DifyRealDialog）的输入区/按钮被视口边缘遮住；F11 全屏后 ratio≥1 才恢复
        // 统一锁死 x/y 两个方向的页面级滚动，组件内部自己的滚动区（如消息列表）不受影响
        overflowX: 'hidden',
        overflowY: 'hidden',
      } as CSSStyleDeclaration)

      setStyle(document.body, {
        width: `${config.width}px`,
        height: `${config.height}px`,
        backgroundImage: `url(${pageConfig.value.bgimage})`,
        backgroundColor: pageConfig.value.bgcolor,
      } as CSSStyleDeclaration)

      resize(config)
    }

    const getAnimation = (animation: any) => {
      if (animation && animation.enable) {
        return animation.name + ' '
          + animation.duration + 'ms '
          + animation.timing + ' '
          + animation.delay + 'ms '
          + animation.iteration + ' '
          + animation.direction;
      }
      else {
        return 'none';
      }
    }


    onMounted(() => {
      initData(props.screenData);
    })

    const initData = async (screenData: any) => {
      try {
        const data = screenData as any
        if (data) {
          EditorModule.setEditorOption({
            screen: data.screen,
            config: data.config,
            coms: data.coms,
            variables: data.variables,
          })

          initPageInfo(data.config)

          FilterModule.setFilterOption({
            dataFilters: data.dataFilters,
          })

          setTimeout(() => {
            loading.value = false
          }, 500)

          on(window, 'resize', () => {
            resize(pageConfig.value)
          })
        } else {
          throw new Error('404')
        }
      } catch (error) {
        console.log(error)
      }
    }

    watch(() => props.screenData, (newId, oldId) => {
      EditorModule.setEditorOption({
        coms: []
      })
      initData(props.screenData);
    })

    return {
      cdn,
      LOGO: globalConfig.logo,
      loading,
      pageConfig,
      coms,
      styleFilter,
      comEvent,
      checkEvents,
      getAnimation
    }
  },
})
</script>

<style lang="scss">
html,
body {
  min-width: auto;
}

#datav-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0f2a42;
  z-index: 2;

  .datav-logo,
  .text-logo {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .datav-logo {
    width: 120px;
  }

  .text-logo {
    margin-top: 73px;
    width: 100px;
  }
}

.datav-layout {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;

  .-datav-com.absolute {
    position: absolute !important;
    margin: 0 !important;
  }
}

.datav-watermark {
  position: fixed;
  right: 10px;
  bottom: 10px;
  z-index: 99999999;
  width: 50px;

  img {
    width: 32px;
    height: 32px;
    vertical-align: middle;
  }
}
</style>
