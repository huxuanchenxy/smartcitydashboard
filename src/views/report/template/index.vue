<template>
  <div class="report-designer-placeholder" style="width:100%;height:100%;">
    <!-- 原报表设计器依赖的 @grapecity/spread-sheets 系列商业组件已从依赖中移除，此处保留占位以维持构建与接口兼容 -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ReportDesigner',
  props: {
    model: {
      type: Object,
      default: () => ({}),
    },
  },
  setup() {
    // report.vue 通过 rdCom ref 调用这两个方法，保留空实现避免运行时报错
    const saveTpl = async () => {}
    const printTpl = () => {}
    return { saveTpl, printTpl }
  },
})
</script>
