<template>
  <div class="setting-panel-gui">
    <g-field label="按钮图片">
      <g-input v-model="config.buttonImage" />
    </g-field>
    <g-field-collapse label="按钮样式">
      <g-field :level="2" label="背景颜色">
        <g-color-picker v-model="config.buttonStyle.backgroundColor" />
      </g-field>
      <g-field :level="2" label="悬停背景颜色">
        <g-color-picker v-model="config.buttonStyle.hoverBackgroundColor" />
      </g-field>
    </g-field-collapse>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRef } from 'vue'
import { AiDifyDemo } from './ai-dify-demo'
import GInput from "@/components/ui/input/src/index.vue";

export default defineComponent({
  name: 'VAiDifyDemoProp',
  components: { GInput },
  props: {
    com: {
      type: Object as PropType<AiDifyDemo>,
      required: true,
    },
  },
  setup(props) {
    const config = toRef(props.com, 'config')

    return {
      config,
    }
  },
})
</script>