<template>
    <nav class="breadcrumb">
        <ul>
            <li>
                <router-link to="/">Главная</router-link>
            </li>
            <li v-if="module">
                <router-link :to="`/modules`">Модули</router-link>
            </li>
            <li v-if="module">
                <span>{{ module }}</span>
            </li>
        </ul>
    </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

// Извлекаем текущий путь и параметры
const route = useRoute()
const module = route.name === 'modules-basic' ? 'Основы бурятского языка'
    : route.name === 'modules-advanced' ? 'Продвинутый курс'
        : null
</script>

<style scoped lang="scss">
.breadcrumb {
    display: flex;
    align-items: center;
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    font-size: 14px;
    gap: 8px;

    ul {
        list-style: none;
        display: flex;
        gap: 8px;
        padding: 0;
        margin: 0;
    }

    li {
        &:not(:last-child)::after {
            content: '>';
            margin: 0 8px;
            color: #888;
        }

        a {
            text-decoration: none;
            color: #777;
            transition: color 0.3s;

            &:hover {
                color: #777
            }
        }

        span {
            color: #555;
        }
    }
}
</style>
