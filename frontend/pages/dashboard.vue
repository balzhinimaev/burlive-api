<template>
  <div class="page dashboard-page">
    <div class="container">
      <div class="row">
        <div class="col-lg-3">
          <div class="sidebar-component">
            <div class="user-info">
              <h6>Личный кабинет</h6>
              <p class="small text-muted">
                BurLive<span class="status"></span>
              </p>
              <ul></ul>
            </div>
          </div>
          <div class="sidebar-component menu">
            <ul>
              <li>
                <NuxtLink to="/dashboard"
                  >Аналитика</NuxtLink
                >
              </li>
              <li>
                <NuxtLink to="/dashboard/promts"
                  >Промты</NuxtLink
                >
              </li>
              <li>
                <NuxtLink to="/dashboard/dialogs"
                  >Диалоги</NuxtLink
                >
              </li>
              <li>
                <NuxtLink to="/dashboard/statistical-data">Статистические данные</NuxtLink>
              </li>
            </ul>
          </div>
          <div class="sidebar-component sidebar-footer">
            <NuxtLink to="/dashboard/settings">Настройки</NuxtLink>
          </div>
          <button @click="logout" class="btn btn-sm btn-primary mt-2">Выйти</button>
        </div>
        <main class="col">
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
const { logUserOut } = useAuthStore();
import { useAuthStore } from "@/stores/auth/login"; // import the auth store we just created

const router = useRouter();

definePageMeta({
  middleware: ["authed"],
});

async function logout() {
  logUserOut();
  router.push("/auth");
}
</script>

<style lang="scss" scoped>
$primary: #050505;
.sidebar-component {
  //   background-color: $primary;
  border-radius: 3px;
  padding: 0.3rem 0;
  margin-bottom: 0.5rem;

  &.menu {
    // background-color:$primary;
    margin-top: 0.5rem;
    ul {
      margin: 0;
      list-style-type: none;
      width: 100%;
      padding: 0;
      li {
        width: 100%;
        a {
          width: 100%;
          border-radius: 3px;
          display: block;
          text-decoration: none;
          // background-color: #111;
          // padding: .5rems 1rem;
          // color: #33;
          margin-bottom: 0.3rem;
          // font-size: 13px;
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }

  &.sidebar-footer {
    a {
      // color: #fff;
      text-decoration: none;
    }
  }
}
.user-info {
  //   text-align: center;
  h6 {
    margin: 0;
  }
}
</style>