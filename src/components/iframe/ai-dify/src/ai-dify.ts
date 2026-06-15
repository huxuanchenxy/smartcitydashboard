import { DatavComponent } from '@/components/datav-component.ts'
import {
  ApiConfigMap, ApiDataConfigMap,
  initApiConfig, initApiData,
} from '@/components/data-source.ts'
import { createField } from '@/components/data-field.ts'
import { DataEventConfig } from '@/components/data-event.ts'
import { getStaticData } from '@/api/data.ts'

export class AiDify extends DatavComponent {
  config = {
    buttonImage: 'images/dify.png',
    buttonStyle: {
      backgroundColor: '#4CAF50',
      hoverBackgroundColor: '#45a049',
    },
  }

  apis: Partial<ApiConfigMap>
  apiData: Partial<ApiDataConfigMap>

  events: Record<string, DataEventConfig>

  actions: Record<string, DataEventConfig>

  constructor() {
    super('AiDify', { w: 100, h: 60 })

    this.initData()
  }

  initData() {
    const fields = [
      createField('buttonImage', { description: '按钮图片', optional: true }),
    ]

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields),
      description: 'ai-dify接口',
    })

    this.apiData = initApiData(this.id)

    this.events = {}
    this.actions = {}

    return this
  }

  async loadData() {
    try {
      const path = 'iframe/ai-dify'
      const res = await getStaticData(this.id, path)
      this.apiData.source.config.data = JSON.stringify(res.data)
    } catch (error) {
      throw error
    }
  }
}

export default AiDify
