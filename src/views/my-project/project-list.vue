<template>
  <div>
    <div class="project-header">
      <div class="project-title">
        <span>画面管理</span>
      </div>
      <div class="header-manager">
        <div class="search">
          <input v-model="searchText" class="search-input" placeholder="搜索画面关键字">
        </div>
        <n-icon class="icon-search">
          <IconSearch />
        </n-icon>
        <n-button class="Server-button" color="#722ED1" @click="openDifyApiDialog">
          <n-icon>
            <IconSearch />
          </n-icon>
          <span>AI机器人</span>
        </n-button>
      </div>
    </div>
    <div class="main-screen">
      <div v-for="screen in screens" :key="screen.id">
        <my-screen :screen="screen" />
      </div>
      <div class="new-project" title="创建画面" @click="openAddProjectView">
        <div class="btn-add-project">
          <img :src="`data/originPic/plus.png`" style="cursor: pointer;">
        </div>
      </div>
    </div>
    <publish-screen v-model="visiblePublish" :project-id="publishAppId" />
  </div>
  <addScreen :visible="addProject" />
  
  <!-- Dify API 聊天机器人弹框 -->
  <DifyApiDialog
    v-model:visible="difyApiDialogVisible"
    :data="difyData"
    @close="handleDifyApiDialogClose"
    @message-received="handleDifyApiMessageReceived"
    @message-sent="handleDifyApiMessageSent"
  />
</template>

<script lang='ts'>
import {
  defineComponent, ref, PropType,
  computed, toRef, provide,
} from 'vue'
import { sortBy } from 'lodash-es'
import { ProjectGroup } from '@/domains/project'
import { IconSearch } from '@/icons'
import MyScreen from './my-screen.vue'
// import PublishScreen from './publish-screen.vue'
import PublishScreen from './publish.vue'
import addScreen from './add-screen.vue'
import DifyApiDialog from '@/components/dify-chatbot/DifyApiDialog.vue'
import { useMessage } from 'naive-ui'

const cdn = import.meta.env.VITE_APP_CDN

export default defineComponent({
  name: 'ProjectList',
  components: {
    MyScreen,
    PublishScreen,
    IconSearch,
    addScreen,
    DifyApiDialog,
    //IconArrowDown,
  },
  props: {
    group: Object as PropType<ProjectGroup>,
  },
  setup(props) {
    const addProject = ref(false)
    const nMessage = useMessage()

    const searchText = ref('')
    const sort = ref('name')
    const sorts = {
      name: '按名称排序',
      createAt: '按创建时间排序',
      updateAt: '按修改时间排序',
    }
    const sortOpts = Object.entries(sorts).map(([key, label]) => ({ key, label }))
    const visiblePublish = ref(false)
    const publishAppId = ref(0)
    
    // Dify API 聊天机器人相关状态
    const difyApiDialogVisible = ref(false)
    const difyData = ref({})

    const group = toRef(props, 'group')

    const closePublish = () => {
      visiblePublish.value = false
    }
    provide('closePublish', closePublish)

    const handleSortChange = (key: string) => {
      sort.value = key
    }

    const screens = computed(() => {
      let list = group.value ? group.value.children : []
      if (searchText.value) {
        const text = searchText.value.toLowerCase()
        list = list.filter(m => m.name.toLowerCase().includes(text))
      }

      return sortBy(list, sort.value)
    })

    const openAddProjectView = () => {
      addProject.value = true
    }


    provide('publish', (appId: number) => {
      visiblePublish.value = true
      publishAppId.value = appId
    })

    provide('closeAddProject', () => { addProject.value = false })
    
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
      cdn,
      searchText,
      sort,
      sorts,
      sortOpts,
      visiblePublish,
      publishAppId,
      screens,
      handleSortChange,
      closePublish,
      addProject,
      openAddProjectView,
      // Dify API 聊天机器人相关
      difyApiDialogVisible,
      difyData,
      openDifyApiDialog,
      handleDifyApiDialogClose,
      handleDifyApiMessageReceived,
      handleDifyApiMessageSent,
    }
  },
})
</script>

<style lang="scss" scoped>
@font-face {
  font-family: "Orbitron-Bold";
  src: url("@/styles/fonts/orbitron-bold.ttf") format("truetype");
}

@mixin cover-img {
  content: "";
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 100%;
  background-color: #131e2d;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 50%;
  filter: grayscale(1);
  opacity: 0.36;
}

:deep(.n-form-item-label) {
  font-size: 24px;
  margin-left: 79px;
  color: #7E7E7E;
  font-family: '思源黑体Normal';
}

:deep(.n-form-item-blank) {
  width: 558px;
}

.create-dialog {
  font-family: Arial, sans-serif;
  padding: 20px;
  height: 250px;

  span {
    color: #A8A8A8;
  }
}

:deep(.n-button__content) {
  font-family: '思源黑体Normal';
}

.modal-center {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 907px;
  height: 526px;
  border-radius: 10px;
  margin-top: 100px;
}

.dialog-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.dialog-body {
  margin-bottom: 20px;
  margin-left: 40px
}

.dialog-footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.input-group {
  display: flex;
  // margin-bottom: px;
  margin-top: 30px;

  span {
    width: 120px;
    height: 35px;
    font-size: 24px;
    font-family: '思源黑体Normal';
    color: #7E7E7E;
    margin-left: 75px;
  }

  img {
    width: 150px;
    height: 100px;
    // margin-left: -100px;.
  }
}

