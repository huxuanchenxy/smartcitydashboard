<template>
  <!-- z-index 需高于左侧自绘对话窗（DifyRealDialog 为 9999/10000），否则弹层会被遮挡 -->
  <el-dialog
    :model-value="visible"
    title="后台配置"
    width="90%"
    top="5vh"
    append-to-body
    destroy-on-close
    :z-index="10200"
    custom-class="backend-config-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div class="backend-config-body">
      <!-- 后台配置内容待定，先占位 -->
      <p class="backend-config-placeholder">后台配置内容待完善</p>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'BackendConfigDialog',
  props: {
    // 通过 v-model:visible 控制弹层显隐
    visible: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:visible'],
  setup(props, { emit }) {
    const handleVisibleChange = (val: boolean) => {
      emit('update:visible', val)
    }

    const handleClose = () => {
      emit('update:visible', false)
    }

    return {
      handleVisibleChange,
      handleClose,
    }
  },
})
</script>

<style scoped>
.backend-config-body {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.backend-config-placeholder {
  margin: 0;
  font-size: 14px;
  color: #94a3b8;
}
</style>

<style>
/* 后台配置弹层占满屏幕 90%：宽 90%（配合 top=5vh 垂直居中），高 90vh；
   用 custom-class 精确命中 .el-dialog，仅作用于本弹层，不影响全站其它 dialog。
   弹层设为纵向 flex，内容区 flex:1 撑满并在超出时滚动。 */
.backend-config-dialog {
  display: flex;
  flex-direction: column;
  height: 90vh;
  margin-bottom: 0;
}

.backend-config-dialog .el-dialog__body {
  flex: 1;
  overflow-y: auto;
}
</style>
