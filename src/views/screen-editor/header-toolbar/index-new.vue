<template>
  <div class="datav-header">
    <div class="datav-edit-left">
      <div class="datav-edit-logo">
        <div class="logo-img"></div>
      </div>
      <div class="datav-edit-title">
        <span class="title">画面编辑</span>
      </div>
    </div>
    <div class="datav-edit-right">
      <div class="datav-cavans-toolbar">
        <div class="datav-toolbar-left">
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4', { '--selected': components }]" @click="changeComponentsPanel">
                <n-icon class="head-btn-icon" :class="{ '--rotate': !components }">
                  <IconBox />
                </n-icon>
              </div>
            </template>
            组件列表
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4', { '--selected': layer }]" @click="changeLayerPanel">
                <n-icon class="head-btn-icon">
                  <IconLayer />
                </n-icon>
              </div>
            </template>
            图层
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4', { '--selected': config }]" @click="changeConfigPanel">
                <n-icon class="head-btn-icon">
                  <IconRpanel />
                </n-icon>
              </div>
            </template>
            右侧面板
          </n-tooltip>
          <div class="divider"></div>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="leftJustifying">
                <n-icon class="head-btn-icon">
                  <IconLeft />
                </n-icon>
              </div>
            </template>
            左对齐
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="centerJustifying">
                <n-icon class="head-btn-icon">
                  <IconCenter />
                </n-icon>
              </div>
            </template>
            居中对齐
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="rightJustifying">
                <n-icon class="head-btn-icon">
                  <IconRight />
                </n-icon>
              </div>
            </template>
            右对齐
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="topJustifying">
                <n-icon class="head-btn-icon">
                  <IconTop />
                </n-icon>
              </div>
            </template>
            顶部对齐
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="middleJustifying">
                <n-icon class="head-btn-icon">
                  <IconMiddle />
                </n-icon>
              </div>
            </template>
            中心对齐
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="bottomJustifying">
                <n-icon class="head-btn-icon">
                  <IconBottom />
                </n-icon>
              </div>
            </template>
            底部对齐
          </n-tooltip>
          <div class="divider"></div>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4', { '--selected': toolbox }]" @click="changeToolboxPanel">
                <n-icon class="head-btn-icon">
                  <IconToolbox />
                </n-icon>
              </div>
            </template>
            工具箱
          </n-tooltip>
          <toolbox-panel />
        </div>
        <div class="datav-toolbar-middle" v-if="!toolbox">
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="changeToolboxPanel">
                <n-icon class="head-btn-icon">
                  <IconBl />
                </n-icon>
              </div>
            </template>
            变量
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="changeToolboxPanel">
                <n-icon class="head-btn-icon">
                  <IconBj />
                </n-icon>
              </div>
            </template>
            告警
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="changeFormulaPanel">
                <n-icon class="head-btn-icon">
                  <IconPf2 />
                </n-icon>
              </div>
            </template>
            配方
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div :class="['head-btn mr4']" @click="changeDevicePanel">
                <n-icon class="head-btn-icon">
                  <IconSbzt />
                </n-icon>
              </div>
            </template>
            设备状态
          </n-tooltip>
          <div class="divider"></div>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4">
                <n-upload :show-file-list="false" :action="uploadSetting.url" :headers="uploadSetting.headers"
                  @finish="importComponents">
                  <n-icon class="head-btn-icon">
                    <IconAppend />
                  </n-icon>
                </n-upload>
              </div>
            </template>
            追加屏幕
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4">
                <n-upload :show-file-list="false" :action="uploadSetting.url" :headers="uploadSetting.headers"
                  @finish="importScreen">
                  <n-icon class="head-btn-icon">
                    <IconImport />
                  </n-icon>
                </n-upload>
              </div>
            </template>
            导入
          </n-tooltip>
          
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="exportScreen">
                <n-icon class="head-btn-icon">
                  <IconExport />
                </n-icon>
              </div>
            </template>
            导出
          </n-tooltip>
          <div class="divider"></div>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="openDifyApiDialog">
                <n-icon class="head-btn-icon">
                  <IconAi />
                </n-icon>
              </div>
            </template>
            AI助手
          </n-tooltip>
        </div>
        <div class="datav-toolbar-right">

          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="saveScreen">
                <n-icon class="head-btn-icon">
                  <IconSave />
                </n-icon>
              </div>
            </template>
            保存
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="goSnapshot">
                <n-icon class="head-btn-icon">
                  <IconSnapshot />
                </n-icon>
              </div>
            </template>
            生成快照
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="goPublish">
                <n-icon class="head-btn-icon">
                  <IconRelease />
                </n-icon>
              </div>
            </template>
            发布
          </n-tooltip>
          <n-tooltip :delay="500">
            <template #trigger>
              <div class="head-btn ml4" @click="goPreview">
                <n-icon class="head-btn-icon">
                  <IconPreview />
                </n-icon>
              </div>
            </template>
            预览
          </n-tooltip>
        </div>
      </div>
      <div class="datav-cavans-name">
        <span>智慧楼宇</span>
      </div>
    </div>
  </div>
  <head-loading />
  <publish-screen v-model="visiblePublish" :project-id="publishAppId" />
  <snapshot v-model="visibleSnapshot" :project-id="snapshotAppId" />
  <formula />
  <device/>
  
  <!-- Dify API 聊天机器人弹框 -->
  <DifyApiDialog
    v-model:visible="difyApiDialogVisible"
    :data="difyData"
    @close="handleDifyApiDialogClose"
    @message-received="handleDifyApiMessageReceived"
    @message-sent="handleDifyApiMessageSent"
  />
