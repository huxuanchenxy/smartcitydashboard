<template>
  <div>
    <div>
      <div class="Server-content">
        <span>点位</span>
      </div>
      <div class="server-hidden">

        <div class="Server-search">
          <div class="Server-search-left">
            <label>设备代码</label>
            <input class="device-input" v-model="deviceCode" placeholder="" />
            <label>点位代码</label>
            <input class="device-input" v-model="nodeCode" placeholder="" />
            <label>点位名称</label>
            <input class="device-input" v-model="nodeName" placeholder="" />
            <label>点位显示名称</label>
            <input class="device-input" v-model="nodeShowName" placeholder="" />
          </div>
          <div class="Server-search-right">
            <n-button class="Server-button" color="#1D9F3A" @click="triggerSearch">
              <n-icon>
                <IconServerSearch />
              </n-icon>
              <span>查询</span></n-button>
            <n-button tertiary class="Server-button button-reset" @click="Eliminate">
              <n-icon>
                <IconServerReset />
              </n-icon>
              <span class="button-reset-span">
                重置
              </span>
            </n-button>
            <n-button class="Server-button" color="#1C64F2" @click="openDifyDialog">
              <n-icon>
                <IconServerSearch />
              </n-icon>
              <span>Dify 聊天机器人</span></n-button>
          </div>
        </div>

        <div class="Server-table">
          <n-data-table :remote="true" :columns="columns" :data="deviceAll" :pagination="pagination" :bordered="false"
            @update:page="handlePageChange" @update:sorter="handleSorterChange" @update:filters="handleFiltersChange">
            <template v-slot:empty>
              <div class="empty-data">
                <n-icon>
                  <IconNodata />
                </n-icon>
                <p>当前无数据显示</p>
              </div>
            </template>
          </n-data-table>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Dify 聊天机器人弹框 -->
  <DifyChatbotDialog
    v-model:visible="difyDialogVisible"
    :data="difyData"
    @close="handleDifyDialogClose"
    @data-received="handleDifyDataReceived"
    @data-sent="handleDifyDataSent"
  />
</template>


