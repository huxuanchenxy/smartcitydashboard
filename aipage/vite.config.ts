import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { resolve } from 'path'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig({
  // aipage 作为独立站点部署，独占域名/端口，使用根路径：
  // - 独立运行：http://localhost:9091/#/home
  // - 生产部署：站点根路径直接放构建产物
  base: '/',
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
