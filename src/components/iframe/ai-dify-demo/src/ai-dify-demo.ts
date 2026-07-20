import { DatavComponent } from '@/components/datav-component'
import {
  ApiConfigMap, ApiDataConfigMap,
  initApiConfig, initApiData,
} from '@/components/data-source'
import { createField } from '@/components/data-field'
import { DataEventConfig } from '@/components/data-event'
import { getStaticData } from '@/api/data'

export class AiDifyDemo extends DatavComponent {
  config = {
    buttonImage: 'images/dify.png',
    buttonStyle: {
      backgroundColor: '#4CAF50',
      hoverBackgroundColor: '#45a049',
    },
    role: '',
  }

  apis: Partial<ApiConfigMap>
  apiData: Partial<ApiDataConfigMap>

  events: Record<string, DataEventConfig>

  actions: Record<string, DataEventConfig>

  constructor() {
    super('AiDifyDemo', { w: 100, h: 60 })

    this.initData()
  }

  initData() {
    const fields = [
      createField('buttonImage', { description: '按钮图片', optional: true }),
    ]

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields),
      description: 'ai-dify-demo接口',
    })

    this.apiData = initApiData(this.id)

    this.events = {}
    this.actions = {}

    return this
  }

  async loadData() {
    try {
      const path = 'iframe/ai-dify-demo'
      const res = await getStaticData(this.id, path)
      this.apiData.source.config.data = JSON.stringify(res.data)
    } catch (error) {
      throw error
    }
  }
}

export default AiDifyDemo