</template>

<script lang="ts">
import { computed, defineComponent, provide, ref } from 'vue'
import {
  UploadCustomRequestOptions,
  UploadFileInfo,
  useMessage,
} from 'naive-ui'
import { PanelType, ToolbarModule } from '@/store/modules/toolbar'
import { EditorModule } from '@/store/modules/editor'
import {
  IconEditorCanvas, IconBox, IconRpanel, IconToolbox, IconFilter, IconWorkspace, IconSnapshot, IconLayer, IconRelease, IconPreview, IconSave, IconExport,
  IconImport, IconAppend, IconFormula, IconLeft, IconCenter, IconRight, IconTop, IconMiddle, IconBottom, IconBl, IconPf2, IconBj,IconSbzt, IconAi
} from '@/icons'
import HeadLoading from './head-loading.vue'
import Snapshot from '../../my-project/Snapshot.vue'
import PublishScreen from '../../my-project/publish.vue'
import Formula from '../../screen-editor/formula-panel/index.vue'
import Device from '../../screen-editor/device-panel/index.vue'
import DifyApiDialog from '@/components/dify-chatbot/DifyApiDialog.vue'
import * as configImagePropJson from '@/../public/templates/configImageProp.json'
import {
  configImagePropModel,
  configImagePropModelAttribute,
  exportImageListModel,
} from '@/components/configImagePropModel'

import request from '@/utils/request'
import { getApiUrl } from '@/utils/apiUrl'

import { saveAs } from 'file-saver'
import { getisIframe, getToken } from '@/utils/token-util'
import { loadAsyncComponent } from '@/utils/async-component'

