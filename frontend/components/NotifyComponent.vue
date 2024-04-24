<script lang="ts" setup>
defineProps<{
    heading: string,
    message: string,
    status: "success" | "error",
    key: number
}>()
onMounted(() => {
    console.log('Компонент загружен')
})
</script>
<template>
  <div class="app-notify-content" :class="{ success: status == 'success', error: status == 'error' }">
    <div class="heading">
      <h6>{{ heading }}</h6>
      <button>x</button>
    </div>
    <p>{{ message }}</p>
  </div>
</template>

<style lang="scss" scoped>
.heading {
    display: flex;
    margin-bottom: .5rem;
    button {
        background-color: transparent;
        color: #888;
        border: 0;
        display: block;
        margin: auto 0 auto 1rem;
        line-height: 1;
        transition: 400ms;
        opacity: .5;
        &:hover {
            opacity: 1;
        }
    }
}
</style>