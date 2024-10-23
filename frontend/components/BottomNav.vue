<template>
    <nav class="bottom-nav">
        <NuxtLink to="/" class="nav-icon" :class="{ active: isActive('/') }">
            <i class="fas fa-home"></i>
        </NuxtLink>
        <NuxtLink to="/my-vocabulary" class="nav-icon" :class="{ active: isActive('/my-vocabulary') }">
            <i class="fas fa-search"></i>
        </NuxtLink>
        <NuxtLink to="/analytics" class="nav-icon" :class="{ active: isActive('/analytics') }">
            <i class="fas fa-chart-pie"></i>
        </NuxtLink>
        <NuxtLink to="/history" class="nav-icon" :class="{ active: isActive('/history') }">
            <i class="fas fa-history"></i>
        </NuxtLink>
        <NuxtLink to="/profile" class="nav-icon" :class="{ active: isActive('/profile') }">
            <i class="fas fa-user"></i>
        </NuxtLink>
    </nav>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router';

// Функция для определения активной страницы
const router = useRouter();
function isActive(route: string) {
    return router.currentRoute.value.path === route;
}
</script>

<style scoped lang="scss">
.bottom-nav {
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color: #1f1f1f;
    padding: 12px 16px;
    border-radius: 32px;
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
    margin: 16px;
}

.nav-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: #888;
    font-size: 20px;
    transition: all 0.3s;

    i {
        font-size: 24px;
    }

    &.active {
        color: #a569ff;
    }

    &.active::after {
        content: "";
        display: block;
        width: 24px;
        height: 3px;
        background-color: #a569ff;
        margin-top: 4px;
        border-radius: 2px;
    }

    &:hover {
        color: #a569ff;
        transform: scale(1.1);
    }
}
</style>
