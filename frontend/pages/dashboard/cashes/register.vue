<template>
  <div>
    <RegistrationHeadingComponent title="Регистрация кассы" />
    <main>
      <div class="row">
        <div class="col-lg-6">
          <NuxtPage />
        </div>
      </div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from 'nuxt/app';
useHead({
  title: 'Регистрация кассы'
})
</script>

<style lang="scss" scoped>

main {
    padding: 1rem;
    margin-top: .5rem;
}
</style>