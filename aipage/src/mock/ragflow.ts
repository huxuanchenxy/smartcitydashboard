// 知识库管理台演示用假数据模块：模拟 RAGFlow 接口的返回结构与延迟，无任何真实请求。
// 后续接入真实接口时，仅需将本文件的导出函数替换为 axios 调用，页面层无需改动。

export interface MockDataset {
  id: string
  name: string
  avatar: string
  description: string
  docCount: number
  chunkCount: number
  tokenCount: number
  language: string
  embeddingModel: string
  updateTime: string
  creator: string
}

export type DocStatus = 'DONE' | 'RUNNING' | 'FAIL' | 'UNSTART'

export interface MockDocument {
  id: string
  datasetId: string
  name: string
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'xlsx'
  size: number
  chunkCount: number
  status: DocStatus
  progress: number
  uploadTime: string
  processDuration: string
}

export interface MockChunk {
  id: string
  docId: string
  index: number
  content: string
  keywords: string[]
  page: number
  tokenCount: number
}

export interface MockRetrievalHit {
  id: string
  content: string
  docName: string
  datasetName: string
  similarity: number
  vectorSimilarity: number
  termSimilarity: number
  keywords: string[]
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const datasets: MockDataset[] = [
  {
    id: 'ds-1',
    name: '泵机组维护手册',
    avatar: '📘',
    description: '泵机组全生命周期维护知识，涵盖拆装工艺、备件规格、润滑与验收标准。',
    docCount: 6,
    chunkCount: 486,
    tokenCount: 312450,
    language: 'Chinese',
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    updateTime: '2026-08-19 16:42',
    creator: '设备部·王工',
  },
  {
    id: 'ds-2',
    name: '水厂运行规程',
    avatar: '🏭',
    description: '制水工艺流程、加药标准、水质检测频次与限值、滤池反冲洗等运行规程。',
    docCount: 4,
    chunkCount: 265,
    tokenCount: 178920,
    language: 'Chinese',
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    updateTime: '2026-08-15 10:08',
    creator: '运行部·李工',
  },
  {
    id: 'ds-3',
    name: '设备故障案例库',
    avatar: '🛠️',
    description: '历年故障现象、根因分析与处理复盘记录，供运维人员检索借鉴。',
    docCount: 3,
    chunkCount: 176,
    tokenCount: 121300,
    language: 'Chinese',
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    updateTime: '2026-08-12 09:24',
    creator: '运维部·赵工',
  },
  {
    id: 'ds-4',
    name: '安全操作规程',
    avatar: '⚠️',
    description: '受限空间作业、动火作业、临时用电等特种作业安全操作要求。',
    docCount: 3,
    chunkCount: 96,
    tokenCount: 68400,
    language: 'Chinese',
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    updateTime: '2026-07-30 14:51',
    creator: '安环部·陈工',
  },
  {
    id: 'ds-5',
    name: '智慧水务问答对库',
    avatar: '💬',
    description: '客服高频问题与内部培训优质问答对，可直接用于 RAG 问答场景。',
    docCount: 2,
    chunkCount: 164,
    tokenCount: 89760,
    language: 'Chinese',
    embeddingModel: 'BAAI/bge-large-zh-v1.5',
    updateTime: '2026-07-22 11:17',
    creator: '客服中心',
  },
]

export const documents: MockDocument[] = [
  { id: 'doc-101', datasetId: 'ds-1', name: '离心泵检修工艺规程.pdf', type: 'pdf', size: 2516582, chunkCount: 96, status: 'DONE', progress: 1, uploadTime: '2026-08-19 16:42', processDuration: '2分36秒' },
  { id: 'doc-102', datasetId: 'ds-1', name: '潜水泵季度点检表.docx', type: 'docx', size: 86016, chunkCount: 38, status: 'DONE', progress: 1, uploadTime: '2026-08-18 09:12', processDuration: '48秒' },
  { id: 'doc-103', datasetId: 'ds-1', name: '轴承润滑标准作业指导.txt', type: 'txt', size: 24576, chunkCount: 0, status: 'RUNNING', progress: 0.62, uploadTime: '2026-08-21 08:55', processDuration: '-' },
  { id: 'doc-104', datasetId: 'ds-1', name: '泵站改造方案2024.pdf', type: 'pdf', size: 8912896, chunkCount: 0, status: 'FAIL', progress: 0.31, uploadTime: '2026-08-10 15:20', processDuration: '解析失败' },
  { id: 'doc-105', datasetId: 'ds-1', name: '机械密封更换图解.md', type: 'md', size: 45056, chunkCount: 54, status: 'DONE', progress: 1, uploadTime: '2026-08-05 10:31', processDuration: '1分02秒' },
  { id: 'doc-106', datasetId: 'ds-1', name: '备件型号对照表.xlsx', type: 'xlsx', size: 132096, chunkCount: 0, status: 'UNSTART', progress: 0, uploadTime: '2026-08-21 09:02', processDuration: '-' },

  { id: 'doc-201', datasetId: 'ds-2', name: '混凝加药工艺规程.pdf', type: 'pdf', size: 1887436, chunkCount: 72, status: 'DONE', progress: 1, uploadTime: '2026-08-15 10:08', processDuration: '1分54秒' },
  { id: 'doc-202', datasetId: 'ds-2', name: '水质检测频次与指标限值.docx', type: 'docx', size: 64512, chunkCount: 45, status: 'DONE', progress: 1, uploadTime: '2026-08-14 16:40', processDuration: '52秒' },
  { id: 'doc-203', datasetId: 'ds-2', name: '滤池反冲洗作业指导.md', type: 'md', size: 32768, chunkCount: 0, status: 'RUNNING', progress: 0.35, uploadTime: '2026-08-21 08:47', processDuration: '-' },
  { id: 'doc-204', datasetId: 'ds-2', name: '污泥脱水间值班制度.txt', type: 'txt', size: 18432, chunkCount: 28, status: 'DONE', progress: 1, uploadTime: '2026-08-08 11:26', processDuration: '31秒' },

  { id: 'doc-301', datasetId: 'ds-3', name: '2023-2024泵机组故障案例汇编.pdf', type: 'pdf', size: 5242880, chunkCount: 132, status: 'DONE', progress: 1, uploadTime: '2026-08-12 09:24', processDuration: '3分18秒' },
  { id: 'doc-302', datasetId: 'ds-3', name: '变频器典型报警速查表.docx', type: 'docx', size: 51200, chunkCount: 26, status: 'DONE', progress: 1, uploadTime: '2026-08-11 14:03', processDuration: '36秒' },
  { id: 'doc-303', datasetId: 'ds-3', name: '水锤事故复盘报告.pdf', type: 'pdf', size: 1258291, chunkCount: 18, status: 'DONE', progress: 1, uploadTime: '2026-08-02 17:45', processDuration: '44秒' },

  { id: 'doc-401', datasetId: 'ds-4', name: '受限空间作业操作规程.pdf', type: 'pdf', size: 942080, chunkCount: 33, status: 'DONE', progress: 1, uploadTime: '2026-07-30 14:51', processDuration: '58秒' },
  { id: 'doc-402', datasetId: 'ds-4', name: '动火作业安全管理制度.docx', type: 'docx', size: 71680, chunkCount: 41, status: 'DONE', progress: 1, uploadTime: '2026-07-28 09:36', processDuration: '47秒' },
  { id: 'doc-403', datasetId: 'ds-4', name: '临时用电安全规程.txt', type: 'txt', size: 16384, chunkCount: 22, status: 'DONE', progress: 1, uploadTime: '2026-07-25 15:19', processDuration: '27秒' },

  { id: 'doc-501', datasetId: 'ds-5', name: '客服高频问答100条.md', type: 'md', size: 61440, chunkCount: 100, status: 'DONE', progress: 1, uploadTime: '2026-07-22 11:17', processDuration: '1分12秒' },
  { id: 'doc-502', datasetId: 'ds-5', name: '新员工培训问答手册.docx', type: 'docx', size: 92160, chunkCount: 64, status: 'DONE', progress: 1, uploadTime: '2026-07-20 10:05', processDuration: '1分01秒' },
]

const chunkPools: Record<string, { content: string; keywords: string[] }[]> = {
  'doc-101': [
    { content: '离心泵拆卸前必须关闭进出口阀门，排空泵腔存液，确认电机断电并悬挂"禁止合闸"警示牌后方可作业。', keywords: ['离心泵', '拆卸', '安全隔离'] },
    { content: '轴承检查标准：滚动轴承径向游隙不得超过0.05mm，滚道或滚动体表面出现点蚀、剥落、过热变色时必须整套更换。', keywords: ['轴承', '游隙', '检查标准'] },
    { content: '润滑标准：连续运行泵每2000运行小时补充锂基润滑脂，填充量为轴承腔的1/2至2/3，过量填充会导致散热不良、轴承温度升高。', keywords: ['润滑', '润滑脂', '轴承温度'] },
    { content: '机械密封安装：动环与静环端面应无划痕，涂抹清洁机油保护；压缩量公差3±0.5mm，装毕盘车应轻快均匀。', keywords: ['机械密封', '安装', '压缩量'] },
    { content: '联轴器对中允许偏差：径向不大于0.08mm，角向不大于0.06mm/m，超差时应重新垫平调整并用百分表复测。', keywords: ['对中', '联轴器', '允许偏差'] },
    { content: '检修后试机：空载运行30分钟，轴承温升不超过35℃、绝对温度不超过75℃，振动速度有效值不大于2.8mm/s方可验收。', keywords: ['试机', '轴承温度', '验收'] },
  ],
  'doc-301': [
    { content: '案例2023-07：某泵站2号泵轴承温度持续上升至92℃触发报警。根因：润滑脂超周期使用劣化结块。处理：更换轴承并清洗轴承腔，润滑周期调整为1800小时，后续6个月未复发。', keywords: ['轴承温度', '报警', '润滑脂'] },
    { content: '案例2023-11：潜水泵绝缘电阻下降至0.5MΩ。根因：机械密封老化失效导致电机腔进水。处理：更换机械密封与O型圈，烘干处理后复测500MΩ合格。', keywords: ['潜水泵', '绝缘电阻', '机械密封'] },
    { content: '案例2024-03：某厂出水管道水锤爆管，泵房被淹。根因：止回阀在突然断电后快速关闭产生升压水锤。整改：加装液压缓闭蝶阀与水锤消除器，停机规程改为先关阀后停机。', keywords: ['水锤', '止回阀', '缓闭蝶阀'] },
    { content: '案例2024-06：变频器频繁报OC过流。根因：泵叶轮缠绕杂物导致负载突增。处理：清理叶轮并加装进口格栅，变频器设置转矩限制提前预警。', keywords: ['变频器', '过流', '叶轮'] },
  ],
  'doc-201': [
    { content: '混凝加药：PAC配制浓度10%，投加量根据原水浊度调整，初始15mg/L；当沉后浊度大于3NTU时按10%梯度增加投加量并观察30分钟。', keywords: ['加药', 'PAC', '浊度'] },
    { content: '原水浊度突变时应切换为SCD流动电流仪自动控制投加，人工校核频次不低于每班次一次。', keywords: ['SCD', '投加控制', '浊度'] },
    { content: 'PAM配制浓度0.1%，搅拌熟化时间不少于30分钟方可投用；投加中断后重新投用须重新熟化。', keywords: ['PAM', '配制', '熟化'] },
    { content: '加药系统巡检：每日检查计量泵行程与频率、背压阀与管路有无堵塞，每周做一次标定罐容积标定。', keywords: ['计量泵', '标定', '巡检'] },
  ],
  'doc-401': [
    { content: '进入受限空间作业必须执行"先通风、再检测、后作业"，氧浓度19.5%至23.5%、有毒有害气体浓度低于限值方可进入。', keywords: ['受限空间', '气体检测', '通风'] },
    { content: '作业时受限空间外必须设专人监护，持续监测并与内部人员保持通讯联络，严禁无防护措施盲目施救。', keywords: ['监护', '持续监测', '施救'] },
    { content: '受限空间内照明电压不大于24V，潮湿狭小容器内不大于12V，灯具应防爆并采用安全电压。', keywords: ['安全电压', '照明', '防爆'] },
    { content: '作业完毕清点人员与工器具，确认无遗留后方可封闭人孔，并办理作业票关闭手续。', keywords: ['作业票', '清点', '关闭'] },
  ],
  'doc-501': [
    { content: '问：自来水为什么有时有漂白粉味？答：出厂水保持少量余氯以保障消毒效果，属安全范围，放置或烧开后自然挥发。', keywords: ['余氯', '水质', '消毒'] },
    { content: '问：自来水发白浑浊怎么办？答：多为管道中空气被压入形成微小气泡，静置片刻即变清，不影响水质。', keywords: ['水质', '气泡', '浑浊'] },
    { content: '问：水费有异议如何处理？答：可申请水表校验，校验误差超标的按校验结果退补水费。', keywords: ['水费', '水表校验'] },
    { content: '问：发现路面管道爆裂怎么办？答：请立即拨打24小时抢修热线，说明位置与现场情况，抢修人员30分钟内到场。', keywords: ['爆管', '抢修', '热线'] },
  ],
}

// 无专属内容池的文档，按模板生成演示 chunk
function fallbackChunks(doc: MockDocument): { content: string; keywords: string[] }[] {
  return [1, 2, 3, 4].map((i) => ({
    content: `《${doc.name}》第${i}章要点：本章节规定了相关作业的流程、质量控制指标与记录要求，执行中如遇与上位制度冲突，以最新版本制度为准。`,
    keywords: [doc.name.replace(/\.[^.]+$/, ''), `第${i}章`],
  }))
}

export async function fetchDatasets(): Promise<MockDataset[]> {
  await delay(350)
  return datasets
}

export async function fetchDataset(id: string): Promise<MockDataset | undefined> {
  await delay(200)
  return datasets.find((d) => d.id === id)
}

export async function fetchDocuments(datasetId: string): Promise<MockDocument[]> {
  await delay(400)
  return documents.filter((d) => d.datasetId === datasetId)
}

export async function fetchChunks(docId: string): Promise<MockChunk[]> {
  await delay(400)
  const doc = documents.find((d) => d.id === docId)
  if (!doc) return []
  const pool = chunkPools[docId] || fallbackChunks(doc)
  return pool.map((c, i) => ({
    id: `${docId}-chunk-${i + 1}`,
    docId,
    index: i + 1,
    content: c.content,
    keywords: c.keywords,
    page: (i % 6) + 1,
    tokenCount: Math.round(c.content.length * 1.4),
  }))
}

function ngrams(s: string, n = 2): string[] {
  const clean = s.replace(/\s+/g, '')
  const out: string[] = []
  for (let i = 0; i + n <= clean.length; i++) {
    out.push(clean.slice(i, i + n))
  }
  return out
}

export const sampleQueries = [
  '泵轴承温度过高怎么处理？',
  '浊度超标如何调整加药量',
  '受限空间作业前有什么要求',
  '自来水有漂白粉味正常吗',
]

export async function doRetrieval(query: string, topK: number, threshold: number): Promise<MockRetrievalHit[]> {
  await delay(600)
  const qg = ngrams(query)
  const hits: MockRetrievalHit[] = []
  for (const doc of documents) {
    if (doc.status !== 'DONE') continue
    const pool = chunkPools[doc.id] || fallbackChunks(doc)
    const ds = datasets.find((d) => d.id === doc.datasetId)
    pool.forEach((c, i) => {
      const vec = qg.length ? qg.filter((g) => c.content.includes(g)).length / qg.length : 0
      const term = c.keywords.filter((k) => query.includes(k)).length / Math.max(1, c.keywords.length)
      const similarity = Math.min(0.99, 0.55 * vec + 0.45 * term + (vec > 0 ? 0.2 : 0))
      if (similarity >= threshold && (vec > 0 || term > 0)) {
        hits.push({
          id: `${doc.id}-hit-${i}`,
          content: c.content,
          docName: doc.name,
          datasetName: ds ? ds.name : '-',
          similarity,
          vectorSimilarity: Math.min(0.99, vec * 0.9 + 0.08),
          termSimilarity: Math.min(0.99, term),
          keywords: c.keywords,
        })
      }
    })
  }
  hits.sort((a, b) => b.similarity - a.similarity)
  return hits.slice(0, topK)
}

export function formatBytes(size: number): string {
  if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`
  if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${size} B`
}

export function formatTokens(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`
  return String(n)
}
