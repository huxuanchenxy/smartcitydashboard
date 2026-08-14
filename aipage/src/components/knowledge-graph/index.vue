<template>
  <div class="knowledge-graph">
    <div class="kg-header">
      <h2>知识图谱</h2>
      <span v-if="loading" class="kg-status">加载中...</span>
      <span v-else-if="errorMsg" class="kg-status error">{{ errorMsg }}</span>
      <span v-else class="kg-status">{{ nodeCount }} 个实体 / {{ edgeCount }} 条关系（可拖拽节点、滚轮缩放）</span>
    </div>
    <div ref="chartRef" class="kg-chart"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { fetchKnowledgeGraph } from '@/utils/ragflow'
import type { KgNode, KgEdge } from '@/utils/ragflow'

const OTHER_TYPE = '其他'

export default defineComponent({
  name: 'KnowledgeGraph',
  setup() {
    const chartRef = ref<HTMLElement | null>(null)
    const loading = ref(true)
    const errorMsg = ref('')
    const nodeCount = ref(0)
    const edgeCount = ref(0)
    let chart: echarts.ECharts | null = null

    // 节点大小按 pagerank 缩放，保证最小/最大可视尺寸
    const symbolSizeOf = (pagerank?: number) => {
      return Math.round(30 + Math.min(50, (pagerank || 0) * 600))
    }

    const buildOption = (nodes: KgNode[], edges: KgEdge[]) => {
      const types: string[] = []
      const typeIndex = (type: string) => {
        let idx = types.indexOf(type)
        if (idx < 0) {
          types.push(type)
          idx = types.length - 1
        }
        return idx
      }

      const nodeMap = new Map<string, any>()
      for (const n of nodes) {
        const id = n.id || n.entity_name || ''
        if (!id) continue
        nodeMap.set(id, {
          id,
          name: n.entity_name || id,
          category: typeIndex(n.entity_type || OTHER_TYPE),
          symbolSize: symbolSizeOf(n.pagerank),
          entityType: n.entity_type || '',
          description: n.description || '',
        })
      }

      const links: any[] = []
      for (const e of edges) {
        const s = e.src_id || e.source || ''
        const t = e.tgt_id || e.target || ''
        if (!s || !t || s === t) continue
        // 边端点可能不在 nodes 列表里，补一个隐式节点避免 echarts 报错
        for (const id of [s, t]) {
          if (!nodeMap.has(id)) {
            nodeMap.set(id, {
              id,
              name: id,
              category: typeIndex(OTHER_TYPE),
              symbolSize: symbolSizeOf(0),
              entityType: '',
              description: '',
            })
          }
        }
        links.push({
          source: s,
          target: t,
          description: e.description || '',
          lineStyle: { width: 1 + Math.min(4, (e.weight || 1) / 5) },
        })
      }

      return {
        tooltip: {
          formatter: (params: any) => {
            if (params.dataType === 'node') {
              const d = params.data || {}
              return [
                `<strong>${d.name}</strong>`,
                d.entityType ? `类型：${d.entityType}` : '',
                d.description ? `<br/>${d.description}` : '',
              ]
                .filter(Boolean)
                .join('<br/>')
            }
            const d = params.data || {}
            const title = `${d.source} → ${d.target}`
            return d.description ? `<strong>${title}</strong><br/>${d.description}` : title
          },
        },
        legend: {
          data: types,
          bottom: 0,
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            draggable: true,
            data: Array.from(nodeMap.values()),
            links,
            categories: types.map((name) => ({ name })),
            label: {
              show: true,
              position: 'bottom',
              fontSize: 12,
              color: '#334155',
            },
            labelLayout: { hideOverlap: true },
            force: {
              repulsion: 800,
              edgeLength: [60, 140],
              gravity: 0.1,
            },
            emphasis: {
              focus: 'adjacency',
            },
            lineStyle: {
              color: '#94a3b8',
              opacity: 0.7,
              curveness: 0.1,
            },
          },
        ],
      }
    }

    const handleResize = () => {
      chart && chart.resize()
    }

    onMounted(async () => {
      try {
        const graph = await fetchKnowledgeGraph()
        nodeCount.value = graph.nodes.length
        edgeCount.value = graph.edges.length
        if (chartRef.value) {
          // as any：规避 vue-tsc 模板 ref 推断的 DOM 类型与 echarts 类型库版本差异
          chart = echarts.init(chartRef.value as any)
          chart.setOption(buildOption(graph.nodes, graph.edges) as any)
          window.addEventListener('resize', handleResize)
        }
      } catch (e: any) {
        errorMsg.value = e?.message || '知识图谱加载失败'
      } finally {
        loading.value = false
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
      if (chart) {
        chart.dispose()
        chart = null
      }
    })

    return {
      chartRef,
      loading,
      errorMsg,
      nodeCount,
      edgeCount,
    }
  },
})
</script>

<style scoped>
.knowledge-graph {
  margin-top: 24px;
}

.kg-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.kg-header h2 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
}

.kg-status {
  font-size: 13px;
  color: #64748b;
}

.kg-status.error {
  color: #ef4444;
}

.kg-chart {
  width: 100%;
  height: 640px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}
</style>