export default defineComponent({
  name: 'HeaderToolber',
  components: {
    HeadLoading,
    PublishScreen,
    Snapshot,
    Formula,
    Device,
    DifyApiDialog,
    IconEditorCanvas, IconBox, IconRpanel, IconToolbox, IconFilter, IconWorkspace, IconSnapshot, IconLayer, IconRelease, IconPreview,
    IconSave, IconExport, IconImport, IconAppend, IconFormula, IconLeft, IconCenter, IconRight, IconTop, IconMiddle, IconBottom, IconBl, IconPf2, IconBj,IconSbzt, IconAi,
    ToolboxPanel: loadAsyncComponent(() => import('../toolbox-panel/index-new.vue')),
  },
  setup() {
    const nMessage = useMessage()

    const selectedComs = computed(() => EditorModule.selectedComs)

    const visibleSnapshot = ref(false)
    const visiblePublish = ref(false)
    const visibleFormula = ref(false);
    
    // Dify API 聊天机器人相关状态
    const difyApiDialogVisible = ref(false)
    const difyData = ref({})
    const closeFormula = () => {
      visibleFormula.value = false;
    };
    const closeSnapshot = () => {
      visibleSnapshot.value = false
    }

    const closePublish = () => {
      visiblePublish.value = false
    }

    provide('closeSnapshot', closeSnapshot)
    provide('closePublish', closePublish)
    provide('closeFormula', closeFormula)

    const uploadSetting = ref({
      url: getApiUrl('dashboard/screen/projectImport'),
      headers: { token: getToken() },
    })

    const importScreen = ({
      file,
      event,
    }: {
      file: UploadFileInfo
      event?: ProgressEvent
    }) => {
      const model = JSON.parse((event?.target as XMLHttpRequest).response)
      const project = model.data.project
      const imageList = model.data.imageList as exportImageListModel[]

      const configImageProp =
        configImagePropJson.default as unknown as configImagePropModel[]

      project.coms.forEach(com => {
        let image = imageList.find(r => r.comId == com.id)

        if (image) {
          let setting = configImageProp.find(r => r.ComName == com.name)
          if (setting) {
            setting.Attributes.forEach(
              (attr: configImagePropModelAttribute) => {
                let proplist = attr.path.split('.')
                let imageProp = com.config

                for (let i = 0; i < proplist.length - 1; i++) {
                  imageProp = imageProp[proplist[i]]
                }

                imageProp[proplist[proplist.length - 1]] = getApiUrl(
                  `${import.meta.env.VITE_APP_QINIU_IMAGE}?imageName=${image.newId
                  }`,
                )
              },
            )
          }
        }
      })

      EditorModule.loadScreenFromModel({
        model: project,
        projectId: EditorModule.screen.id,
        name: EditorModule.screen.name,
      })
    }

    const importComponents = ({
      file,
      event,
    }: {
      file: UploadFileInfo
      event?: ProgressEvent
    }) => {
      const model = JSON.parse((event?.target as XMLHttpRequest).response)
      const project = model.data.project
      const imageList = model.data.imageList as exportImageListModel[]

      const configImageProp =
        configImagePropJson.default as unknown as configImagePropModel[]

      project.coms.forEach(com => {
        let image = imageList.find(r => r.comId == com.id)

        if (image) {
          let setting = configImageProp.find(r => r.ComName == com.name)
          if (setting) {
            setting.Attributes.forEach(
              (attr: configImagePropModelAttribute) => {
                let proplist = attr.path.split('.')
                let imageProp = com.config

                for (let i = 0; i < proplist.length - 1; i++) {
                  imageProp = imageProp[proplist[i]]
                }

                imageProp[proplist[proplist.length - 1]] = getApiUrl(
                  `${import.meta.env.VITE_APP_QINIU_IMAGE}?imageName=${image.newId
                  }`,
                )
              },
            )
          }
        }
      })

      EditorModule.appendEditorOption({
        coms: project.coms,
      })
    }

    const leftJustifying = () => {
      let minLeft = EditorModule.canvas.width;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.x = EditorModule.refCom.attr.x;
          }
          else {
            if (minLeft > com.attr.x) {
              minLeft = com.attr.x;
            }
          }
        })
      }
      if (minLeft != EditorModule.canvas.width) {
        selectedComs.value.forEach((com) => {
          com.attr.x = minLeft;
        })
      }
    }

    const centerJustifying = () => {
      let minCenter = 0;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.x = EditorModule.refCom.attr.x + Math.round(EditorModule.refCom.attr.w / 2) - Math.round(com.attr.w / 2);
          }
          else {
            if (minCenter < com.attr.x + Math.round(com.attr.w / 2)) {
              minCenter = com.attr.x + Math.round(com.attr.w / 2);
            }
          }
        })
      }
      if (minCenter != 0) {
        selectedComs.value.forEach((com) => {
          com.attr.x = minCenter - Math.round(com.attr.w / 2);
        })
      }
    }

    const rightJustifying = () => {

      let minRight = 0;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.x = EditorModule.refCom.attr.x + EditorModule.refCom.attr.w - com.attr.w;
          }
          else {
            if (minRight < com.attr.x + com.attr.w) {
              minRight = com.attr.x + com.attr.w;
            }
          }
        })
      }
      if (minRight != 0) {
        selectedComs.value.forEach((com) => {
          com.attr.x = minRight - com.attr.w;
        })
      }
    }

    const topJustifying = () => {
      let minTop = EditorModule.canvas.height;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.y = EditorModule.refCom.attr.y;
          }
          else {
            if (minTop > com.attr.y) {
              minTop = com.attr.y;
            }
          }
        })
      }
      if (minTop != EditorModule.canvas.height) {
        selectedComs.value.forEach((com) => {
          com.attr.y = minTop;
        })
      }
    }

    const middleJustifying = () => {

      let minMiddle = EditorModule.canvas.height;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.y = EditorModule.refCom.attr.y + Math.round(EditorModule.refCom.attr.h / 2) - Math.round(com.attr.h / 2);
          }
          else {
            if (minMiddle > com.attr.y + Math.round(com.attr.h / 2)) {
              minMiddle = com.attr.y + Math.round(com.attr.h / 2);
            }
          }
        })
      }
      if (minMiddle != EditorModule.canvas.height) {
        selectedComs.value.forEach((com) => {
          com.attr.y = minMiddle - Math.round(com.attr.h / 2);
        })
      }

    }

    const bottomJustifying = () => {
      let minBottom = 0;
      if (selectedComs.value.length > 1) {
        selectedComs.value.forEach((com, idx) => {
          if (EditorModule.refCom) {
            com.attr.y = EditorModule.refCom.attr.y + EditorModule.refCom.attr.h - com.attr.h;
          }
          else {
            if (minBottom < com.attr.y + com.attr.h) {
              minBottom = com.attr.y + com.attr.h;
            }
          }
        })
      }
      if (minBottom != 0) {
        selectedComs.value.forEach((com) => {
          com.attr.y = minBottom - com.attr.h;
        })
      }
    }

    // 打开 Dify API 聊天机器人弹框
    const openDifyApiDialog = () => {
      console.log('Opening Dify API dialog...');
      difyApiDialogVisible.value = true;
      console.log('Dify API dialog visible set to true');
    };
    
    // 处理 Dify API 聊天机器人关闭事件
    const handleDifyApiDialogClose = () => {
      console.log('Dify API dialog closed');
    };
    
    // 处理从 Dify API 聊天机器人接收消息
    const handleDifyApiMessageReceived = (data) => {
      console.log('Message received from Dify API:', data);
      nMessage.success('收到来自 Dify API 的消息');
    };
    
    // 处理向 Dify API 聊天机器人发送消息
    const handleDifyApiMessageSent = (data) => {
      console.log('Message sent to Dify API:', data);
      nMessage.success('消息已发送到 Dify API');
    };

    return {
      visibleSnapshot,
      visiblePublish,
      closeSnapshot,
      closePublish,
      //customRequest,
      uploadSetting,
      importScreen,
      importComponents,
      visibleFormula,
      closeFormula,
      leftJustifying,
      centerJustifying,
      rightJustifying,
      topJustifying,
      middleJustifying,
      bottomJustifying,
      nMessage,
      // Dify API 聊天机器人相关
      difyApiDialogVisible,
      difyData,
      openDifyApiDialog,
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
      // hideModal,
    }
  },
  data() {
    return {
      //visiblePublish: false,
      //visibleSnapshot: false,
      visibleFormula: false,
      publishAppId: 0,
      snapshotAppId: 0,
      nMessage: useMessage(),
    }
  },
  computed: {
    screen() {
      return EditorModule.screen
    },
    layer() {
      return ToolbarModule.layer.show
    },
    components() {
      return ToolbarModule.components.show
    },
    config() {
      return ToolbarModule.config.show
    },
    toolbox() {
      return ToolbarModule.toolbox.show
    },
    filter() {
      return ToolbarModule.filter.show
    },
    formula() {
      return ToolbarModule.formula.show
    },
    device(){
      return ToolbarModule.device.show
    }
  },
  methods: {
    changeLayerPanel() {
      ToolbarModule.setPanelState({
        type: PanelType.layer,
        value: !this.layer,
      })
    },
    changeComponentsPanel() {
      ToolbarModule.setPanelState({
        type: PanelType.components,
        value: !this.components,
      })
    },
    changeConfigPanel() {
      ToolbarModule.setPanelState({
        type: PanelType.config,
        value: !this.config,
      })
    },
    changeToolboxPanel() {
      ToolbarModule.setPanelState({
        type: PanelType.toolbox,
        value: !this.toolbox,
      })
    },
    changeFilterPanel() {
      ToolbarModule.filter.show = !this.filter
    },
    changeFormulaPanel() {
      ToolbarModule.formula.show = !this.formula
    },
    changeDevicePanel(){
      ToolbarModule.device.show = !this.device
    },
    goHome() {
      const route = this.$router.resolve('/')
      window.open(route.href, '_blank', 'noopener=yes,noreferrer=yes')
    },
    goPublish() {
      this.visiblePublish = true
      this.publishAppId = this.screen.id
    },
    goSnapshot() {
      this.visibleSnapshot = true
      this.snapshotAppId = this.screen.id
    },

    async saveScreen() {
      ToolbarModule.addLoading()
      try {
        await EditorModule.saveScreen()
        this.nMessage.success('应用已保存')
      } catch (error) {
        this.nMessage.error(`保存应用失败：${error}`)
      } finally {
        ToolbarModule.removeLoading()
      }
    },
    async exportScreen() {
      const data = EditorModule.getScreenData
      const configImageProp =
        configImagePropJson.default as unknown as configImagePropModel[]

      const imageList: exportImageListModel[] = []
      data.coms.forEach(com => {
        let imageConfig = configImageProp.find(r => r.ComName == com.name)
        let comConfig = com.config
        if (imageConfig) {
          imageConfig.Attributes.forEach(detail => {
            let attrList = detail.path.split('.')
            let configAttr = comConfig[attrList[0]]
            for (let i = 1; i < attrList.length; i++) {
              configAttr = configAttr[attrList[i]]
            }

            const url = configAttr as string
            if (url && url.indexOf('data/originPic') < 0) {
              let fromInternet =
                url.indexOf(
                  `${import.meta.env.VITE_APP_QINIU_IMAGE}?imageName=`,
                ) < 0
              let imageUrl = null
              let imageId = null
              if (fromInternet) {
                imageUrl = url
              } else {
                imageId = url.split(
                  `${import.meta.env.VITE_APP_QINIU_IMAGE}?imageName=`,
                )[1]
              }

              imageList.push({
                comId: com.id,
                attrIndex: detail.index,
                fromInternet: fromInternet,
                imageId: imageId,
                imageUrl: imageUrl,
                newId: null,
              })
            }
          })
        }
      })

      ToolbarModule.addLoading()
      const requestData = { projectId: this.screen.id, data: imageList }
      //console.log('exportScreen urls',imageList,JSON.stringify(requestData))
      EditorModule.saveScreen()
        .then(() => {
          request
            .post(getApiUrl('dashboard/screen/projectExport'), requestData, {
              responseType: 'blob',
            })
            .then(res => {
              const blob = new Blob([res.data])
              saveAs(blob, `大屏-${this.screen.name}.zip`)
            })
            .catch(error => {
              if (error.message) {
                this.nMessage.error(error.message)
              }

              if (error.data.message) {
                this.nMessage.error(error.data.message)
              }
            })
            .finally(() => {
              ToolbarModule.removeLoading()
            })
        })
        .catch(error => {
          if (error.message) {
            this.nMessage.error(error.message)
          }

          if (error.data.message) {
            this.nMessage.error(error.data.message)
          }
          ToolbarModule.removeLoading()
        })
      // .finally(() => {
      //   ToolbarModule.removeLoading()
      // })

      //const blob = new Blob([JSON.stringify(data)])
      //saveAs(blob,'screen.json')
    },
    async goPreview() {
      await this.saveScreen()

      let isIframe = getisIframe()

      let route;

      if (isIframe && isIframe == 'iframe') {
        route = this.$router.resolve({
          name: 'Preview',
          params: {
            screenId: this.screen.id,
            token: getToken()
          },
        })
      }
      else {
        route = this.$router.resolve({
          name: 'Preview',
          params: {
            screenId: this.screen.id,
          },
        })
      }
      const a = document.createElement('a')
      a.rel = 'noopener, noreferrer'
      a.href = route.href
      a.target = '_blank'
      a.click()
    },
  },
})
</script>

