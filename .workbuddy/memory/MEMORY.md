# 项目长期记忆：datav-vue（DataS 可视化编辑器）

包名 datav-vue，一个 DataV 风格的数据可视化拖拽编辑器（类阿里 DataV）。标题 DataS。

## 技术栈
- Vue 3.2 + TypeScript 4.4 + Vite 2.6（dev 端口 9090，构建输出 website/）
- Vue Router 4（hash 模式）+ Vuex 4（vuex-module-decorators 装饰器写法）
- UI：Element Plus + Naive UI + 自建 GUI 三套并存
- 图表：ECharts5 / vue-echarts / @kjgl77/datav-vue3 / flint-chart / wordcloud / three.js
- 地图：高德、百度、腾讯、OpenLayers、Bing、UE 底座（City3d 等）
- 其它：monaco-editor、x-data-spreadsheet、gsap、mockjs

## 关键架构（改东西必看）
- 可视化组件系统：新增组件必须同步改 3 文件：
  - src/components/index.ts（全局注册，V 前缀名如 VMainTitle）
  - src/components/datav.ts（createComponent 工厂，name.substr(1) 经 kebabCase 映到目录）
  - src/data/system-components.ts（组件面板清单：分类/名称/缩略图/used/visible）
  - 单组件目录约定 components/<category>/<kebab-name>/：index.ts + src/index.vue + src/<name>.ts（继承 DatavComponent/DatavEChartsComponent）+ config.vue + config.json（开发模式访问 #/dev/props-config 生成）
- 编辑器：入口 src/views/screen-editor/index-new.vue，核心由 EditorModule（Vuex）驱动；含图层面板、组件面板、配置面板、画布、滤镜管理
- 接口层：src/api/ + src/utils/request.ts（axios，地址从 viteEnv/ 取），mock 用 axios-mock-adapter（按模板 tplId===1 开关），api/data.ts 的 getStaticData 读 ./data/<path>.json
- 环境：viteEnv/ 下 .env* 统一 VITE_APP_ 前缀（development 默认服务 http://10.89.33.97:29021）
- 脚手架：plop（yarn new datav / yarn gc <name> / yarn new component|store|icons）

## 约定
- 路径别名 @ -> src；flint-chart 别名到 src/types/flint-chart
- tsconfig：experimentalDecorators:true，strict 关闭、noImplicitAny:false
- 跨组件通讯：mitter 事件总线 + window.ue.interface（对接 UE 底座）
- i18n：vue-i18n，目前仅登录页国际化
- 包管理器：项目用 yarn；本机无 yarn，启动用托管 node v22.22.2 直接跑 ./node_modules/.bin/vite
- Element Plus 在 main.ts 全局注册（import from '@/components/element-plus'），组件里直接用 el-* 标签，无需单独 import；el-tooltip 不生成额外 wrapper，包裹 flex 子项不会破坏布局
- AgentConfig（src/views/project/NetWork/AgentConfig.vue）技能库：必须保持单列布局，不要再改成两列/多列；卡片文字被截断时用 el-tooltip 悬停展示全文而非放开行数

## 启动命令（本机）
无 yarn 时：
export PATH="/c/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2:$PATH"
cd G:/project/dashboard && NODE_ENV=development ./node_modules/.bin/vite
等价 yarn dev，监听 9090。
