<template>
  <div :id="'div_' + comid" :style="wrapperStyle">
    <button :style="buttonStyle" @click="handleClick">
      <img :src="buttonImage" style="height: 40px; width: 40px;">
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, toRef } from 'vue'
import type { CSSProperties } from 'vue'
import { AiDify } from './ai-dify'
import { useDataCenter } from '@/mixins/data-center'

export default defineComponent({
  name: 'VAiDify',
  props: {
    com: {
      type: Object as PropType<AiDify>,
      required: true,
    },
  },

  setup(props) {
    useDataCenter(props.com)

    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')
    const comid = toRef(props.com, 'id').value

    const buttonImage = computed(() => {
      return config.value.buttonImage
    })

    const handleClick = () => {
      console.log('AiDify button clicked')
    }

    const buttonStyle = computed(() => {
      const bs = config.value.buttonStyle
      const style = {
        padding: '10px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: bs.backgroundColor,
        hoverBackgroundColor: bs.hoverBackgroundColor,
      }
      return style as CSSProperties
    })

    const wrapperStyle = computed(() => {
      return {
        width: `${attr.value.w}px`,
        height: `${attr.value.h}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      } as CSSProperties
    })

    return {
      buttonImage,
      buttonStyle,
      wrapperStyle,
      handleClick,
      comid,
    }
  },
})
</script>
