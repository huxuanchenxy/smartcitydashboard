export const globalConfig = {
  title: 'DataS',
  logo: `data/originPic/datav-vue-logo.png`,
}

// Dify 配置 - 用于 AI 对话功能
export const difyConfig = {
  // 默认 API Key（用于普通发送）
  apiKey: '',
  
  // 发送2功能的第一次调用 API Key（对应第一个 chatflow）
  apiKeyFlow1: '',
  
  // 发送2功能的第二次调用 API Key（对应第二个 chatflow）
  apiKeyFlow2: '',
  
  // 新程序专用 API Key
  apiKeyFlow3: '',
  
  // difyapidialog 专用 API Key
  apiKeyFlow4: '',
  
  // difyapidialog 专用 API Key (FLOWa1)
  apiKeyFlowA1: '',
  
  // difyapidialog 专用 API Key (FLOWb1)
  apiKeyFlowB1: '',
  
  // difyapidialog 专用 API Key (FLOWb2)
  apiKeyFlowB2: '',
  
  // difyapidialog 专用 API Key (FLOWb3)
  apiKeyFlowB3: '',
  
  // difyapidialog 专用 API Key (FLOW_getway)
  apiKeyFlowGetway: '',
  
  // 水务专用 API Key
  apiKeyFlowWater: '',
  
  // API 基础地址
  baseUrl: '',
}
