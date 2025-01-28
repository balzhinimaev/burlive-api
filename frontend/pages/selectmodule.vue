<template>
    <div class="page home-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">
                        <!-- Плейсхолдер для заголовка при загрузке -->
                        <template v-if="isFetching">
                            <div class="loading-placeholder title-placeholder" style="margin: 0; height: 32px;">
                                <div class="line" style="width: 90%; height: 32px; background-color: var(--background-component-color);"></div>
                            </div>
                        </template>
                        <!-- Реальный заголовок после загрузки -->
                        <template v-else>
                            Выберите модуль
                        </template>
                    </h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link>
                    </p>
                    <p class="typography-body">
                        <!-- Плейсхолдер для описания при загрузке -->
                        <template v-if="isFetching">
                            <div class="loading-placeholder description-placeholder">
                                <div class="line" style="width: 100%; height: 16px;"></div>
                                <div class="line" style="width: 80%; height: 16px;"></div>
                                <div class="line" style="width: 90%; height: 16px;"></div>
                            </div>
                        </template>
                        <!-- Реальное описание после загрузки -->
                        <template v-else>
                            Выберите тему или модуль, который хотите изучать.
                        </template>
                    </p>
                </div>
            </div>
        </header>

        <main>
            <!-- Список модулей после загрузки -->
            <section class="list-items" v-if="!isFetching && modules.length > 0">
                <div class="container">
                    <ModulesItem v-for="module in modules" :module="module" />
                </div>
            </section>

            <!-- Плейсхолдеры при загрузке
            <template v-if="!isFetching && modules.length > 0">
                <div class="container">
                    <p>Подтягивание данных</p>
                    <ul class="modules-list">
                        <li v-for="n in 3" :key="n" class="">
                            <a href="javascript:void(0)" class="list-wrapper">
                                <div class="number-placeholder">
                                    <div class="circle-placeholder"></div>
                                </div>
                                <div class="content-placeholder">
                                    <div class="module-title-placeholder"></div>
                                    <div class="module-description-placeholder"></div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </template> -->

            <!-- Отображение ошибки -->
            <section v-else-if="errorOnFetchingModules">
                <div class="container">
                    <div class="content-wrapper">
                        <p>{{ errorOnFetchingModules }}</p>
                    </div>
                </div>
            </section>

            <!-- Плейсхолдеры по умолчанию (опционально) -->
            <template v-else>
                <div class="container">
                    <ul class="modules-list">
                        <li v-for="n in 1" :key="n" class="loading-placeholder module-card-placeholder">
                            <a href="javascript:void(0)" class="list-wrapper">
                                <div class="number-placeholder">
                                    <div class="circle-placeholder"></div>
                                </div>
                                <div class="content-placeholder-100">
                                    <div class="module-title-placeholder"></div>
                                    <div class="module-description-placeholder"></div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </template>
        </main>
    </div>
</template>

<script setup lang="ts">
import { useModulesStore } from '@/stores/Modules';
import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';

const modulesStore = useModulesStore();
const router = useRouter();

// Получаем доступ к состоянию напрямую без конфликта
const modules = computed(() => modulesStore.getModules);
const isFetching = computed(() => modulesStore.isFetching);
const errorOnFetchingModules = computed(() => modulesStore.errorOnFetchingModules);
const config = useRuntimeConfig()

console.log('Runtime config:', config)
if (import.meta.server) {
    console.log('API secret:', config.jwtToken)
}
function goToModule(route: string) {
    router.push(`/modules/${route}`);
}

onMounted(async () => {
    console.log('onMounted вызван');
    if (process.client && window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: '/' });
        });
    }
    console.log('Перед fetchModules');
    await modulesStore.fetchModules();
    console.log('После fetchModules');
});

onBeforeUnmount(() => {
    if (process.client && window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});
</script>


<style scoped lang="scss">
.content-wrapper {
    padding: 10px;
    background-color: var(--background-component-color);
    border-radius: var(--border-radius);
    .typography-body {
        margin-top: 0;
    }
}
.modules-list {
    list-style-type: none;
    // padding: 0 0 0 15px;
    padding: 0;
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
            // align-items: center;

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
