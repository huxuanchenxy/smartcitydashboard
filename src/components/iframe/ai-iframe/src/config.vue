<template>
  <div class="setting-panel-gui">
    <g-field label="整体边框样式">
      <g-select v-model="config.border" :data="borderStyleFamily" />
    </g-field>
    <g-field label="边框颜色">
      <g-color-picker v-model="config.borderColor" />
    </g-field>
    <g-field label="边框粗细">
      <g-input-number v-model="config.borderWidth" :min="0" :step="1" />
    </g-field>
    <g-field label="显示方式">
      <g-select v-model="config.overflow" :data="overflowFamily" />
    </g-field>
    <g-field-collapse label="标题栏配置">

      <g-field-collapse v-model="config.titleConfig.titleStyle.show" label="标题栏显示" :toggle="true">
        <g-field :level="2" label="字体大小">
          <g-input-number v-model="config.titleConfig.titleStyle.fontSize" :min="0" :max="100" :step="1" />
        </g-field>
        <g-field :level="2" label="背景色">
          <g-color-picker v-model="config.titleConfig.titleStyle.background" />
        </g-field>
        <g-field :level="2" label="字体颜色">
          <g-color-picker v-model="config.titleConfig.titleStyle.color" />
        </g-field>
        <g-field :level="2" label="加粗">
          <g-select v-model="config.titleConfig.titleStyle.fontWeight" :data="fontWeightFamily" />
        </g-field>
        <g-field :level="2" label="标题框高度">
          <g-input-number v-model="config.titleConfig.titleStyle.height" :min="0" :max="9999" :step="1" />
        </g-field>
        <g-field :level="2" label="标题框宽占比">
          <g-input-number v-model="config.titleConfig.titleStyle.width" :min="0" :max="100" :step="1" />
        </g-field>
        <g-field :level="2" label="标题上边距">
          <g-input-number v-model="config.titleConfig.titleStyle.paddingTop" :min="0" :max="100" :step="1" />
        </g-field>
      </g-field-collapse>
    </g-field-collapse>
    <g-field-collapse label="资源配置">
      <g-field-collapse label="资源框样式">
        <g-field :level="2" label="资源框高度">
          <g-input-number v-model="config.srcConfig.srcStyle.height" :min="0" :max="9999" :step="1" />
        </g-field>
        <g-field :level="2" label="资源框宽比">
          <g-input-number v-model="config.srcConfig.srcStyle.width" :min="0" :max="100" :step="1" />
        </g-field>
      </g-field-collapse>
    </g-field-collapse>
    <g-field-collapse label="图标按钮配置">
      <g-field :level="2" label="按钮高度">
        <g-input-number v-model="config.iconConfig.buttonHeight" :min="0" :max="9999" :step="1" />
      </g-field>
      <g-field :level="2" label="按钮宽度">
        <g-input-number v-model="config.iconConfig.buttonWidth" :min="0" :max="9999" :step="1" />
      </g-field>
      <g-field :level="2" label="刷新图标">
        <g-select v-model="config.iconConfig.refreshIcon" :data="refreshIconFamily" />
        <span>
          <img :src="config.iconConfig.refreshIcon">
        </span>
      </g-field>
      <g-field :level="2" label="关闭图标">
        <g-select v-model="config.iconConfig.closeIcon" :data="closeIconFamily" />
        <span>
          <img :src="config.iconConfig.closeIcon">
        </span>
      </g-field>
    </g-field-collapse>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRef, watch } from 'vue'
import { refreshIconFamily, closeIconFamily, fontWeightFamily, borderStyleFamily, overflowFamily } from '@/data/select-options'
import { AiIframe } from './ai-iframe'
import GSelect from '@/components/ui/select/src/index.vue'
import GInput from "@/components/ui/input/src/index.vue";
import GInputNumber from "@/components/ui/input-number/src/index.vue";

export default defineComponent({
  name: 'VAiIframeProp',
  components: { GInputNumber, GInput, GSelect },
  props: {
    com: {
      type: Object as PropType<AiIframe>,
      required: true,
    },
  },
  setup(props) {
    const config = toRef(props.com, 'config')
    const attr = toRef(props.com, 'attr')

    watch(() => config.value.titleConfig.titleStyle.height, v2 => {
      if (v2 > config.value.iconConfig.buttonHeight) {
        config.value.srcConfig.srcStyle.height = attr.value.h - v2
      }
    },
      {
        deep: true, // 深度监听
      })

    watch(() => attr.value.h, v2 => {
      if (v2 > config.value.iconConfig.buttonHeight) {
        config.value.srcConfig.srcStyle.height = v2 - config.value.titleConfig.titleStyle.height
      }
    },
      {
        deep: true, // 深度监听
      })

    return {
      config,
      refreshIconFamily,
      closeIconFamily,
      fontWeightFamily,
      borderStyleFamily,
      overflowFamily,
    }
  },

})
</script>