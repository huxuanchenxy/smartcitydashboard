<template>
  <div class="home">
    <h1>AI 页面</h1>
    <p>aipage 项目运行正常。当前登录状态：{{ token ? '已登录' : '未登录' }}</p>
    <p class="tip">本页面可独立运行（http://localhost:9091/），也可被 dashboard 通过 iframe 嵌入。</p>
    <p class="console-entry">
      <router-link to="/console/datasets">进入知识库管理台 →</router-link>
    </p>

    <section class="auth-panel">
      <h2>登录凭证与菜单权限</h2>
      <p class="field-label">已接收到的 token（{{ token ? '来自 dashboard（URL query / postMessage）' : '无' }}）：</p>
      <div class="token-box">{{ token || '（未收到 token，请从 dashboard 嵌入访问或带 ?token= 参数打开）' }}</div>

      <div class="perm-toolbar">
        <button class="refresh-btn" :disabled="permLoading" @click="loadPermissions">
          {{ permLoading ? '请求中...' : '请求 getRolePermissions（menu/permissions）' }}
        </button>
        <span v-if="permError" class="perm-error">{{ permError }}</span>
        <span v-else-if="permData" class="perm-ok">请求成功</span>
      </div>

      <div v-if="permData" class="perm-result">
        <p class="field-label">当前 token 的菜单权限（enabled 为 true 的才会在 dashboard 显示）：</p>
        <div v-for="group in permGroups" :key="group.title" class="perm-group">
          <p class="group-title">{{ group.title }}</p>
          <ul>
            <li v-for="item in group.items" :key="item.key" :class="{ disabled: !item.enabled }">
              <span class="perm-flag">{{ item.enabled ? '✓ 启用' : '✗ 禁用' }}</span>
              {{ item.name }}<span class="perm-path">（{{ item.path }}）</span>
            </li>
          </ul>
        </div>
        <details class="perm-raw">
          <summary>原始返回 JSON</summary>
          <pre>{{ permRaw }}</pre>
        </details>
      </div>
    </section>

    <KnowledgeGraph />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { getToken } from '@/utils/token'
import { fetchMenuPermissions } from '@/utils/permission'
import type { PermissionMenuItem } from '@/utils/permission'
import KnowledgeGraph from '@/components/knowledge-graph/index.vue'

export default defineComponent({
  name: 'AiPageHome',
  components: {
    KnowledgeGraph,
  },
  setup() {
    const token = ref(getToken())
    const permData = ref<any>(null)
    const permRaw = ref('')
    const permError = ref('')
    const permLoading = ref(false)

    // 展平一级/二级菜单树，保留 enabled 状态
    const flatten = (items: PermissionMenuItem[]) => {
      const out: { key: string; name: string; path: string; enabled: boolean }[] = []
      const walk = (list: PermissionMenuItem[]) => {
        list?.forEach((item, idx) => {
          out.push({
            key: `${item._id ?? idx}-${item.name}`,
            name: item.name || '-',
            path: item.path || '-',
            enabled: !!item.enabled,
          })
          if (item.children && item.children.length > 0) {
            walk(item.children)
          }
        })
      }
      walk(items || [])
      return out
    }

    const permGroups = ref<{ title: string; items: ReturnType<typeof flatten> }[]>([])

    const loadPermissions = async () => {
      token.value = getToken()
      permError.value = ''
      permLoading.value = true
      try {
        const data = await fetchMenuPermissions()
        permData.value = data
        permRaw.value = JSON.stringify(data, null, 2)
        permGroups.value = [
          { title: '一级菜单', items: flatten(data['一级菜单']) },
          { title: '二级菜单', items: flatten(data['二级菜单']) },
        ]
      } catch (e: any) {
        permData.value = null
        permGroups.value = []
        permError.value = `请求失败：${e?.message || e}`
      } finally {
        permLoading.value = false
      }
    }

    onMounted(() => {
      if (token.value) {
        loadPermissions()
      }
    })

    return { token, permData, permRaw, permError, permLoading, permGroups, loadPermissions }
  },
})
</script>

<style scoped>
.home {
  padding: 24px;
}

.tip {
  color: #999;
  font-size: 13px;
}

.console-entry {
  margin: 4px 0 16px;
}

.console-entry a {
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.console-entry a:hover {
  text-decoration: underline;
}

.auth-panel {
  margin: 16px 0 24px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.auth-panel h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.field-label {
  margin: 8px 0 4px;
  font-size: 13px;
  color: #475569;
}

.token-box {
  padding: 8px 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 4px;
  background: #fff;
  font-family: Consolas, monospace;
  font-size: 13px;
  word-break: break-all;
}

.perm-toolbar {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  padding: 6px 14px;
  border: 1px solid #0e62a9;
  border-radius: 4px;
  background: #0e62a9;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.perm-error {
  color: #dc2626;
  font-size: 13px;
}

.perm-ok {
  color: #16a34a;
  font-size: 13px;
}

.perm-group {
  margin-top: 8px;
}

.group-title {
  margin: 0 0 4px;
  font-weight: bold;
  font-size: 14px;
}

.perm-group ul {
  margin: 0;
  padding-left: 20px;
}

.perm-group li {
  font-size: 13px;
  line-height: 1.9;
}

.perm-group li.disabled {
  color: #94a3b8;
  text-decoration: line-through;
}

.perm-flag {
  display: inline-block;
  width: 60px;
  font-weight: bold;
}

.perm-group li.disabled .perm-flag {
  color: #dc2626;
}

.perm-group li:not(.disabled) .perm-flag {
  color: #16a34a;
}

.perm-path {
  color: #94a3b8;
}

.perm-raw summary {
  margin-top: 10px;
  font-size: 13px;
  color: #0e62a9;
  cursor: pointer;
}

.perm-raw pre {
  max-height: 360px;
  overflow: auto;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  font-size: 12px;
}
</style>
