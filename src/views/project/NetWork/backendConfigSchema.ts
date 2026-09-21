/**
 * 后台配置 9 张表的字段元数据
 * 来源：Swagger http://10.89.33.97:8082/v3/api-docs components.schemas
 *
 * 用途：
 *   1. 驱动表格列渲染（label + prop + 格式化）
 *   2. 驱动新增/编辑弹窗的动态表单
 *
 * 对于 Swagger 中 schema 为空的表（如 SessionDialogueLog），
 * 后端未暴露字段结构，此处采用「JSON 原文编辑」模式，避免臆造字段。
 */
import type { BackendTableKey } from '@/api/backendConfig'

/** 字段类型 */
export type FieldKind =
  | 'text'        // 单行字符串
  | 'textarea'    // 多行字符串（长文本）
  | 'number'      // 数字（int32/int64/float）
  | 'boolean'     // 布尔
  | 'datetime'    // 时间字符串
  | 'json'        // 对象（additionalProperties）
  | 'stringArray' // 字符串数组

export interface FieldDef {
  /** 后端字段名 */
  prop: string
  /** 中文标签 */
  label: string
  /** 输入类型 */
  kind: FieldKind
  /** 是否为主键（新增时禁用，编辑时只读） */
  isId?: boolean
  /** 是否必填（前端提示，实际以后端为准） */
  required?: boolean
  /** 是否在列表中展示（默认 true） */
  inTable?: boolean
  /** 是否在表单中展示（默认 true） */
  inForm?: boolean
  /** 是否只读（后端自动维护的时间戳等） */
  readonly?: boolean
  /** 数字类型：int 或 float，用于 step 处理 */
  numberType?: 'int' | 'float'
  /** 表格列宽度（px） */
  width?: number
  /** 占位提示 */
  placeholder?: string
}

export interface TableDef {
  key: BackendTableKey
  /** 表中文名 */
  title: string
  /** 主键字段名 */
  idField: string
  /** 是否使用 JSON 原文编辑（无 schema 表） */
  jsonMode?: boolean
  /** 是否提供启用列表接口 */
  hasEnabledList?: boolean
  fields: FieldDef[]
}

/** 通用：createdAt / updatedAt 只读时间字段 */
const createdAtField: FieldDef = {
  prop: 'createdAt',
  label: '创建时间',
  kind: 'datetime',
  inTable: true,
  inForm: true,
  readonly: true,
  width: 165,
}
const updatedAtField: FieldDef = {
  prop: 'updatedAt',
  label: '更新时间',
  kind: 'datetime',
  inTable: true,
  inForm: true,
  readonly: true,
  width: 165,
}

