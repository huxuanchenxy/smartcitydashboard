import axios from 'axios'

// RAGFlow 知识图谱接口配置（见 .env.development / .env.production）
// 前端始终请求同源 /ragflow-api 前缀：开发态走 vite 代理，生产走 nginx 代理，规避 CORS
const RAGFLOW_DATASET_ID = String(import.meta.env.VITE_APP_RAGFLOW_DATASET_ID || '')
const RAGFLOW_TOKEN = String(import.meta.env.VITE_APP_RAGFLOW_TOKEN || '')

export interface KgNode {
  id: string
  entity_name?: string
  entity_type?: string
  description?: string
  pagerank?: number
  rank?: number
}

export interface KgEdge {
  source?: string
  target?: string
  src_id?: string
  tgt_id?: string
  weight?: number
  description?: string
  keywords?: string[]
}

export interface KnowledgeGraph {
  nodes: KgNode[]
  edges: KgEdge[]
}

export async function fetchKnowledgeGraph(): Promise<KnowledgeGraph> {
  const resp = await axios.get(
    `/ragflow-api/api/v1/datasets/${RAGFLOW_DATASET_ID}/knowledge_graph`,
    {
      headers: {
        Authorization: `Bearer ${RAGFLOW_TOKEN}`,
      },
    }
  )
  const body = resp.data
  if (body && body.code === 0 && body.data && body.data.graph) {
    const graph = body.data.graph as KnowledgeGraph
    return {
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
      edges: Array.isArray(graph.edges) ? graph.edges : [],
    }
  }
  throw new Error((body && body.message) || '知识图谱接口返回异常')
}
