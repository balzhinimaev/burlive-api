<template>
  <div>
    <RegistrationHeadingComponent title="Кассы" />
    <main>
      <NuxtLink
        to="/dashboard/cashes/register"
        class="btn btn-primary my-3"
        >Добавить кассу</NuxtLink
      >
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: "Кассы",
});
</script>