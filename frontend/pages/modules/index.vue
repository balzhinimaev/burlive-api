<template>
    <div class="page home-page">
        <header>
            <div class="container-fluid">
                <h2 class="heading">Выберите модуль</h2>
                <!-- <Breadcrumb /> -->
                <p class="typography-body">
                    Выберите тему или модуль, который хотите изучать.
                </p>
            </div>
        </header>
        
        <main>
            <section id="modules-list">
                <div class="module-card box-shadow" v-for="module in modules" :key="module.id"
                @click="goToModule(module.route)">
                <h3 class="module-title">{{ module.title }}</h3>
                <p class="module-description">{{ module.description }}</p>
            </div>
        </section>
        <NuxtLink class="btn btn-primary" style="display: block; margin: 16px 0;" to="/">Назад</NuxtLink>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface Module {
    id: number;
    title: string;
    description: string;
    route: string;
}

const modules: Module[] = [
    {
        id: 1,
        title: 'Основы бурятского языка',
        description: 'Начните с базовых фраз и приветствий.',
        route: '/modules/basics',
    },
    {
        id: 2,
        title: 'Продвинутый курс',
        description: 'Углубитесь в грамматику и сложные фразы.',
        route: '/modules/advanced',
    },
];

function goToModule(route: string) {
    router.push(route)
}
</script>

<style scoped lang="scss">
.page {
    margin: 32px 0;

    main {
        margin: 0 16px;
    }
}

.heading {
    font-family: 'Nunito', sans-serif;
    font-weight: 700;
    font-size: 32px;
    letter-spacing: -0.05em;
}

.typography-body {
    font-family: 'Nunito', sans-serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 24px;
}

#modules-list {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .module-card {
        padding: 16px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 1px 3px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: background-color 0.3s;

        &:hover {
            background-color: #f9f9f9;
        }

        .module-title {
            font-family: 'Nunito', sans-serif;
            font-weight: 600;
            font-size: 18px;
            margin-bottom: 4px;
        }

        .module-description {
            font-family: 'Nunito', sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 1.5;
        }
    }
}
</style>