.modal-center-title {
  display: flex;
  justify-content: center;
  margin-top: 30px;

  span {
    width: 110px;
    height: 35px;
    font-size: 24px;
    font-family: '思源黑体Normal';
    color: #7E7E7E;
  }
}


.input-group1 {
  display: flex;
  margin-bottom: 59px;
  margin-top: 46px;

  span {
    width: 110px;
    height: 35px;
    font-size: 22px;
    font-family: '思源黑体Normal';
    color: #7E7E7E;
    // margin-left:85px;
  }

  img {
    width: 150px;
    height: 100px;
    // margin-left: -100px;
  }
}

.name-title-one,
.name-title {
  margin-bottom: 5px;
  color: #333;
  margin-top: 3px;

}

.name-title-button {
  border: 1px solid #ccc;
  width: 8rem;
  height: 8rem;
  border-radius: 2rem;
  color: #ccc;
  background-color: white;

  span {
    font-size: 6rem;
  }
}

.project-header {
  span {
    font-size: 21px
  }
}

.name-input {
  margin-left: 10px;
  border-radius: 4rem;
  height: 30px;
  width: 70%;
  padding: 10px;
  border: 1px solid #ccc;
  color: #A8A8A8;
}

.name-select .n-base-selection-label {
  border-radius: 16px !important;
  /* 调整下拉选项的圆角 */
}

.n-select {
  border-radius: 0 0 0 10rem !important;
  margin-left: 10px;
  width: 70%;
  // border: #A8A8A8;
}

:deep(.name-select, .n-base-selection-label) {
  border-radius: 16px !important;
}

.cancel-button {
  color: #7E7E7E;
}

.button {
  margin-top: 30px;
  margin-left: 10px;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  height: 48px;
  width: 158px;
  font-size: 24px;
  margin-bottom: 41px;
}

.n-base-selection {
  border-radius: 10rem;
  border: #A8A8A8;
}

.n-base-selection-label {
  border-radius: 10rem;
  border: #A8A8A8;
}

@mixin slider-blur($placement: left, $angle: -90deg) {
  content: " ";
  position: absolute;
  top: 0;
  #{$placement}: 0;
  background-image: linear-gradient(#{$angle},
    rgba(0, 0, 0, 0) 64%,
  );
  width: 82px;
  height: 96px;
  pointer-events: none;
  z-index: 1;
}

@import '@/styles/mixins/util';

.ellipsis {
  @include utils-ellipsis;

  display: block;
}

.new-projects-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--datav-main-color);
  padding: 0;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.new-projects {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-right: -32px;

  .new-project {
    width: 258px;
    height: 78px;
    margin: 16px 32px 16px 0;
    vertical-align: middle;
    border: 1px solid #39414d;
    background: #22272e;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    position: relative;
    cursor: pointer;
    color: #fff;

    img {
      width: 150px;
      height: 100%;
    }

    &:hover {
      border-color: var(--datav-main-color);

      &::after {
        content: "";
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        background: rgba(36, 131, 255, 0.08);
      }
    }
  }

  .project-type {
    padding-left: 8px;
    flex: 1;
    font-size: 14px;
  }
}

.project-header {
  position: sticky;
  top: 0px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  z-index: 1;
  min-width: 1024px;
  background-color: #fff;

  .project-title {
    display: flex;
    align-items: center;

    span {
      max-width: 100px;
      font-size: 24px;
      color: #7E7E7E;
    }
  }


}

.server-input {
  .name-input {
    border-radius: 20px;
    height: 48px;
    width: 558px;
    padding: 10px;
    border: 1px solid #ccc;
    color: #A8A8A8;
    font-size: 20px;
  }

  .na-input {
    border-radius: 8px;
  }
}

.name-title-img {
  margin-left: 10px;
}

.header-manager {
  display: flex;
  align-items: center;
  font-size: 14px;

  .search {
    margin-right: 6px;
    transform: translateX(30px);

    .search-input {
      @include utils-ellipsis;
      color: #000;
      padding: 0 10px;
      line-height: 30px;
      height: 30px;
      padding-right: 30px;
      padding-left: 20px;
      border: 1px solid #c5c5c5;
      border-radius: 20px;
      transition: 0.2s;

      &:hover,
      &:focus {
        border: var(--datav-border-primary);
        box-shadow: var(--datav-shadow);
      }
    }
  }

  .icon-search {
    padding: 0 24px 0 4px;
    color: var(--datav-font-color);
    cursor: pointer;
    z-index: 1;
  }

  .sort-type {
    @include utils-ellipsis;

    display: inline-block;
    color: var(--datav-font-color);
    line-height: 30px;
    cursor: pointer;
    font-size: 14px;
    min-width: 100px;

    .icon-arrow {
      font-size: 14px;
      margin-left: 4px;
    }

    &:hover {
      color: var(--datav-main-color);
    }
  }
}

.main-screen {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  user-select: none;
  margin-top: 1rem;
  padding: 0;
  height: calc(100vh - 170px);
  overflow-y: auto;

  .new-project {
    margin: 24px 32px 32px 0;
    ;
    width: 336px;
    height: 249px;
    border: 2px solid rgb(14, 98, 170, .6);
    border-radius: 10px;

    .btn-add-project {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 336px;
      height: 249px;

      img {
        width: 100px;
        height: 100px;
      }
    }
  }
}

:deep(.el-dialog) {
  margin: 0 auto !important;
  position: fixed !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

:deep(.el-dialog__wrapper) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: auto;
}
</style>
