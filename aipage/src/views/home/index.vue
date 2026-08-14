<template>
  <div class="home">
    <h1>AI 页面</h1>
    <p>aipage 项目运行正常。当前登录状态：{{ token ? '已登录' : '未登录' }}</p>
    <p class="tip">本页面可独立运行（http://localhost:9091/），也可被 dashboard 通过 iframe 嵌入。</p>
    <KnowledgeGraph />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { getToken } from '@/utils/token'
import KnowledgeGraph from '@/components/knowledge-graph/index.vue'

export default defineComponent({
  name: 'AiPageHome',
  components: {
    KnowledgeGraph,
  },
  setup() {
    const token = ref(getToken())
    return { token }
  },
})
</script>

<style scoped>
.home {
  padding: 24px;
}

.tip {
  color: #999;
  font-size: 13px;
}
</style>
