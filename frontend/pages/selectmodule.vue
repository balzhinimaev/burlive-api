<template>
    <div class="page home-page">
        <UserInfo />

        <main>
            <!-- Список модулей после загрузки -->
            <section class="list-items" v-if="!isFetching && modules.length > 0">
                <div class="container">
                    <ModulesItem v-for="module in modules" :module="module" />
                </div>
            </section>

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
function goToModule(route: string) {
    router.push(`/modules/${route}`);
}

onMounted(async () => {
    console.log('onMounted вызван');
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: '/' });
        });
    }
    await modulesStore.fetchModules();
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
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
    margin: 15px 0;
    // border-radius: 20px;
    // overflow: hidden;

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
