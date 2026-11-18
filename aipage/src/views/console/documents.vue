<template>
  <div>
    <div class="page-head">
      <router-link class="back-link" to="/console/datasets">← 数据集</router-link>
      <span class="ds-avatar">{{ dataset?.avatar }}</span>
      <h2>{{ dataset?.name || '...' }}</h2>
      <span class="page-sub">{{ dataset?.description }}</span>
    </div>

    <div class="toolbar">
      <button class="btn-primary" @click="handleUpload">⬆ 上传文档</button>
      <span class="toolbar-tip">支持 PDF / Word / Markdown / TXT / Excel，单文件 ≤ 128MB</span>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <table v-else class="doc-table">
      <thead>
        <tr>
          <th>文档名称</th>
          <th>大小</th>
          <th>Chunks</th>
          <th style="width: 200px">解析状态</th>
          <th>上传时间</th>
          <th style="width: 200px">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="doc in list" :key="doc.id">
          <td>
            <span class="type-badge" :class="'type-' + doc.type">{{ doc.type }}</span>
            <span class="doc-name">{{ doc.name }}</span>
          </td>
          <td class="cell-dim">{{ formatBytes(doc.size) }}</td>
          <td class="cell-dim">{{ doc.chunkCount || '-' }}</td>
          <td>
            <span class="status-badge" :class="'status-' + doc.status">{{ statusText(doc.status) }}</span>
            <div v-if="doc.status === 'RUNNING'" class="progress-bar">
              <div class="progress-fill" :style="{ width: Math.round(doc.progress * 100) + '%' }"></div>
            </div>
            <span v-if="doc.status === 'FAIL'" class="fail-tip">解析失败：不支持的图表结构，请重试</span>
          </td>
          <td class="cell-dim">{{ doc.uploadTime }}</td>
          <td>
            <button v-if="doc.status === 'DONE'" class="btn-link" @click="goChunks(doc)">Chunks</button>
            <button v-if="doc.status !== 'RUNNING'" class="btn-link" @click="handleReparse(doc)">解析</button>
            <button class="btn-link btn-danger" @click="handleDelete(doc)">删除</button>
          </td>
        </tr>
        <tr v-if="list.length === 0">
          <td colspan="6" class="empty-row">暂无文档，点击「上传文档」添加</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDataset, fetchDocuments, formatBytes } from '@/mock/ragflow'
import type { MockDataset, MockDocument, DocStatus } from '@/mock/ragflow'

export default defineComponent({
  name: 'ConsoleDocuments',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const datasetId = String(route.params.id || '')

    const dataset = ref<MockDataset>()
    const list = ref<MockDocument[]>([])
    const loading = ref(true)
    let uploadSeq = 0
    let timer = 0

    const statusText = (s: DocStatus) => {
      const map: Record<DocStatus, string> = {
        DONE: '解析完成',
        RUNNING: '解析中',
        FAIL: '解析失败',
        UNSTART: '未解析',
      }
      return map[s]
    }

    // 模拟解析进度推进：RUNNING 的文档逐步到 100% 后转为 DONE
    const tick = () => {
      list.value.forEach((doc) => {
        if (doc.status !== 'RUNNING') return
        doc.progress = Math.min(1, doc.progress + 0.04 + Math.random() * 0.06)
        if (doc.progress >= 1) {
          doc.status = 'DONE'
          doc.chunkCount = 20 + Math.floor(Math.random() * 40)
          doc.processDuration = `${30 + Math.floor(Math.random() * 90)}秒`
        }
      })
    }

    const handleUpload = () => {
      uploadSeq += 1
      list.value.unshift({
        id: `doc-upload-${Date.now()}`,
        datasetId,
        name: `新上传文档_${String(uploadSeq).padStart(2, '0')}.pdf`,
        type: 'pdf',
        size: 512000 + Math.floor(Math.random() * 4096000),
        chunkCount: 0,
        status: 'RUNNING',
        progress: 0.05,
        uploadTime: '2026-08-21 ' + new Date().toTimeString().slice(0, 5),
        processDuration: '-',
      })
    }

    const handleReparse = (doc: MockDocument) => {
      doc.status = 'RUNNING'
      doc.progress = 0.08
      doc.chunkCount = 0
    }

    const handleDelete = (doc: MockDocument) => {
      list.value = list.value.filter((d) => d.id !== doc.id)
    }

    const goChunks = (doc: MockDocument) => {
      router.push(`/console/datasets/${datasetId}/docs/${doc.id}/chunks`)
    }

    onMounted(async () => {
      dataset.value = await fetchDataset(datasetId)
      list.value = await fetchDocuments(datasetId)
      loading.value = false
      timer = window.setInterval(tick, 600)
    })

    onUnmounted(() => {
      window.clearInterval(timer)
    })

    return { dataset, list, loading, statusText, formatBytes, handleUpload, handleReparse, handleDelete, goChunks }
  },
})
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.page-head h2 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.ds-avatar {
  font-size: 22px;
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

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.btn-primary {
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.toolbar-tip {
  font-size: 12px;
  color: #94a3b8;
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #94a3b8;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
}

.doc-table th {
  padding: 12px 14px;
  text-align: left;
  font-size: 13px;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.doc-table td {
  padding: 12px 14px;
  font-size: 13px;
  color: #0f172a;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.doc-table tr:last-child td {
  border-bottom: none;
}

.cell-dim {
  color: #64748b;
}

.type-badge {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
}

.type-pdf { background: #dc2626; }
.type-docx { background: #2563eb; }
.type-txt { background: #64748b; }
.type-md { background: #7c3aed; }
.type-xlsx { background: #16a34a; }

.doc-name {
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-DONE { background: #dcfce7; color: #16a34a; }
.status-RUNNING { background: #dbeafe; color: #2563eb; }
.status-FAIL { background: #fee2e2; color: #dc2626; }
.status-UNSTART { background: #f1f5f9; color: #94a3b8; }

.progress-bar {
  width: 140px;
  height: 6px;
  margin-top: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 3px;
  transition: width 0.5s;
}

.fail-tip {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #dc2626;
}

.btn-link {
  margin-right: 10px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  color: #2563eb;
  cursor: pointer;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-danger {
  color: #dc2626;
}

.empty-row {
  padding: 40px 0 !important;
  text-align: center;
  color: #94a3b8;
}
</style>
