<template>
  <div class="retrieval">
    <div class="page-head">
      <h2>召回测试</h2>
      <span class="page-sub">在全部数据集上验证检索效果，调优相似度阈值与 TopK</span>
    </div>

    <div class="query-panel">
      <textarea
        v-model="query"
        class="query-input"
        rows="3"
        placeholder="输入用户问题，例如：泵轴承温度过高怎么处理？"
      ></textarea>
      <div class="query-controls">
        <label class="control">
          TopK
          <select v-model.number="topK" class="control-select">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </label>
        <label class="control">
          相似度阈值 {{ threshold.toFixed(2) }}
          <input v-model.number="threshold" type="range" min="0" max="0.9" step="0.05" class="control-range" />
        </label>
        <button class="btn-primary" :disabled="searching || !query.trim()" @click="handleSearch">
          {{ searching ? '检索中...' : '🔍 检索' }}
        </button>
      </div>
      <div class="sample-row">
        <span class="sample-label">试试：</span>
        <button v-for="q in sampleQueries" :key="q" class="sample-chip" @click="useSample(q)">{{ q }}</button>
      </div>
    </div>

    <div v-if="searched" class="result-head">
      命中 <b>{{ hits.length }}</b> 个 chunk · 耗时 {{ cost }}ms
    </div>

    <div class="hit-list">
      <div v-for="(hit, i) in hits" :key="hit.id" class="hit-card">
        <div class="hit-head">
          <span class="hit-rank">#{{ i + 1 }}</span>
          <span class="hit-source">📄 {{ hit.docName }} · {{ hit.datasetName }}</span>
          <span class="hit-score">相似度 {{ hit.similarity.toFixed(3) }}</span>
        </div>
        <div class="score-bars">
          <div class="score-row">
            <span class="score-label">向量相似度</span>
            <div class="score-bar"><div class="score-fill fill-vector" :style="{ width: (hit.vectorSimilarity * 100) + '%' }"></div></div>
            <span class="score-num">{{ hit.vectorSimilarity.toFixed(2) }}</span>
          </div>
          <div class="score-row">
            <span class="score-label">关键词相似度</span>
            <div class="score-bar"><div class="score-fill fill-term" :style="{ width: (hit.termSimilarity * 100) + '%' }"></div></div>
            <span class="score-num">{{ hit.termSimilarity.toFixed(2) }}</span>
          </div>
        </div>
        <p class="hit-content">{{ hit.content }}</p>
        <div class="hit-tags">
          <span v-for="k in hit.keywords" :key="k" class="tag">{{ k }}</span>
        </div>
      </div>
      <div v-if="searched && hits.length === 0" class="empty">
        未命中任何 chunk，请降低相似度阈值或更换问法
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { doRetrieval, sampleQueries } from '@/mock/ragflow'
import type { MockRetrievalHit } from '@/mock/ragflow'

export default defineComponent({
  name: 'ConsoleRetrieval',
  setup() {
    const query = ref('')
    const topK = ref(5)
    const threshold = ref(0.2)
    const searching = ref(false)
    const searched = ref(false)
    const hits = ref<MockRetrievalHit[]>([])
    const cost = ref(0)

    const handleSearch = async () => {
      searching.value = true
      const start = Date.now()
      hits.value = await doRetrieval(query.value, topK.value, threshold.value)
      cost.value = Date.now() - start + 40 + Math.floor(Math.random() * 80)
      searched.value = true
      searching.value = false
    }

    const useSample = (q: string) => {
      query.value = q
      handleSearch()
    }

    return { query, topK, threshold, searching, searched, hits, cost, sampleQueries, handleSearch, useSample }
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

.query-panel {
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 18px;
}

.query-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.query-input:focus {
  border-color: #93c5fd;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.query-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 12px;
}

.control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
}

.control-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

.control-range {
  width: 160px;
}

.btn-primary {
  margin-left: auto;
  padding: 8px 22px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sample-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.sample-label {
  font-size: 12px;
  color: #94a3b8;
}

.sample-chip {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
}

.sample-chip:hover {
  border-color: #93c5fd;
  color: #2563eb;
}

.result-head {
  margin-bottom: 12px;
  font-size: 13px;
  color: #64748b;
}

.result-head b {
  color: #2563eb;
}

.hit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hit-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}

.hit-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.hit-rank {
  font-weight: 700;
  color: #2563eb;
}

.hit-source {
  flex: 1;
  font-size: 13px;
  color: #64748b;
}

.hit-score {
  font-size: 13px;
  font-weight: 700;
  color: #16a34a;
}

.score-bars {
  margin-bottom: 10px;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.score-label {
  width: 84px;
  font-size: 12px;
  color: #94a3b8;
}

.score-bar {
  flex: 1;
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
}

.fill-vector { background: #2563eb; }
.fill-term { background: #f59e0b; }

.score-num {
  width: 36px;
  text-align: right;
  font-size: 12px;
  color: #64748b;
}

.hit-content {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.8;
  color: #334155;
}

.hit-tags {
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

.empty {
  padding: 60px 0;
  text-align: center;
  color: #94a3b8;
}
</style>
