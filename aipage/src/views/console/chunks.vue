<template>
  <div>
    <div class="page-head">
      <router-link class="back-link" :to="`/console/datasets/${datasetId}`">← 文档列表</router-link>
      <h2>Chunks</h2>
      <span class="page-sub">{{ docName }} · 共 {{ filtered.length }} 个分片</span>
    </div>

    <input v-model="keyword" class="search-input" type="text" placeholder="搜索 chunk 内容 / 关键词..." />

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="chunk-list">
      <div v-for="chunk in filtered" :key="chunk.id" class="chunk-card">
        <div class="chunk-head">
          <span class="chunk-index">#{{ chunk.index }}</span>
          <span class="chunk-meta">第 {{ chunk.page }} 页 · {{ chunk.tokenCount }} tokens</span>
        </div>
        <p class="chunk-content">{{ chunk.content }}</p>
        <div class="chunk-tags">
          <span v-for="k in chunk.keywords" :key="k" class="tag">{{ k }}</span>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="loading">没有匹配的 chunk</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchChunks, documents } from '@/mock/ragflow'
import type { MockChunk } from '@/mock/ragflow'

export default defineComponent({
  name: 'ConsoleChunks',
  setup() {
    const route = useRoute()
    const datasetId = String(route.params.id || '')
    const docId = String(route.params.docId || '')
    const docName = (documents.find((d) => d.id === docId) || { name: '' }).name

    const list = ref<MockChunk[]>([])
    const loading = ref(true)
    const keyword = ref('')

    const filtered = computed(() => {
      const kw = keyword.value.trim()
      if (!kw) return list.value
      return list.value.filter(
        (c) => c.content.includes(kw) || c.keywords.some((k) => k.includes(kw)),
      )
    })

    onMounted(async () => {
      list.value = await fetchChunks(docId)
      loading.value = false
    })

    return { datasetId, docName, list, loading, keyword, filtered }
  },
})
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.back-link {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}

.page-sub {
  width: 100%;
  font-size: 13px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #94a3b8;
}

.chunk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chunk-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.chunk-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.chunk-index {
  font-weight: 700;
  color: #2563eb;
}

.chunk-meta {
  font-size: 12px;
  color: #94a3b8;
}

.chunk-content {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
}

.chunk-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  padding: 2px 10px;
  border-radius: 999px;
  background: #eff6ff;
  font-size: 12px;
  color: #2563eb;
}
</style>
