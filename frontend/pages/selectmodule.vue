<template>
    <div class="page home-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">Выберите модуль</h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link>
                    </p>
                    <p class="typography-body">
                        Выберите тему или модуль, который хотите изучать.
                    </p>
                </div>
            </div>
        </header>

        <main>
            <section id="modules-list">
                <div class="container">
                    <ul class="modules-list">
                        <li v-for="(module, index) in modules" :key="module.id" :class="{ disabled: module.disabled }">
                            <a href="javascript:void(0)" @click.prevent="!module.disabled && goToModule(module.route)"
                                class="list-wrapper">
                                <div class="number">
                                    {{ index + 1 }}
                                    <div class="circle"></div>
                                </div>
                                <div class="content">
                                    <div class="module-title">{{ module.title }}</div>
                                    <div class="module-description">{{ module.description }}</div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
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
    disabled: boolean;
}

const modules: Module[] = [
    {
        id: 1,
        title: 'Основы бурятского языка',
        description: 'Начните с базовых фраз и приветствий.',
        route: '/modules/basics',
        disabled: false, // Модуль доступен
    },
    {
        id: 2,
        title: 'Продвинутый курс',
        description: 'Углубитесь в грамматику и сложные фразы.',
        route: '/modules/advanced',
        disabled: true, // Модуль недоступен
    },
];

function goToModule(route: string) {
    router.push(route);
}

function rgbToHex(rgb: string) {
    const result = rgb.match(/\d+/g);
    if (result) {
        return (
            '#' +
            result
                .slice(0, 3)
                .map((x) => {
                    const hex = parseInt(x).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                })
                .join('')
        );
    }
    return rgb; // Возвращаем исходное значение, если не удалось преобразовать
}

onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: '/' }); // Или другой маршрут по умолчанию
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
    .header-inner {
        padding: 16px 0;
    }
}

.list-wrapper {
    display: flex;
    list-style-type: none;

    .number {
        margin: 0 15px auto 0;
        position: relative;

        .circle {
            display: block;
            width: 15px;
            height: 15px;
            background-color: rgba(114, 35, 109, 0.416);
            border-radius: 50%;
            margin: auto;
            position: absolute;
            z-index: -1;
            left: -5px;
            top: 5px;
        }
    }
}

h2 {
    margin-bottom: 0;
}

.modules-list {
    list-style-type: none;
    padding: 0 0 0 15px;
    margin: 0;

    li {
        margin-bottom: 16px;
        transition: background-color 0.3s;

        &.disabled {
            .list-wrapper {
                pointer-events: none;
                opacity: 0.1;
                cursor: not-allowed;
            }
        }

        .list-wrapper {
            text-decoration: none;
            display: flex;
            align-items: center;
            color: #eee;

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
