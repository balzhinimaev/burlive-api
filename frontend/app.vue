<template>
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
</template>

<style lang="scss">
// @import '@/node_modules/bootstrap/scss/bootstrap';
@import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap");
[data-bs-theme="dark"] {
  --bs-heading-color: #dee2e6;
  --bs-link-color-rgb: #dee2e6;
  --bs-link-hover-color-rgb: #dee2e6;
  --bs-body-bg-rgb: #dee2e6;
  --bs-body-color: #dee2e6;
  a {
    color: $light;
  }
}
.page-wrapper {
  padding: 30px 1rem 0;
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
  background-color: #0b0b0b;
  padding: 1rem;
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
  const element = document.getElementsByTagName('body')[0]
  element.setAttribute('data-bs-theme', 'dark');
  console.log(element)
})
</script>
