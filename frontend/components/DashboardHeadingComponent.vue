<template>
  <div class="page-heading">
    <h4>{{ title }}</h4>
    <!-- <BreadcrumbComponent /> -->
  </div>
</template>

<script lang="ts" setup>
defineProps({
  title: String,
});
</script>