<script lang='ts'>
import { h, defineComponent, ref, onMounted, reactive, computed, provide, watch } from 'vue'
import { NButton, useMessage } from 'naive-ui'
import { nodeAllList, nodeAllListquery } from '@/api/ic'
import { getProjectId } from "@/utils/token-util";
import IcList from '@/views/screen-editor/config-panel/icevent-panel/ic-list.vue'
import {
  IconWarning,
  IconServerAdd,
  IconServerReset,
  IconServerSearch,
  serverConfigBell,
  serverConfigData,
  IconDeviceManagement,
  IconNodata
} from '@/icons'
import DifyChatbotDialog from '../../../components/dify-chatbot/DifyChatbotDialog.vue'
export default defineComponent({
  name: 'MyScreen',
  components: {
    IconServerAdd,
    IconServerReset,
    IconServerSearch,
    serverConfigBell,
    serverConfigData,
    IcList,
    IconDeviceManagement,
    IconNodata,
    DifyChatbotDialog
  },
  setup() {
    const deviceAll = ref([])
    const columns = ref([]);
    const message = useMessage()
    const showPointLocation = ref(false);
    
    // Dify 聊天机器人相关状态
    const difyDialogVisible = ref(false);
    const difyData = ref({
      deviceCode: '',
      nodeCode: '',
      nodeName: '',
      nodeShowName: ''
    });
    const deviceCode = ref('')
    const nodeCode = ref('');
    const nodeName = ref('');
    const nodeShowName = ref('');


    const createColumns = () => {
      return columns.value = [
        {
          title: '设备代码',
          key: 'deviceCode',
        },
        {
          title: '点位代码',
          key: 'nodeCode',
        },
        {
          title: '点位名称',
          key: 'nodeName',
        },
        {
          title: '点位显示名称',
          key: 'nodeShowName',
        },
        {
          title: '是否订阅',
          key: 'isSubscribe',
          render(row) {
            const text = row.isShared === 1 ? '是' : '否';
            const color = row.isShared === 1 ? '#2885F0' : '#D03050';
            return h('span', { style: { color: color } }, text);
          }
        },
        {
          title: '是否推送',
          key: 'isPush',
          render(row) {
            const text = row.isShared === 1 ? '是' : '否';
            const color = row.isShared === 1 ? '#2885F0' : '#D03050';
            return h('span', { style: { color: color } }, text);
          }
        },
        {
          title: '是否记录',
          key: 'isSave',
          render(row) {
            const text = row.isShared === 1 ? '是' : '否';
            const color = row.isShared === 1 ? '#2885F0' : '#D03050';
            return h('span', { style: { color: color } }, text);
          }
        },
        {
          title: '是否轮询',
          key: 'isPolling',
          render(row) {
            const text = row.isShared === 1 ? '是' : '否';
            const color = row.isShared === 1 ? '#2885F0' : '#D03050';
            return h('span', { style: { color: color } }, text);
          }
        },
      ];
    };

    const fetchProjects = async () => {
      try {
        const projectIdString = getProjectId();
        const projectIdNumber = Number(projectIdString);
        const res = await nodeAllList(projectIdNumber, pagination.page, pagination.pageSize);
        deviceAll.value = res.data.data.records;
        pagination.pageCount = Math.ceil(res.data.data.total / pagination.pageSize);
        pagination.itemCount = res.data.data.total;
        createColumns();
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    const nodeListquery = async () => {
      try {
        const projectIdString = getProjectId();
        const projectIdNumber = Number(projectIdString);
        const res = await nodeAllListquery(
          projectIdNumber,
          deviceCode.value,
          nodeCode.value,
          nodeName.value,
          nodeShowName.value,
          pagination.page,
          pagination.pageSize);

        deviceAll.value = res.data.data.records;
        pagination.pageCount = Math.ceil(res.data.data.total / pagination.pageSize);
        pagination.itemCount = res.data.data.total;
        createColumns();
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };
    const pagination = reactive({
      page: 1,
      pageCount: 0,
      pageSize: 8,
      itemCount: 0,
      prefix({ itemCount }) {
        return `共 ${itemCount} 条`;
      }
    });


    const handleSorterChange = (sorter) => {
      pagination.page = 1;
      if(deviceCode.value || nodeCode.value || nodeName.value || nodeShowName.value !==null){
        nodeListquery()
      }else{
        fetchProjects()
      }
    };


    const handleFiltersChange = (filters) => {
      pagination.page = 1;
      if(deviceCode.value || nodeCode.value || nodeName.value || nodeShowName.value !==null){
        nodeListquery()
      }else{
        fetchProjects()
      }
    };

    const handlePageChange = (currentPage) => {
      pagination.page = currentPage;
      if(deviceCode.value || nodeCode.value || nodeName.value || nodeShowName.value !==null){
        nodeListquery()
      }else{
        fetchProjects()
      }
    };
    const triggerSearch = () => {
      pagination.page = 1;
      nodeListquery();
    };
    const Eliminate = () => {

      deviceCode.value = null;
      nodeCode.value = null;
      nodeName.value = null;
      nodeShowName.value = null;
      fetchProjects()
    }
    
    // 打开 Dify 聊天机器人弹框
    const openDifyDialog = () => {
      console.log('Opening Dify dialog...');
      // 同步当前查询条件到 Dify 数据
      difyData.value = {
        deviceCode: deviceCode.value,
        nodeCode: nodeCode.value,
        nodeName: nodeName.value,
        nodeShowName: nodeShowName.value
      };
      console.log('Dify data:', difyData.value);
      difyDialogVisible.value = true;
      console.log('Dify dialog visible set to true');
    };
    
    // 处理 Dify 聊天机器人关闭事件
    const handleDifyDialogClose = () => {
      console.log('Dify dialog closed');
    };
    
    // 处理从 Dify 聊天机器人接收数据
    const handleDifyDataReceived = (data) => {
      console.log('Data received from Dify:', data);
      // 可以根据需要处理从 Dify 接收的数据
      message.success('收到来自 Dify 的数据');
    };
    
    // 处理向 Dify 聊天机器人发送数据
    const handleDifyDataSent = (data) => {
      console.log('Data sent to Dify:', data);
      message.success('数据已发送到 Dify');
    };
    
    onMounted(() => {
      fetchProjects();
    })
    return {
      deviceAll,
      columns,
      pagination,
      deviceCode,
      nodeCode,
      nodeName,
      nodeShowName,
      handleSorterChange,
      handleFiltersChange,
      handlePageChange,
      Eliminate,
      showPointLocation,
      triggerSearch,
      // Dify 聊天机器人相关
      difyDialogVisible,
      difyData,
      openDifyDialog,
      handleDifyDialogClose,
      handleDifyDataReceived,
      handleDifyDataSent
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/main-content.scss';

.device-span {
  background-image: url('../images/device-management.png');
  background-repeat: no-repeat;
  margin-bottom: 12px;
  width: 127px;
  height: 30px;
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
}

.device-span span {
  color: #0E62A9;
  font-size: 18px;
  display: flex;
}

.device-input {
  width: 150px;
  height: 36px;
  border: 1px solid #E4E7EC;
  border-radius: 8px;
  margin-right: 5px;
  font-size: 18px;
  color: #7E7E7E;
  padding: 0 10px;
}

</style>
