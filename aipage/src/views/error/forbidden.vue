<template>
  <div class="forbidden">
    <h1>403</h1>
    <p>抱歉，您没有权限访问该页面。</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Forbidden',
})
</script>

<style scoped>
.forbidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.forbidden h1 {
  font-size: 72px;
  margin-bottom: 8px;
  color: #005497;
}
</style>
