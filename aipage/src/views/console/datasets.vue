<template>
  <div>
    <div class="page-head">
      <h2>数据集</h2>
      <span class="page-sub">共 {{ list.length }} 个知识库 · 嵌入模型 BAAI/bge-large-zh-v1.5</span>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <p class="stat-num">{{ list.length }}</p>
        <p class="stat-label">数据集</p>
      </div>
      <div class="stat-card">
        <p class="stat-num">{{ totalDocs }}</p>
        <p class="stat-label">文档</p>
      </div>
      <div class="stat-card">
        <p class="stat-num">{{ totalChunks }}</p>
        <p class="stat-label">Chunks</p>
      </div>
      <div class="stat-card">
        <p class="stat-num">{{ totalTokens }}</p>
        <p class="stat-label">Tokens</p>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="ds-grid">
      <div v-for="ds in list" :key="ds.id" class="ds-card" @click="goDocs(ds.id)">
        <div class="ds-head">
          <span class="ds-avatar">{{ ds.avatar }}</span>
          <div class="ds-title">
            <p class="ds-name">{{ ds.name }}</p>
            <p class="ds-creator">{{ ds.creator }}</p>
          </div>
        </div>
        <p class="ds-desc">{{ ds.description }}</p>
        <div class="ds-meta">
          <span>📄 {{ ds.docCount }} 文档</span>
          <span>🧩 {{ ds.chunkCount }} chunks</span>
        </div>
        <div class="ds-foot">
          <span class="ds-time">更新于 {{ ds.updateTime }}</span>
          <span class="ds-enter">进入文档 →</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchDatasets, formatTokens } from '@/mock/ragflow'
import type { MockDataset } from '@/mock/ragflow'

export default defineComponent({
  name: 'ConsoleDatasets',
  setup() {
    const router = useRouter()
    const list = ref<MockDataset[]>([])
    const loading = ref(true)

    const totalDocs = computed(() => list.value.reduce((s, d) => s + d.docCount, 0))
    const totalChunks = computed(() => list.value.reduce((s, d) => s + d.chunkCount, 0))
    const totalTokens = computed(() => formatTokens(list.value.reduce((s, d) => s + d.tokenCount, 0)))

    const goDocs = (id: string) => {
      router.push(`/console/datasets/${id}`)
    }

    onMounted(async () => {
      list.value = await fetchDatasets()
      loading.value = false
    })

    return { list, loading, totalDocs, totalChunks, totalTokens, goDocs }
  },
})
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.page-sub {
  font-size: 13px;
  color: #94a3b8;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.stat-num {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #2563eb;
}

.stat-label {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #94a3b8;
}

.ds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.ds-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.ds-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.12);
}

.ds-head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ds-avatar {
  font-size: 30px;
}

.ds-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.ds-creator {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.ds-desc {
  flex: 1;
  margin: 12px 0;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.ds-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #475569;
}

.ds-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
  font-size: 12px;
}

.ds-time {
  color: #94a3b8;
}

.ds-enter {
  color: #2563eb;
  font-weight: 600;
}
</style>
