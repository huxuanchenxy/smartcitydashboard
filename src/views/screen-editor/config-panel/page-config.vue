<template>
  <div class="config-manager-page">
    <div class="config-manager-head">画面设置</div>
    <div class="config-manager-body">
      <div class="page-config">
        <div class="page-config-wp">
          <g-field label="屏幕大小" :is-flat="true">
            <g-input-number v-model="pageConfig.width" label="宽度" :min="0" :max="99999" inline @change="onSizeChange" />
            <g-input-number v-model="pageConfig.height" label="高度" :min="0" :max="99999" inline @change="onSizeChange" />
          </g-field>
          <g-field label="背景颜色">
            <g-color-picker v-model="pageConfig.bgcolor" />
          </g-field>
          <g-field label="背景图">
            <g-upload-image v-model="pageConfig.bgimage" />
          </g-field>
          <g-field label="重置">
            <n-button size="tiny" :focusable="false" @click="resetBGImage">
              恢复默认背景
            </n-button>
          </g-field>
        </div>

        <div class="page-config-wp">
          <g-field label="页面缩放方式">
            <n-radio-group v-model:value="pageConfig.zoomMode" name="zoomMode" size="small">
              <n-radio-button v-for="zm in zoomModes" :key="zm.value" :value="zm.value">
                <n-tooltip>
                  <template #trigger>
                    <n-icon>
                      <IconAdaptAuto v-if="zm.value === ZoomMode.auto" />
                      <IconAdaptWidth v-else-if="zm.value === ZoomMode.width" />
                      <IconAdaptHeight v-else-if="zm.value === ZoomMode.height" />
                      <IconFullscreen v-else-if="zm.value === ZoomMode.full" />
                      <IconAdaptAuto v-else-if="zm.value === ZoomMode.responsive" />
                      <IconStop v-else />
                    </n-icon>
                  </template>
                  {{ zm.label }}
                </n-tooltip>
              </n-radio-button>
            </n-radio-group>
          </g-field>
          <g-field label="栅格间距" tooltip="每次移动的距离，单位px">
            <g-input-number v-model="pageConfig.grid" :min="1" :max="20" suffix="px" />
          </g-field>
        </div>

        <div class="page-config-wp">
          <g-field label="缩略图">
            <n-upload abstract accept="image/*" :action="cover.uploadHost" :multiple="false" :show-file-list="false"
              :data="form" :headers="header" @before-upload="beforeUpload" @finish="finishUpload">
              <n-button-group>
                <n-button size="tiny" class="cover-btn" :focusable="false" @click="cutCover">
                  <n-spin v-if="cover.loading" :size="14" />
                  <template v-else>
                    截取封面
                  </template>
                </n-button>
                <n-upload-trigger #="{ handleClick }" abstract>
                  <n-button size="tiny" class="cover-btn" :focusable="false" @click="handleClick">
                    <n-spin v-if="uploadLoading" :size="14" />
                    <template v-else>
                      上传封面
                    </template>
                  </n-button>
                </n-upload-trigger>
              </n-button-group>
            </n-upload>
            <div class="screen-preview">
              <img v-if="pageConfig.screenshot" :src="pageConfig.screenshot">
              <img v-else :src="cover.img" style="object-fit: contain; opacity: 0.25; filter: grayscale(1);">
              <input readonly="true" class="screen-preview-paste" @paste="onPaste">
            </div>
            <span class="upload-tip">*选中封面，从剪贴板粘贴</span>
          </g-field>
          <g-field label="使用水印">
            <n-switch v-model:value="pageConfig.useWatermark" />
          </g-field>
        </div>
        <div class="page-config-wp">
          <g-field label="快捷配置">
            <n-button size="tiny" :focusable="false" @click="handleAddWs">
              添加默认通讯组件
            </n-button>
          </g-field>
        </div>
        <div v-if="false" class="page-config-wp">
          <g-field-collapse label="令牌设置" mode="layout" default-layout="horizontal"
            :features="['vertical', 'horizontal', 'copy', 'add', 'remove']" :list="pageConfig.tokenSettings" :min="1"
            :max="100" tab="令牌" :add-item="handleAddToken">
            <template #default="slotProps">
              <g-field :level="2" label="访问地址">
                <g-input v-model="slotProps.item.accessUrl" />
              </g-field>
              <g-field :level="2" label="登录地址">
                <g-input v-model="slotProps.item.loginUrl" />
              </g-field>
              <g-field :level="2" label="请求类型">
                <g-select v-model="slotProps.item.requestType"
                  :data="[{ id: 'get', value: 'GET' }, { id: 'post', value: 'POST' }]" />
              </g-field>
              <g-field :level="2" label="用户名关键字">
                <g-input v-model="slotProps.item.usernameKey" />
              </g-field>
              <g-field :level="2" label="用户名值">
                <g-input v-model="slotProps.item.usernameValue" />
              </g-field>
              <g-field :level="2" label="密码关键字">
                <g-input v-model="slotProps.item.passwordKey" />
              </g-field>
              <g-field :level="2" label="密码值">
                <g-input v-model="slotProps.item.passwordValue" />
              </g-field>
              <g-field :level="2" label="返回令牌路径">
                <g-input v-model="slotProps.item.tokenPath" />
              </g-field>
              <g-field :level="2" label="访问令牌关键字">
                <g-input v-model="slotProps.item.headerKey" />
              </g-field>
            </template>
          </g-field-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { defineComponent, ref, computed, h } from 'vue'
