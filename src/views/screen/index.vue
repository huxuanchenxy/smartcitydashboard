<template>
  <component :is="comName" :screen-data="screenData"/>
</template>

<script lang='ts'>
import {
  defineComponent,
  onMounted,
  ref,
  watch,
} from 'vue'
import { getScreen } from '@/api/screen'
import screen from './screen.vue'
import { setToken } from '@/utils/token-util'
import { useRoute } from 'vue-router'


export default defineComponent({
  name: 'Preview',
  components: {
    screen,
  },
  props: {
    screenId: {
      type: [String, Number],
      required: true,
    },
    token: {
      type: String,
      required: false,
    }
  },
  setup(props) {

    const screenData = ref(null)
    const comName = ref(null)
    const route = useRoute();

    onMounted(async () => {
      initData(+props.screenId)
    })

    const initData = async (screenId: number) => {
      try {
        if (props.token) {
          //设置token
          setToken(props.token);
        }
        const retModel = await getScreen(screenId)
        const data = retModel.data.data
        screenData.value = data
        comName.value = 'screen'
      } catch (error) {
        console.log(error)
      }
    }

    watch(() => route.params.screenId, (newId, oldId) => {
      if (newId) {
        initData(+newId);
      }
    })

    return {
      screenData,
      comName
    }
  },
})
</script>

<style lang="scss">
//全局文字不能选中 滨江的需求
span {
  user-select: none;
}
</style>
