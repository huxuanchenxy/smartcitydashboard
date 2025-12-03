<template>
  <div
    class="datav-gui g-upload"
    :class="[
      {
        '--inline --single': !!inline,
      }
    ]"
  >
    <n-spin :show="loading">
      <div class="g-upload-image-wrap" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div class="g-upload-image-content">
          <img v-if="ShowEmptyImage" :src="currentThumbnail">
          <div v-else class="g-upload-tip" style="text-align: center;">
            <n-icon size="60">
              <IconImg />
            </n-icon>
          </div>
        </div>
        <div v-show="visibleCover" class="g-upload-image-cover">
          <n-popover
            v-model:show="visible"
            :placement="'left'"
            trigger="click"
            :width="350"
            :show-arrow="false"
            class="g-select-image-popover"
            :style="{
              '--color': 'var(--datav-gui-bgcolor-back)'
            }"
          >
            <template #trigger>
              <span @click.stop="syncUploadImages()">选择</span>
            </template>
            <div class="g-select-image-dropdown-menu-wrap">
              <ul class="g-select-image-dropdown-menu">
                <template v-if="models && models.length > 0">
                  <li
                    v-for="model in models"
                    :key="model.id"
                    class="g-select-image-dropdown-menu-item"
                    @click="onSelectImg(model)"
                  >
                    <img :src="model.thumbnail" class="g-select-image-img">
                    <span>{{ model.fileName }}</span>
                  </li>
                </template>
                <li v-else class="g-select-image-dropdown-menu-item --empty">
                  <span>列表为空</span>
                </li>
              </ul>
            </div>
          </n-popover>
          <!-- <p style="padding: 0 10px;">|</p>
          <span @click.stop="removeImage()">删除</span> -->
          <p style="padding: 0 10px;">|</p>
          <span @click.stop="openNodeWindow()">点位</span>
        </div>
      </div>
    </n-spin>

    <span v-if="label" class="g-input__caption">
      {{ label }}
    </span>
  </div>

  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :show-icon="false"
    :auto-focus="false"
    :on-after-enter="onAfterEnter"
    style="width:1550px;height:768px;"
  >
    <template #header-extra>
      绑定点位
    </template>
    <ModelNodeMapper ref="modelNodeMapperRef" v-model="modelValue" :ic-com="icCom" />
  </n-modal>
</template>

<script lang='ts'>
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
//import { useMessage, UploadFileInfo } from 'naive-ui'
import { UPDATE_MODEL_EVENT } from '@/utils/constants'
//import { generateId } from '@/utils/util'
import { ThreedModel } from '@/utils/types'
//import { uploadHost, previewHost, validAllowImg } from '@/utils/upload-util'
//import { getTokenByEnv } from '@/api/qiniu'
import { IconImg } from '@/icons'
import { ThreedModule } from '@/store/modules/threed'
import { getThumbnail } from '@/api/threed'
import ModelNodeMapper from './modelNodeMapper.vue'
//import { ThreedModelConfig } from '@/components/media/threed-viewer/src/threed-viewer'




export default defineComponent({
  name: 'GSelectModel',
  components: {
    IconImg,
    ModelNodeMapper,
  },
  props: {
    modelValue: {
      type: Object,
      required: true,
    },
    icCom:{
      type: Object,
      required: true,
    },
    label: {
      type: String,
      default: '',
    },
    inline: {
      type: [Boolean, String],
      default: false,
    },
  },
  emits: [UPDATE_MODEL_EVENT,'change'],
  setup(props, ctx) {
    const visible = ref(false)
    //const nMessage = useMessage()
    const loading = ref(false)
    const form = ref({
      key: '',
      //      token: '',
    })

    const httpHeaders = ref({ token : '' })

    const iserr = ref(false)
    const visibleCover = ref(false)

    const models = ref(ThreedModule.dataThreedModels)

    const showModal = ref(false)
    const modelLoading = ref(false)

    let currentThumbnail = ref<string | null>(null)

    const modelNodeMapperRef = ref(null)

    onMounted(()=>{
      models.value.forEach(r=>{
        getThumbnailImage(r)
        loadCurrentThumbnail()
      })

      //console.log('modelNodeMapperRef',modelNodeMapperRef.value)
    })

    watch(()=> props.modelValue, () => {
      loadCurrentThumbnail()
    })


    const loadCurrentThumbnail = () =>{
      if(props.modelValue && props.modelValue.url)
      {
        iserr.value = false
        getThumbnail(props.modelValue.url).then(res => {
          currentThumbnail.value = res.data
        }).catch( err =>{
          console.log('loadCurrentThumbnail', err)
          iserr.value = true
        })
      }
    }

    const ShowEmptyImage = computed(() => {
      return props.modelValue && props.modelValue.url && !iserr.value
    })

    const syncUploadImages = () => {

    }

    const onSelectImg = (model: ThreedModel) => {
      visible.value = false
      visibleCover.value = false

      props.modelValue.url = model.id

      ctx.emit(UPDATE_MODEL_EVENT, props.modelValue)
      ctx.emit('change', props.modelValue)
      currentThumbnail.value = model.thumbnail
    }


    const handleMouseEnter = () => {
      //if (props.modelValue) {
      visibleCover.value = true
      //}
    }

    const handleMouseLeave = () => {
      if (!visible.value) {
        visibleCover.value = false
      }
    }

    const removeImage = () => {
      //handleInput('')
      visibleCover.value = false
      visible.value = false

      currentThumbnail = null

      ctx.emit(UPDATE_MODEL_EVENT, null)
      ctx.emit('change', null)
    }

    const getThumbnailImage = (model: ThreedModel) => {
      getThumbnail(model.id).then(res => {
        model.thumbnail = res.data
      })
    }

    //watch(() => props.modelValue, zoomImage)

    const openNodeWindow = () =>{
      showModal.value = true
    }

    const onAfterEnter = () =>{
      modelNodeMapperRef.value.show3dModel()
      console.log('modelNodeMapperRef',modelNodeMapperRef)
    }

    return {
      visible,
      loading,
      form,
      iserr,
      visibleCover,
      models,
      syncUploadImages,
      //handleInput,
      handleMouseEnter,
      handleMouseLeave,
      removeImage,
      onSelectImg,
      httpHeaders,
      currentThumbnail,
      showModal,
      modelLoading,
      openNodeWindow,
      modelNodeMapperRef,
      onAfterEnter,
      ShowEmptyImage,
    }
  },
})
</script>
<style>

</style>
