import { DatavComponent } from '@/components/datav-component'
import {
  ApiConfigMap, ApiDataConfigMap,
  initApiConfig, initApiData,
} from '@/components/data-source'
import { createField } from '@/components/data-field'
import { DataEventConfig } from '@/components/data-event'
import { getStaticData } from '@/api/data'

export class AiDifyReal extends DatavComponent {
  config = {
    buttonImage: 'images/dify.png',
    buttonStyle: {
      backgroundColor: '#4CAF50',
      hoverBackgroundColor: '#45a049',
    },
    role: '',
    // 左侧历史会话栏宽度（px）
    sidebarWidth: 300,
    // 字体整体缩放倍率（1 = 100%，范围 0.8–3）
    fontScale: 1,
  }

  apis: Partial<ApiConfigMap>
  apiData: Partial<ApiDataConfigMap>

  events: Record<string, DataEventConfig>

  actions: Record<string, DataEventConfig>

  constructor() {
    // 内嵌聊天面板，默认给出适合对话展示的宽高（左侧历史栏 300px，主聊天区约 340px）
    super('AiDifyReal', { w: 640, h: 600 })

    this.initData()
  }

  initData() {
    const fields = [
      createField('buttonImage', { description: '按钮图片', optional: true }),
    ]

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields),
      description: 'ai-dify-real接口',
    })

    this.apiData = initApiData(this.id)

    this.events = {}
    this.actions = {}

    return this
  }

  async loadData() {
    try {
      const path = 'iframe/ai-dify-real'
      const res = await getStaticData(this.id, path)
      this.apiData.source.config.data = JSON.stringify(res.data)
    } catch (error) {
      throw error
    }
  }
}

export default AiDifyReal