import { UploadFileInfo, useMessage, useDialog } from 'naive-ui'
import { globalConfig } from '@/config'
import { ToolbarModule } from '@/store/modules/toolbar'
import { EditorModule } from '@/store/modules/editor'
import { ZoomMode } from '@/utils/enums'
import html2canvas from 'html2canvas'
import { previewHost, validAllowImg, dataURLtoBlob, uploadCoverHost } from '@/utils/upload-util'
import { upload } from '@/api/qiniu'
import { getToken } from '@/utils/token-util'
import { generateId } from '@/utils/util'
import { IconFullscreen, IconAdaptAuto, IconAdaptWidth, IconAdaptHeight, IconStop, IconWarning } from '@/icons'
import { createComponent } from '@/components/datav';
import { TokenSetting } from '@/domains/editor'

export default defineComponent({
  name: 'PageConfig',
  components: {
    IconFullscreen,
    IconAdaptAuto,
    IconAdaptWidth,
    IconAdaptHeight,
    IconStop,
  },
  setup() {
    const nMessage = useMessage()
    const pageConfig = computed(() => EditorModule.pageConfig)
    const zoomModes = [
      { value: ZoomMode.auto, label: '全屏铺满' },
      { value: ZoomMode.width, label: '等比缩放宽度铺满' },
      { value: ZoomMode.height, label: '等比缩放高度铺满' },
      { value: ZoomMode.full, label: '等比缩放高度铺满（可滚动）' },
      { value: ZoomMode.responsive, label: '响应式铺满（内容自适应、不变形）' },
      { value: ZoomMode.disabled, label: '不缩放' },
    ]

    const cover = ref({
      loading: false,
      img: globalConfig.logo,
      uploadHost: uploadCoverHost,
    })
    const uploadLoading = ref(false)
    const form = ref({
      key: '',
    })

    const header = ref({
      token: '',
    })

    const resetBGImage = () => {
      /*      pageConfig.value.bgimage = `${cdn}/datav/bj.png`*/
      pageConfig.value.bgimage = `data/originPic/bj.png`
    }

    const uploadCover = async (blob: Blob) => {
      try {
        ToolbarModule.addLoading()
        const token = getToken() //await getTokenByEnv()
        const formData = new FormData()
        const fileName = `${generateId()}_screenshot.png`
        formData.append('file', blob, fileName)
        //formData.append('token', token)
        formData.append('key', `upload/${fileName}`)

        //const res = await upload(uploadHost, formData,{ headers:{ token:token } })
        const res = await upload(uploadCoverHost, formData, { headers: { token: token } })
        if (res) {
          pageConfig.value.screenshot = `${previewHost}?imageName=${res.data.data}`
        }
      } catch (error) {
        throw error
      } finally {
        ToolbarModule.removeLoading()
      }
    }

    const cutCover = async () => {
      const dom = document.getElementById('canvas-coms')
      if (!dom || cover.value.loading) {
        return
      }

      // 这里直接操作的 dom
      const { transform } = dom.style
      dom.style.transform = 'scale(1) translate(0px, 0px)'
      cover.value.loading = true
      setTimeout(async () => {
        try {
          const res = await html2canvas(dom, {
            scale: 1.2,
            logging: false,
            useCORS: true,
            backgroundColor: null,
            scrollX: 0,
            scrollY: 0,
          })

          dom.style.transform = transform
          await uploadCover(dataURLtoBlob(res.toDataURL('image/jpeg', 0.8)))
        } catch (error) {
          nMessage.error(error.toString())
        } finally {
          cover.value.loading = false
        }
      }, 500)
    }

    const beforeUpload = async (options: { file: UploadFileInfo; event: Event; }) => {
      const valid = validAllowImg(options.file.file, {})

      if (valid) {
        nMessage.error(valid)
        return false
      }

      try {
        ToolbarModule.addLoading()
        uploadLoading.value = true
        //form.value.token = await getTokenByEnv()
        form.value.key = `upload/${generateId()}_${options.file.name}`
        header.value.token = getToken()
        return true
      } catch (error) {
        ToolbarModule.removeLoading()
        uploadLoading.value = false
        nMessage.error(error.toString())
      }

      return false
    }

    const finishUpload = (options: { file: UploadFileInfo; event: Event; }) => {
      ToolbarModule.removeLoading()
      uploadLoading.value = false

      const res = JSON.parse((options.event.target as XMLHttpRequest).response)
      if (res.error) {
        nMessage.error(res.error)
      } else {
        pageConfig.value.screenshot = `${previewHost}?imageName=${res.data}`
      }
    }

    const onPaste = async (ev: ClipboardEvent) => {
      if (ev.type === 'paste' && ev.clipboardData) {
        try {
          const item = ev.clipboardData.items[0]
          if (item && item.type.includes('image')) {
            const file = item.getAsFile()
            if (file) {
              await uploadCover(file)
            }
          }
        } catch (error) {
          nMessage.error(error.toString())
        }
      }
    }

    const onSizeChange = () => {
      EditorModule.autoCanvasScale(() => ({
        offsetX: ToolbarModule.getPanelOffsetX,
        offsetY: ToolbarModule.getPanelOffsetY,
      }))
    }

    const handleAddToken = () => {
      return new TokenSetting()
    }

    const nDialog = useDialog()

    const handleAddWs = async () => {
      const d = nDialog.create({
        content: `添加默认配置的通讯组件？`,
        negativeText: '取消',
        negativeButtonProps: {
          round: true,
          ghost:true,
          color:'#7E7E7E',
          focusable:false,
        },
        positiveText: '确定',
        positiveButtonProps:{
          round: true,
          color:'#0647a1',
        },
        iconPlacement: 'top',
        autoFocus: false,
        icon: () => h(IconWarning),
        onPositiveClick: async () => {
          d.loading = true
          try {
            let wsControl = EditorModule.coms.find(r => r.alias === 'WsControl');
            if (!wsControl) {
              const { pageConfig } = EditorModule
              wsControl = await createComponent('VWsControl')
              wsControl.attr.x = 0
              wsControl.attr.y = pageConfig.height
              wsControl.projectId = EditorModule.screen.id
              wsControl.hided = true
              await EditorModule.addCom(wsControl)
            }
            else {
              nMessage.error('已存在通讯组件，请手动更改配置');
            }
          } catch (error) {
            nMessage.error(error.message)
          }
        },
      })
    }

    return {
      ZoomMode,
      pageConfig,
      zoomModes,
      cover,
      uploadLoading,
      form,
      header,
      resetBGImage,
      cutCover,
      beforeUpload,
      finishUpload,
      onPaste,
      onSizeChange,
      handleAddToken,
      handleAddWs
    }
  },
})
</script>

