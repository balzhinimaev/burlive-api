<template>
    <div class="page home-page">
        <header>
            <div class="container-fluid">
                <h2 class="heading">Выберите модуль</h2>
                <p class="typography-body">
                    Выберите тему или модуль, который хотите изучать.
                </p>
                {{ useRouter().options.history.state.back }}
            </div>
        </header>

        <main>
            <section id="modules-list">
                <ul class="modules-list">
                    <li v-for="(module, index) in modules" :key="module.id">
                        <a href="#" @click.prevent="goToModule(module.route)">
                            <span class="module-number">{{ index + 1 }}.</span>
                            <span class="module-title">{{ module.title }}</span>
                        </a>
                        <p class="module-description">{{ module.description }}</p>
                    </li>
                </ul>
            </section>
        </main>
    </div>
</template>


<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

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
    router.push(route);
}

function rgbToHex(rgb: string) {
    const result = rgb.match(/\d+/g);
    if (result) {
        return '#' + result.slice(0, 3).map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }
    return rgb; // Возвращаем исходное значение, если не удалось преобразовать
}

onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: "/" }); // Или другой маршрут по умолчанию
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

<style scoped lang="scss">
header {
    margin-bottom: 10px;
}

#modules-list {
    padding: 0 32px 32px;

    .modules-list {
        list-style: none;
        /* Убираем стандартные маркеры списка */
        padding: 0;
        margin: 0;

        li {
            margin-bottom: 16px;
            transition: background-color 0.3s;
            color: #aaa;

            a {
                text-decoration: none;
                display: flex;
                align-items: center;
                color: #eee;
            }

            a:hover .module-title {
                text-decoration: underline;
            }

            .module-number {
                font-weight: 600;
                font-size: 18px;
                margin-right: 8px;
            }

            .module-title {
                font-weight: 600;
                font-size: 18px;
            }

            .module-description {
                font-weight: 400;
                font-size: 14px;
                line-height: 1.5;
                margin-top: 4px;
            }
        }
    }
}
</style>
