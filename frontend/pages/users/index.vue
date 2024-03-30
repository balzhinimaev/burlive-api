<template>
  <div class="page">
    <div class="container-fluid">
      <DashboardHeadingComponent title="Пользователи" />
      <div class="row">
        <div class="col-lg-12">
          <div class="custom-row">
            <h5>Пользователи</h5>
            <!-- <button class="btn btn-dark btn-sm">Новое предложение</button> -->
          </div>
          <p>
            <i>Пользователей найдено: {{ users.length }}</i>
          </p>
          <div v-if="users">
            <div class="user" v-for="(user, index) in users" :key="index">
              <div class="avatar">
                <NuxtImg :src="user.avatar" alt="" v-if="user.avatar" />
                <NuxtImg src="https://placehold.co/96x96" alt="" v-else />
              </div>
              <div class="userdata">
                <span class="user-fullname">{{
                  user.firstName + " " + user.lastName
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
const users = ref("");
definePageMeta({
  middleware: ["authed"],
});
useSeoMeta({
  title: 'Пользователи'
})
onBeforeMount(() => {
  const { data, pending, error } = useFetch(
    () => `http://localhost:5555/api/users`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
        "Content-Type": "application/json", // Укажите тип контента, если это необходимо,
      },
      onResponse({ request, response, options }) {
        // Process the response data
        users.value = response._data.users;
      },
    }
  );
});
</script>

<style lang="scss" scoped>
.user {
  margin-bottom: 1rem;
  display: flex;
  &:last-child {
    margin-bottom: 0;
  }
}
.avatar {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  margin: auto 1rem auto 0;
  img {
    width: 100%;
    height: 100%;
  }
}

.user-fullname {
  font-size: 16px;
}
.custom-row {
  display: flex;
  justify-content: space-between;

  h5,
  button {
    margin: auto 0;
  }
}
</style>
