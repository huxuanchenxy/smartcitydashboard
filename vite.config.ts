import type { ConfigEnv } from 'vite'
import { loadEnv, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import plainText from 'vite-plugin-plain-text'

import { resolve } from 'path'

import monacoEditorPlugin from 'vite-plugin-monaco-editor'

function pathResolve(dir: string) {
  return resolve(process.cwd(), '.', dir)
}

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv) => {
  const dirRoot = process.cwd()

  const env = loadEnv(mode, dirRoot)

  return defineConfig({
    envDir: './viteEnv',
    base: './',//env.VITE_PUBLIC_PATH,
    plugins: [
      vue(),
      plainText(/\.hbs$/),
      monacoEditorPlugin({}),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `$--color-primary: #005497;`,
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 9090,
      //https: true,
    },
    resolve: {
      alias: {
        '@': pathResolve('./src'),
        'vue-i18n': pathResolve('./node_modules/vue-i18n/dist/vue-i18n.cjs.js'),
        'vue': pathResolve('./node_modules/vue')
      },
    },
    define: {
      // setting vue-i18-next
      // Suppress warning
      __INTLIFY_PROD_DEVTOOLS__: false,
      __DEV__: process.env.NODE_ENV !== 'production',
    },
    optimizeDeps: {
      include: [
        'accounting',
        'axios',
        'axios-mock-adapter',
        'crypto-js',
        'dayjs',
        'echarts',
        'element-plus',
        'gsap',
        'html2canvas',
        'js-cookie',
        'lodash-es',
        'mockjs',
        'monaco-editor',
        'particles.vue3',
        'shortid',
        'vue',
        'vue-i18n',
        'vue-router',
        'vuex',
        'vuex-module-decorators',
      ],
      exclude: [],
    },
    build: {
      sourcemap: false,
      outDir: 'website',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          share: resolve(__dirname, 'share/index.html'),
        },
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'vuex'],
            'vendor-echarts': ['echarts'],
            'vendor-monaco': ['monaco-editor'],
            'vendor-three': ['three'],
            'vendor-ui': ['element-plus', 'naive-ui'],
          },
        },
      },
    },
    esbuild: {
    },
  })
}