<style lang="scss" scoped>
.datav-header {
  position: relative;
  height: 98px;
  padding-right: 8px;
  display: flex;
  z-index: 100;
  align-items: center;
  user-select: none;
  color: var(--datav-gui-font-color-base);
  //border-bottom: var(--datav-border-dark);
  background: #fff;

  .datav-edit-left {
    width: 360px;
    height: 98px;
    display: flex;
    align-items: center;
    justify-content: center;

    .datav-edit-logo {
      width: 98px;
      height: 98px;
      display: flex;
      align-items: center;
      justify-content: center;

      .logo-img {
        width: 72px;
        height: 72px;
        background-size: cover;
        background-position: center;
        background-image: url('../images/logo_icon.png');
        cursor: pointer;
      }
    }

    .datav-edit-title {
      width: 262px;
      height: 98px;
      display: flex;
      align-items: center;
      background-color: #F0F4FD;

      .title {
        font-size: 24px;
        font-weight: 400;
        color: #444444;
        font-family: '思源黑体Normal';
        margin: 34px;
      }
    }
  }

  .datav-edit-right {
    flex-grow: 1;
    height: 98px;
    display: flex;
    flex-direction: column;

    .datav-cavans-toolbar {
      width: 100%;
      height: 49px;
      display: flex;
      flex-direction: row;

      .datav-toolbar-left {
        min-width: 400px;
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        padding-left: 42px;
      }

      .datav-toolbar-middle {
        min-width: 400px;
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        padding-right: 42px;
      }

      .datav-toolbar-right {
        width: 267px;
        height: 49px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: flex-end;
        //padding-right: 42px;
      }

      .divider {
        width: 1px;
        height: 20px;
        margin: 0 5px;
        background-color: #7E7E7E;
      }
    }

    .datav-cavans-name {
      width: 100%;
      height: 49px;
      padding-right: 267px;
      display: flex;
      align-items: center;
      justify-content: center;

      span {
        font-size: 24px;
        font-weight: 400;
        color: #7E7E7E;
        font-family: '思源黑体Normal';
      }
    }
  }
}

