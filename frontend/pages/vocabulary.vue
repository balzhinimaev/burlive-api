<template>
    <div>
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">Словарь</h2>
                    <p class="breadcrumb"><nuxt-link to="/">Главная</nuxt-link><span class="split">/</span><nuxt-link
                            to="/vocabulary">Словарь</nuxt-link></p>
                </div>
            </div>
        </header>
    </div>
</template>

<style lang="scss" scoped>
header {
    .header-inner {
        padding: 16px 0;
    }

    .heading {
        margin-bottom: 0;
    }
}
</style>

<script setup lang="ts">
onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: "/" }); // Или другой маршрут по умолчанию
        });
    }
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});
</script>