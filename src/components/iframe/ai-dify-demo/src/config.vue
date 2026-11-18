<template>
  <div class="setting-panel-gui">
    <g-field label="预设角色">
      <g-select v-model="config.role" :data="roleOptions" />
    </g-field>
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
import { defineComponent, PropType, toRef, ref } from 'vue'
import { AiDifyDemo } from './ai-dify-demo'
import GInput from "@/components/ui/input/src/index.vue";
import GSelect from "@/components/ui/select/src/index.vue";

export default defineComponent({
  name: 'VAiDifyDemoProp',
  components: { GInput, GSelect },
  props: {
    com: {
      type: Object as PropType<AiDifyDemo>,
      required: true,
    },
  },
  setup(props) {
    const config = toRef(props.com, 'config')

    const roleOptions = ref([
      { id: '', value: '无（默认）' },
      { id: 'project_manager', value: '项目经理' },
      { id: 'developer', value: '开发人员' },
      { id: 'user', value: '使用人员' },
    ])

    return {
      config,
      roleOptions,
    }
  },
})
</script>