.head-btn {
  width: 32px;
  height: 32px;
  line-height: 32px;
  padding: 4px;
  text-align: center;
  cursor: pointer;
  border-radius: 6px;
  transition: 0.2s;
  margin: 0 5px;

  .head-btn-icon {
    color: #7E7E7E;
    font-size: 20px;

    &:not(:first-child) {
      border-left: 1px solid rgba(255, 235, 235, 0.1);
    }
  }

  &:not(.--disabled):hover {
    background: #BEE2FF;

    .head-btn-icon {
      color: #FFFFFF
    }
  }

  &.--selected {
    background: #0E62A9;

    .head-btn-icon {
      color: #FFFFFF
    }

    &+.head-btn {
      border-left-color: transparent;
    }

    &:not(.--disabled):hover {
      //background: var(--datav-main-color)
      background: #0E62A9;


    }
  }

  &.--disabled {
    cursor: not-allowed;

    .head-btn-icon {
      opacity: 0.2;
    }
  }
}

.head-btn-group {
  display: flex;
  box-sizing: border-box;
  background: #1d1e1f;
  border: 1px solid rgba(255, 235, 235, 0.1);
  box-shadow: 0 0 0 1px #181818;

  .head-btn {
    width: 45px;
    border-radius: 0;
    box-shadow: none;
    height: 22px;
    line-height: 24px;
    border-left: 1px solid transparent;
  }
}

