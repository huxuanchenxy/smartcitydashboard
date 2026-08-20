import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

import { resolve } from 'path'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
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
      proxy: {
        // RAGFlow 知识图谱接口同源代理，规避浏览器 CORS 限制；
        // 生产部署需 nginx 配置等价 location /ragflow-api/ { proxy_pass <VITE_APP_RAGFLOW_HOST>/; }
        '/ragflow-api': {
          target: env.VITE_APP_RAGFLOW_HOST || 'http://10.89.34.200:8888',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ragflow-api/, ''),
        },
        // IC 后端（用户/权限体系，与 dashboard 共用）同源代理，规避 CORS；
        // 生产部署需 nginx 配置等价 location /device/ { proxy_pass http://<IC_HOST>:<IC_PORT>/device/; }
        '/device': {
          target: env.VITE_APP_IC_HOST
            ? `http://${env.VITE_APP_IC_HOST}:${env.VITE_APP_IC_PORT || '39100'}`
            : 'http://10.89.33.97:39100',
          changeOrigin: true,
        },
      },
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
  }
})
