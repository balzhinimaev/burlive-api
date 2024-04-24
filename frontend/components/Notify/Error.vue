<script lang="ts" setup>
defineProps<{
    heading: string,
    message: string
}>()
</script>
<template>
  <div class="app-notify-content error">
    <div class="heading">
      <h6>{{ heading }}</h6>
    </div>
    <p>{{ message }}</p>
  </div>
</template>