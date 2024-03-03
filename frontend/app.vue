<template>
  <div>
    <div class="page-wrapper" data-bs-theme="dark">
      <!-- <NuxtWelcome /> -->
      <div class="container-fluid">
        <navbarComponent />
      </div>
      <NuxtPage />
      <!-- <footer>
      <div class="container my-4">
        <h6>Цветовая схема</h6>
        <div class="btn-group" role="group" aria-label="Basic example">
          <button type="button" class="btn btn-light">День</button>
          <button type="button" class="btn btn-black">Ночь</button>
        </div>
      </div>
    </footer> -->
    </div>
    <div class="app-notify">
      <div class="app-notify-content success">
        <div class="heading">
          <h6>Успешно</h6>
        </div>
        <p>Lorem ipsum dolor sit amet consectetur</p>
      </div>
      <div class="app-notify-content error">
        <div class="heading">
          <h6>Не успешно</h6>
        </div>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Eius hic
          repellendus quae.
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
// @import '@/node_modules/bootstrap/scss/bootstrap';
@import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap");
.app-notify {
  padding: 1.5rem 1rem;
  .app-notify-content {
    background-color: #111;
    padding: 1rem;
    width: fit-content;
    border-radius: 10px;
    margin-bottom: 1rem;
    max-width: 350px;
    &:last-child {
      margin-bottom: 0;
    }
    .heading {
      h6 {
        color: $success;
      }
    }
    p {
      margin: 0;
      font-size: 14px;
    }

    &.error {
      .heading {
        h6 {
          color: $danger;
        }
      }
    }
  }
}

[data-bs-theme="dark"] {
  /* Для темной темы */
  --scrollbar-track-color: #111;
  --scrollbar-thumb-color: #222;
  --scrollbar-thumb-hover-color: #333;
  /* Для темной темы */
  --body-background-color: #0b0b0b;
  --bs-heading-color: #dee2e6;
  --bs-link-color-rgb: #dee2e6;
  --bs-link-hover-color-rgb: #dee2e6;
  --bs-body-bg-rgb: #dee2e6;
  --bs-body-color: #dee2e6;
  --bs-table-bg: transparent;
  .table {
    --bs-table-bg: transparent;
  }
  a {
    color: #d1d1d1;
    transition: 400ms;
    &:hover {
      color: var(--bs-body-color);
    }
  }
}
.table {
  padding: 1rem;
}

/* Стилизация полосы прокрутки */
::-webkit-scrollbar {
  width: 10px; /* Ширина полосы прокрутки */
}

/* Полоса прокрутки */
::-webkit-scrollbar-track {
  background: var(--scrollbar-track-color); /* Цвет фона полосы прокрутки */
}

/* Дорожка, по которой перемещается ползунок */
::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb-color); /* Цвет ползунка */
  border-radius: 5px; /* Скругление углов ползунка */
}

/* Ползунок при наведении на него курсора */
::-webkit-scrollbar-thumb:hover {
  background-color: var(
    --scrollbar-thumb-hover-color
  ); /* Цвет ползунка при наведении */
}

[data-bs-theme="light"] {
  --bs-heading-color: #dee2e6;
  --bs-link-color-rgb: #dee2e6;
  --bs-link-hover-color-rgb: #dee2e6;
  --bs-body-bg-rgb: #dee2e6;
  --bs-body-color: #dee2e6;
  &:body {
    background-color: #e5e5e5;
  }
  a {
    color: $light;
  }
  .table {
    --bs-table-bg: transparent;
    padding: 1rem;
  }
}

.page-wrapper {
  padding: 1.5rem 1rem;
  border-radius: 1rem;
  background-image: linear-gradient(269deg, #171f2085, #14141482);
}
body,
.page-wrapper {
  font-family: "Montserrat", sans-serif;
  // background-color: #101010;
  // background-color: var(--bs-body-bg);
}
.page {
  min-height: calc(100vh - 7.5rem);
}
body {
  padding: 1rem;
  background-color: var(--body-background-color);
}
.btn.btn-success {
  color: #fff;
  &:active {
    color: #fff;
  }
}
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
footer {
  padding: 15px 0;
  background-color: #f8f8f8;
  margin-top: 3rem;
}
@media screen and (max-width: 1400px) {
  html {
    font-size: 80%;
  }
}
</style>

<script lang="ts" setup>
useHead({
  title: "BurLive",
});
onMounted(() => {
  const element = document.getElementsByTagName("body")[0];
  element.setAttribute("data-bs-theme", "dark");
  console.log(element);
});
</script>
