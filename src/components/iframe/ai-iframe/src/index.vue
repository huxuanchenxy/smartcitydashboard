<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <div :style="titleStyle">
      <span :style="titleContentStyle">{{ title }}</span>
      <n-button text type="info" onmouseover="this.style.backgroundColor='rgba(199, 199, 231, 0.7)'" onmouseout="this.style.backgroundColor=''" :style="ButtonStyle" @click="close">
        <img :src="iconCloseSrc" style="height: 20px;">
      </n-button>
      <n-button text type="info" onmouseover="this.style.backgroundColor='rgba(199, 199, 231, 0.7)'" onmouseout="this.style.backgroundColor=''" :style="ButtonStyle" @click="fresh">
        <img :src="iconRefreshSrc" style="height: 20px;">
      </n-button>
      <n-button text type="info" onmouseover="this.style.backgroundColor='rgba(199, 199, 231, 0.7)'" onmouseout="this.style.backgroundColor=''" :style="ButtonStyle" @click="readIframeContent">
        读取内容
      </n-button>
    </div>
    <div style="height: 100%">
      <iframe :id="comid" :name="'iframeSrcName_' + comid" scrolling="no" :src="url" :style="srcStyle"
        allowfullscreen="true"></iframe>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRef, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { AiIframe } from './ai-iframe'
import { getFieldMap, useDataCenter } from '@/mixins/data-center'
import { ApiModule } from '@/store/modules/api'
import { ref } from 'vue'
import { useEventCenter } from '@/mixins/event-center'

export default defineComponent({
  name: 'VAiIframe',
  props: {
    com: {
      type: Object as PropType<AiIframe>,
      required: true,
    },
  },

  setup(props) {
    useDataCenter(props.com)
    useEventCenter(props.com)

    const dialogVisible = ref(false)

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    const comid = toRef(props.com, 'id').value


    const iconCloseSrc = computed(() => {
      return config.value.iconConfig.closeIcon
    })

    const iconRefreshSrc = computed(() => {
      return config.value.iconConfig.refreshIcon
    })

    const refreshBC = computed(() => {
      return config.value.iconConfig.refreshBackgroundColor
    })

    const closeBC = computed(() => {
      return config.value.iconConfig.closeBackgroundColor
    })

    const close = () => {
      const iframeDoc = document.getElementById('div_' + comid)
      window.open('', 'iframeSrcName_' + comid, '')
      props.com.hided = true
      iframeDoc.hidden = true
      /*      iframeDoc.style.display = 'none'*/
    }

    const open = () => {
      const iframeDoc = document.getElementById('div_' + comid)
      iframeDoc.style.display = 'block'
    }

    const fresh = () => {
      const iframeSrcDoc = (document.getElementById(comid) as HTMLIFrameElement)
      window.open(iframeSrcDoc.src, 'iframeSrcName_' + comid, '')
    }

    // 读取iframe内容
    const readIframeContent = () => {
      try {
        console.log('开始读取iframe内容 comid', comid)
        const iframeElement = (document.getElementById(comid) as HTMLIFrameElement)
        console.log('iframeElement:', iframeElement)
        if (iframeElement && iframeElement.contentDocument) {
          // const iframeContent = iframeElement.contentDocument.body.innerHTML
          console.log('Iframe内容:', iframeElement)
          // 可以在这里处理读取到的内容，比如发送到父组件或存储
          alert('已读取iframe内容，详情请查看控制台')
        } else {
          console.error('无法访问iframe内容，可能是跨域问题')
          alert('无法访问iframe内容，可能是跨域问题')
        }
      } catch (error) {
        console.error('读取iframe内容失败:', error)
        alert('读取iframe内容失败: ' + error.message)
      }
    }

    const dv_data = computed(() => {
      //dv_data api返回的json
      //?可选链，不为空则计算下一级别，返回不为空的最后一层
      //??或，类似与||
      return ApiModule.dataMap[props.com.id]?.source ?? {}
    })

    const dv_field = computed(() => {
      return getFieldMap(props.com.apis.source.fields)
    })

    const title = computed(() => {
      return dv_data.value.title ?? config.value.titleConfig.title
    })

    const url = computed(() => {
      return dv_data.value.src ?? config.value.srcConfig.src
    })

    watch(() => url.value, (newUrl: string) => {
      const iframeSrcDoc = (document.getElementById(comid) as HTMLIFrameElement)
      iframeSrcDoc.src = newUrl;
      iframeSrcDoc.contentWindow.location.reload();
    })

    const ButtonStyle = computed(() => {
      const bs = config.value.iconConfig
      const style = {
        paddingTop: '-10px',
        float: `right`,
        height: `${bs.buttonHeight}px`,
        width: `${bs.buttonWidth}px`,
      }
      return style as CSSProperties
    })

    const titleStyle = computed(() => {
      const ts = config.value.titleConfig.titleStyle
      const style = {
        background: ts.background,
        color: ts.color,
        fontSize: `${ts.fontSize}px`,
        fontWeight: ts.fontWeight,
        height: `${ts.height}px`,
        width: `${ts.width}%`,
        display: ts.show ? 'inline-block' : 'none',
      }
      return style as CSSProperties
    })

    const titleContentStyle = computed(() => {
      const ts = config.value.titleConfig.titleStyle
      const style = {
        paddingTop: `${ts.paddingTop}px`,
        paddingLeft: `${ts.paddingLeft}px`,
        display: 'inline-block',
      }
      return style as CSSProperties
    })

    const srcStyle = computed(() => {
      const ss = config.value.srcConfig.srcStyle
      const style = {
        height: `${ss.height}px`,
        width: `${ss.width}%`,
        overflow: `${config.value.overflow}`,
      }
      return style as CSSProperties
    })

    const wrapperStyle = computed(() => {
      return {
        outline: `${config.value.border}`,
        outlineColor: `${config.value.borderColor}`,
        outlineWidth: `${config.value.borderWidth}px`,
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
      } as CSSProperties
    })

    return {
      refreshBC,
      closeBC,
      title,
      url,
      titleContentStyle,
      wrapperStyle,
      titleStyle,
      srcStyle,
      ButtonStyle,
      close,
      fresh,
      readIframeContent,
      open,
      dialogVisible,
      iconCloseSrc,
      iconRefreshSrc,
      comid
    }
  },
})
</script>