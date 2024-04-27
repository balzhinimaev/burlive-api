<template>
  <div>
    <div class="container-fluid">
      <h2>{{ userStore.loadedPubicProfile.username }}</h2>
      <p>{{ useRoute().params.id }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();
useSeoMeta({
  title: "Пользователь",
});
onBeforeMount(() => {
  userStore.fetchPublicProfileByUsername(<string>useRoute().params.id);
});
</script>