<style lang="scss" scoped>
.config-manager-page {
  height: 100%;
  background: var(--datav-left-nav-bg);
  user-select: none;

  .config-manager-head {
    width: 100%;
    height: 30px;
    font-size: 12px;
    line-height: 30px;
    text-align: center;
    color: var(--datav-font-color);
    background: var(--datav-layer-bg);
    user-select: none;
    border-top: 1px solid #d8d8d8;
  }

  .config-manager-body {
    width: 100%;
    height: 100%;
    padding-top: 36px;
    margin-top: -36px;
  }
}

.page-config {
  position: relative;
  height: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  font-size: 12px;
  color: var(--datav-gui-font-color-1);
  background: #FFF;
}

.page-config-wp {
  position: relative;

  &:not(:last-child)::after {
    position: absolute;
    bottom: 1px;
    left: 6%;
    width: 91%;
    height: 1px;
    background: var(--datav-dark-color);
    content: '';
  }
}

.cover-btn {
  width: 96px;
}

.screen-preview {
  position: relative;
  width: 192px;
  height: 108px;
  margin-top: 8px;

  img {
    width: 100%;
    height: 100%;
  }

  .screen-preview-paste {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: 0 0;
    border: var(--datav-outline);
    transition: border-color 0.2s;

    &:hover {
      border-color: var(--datav-main-color);
    }
  }
}

.upload-tip {
  color: var(--datav-gui-font-color-description);
  margin-top: 4px;
  display: -webkit-box;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
