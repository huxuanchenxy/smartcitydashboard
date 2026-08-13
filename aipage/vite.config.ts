import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { resolve } from 'path'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  // 开发与生产统一 /aipage/ 前缀：
  // - 独立运行：http://localhost:9091/aipage/
  // - dashboard 开发态代理：dashboard /aipage/* -> http://localhost:9091/aipage/*（不 rewrite）
  // - 生产 Nginx：location /aipage/ alias 到本项目构建产物
  base: '/aipage/',
  plugins: [
    vue(),
  ],
  server: {
    host: '0.0.0.0',
    port: 9091,
  },
  resolve: {
    alias: {
      '@': pathResolve('./src'),
    },
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
})
