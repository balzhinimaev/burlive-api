<template>
  <div>
    <div class="container-fluid">
      <div v-if="isLoading">
        <p>Загрузка ...</p>
      </div>
      <div v-else-if="isErrorLoadingPublicProfile">
        <p>Ошибка: {{ errorLoadingPublicProfile }}</p>
      </div>  
      <div class="row" v-else>
        <div class="col-md-2">
          <div>
            <!-- {{ loadedPubicProfile }} -->
            <div class="avatar">
              <NuxtImg :src="loadedPubicProfile.avatar" width="256" height="256"</NuxtImg>
            </div>
            <!-- <p class="text-center">@{{ loadedPubicProfile.username }}</p> -->
            <!-- <p>{{ useRoute().params.id }}</p> -->
            <div class="button-group">
              <button class="btn btn-primary">Написать</button>
              <button class="btn btn-dark">Подписаться</button>
            </div>
          </div>
        </div>
        <div class="col-md-5">
          <section id="mini-dash">
            <div class="mini-card">
              <ul>
                <li>Предложений предложено: 204</li>
                <li>Предложений переведено: 517</li>
                <li>Голосов: 1048</li>
                <li>Комментариев: 12</li>
                <li>Подписчиков: 52</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from "@/stores/userStore";
const userStore = useUserStore();
import { storeToRefs } from "pinia"; // import storeToRefs helper hook from pinia

const isLoading = storeToRefs(userStore).isLoadingPubicProfile
const errorLoadingPublicProfile = storeToRefs(userStore).errorLoadingPublicProfile
const isErrorLoadingPublicProfile = storeToRefs(userStore).isLoadingPubicProfile
const loadedPubicProfile = storeToRefs(userStore).loadedPubicProfile

useSeoMeta({
  title: "Пользователь",
});
onBeforeMount(() => {
  userStore.fetchPublicProfileByUsername(<string>useRoute().params.id);
});
</script>
<style lang="scss" scoped>
#mini-dash {
  padding: 1rem;
}
.avatar {
  border-radius: 10px;
  overflow: hidden;
  width: 256px;
  height: 256px;
  margin: 0 auto 1rem;
}
.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>
