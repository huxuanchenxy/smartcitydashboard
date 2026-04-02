<template>
  <n-button type="primary">
    primary
    <div>
      <slot>
      </slot>
    </div>
  </n-button>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MySlot',
})
</script>

<style scoped>

</style>