.datav-edit-header {
  width: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  height: 40px;
  z-index: 100;

  .editor-header-wp {
    display: flex;
    overflow: hidden;
    transition: width 0.3s ease;
  }

  .editor-config {
    display: flex;
    width: 300px;
    align-items: center;
    transition: 0.3s ease;
  }

  .drawer-actions {
    width: 90px;
    height: 40px;
    display: flex;
    align-items: center;
  }

  .com-list-icon {
    display: inline-block;
    font-size: 14px;
    color: #fff;

    &.--rotate {
      animation: com-rotate 2s infinite;
      animation-direction: alternate-reverse;
    }
  }

  .screen-info {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    text-align: center;
    cursor: default;
    font-size: 14px;
    max-width: 500px;
    color: var(--datav-gui-font-color-base);
    line-height: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .workspace-icon {
      margin-right: 8px;
      font-size: 14px;
      cursor: pointer;
    }
  }

  .global-actions {
    position: absolute;
    top: 0;
    right: 8px;
    width: 300px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 40px;
  }

  .full-a {
    display: block;
    width: 100%;
    height: 100%;
    text-decoration: none;
  }

  .ml4 {
    margin-left: 4px;
  }

  .mr4 {
    margin-right: 4px;
  }
}

@keyframes com-rotate {
  0% {
    transform: rotateZ(0);
  }

  100% {
    transform: rotateZ(360deg);
  }
}
</style>
