<template>
  <div class="cache-page">
    <div class="cache-header">
      <h2>IndexedDB 管理</h2>
      <p>管理 DifyChatDB 数据库中的缓存数据</p>
    </div>
    
    <div class="cache-content">
      <div class="cache-card">
        <div class="cache-card-header">
          <h3>🗄️ 数据库概览</h3>
        </div>
        <div class="cache-stats">
          <div class="stat-item">
            <span class="stat-value">{{ dbStats.keyCount }}</span>
            <span class="stat-label">键数量</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ dbStats.size }}</span>
            <span class="stat-label">数据大小</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ dbStats.dbName }}</span>
            <span class="stat-label">数据库名</span>
          </div>
        </div>
      </div>

      <div class="cache-card">
        <div class="cache-card-header">
          <h3>⚙️ 操作</h3>
        </div>
        <div class="cache-actions">
          <n-button type="primary" @click="refreshData">
            🔄 刷新数据
          </n-button>
          <n-button type="success" @click="exportAllData">
            📤 导出所有缓存
          </n-button>
          <n-button type="info" @click="triggerImport">
            📥 导入缓存数据
          </n-button>
          <n-button type="error" @click="clearAllData">
            🧹 清空所有数据
          </n-button>
          <input type="file" ref="importFileInput" class="import-file-input" accept=".json" @change="handleFileImport" />
        </div>
      </div>

      <div class="cache-card">
        <div class="cache-card-header">
          <h3>📋 数据列表</h3>
        </div>
        <n-data-table :columns="columns" :data="dataList" bordered>
          <template v-slot:empty>
            <div class="empty-data">
              <n-icon>
                <IconNodata />
              </n-icon>
              <p>暂无数据</p>
            </div>
          </template>
        </n-data-table>
      </div>
    </div>

    <n-modal v-model:show="showEditModal" class="edit-modal" :mask-closable="false">
      <n-card style="width: 700px;" :bordered="false" size="huge" role="dialog" aria-modal="true">
        <div class="modal-center-title">
          <span>编辑缓存数据</span>
        </div>
        <div class="dialog-body">
          <n-form-item label="键名" style="font-size: 14px;">
            <n-input v-model:value="editForm.key" />
          </n-form-item>
          <n-form-item label="数据类型" style="font-size: 14px;">
            <n-input :value="editForm.type" disabled />
          </n-form-item>
          <n-form-item label="数据内容" style="font-size: 14px;">
            <n-input
              v-model:value="editForm.content"
              type="textarea"
              :rows="15"
              placeholder="请输入 JSON 格式的数据"
            />
          </n-form-item>
        </div>
        <div class="dialog-footer">
          <n-button style="border: 1px solid #A8A8A8;" size="small" :focusable="false" @click="closeEditModal" quaternary round class="button cancel-button">
            取消
          </n-button>
          <n-button size="small" color="#0647a1" :focusable="false" :loading="saveLoading" @click="saveEditData" class="button confirm-button">
            保存
          </n-button>
        </div>
      </n-card>
    </n-modal>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref, onMounted, reactive, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { NButton, NDataTable, NIcon, NModal, NCard, NFormItem, NInput } from 'naive-ui'
import { IconNodata } from '@/icons'
import localforage from 'localforage'

interface DataItem {
  key: string
  type: string
  size: number
  count: number
  preview: string
  data: any
}

interface DBStats {
  keyCount: number
  size: string
  dbName: string
}

interface EditForm {
  key: string
  type: string
  content: string
}

