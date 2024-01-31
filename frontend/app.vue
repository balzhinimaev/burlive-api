<template>
  <div>
    <!-- <NuxtWelcome /> -->
    <NuxtPage />
  </div>
</template>

<style lang="scss">
// @import '@/node_modules/bootstrap/scss/bootstrap';
@import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300&display=swap');
.page {
  padding: 30px 0;
}
body {
  font-family: 'Montserrat', sans-serif;
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
</style>

<script lang="ts" setup>
useHead({
  title: 'BurLive'
})</script>
