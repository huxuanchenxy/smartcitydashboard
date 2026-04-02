import { DatavComponent } from '@/components/datav-component'
import {
  ApiConfigMap, ApiDataConfigMap,
  initApiConfig, initApiData,
} from '@/components/data-source'
import { createField } from '@/components/data-field'
import { DataEventConfig } from '@/components/data-event'
import { getStaticData } from '@/api/data'

/**
 * AiIframe
 */
export class AiIframe extends DatavComponent {
  config = {
    border:'solid',
    borderColor:`rgba(100, 200, 255, 0.7)`,
    borderWidth:3,
    overflow:'scroll',
    titleConfig: {
      title: 'AI标题',
      titleStyle: {
        paddingTop:0,
        paddingLeft:20,
        fontSize: 20,
        background: `rgba(100, 200, 255, 0.7)`,
        color: `rgba(255, 255, 235, 1)`,
        fontWeight: 'normal',
        height: 30,
        width: 100,
        show:true
      },
    },
    srcConfig: {
      srcStyle: {
        height: 570,
        width: 100,
      },
      src: 'http://saints-pc:8080/geoserver/web/',
    },
    iconConfig: {
      buttonHeight:30,
      buttonWidth:50,
      refreshBackgroundColor:`rgba(100, 200, 255, 0.7)`,
      closeBackgroundColor:`rgba(255, 0, 0, 1)`,
      refreshIcon: 'images/refresh.svg',
      closeIcon: 'images/close-o.svg',
    },
  }

  apis: Partial<ApiConfigMap>
  apiData: Partial<ApiDataConfigMap>

  events: Record<string, DataEventConfig>

  actions: Record<string, DataEventConfig>

  constructor() {
    super('AiIframe', { w: 800, h: 600 })

    this.initData()
  }

  initData() {
    const fields = [
      createField('title', { description: '标题', optional: true }),
      createField('url', { description: '地址', optional: true }),
    ]

    this.apis = initApiConfig({
      fields: Object.assign({}, ...fields),
      description: 'ai-iframe接口',
    })

    this.apiData = initApiData(this.id)

    this.events = {}
    this.actions = {}

    return this
  }

  async loadData() {
    try {
      // 组件静态数据来源，当前项目统一管理目录：data/*
      // 如：data/demo/data.json 简写为 => demo/data
      const path = 'iframe/ai-iframe'
      const res = await getStaticData(this.id, path)
      this.apiData.source.config.data = JSON.stringify(res.data)
    } catch (error) {
      throw error
    }
  }
}

export default AiIframe