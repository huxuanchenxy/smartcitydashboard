<template>
  <div class="console">
    <header class="console-header">
      <div class="brand">
        <span class="brand-logo">📚</span>
        <span class="brand-title">知识库管理台</span>
        <span class="brand-sub">RAGFlow Knowledge Base</span>
      </div>
      <nav class="console-nav">
        <router-link to="/console/datasets" class="nav-item" active-class="nav-active">数据集</router-link>
        <router-link to="/console/retrieval" class="nav-item" active-class="nav-active">召回测试</router-link>
        <router-link to="/home" class="nav-item nav-back">← 知识图谱</router-link>
      </nav>
    </header>
    <main class="console-main">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ConsoleLayout',
})
</script>

<style scoped>
.console {
  min-height: 100vh;
  background: #f1f5f9;
}

.console-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
}

.brand {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-logo {
  font-size: 20px;
}

.brand-title {
  font-size: 17px;
  font-weight: 700;
  color: #0f172a;
}

.brand-sub {
  font-size: 12px;
  color: #94a3b8;
}

.console-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-item {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 14px;
  color: #475569;
  text-decoration: none;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.nav-active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.nav-back {
  margin-left: 12px;
  color: #94a3b8;
}

.console-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
</style>