export default defineComponent({
  name: 'IndexedDBManagement',
  components: {
    NButton,
    NDataTable,
    NIcon,
    NModal,
    NCard,
    NFormItem,
    NInput,
  },
  setup() {
    const dataList = ref<DataItem[]>([])
    const expandedKeys = ref<string[]>([])
    const dbStats = reactive<DBStats>({
      keyCount: 0,
      size: '0 B',
      dbName: 'DifyChatDB',
    })

    const showEditModal = ref(false)
    const saveLoading = ref(false)
    const importFileInput = ref<HTMLInputElement | null>(null)
    const originalKey = ref('')

    const editForm = reactive<EditForm>({
      key: '',
      type: '',
      content: '',
    })

    const message = useMessage()
    const dialog = useDialog()

    const indexedDBStore = localforage.createInstance({
      name: 'DifyChatDB',
      version: 1,
      storeName: 'dify_chat_data',
      description: 'Dify chatbot data storage using IndexedDB',
      driver: [localforage.INDEXEDDB, localforage.WEBSQL, localforage.LOCALSTORAGE],
    })

    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getTypeTagType = (type: string): string => {
      const tags: Record<string, string> = {
        array: 'success',
        object: 'info',
        string: 'warning',
        number: 'default',
        boolean: 'default',
      }
      return tags[type] || 'default'
    }

    const getDataType = (data: any): string => {
      if (Array.isArray(data)) return 'array'
      return typeof data
    }

    const getPreview = (data: any): string => {
      if (data === null) return 'null'
      if (data === undefined) return 'undefined'
      if (typeof data === 'string') {
        return data.length > 50 ? data.substring(0, 50) + '...' : data
      }
      if (Array.isArray(data)) {
        return `Array(${data.length})`
      }
      if (typeof data === 'object') {
        const keys = Object.keys(data)
        return `Object(${keys.length}): ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`
      }
      return String(data)
    }

    const calculateSize = (data: any): number => {
      try {
        const jsonString = JSON.stringify(data)
        return new Blob([jsonString]).size
      } catch {
        return 0
      }
    }

    const getDataCount = (data: any): number => {
      if (Array.isArray(data)) return data.length
      if (typeof data === 'object' && data !== null) return Object.keys(data).length
      return 0
    }

    const toggleExpand = (key: string) => {
      const index = expandedKeys.value.indexOf(key)
      if (index > -1) {
        expandedKeys.value.splice(index, 1)
      } else {
        expandedKeys.value.push(key)
      }
    }

    const deleteData = (key: string) => {
      dialog.warning({
        title: '确认删除',
        content: `确定删除键 "${key}" 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          await indexedDBStore.removeItem(key)
          message.success('删除成功')
          loadData()
        },
      })
    }

    const clearAllData = () => {
      dialog.error({
        title: '确认清空',
        content: '确定清空所有数据吗？此操作不可恢复！',
        positiveText: '确定清空',
        negativeText: '取消',
        onPositiveClick: async () => {
          await indexedDBStore.clear()
          dataList.value = []
          dbStats.keyCount = 0
          dbStats.size = '0 B'
          message.success('清空完成')
        },
      })
    }

    const refreshData = () => {
      loadData()
      message.success('数据已刷新')
    }

    const loadData = async () => {
      try {
        dataList.value = []
        let totalSize = 0

        await indexedDBStore.iterate((value, key) => {
          const item: DataItem = {
            key: String(key),
            type: getDataType(value),
            size: calculateSize(value),
            count: getDataCount(value),
            preview: getPreview(value),
            data: value,
          }
          dataList.value.push(item)
          totalSize += item.size
        })

        dbStats.keyCount = dataList.value.length
        dbStats.size = formatSize(totalSize)
      } catch (error) {
        message.error('加载数据失败')
      }
    }

    const exportAllData = async () => {
      try {
        const allData: Record<string, any> = {}
        await indexedDBStore.iterate((value, key) => {
          allData[String(key)] = value
        })

        const content = JSON.stringify(allData, null, 2)
        const blob = new Blob([content], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dify-chat-cache-${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        message.success('导出成功')
      } catch (error) {
        message.error('导出失败')
      }
    }

    const triggerImport = () => {
      importFileInput.value?.click()
    }

    const handleFileImport = async (event: Event) => {
      const target = event.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return

      try {
        const content = await file.text()
        const data = JSON.parse(content)

        if (typeof data !== 'object' || data === null) {
          message.error('导入文件格式不正确，必须是 JSON 对象')
          return
        }

        dialog.warning({
          title: '确认导入',
          content: `确定导入 ${Object.keys(data).length} 条缓存数据吗？已存在的键将被覆盖。`,
          positiveText: '确定',
          negativeText: '取消',
          onPositiveClick: async () => {
            for (const [key, value] of Object.entries(data)) {
              await indexedDBStore.setItem(key, value)
            }
            message.success('导入成功')
            loadData()
            target.value = ''
          },
        })
      } catch (error) {
        message.error('导入失败，文件格式不正确')
        target.value = ''
      }
    }

    const openEditModal = (row: DataItem) => {
      originalKey.value = row.key
      editForm.key = row.key
      editForm.type = row.type
      editForm.content = JSON.stringify(row.data, null, 2)
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editForm.key = ''
      editForm.type = ''
      editForm.content = ''
    }

    const saveEditData = async () => {
      if (!editForm.key.trim()) {
        message.warning('请输入键名')
        return
      }
      if (!editForm.content.trim()) {
        message.warning('请输入数据内容')
        return
      }

      try {
        const data = JSON.parse(editForm.content)
        saveLoading.value = true

        if (editForm.key !== originalKey.value) {
          await indexedDBStore.removeItem(originalKey.value)
        }
        await indexedDBStore.setItem(editForm.key, data)
        message.success('保存成功')
        closeEditModal()
        loadData()
      } catch (error) {
        message.error('JSON 格式错误')
      } finally {
        saveLoading.value = false
      }
    }

    const columns = [
      {
        title: '键名',
        key: 'key',
        width: 200,
        render(row: DataItem) {
          return h('code', { class: 'cache-key' }, row.key)
        },
      },
      {
        title: '类型',
        key: 'type',
        width: 100,
        render(row: DataItem) {
          const tagClass = `tag-${getTypeTagType(row.type)}`
          return h('span', { class: ['cache-tag', tagClass] }, row.type)
        },
      },
      {
        title: '大小',
        key: 'size',
        width: 120,
        render(row: DataItem) {
          return h('span', { class: 'cache-size' }, formatSize(row.size))
        },
      },
      {
        title: '元素数',
        key: 'count',
        width: 100,
        render(row: DataItem) {
          return h('span', {}, row.count)
        },
      },
      {
        title: '预览',
        key: 'preview',
        minWidth: 300,
        render(row: DataItem) {
          const isExpanded = expandedKeys.value.includes(row.key)
          return h('div', {}, [
            h('div', { class: 'preview-content', onClick: () => toggleExpand(row.key) }, [
              h('span', { class: 'expand-icon' }, isExpanded ? '▼' : '▶'),
              h('span', { class: 'preview-text' }, row.preview),
            ]),
            isExpanded
              ? h('div', { class: 'expanded-content' }, [
                  h('pre', {}, JSON.stringify(row.data, null, 2)),
                ])
              : null,
          ])
        },
      },
      {
        title: '操作',
        key: 'actions',
        width: 160,
        align: 'center' as const,
        render(row: DataItem) {
          return h('div', { class: 'action-buttons' }, [
            h(
              NButton,
              {
                type: 'primary',
                size: 'small',
                onClick: () => openEditModal(row),
              },
              '编辑'
            ),
            h(
              NButton,
              {
                type: 'error',
                size: 'small',
                onClick: () => deleteData(row.key),
              },
              '删除'
            ),
          ])
        },
      },
    ]

    onMounted(() => {
      loadData()
    })

    return {
      dataList,
      expandedKeys,
      dbStats,
      columns,
      showEditModal,
      saveLoading,
      importFileInput,
      editForm,
      formatSize,
      toggleExpand,
      deleteData,
      clearAllData,
      refreshData,
      exportAllData,
      triggerImport,
      handleFileImport,
      openEditModal,
      closeEditModal,
      saveEditData,
      IconNodata,
    }
  },
})
</script>

<style scoped>
.cache-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.cache-header {
  margin-bottom: 20px;
}

.cache-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.cache-header p {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.cache-content {
  max-width: 1400px;
  margin: 0 auto;
}

.cache-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.cache-card-header {
  margin-bottom: 16px;
}

.cache-card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.cache-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  flex: 1;
  text-align: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.cache-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.import-file-input {
  display: none;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.cache-key {
  font-size: 13px;
  color: #606266;
  background-color: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.cache-size {
  font-size: 13px;
  color: #67c23a;
}

.cache-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.tag-success {
  background-color: #f0f9eb;
  color: #67c23a;
}

.tag-info {
  background-color: #ecf5ff;
  color: #409eff;
}

.tag-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.tag-default {
  background-color: #f4f4f5;
  color: #909399;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  font-size: 13px;
}

.expand-icon {
  font-size: 12px;
  color: #909399;
}

.preview-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.expanded-content {
  margin-top: 8px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.expanded-content pre {
  margin: 0;
  font-size: 12px;
  color: #303133;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #909399;
}

.empty-data p {
  margin-top: 8px;
  font-size: 14px;
}

.modal-center-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.dialog-body {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.edit-modal :deep(.n-card) {
  padding: 24px;
}
</style>