export const BACKEND_TABLES: TableDef[] = [
  {
    key: 'intentDefinition',
    title: '意图定义',
    idField: 'intentId',
    hasEnabledList: true,
    fields: [
      { prop: 'intentId', label: '意图ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'intentCode', label: '意图编码', kind: 'text', required: true, width: 140 },
      { prop: 'intentName', label: '意图名称', kind: 'text', required: true, width: 140 },
      { prop: 'intentDesc', label: '意图描述', kind: 'textarea', inTable: false },
      { prop: 'intentExamples', label: '示例语句', kind: 'stringArray', inTable: false, placeholder: '一行一个示例' },
      { prop: 'extractionConfig', label: '抽取配置', kind: 'json', inTable: false },
      { prop: 'isAllowedSkipConfirm', label: '允许跳过确认', kind: 'boolean', width: 120 },
      { prop: 'priority', label: '优先级', kind: 'number', numberType: 'int', width: 90 },
      { prop: 'isEnabled', label: '是否启用', kind: 'boolean', width: 100 },
      { prop: 'defaultEvaluationMode', label: '默认评估模式', kind: 'text', width: 140 },
      { prop: 'isSupportEvaluationSkip', label: '支持评估跳过', kind: 'number', numberType: 'int', width: 130 },
      { prop: 'categories', label: '分类', kind: 'number', numberType: 'int', width: 80 },
      createdAtField,
      updatedAtField,
    ],
  },
  {
    key: 'difySkillRegistry',
    title: 'Dify技能注册表',
    idField: 'skillId',
    hasEnabledList: true,
    fields: [
      { prop: 'skillId', label: '技能ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'skillCode', label: '技能编码', kind: 'text', required: true, width: 140 },
      { prop: 'skillName', label: '技能名称', kind: 'text', required: true, width: 140 },
      { prop: 'skillType', label: '技能类型', kind: 'text', width: 110 },
      { prop: 'difyAppId', label: 'Dify AppId', kind: 'text', width: 180 },
      { prop: 'difyApiSecretEncrypted', label: 'Dify 密钥(加密)', kind: 'text', inTable: false },
      { prop: 'difyApiEndpoint', label: 'Dify Endpoint', kind: 'text', width: 220 },
      { prop: 'apiPath', label: 'API 路径', kind: 'text', width: 180 },
      { prop: 'skillDesc', label: '技能描述', kind: 'textarea', inTable: false },
      { prop: 'generationPrompt', label: '生成提示词', kind: 'textarea', inTable: false },
      { prop: 'timeoutSeconds', label: '超时秒', kind: 'number', numberType: 'int', width: 90 },
      { prop: 'maxRetryTimes', label: '最大重试', kind: 'number', numberType: 'int', width: 100 },
      { prop: 'defaultOutputConfidence', label: '默认置信度', kind: 'number', numberType: 'float', width: 120 },
      { prop: 'isAllowSkipEvaluation', label: '允许跳过评估', kind: 'number', numberType: 'int', width: 130 },
      { prop: 'supportsFileInput', label: '支持文件输入', kind: 'boolean', width: 130 },
      { prop: 'isEnabled', label: '是否启用', kind: 'boolean', width: 100 },
      { prop: 'requestTemplate', label: '请求模板', kind: 'json', inTable: false },
      { prop: 'responseExtractRule', label: '响应抽取规则', kind: 'json', inTable: false },
      { prop: 'slotTransforms', label: '槽位转换', kind: 'json', inTable: false },
      createdAtField,
      updatedAtField,
    ],
  },
  {
    key: 'intentSkillConfig',
    title: '意图-技能执行配置',
    idField: 'configId',
    hasEnabledList: true,
    fields: [
      { prop: 'configId', label: '配置ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'intentCode', label: '意图编码', kind: 'text', required: true, width: 140, placeholder: '关联意图编码' },
      { prop: 'skillId', label: '技能ID', kind: 'number', numberType: 'int', required: true, width: 90, placeholder: '关联技能ID(dify_skill_registry)' },
      { prop: 'callOrder', label: '步骤顺序', kind: 'number', numberType: 'int', required: true, width: 100, placeholder: '从1开始' },
      { prop: 'stepCode', label: '步骤标识', kind: 'text', required: true, width: 120, placeholder: '同一意图内唯一' },
      { prop: 'isForceSkip', label: '强制跳过', kind: 'boolean', width: 100 },
      { prop: 'isEnabled', label: '是否生效', kind: 'boolean', width: 100 },
      { prop: 'repeatPolicy', label: '确认/重试策略', kind: 'json', inTable: false },
      { prop: 'preCheckSlots', label: '前置槽位校验', kind: 'json', inTable: false, placeholder: '执行前必存在的黑板状态键' },
      { prop: 'inputMapping', label: '输入映射', kind: 'json', inTable: false, placeholder: '{"参数名":"stepX.参数名"}；特殊键"query"覆盖chatflow的query' },
      createdAtField,
      updatedAtField,
    ],
  },
  {
    key: 'skillParamDefinition',
    title: 'Skill参数定义',
    idField: 'paramId',
    hasEnabledList: true,
    fields: [
      { prop: 'paramId', label: '参数ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'skillId', label: '技能ID', kind: 'number', numberType: 'int', required: true, width: 90 },
      { prop: 'paramCode', label: '参数编码', kind: 'text', required: true, width: 140 },
      { prop: 'paramName', label: '参数名称', kind: 'text', required: true, width: 140 },
      { prop: 'direction', label: '方向', kind: 'text', width: 90, placeholder: 'in / out' },
      { prop: 'dataType', label: '数据类型', kind: 'text', width: 110 },
      { prop: 'isRequired', label: '是否必填', kind: 'boolean', width: 100 },
      { prop: 'isEnabled', label: '是否启用', kind: 'boolean', width: 100 },
      { prop: 'sortOrder', label: '排序', kind: 'number', numberType: 'int', width: 80 },
      { prop: 'normalizeSql', label: '归一化SQL', kind: 'number', numberType: 'int', width: 110 },
      { prop: 'paramDesc', label: '参数描述', kind: 'textarea', inTable: false },
      createdAtField,
    ],
  },
  {
    key: 'sessionExecutionInstance',
    title: '会话执行实例',
    idField: 'instanceId',
    fields: [
      { prop: 'instanceId', label: '实例ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'conversationId', label: '会话ID', kind: 'text', width: 200 },
      { prop: 'turnIndex', label: '轮次', kind: 'number', numberType: 'int', width: 80 },
      { prop: 'intentCode', label: '意图编码', kind: 'text', width: 130 },
      { prop: 'orchestrationStatus', label: '编排状态', kind: 'text', width: 110 },
      { prop: 'totalSkillCount', label: '技能总数', kind: 'number', numberType: 'int', width: 100 },
      { prop: 'successSkillCount', label: '成功数', kind: 'number', numberType: 'int', width: 90 },
      { prop: 'orchestrationCostMs', label: '编排耗时(ms)', kind: 'number', numberType: 'int', width: 130 },
      { prop: 'evaluationStatus', label: '评估状态', kind: 'text', width: 110 },
      { prop: 'evaluationSkipType', label: '评估跳过类型', kind: 'text', width: 130 },
      { prop: 'evaluateRetryCount', label: '评估重试次数', kind: 'number', numberType: 'int', width: 130 },
      { prop: 'outputEvaluateResult', label: '评估结果', kind: 'json', inTable: false },
      createdAtField,
      updatedAtField,
    ],
  },
  {
    key: 'sessionFileRecord',
    title: '会话文件登记',
    idField: 'fileId',
    fields: [
      { prop: 'fileId', label: '文件ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'conversationId', label: '会话ID', kind: 'text', width: 200 },
      { prop: 'turnIndex', label: '轮次', kind: 'number', numberType: 'int', width: 80 },
      { prop: 'originalName', label: '原始文件名', kind: 'text', width: 180 },
      { prop: 'mimeType', label: 'MIME类型', kind: 'text', width: 140 },
      { prop: 'fileSize', label: '文件大小', kind: 'number', numberType: 'int', width: 110 },
      { prop: 'storedPath', label: '存储路径', kind: 'text', inTable: false },
      { prop: 'accessUrl', label: '访问URL', kind: 'text', inTable: false },
      createdAtField,
    ],
  },
  {
    key: 'difyFileUpload',
    title: '网关文件上传记录',
    idField: 'id',
    fields: [
      { prop: 'id', label: 'ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'skillId', label: '技能ID', kind: 'number', numberType: 'int', width: 90 },
      { prop: 'uploadFileId', label: '上传文件ID', kind: 'text', width: 200 },
      { prop: 'storagePath', label: '存储路径', kind: 'text', width: 260 },
      { prop: 'uploadedAt', label: '上传时间', kind: 'datetime', width: 165, readonly: true },
    ],
  },
  {
    key: 'sessionSkillConversation',
    title: '业务会话-Dify会话映射',
    idField: 'id',
    fields: [
      { prop: 'id', label: 'ID', kind: 'number', isId: true, numberType: 'int', width: 90 },
      { prop: 'bizKey', label: '业务会话ID', kind: 'text', required: true, width: 220, placeholder: '网关 conversation_id' },
      { prop: 'skillCode', label: '技能编码', kind: 'text', required: true, width: 140 },
      { prop: 'difyConversationId', label: 'Dify会话ID', kind: 'text', required: true, width: 220 },
      createdAtField,
      updatedAtField,
    ],
  },

]

/** 按 key 快速取表定义 */
export function getTableDef(key: BackendTableKey): TableDef | undefined {
  return BACKEND_TABLES.find(t => t.key === key)
}

/** 空表单初值：按字段类型给出默认值，避免 v-model 绑定 undefined */
export function buildEmptyForm(def: TableDef): Record<string, any> {
  if (def.jsonMode) return {}
  const form: Record<string, any> = {}
  def.fields.forEach(f => {
    if (f.readonly) return
    switch (f.kind) {
      case 'number':
        form[f.prop] = null
        break
      case 'boolean':
        form[f.prop] = false
        break
      case 'json':
        form[f.prop] = null
        break
      case 'stringArray':
        form[f.prop] = []
        break
      default:
        form[f.prop] = ''
    }
  })
  return form
}
