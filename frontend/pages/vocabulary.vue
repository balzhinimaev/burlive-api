<!-- pages/vocabulary.vue -->
<template>
    <div class="page vocabulary-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">
                        <template v-if="isFetching">
                            <div class="loading-placeholder title-placeholder" style="margin: 0;">
                                <div class="line" style="width: 90%; height: 0;"></div>
                            </div>
                        </template>
                        <template v-else>
                            Выберите тему словаря
                        </template>
                    </h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/vocabulary">Словарь</nuxt-link>
                    </p>
                    <p class="typography-body">
                        <template v-if="isFetching">
                            <div class="loading-placeholder description-placeholder">
                                <div class="line" style="width: 100%; height: 16px;"></div>
                                <div class="line" style="width: 80%; height: 16px;"></div>
                                <div class="line" style="width: 90%; height: 16px;"></div>
                            </div>
                        </template>
                        <template v-else>
                            Выберите тему, которую хотите изучать.
                        </template>
                    </p>
                </div>
            </div>
        </header>

        <main>
            <section class="list-items" v-if="!isFetching && themes.length > 0">
                <div class="container">
                    <VocabularyItem v-for="theme in themes" :key="theme._id" :theme="theme" />
                </div>
            </section>

            <template v-else-if="isFetching">
                <div class="container">
                    <ul class="themes-list">
                        <li v-for="n in 3" :key="n" class="loading-placeholder theme-card-placeholder">
                            <a href="javascript:void(0)" class="list-wrapper">
                                <div class="number-placeholder">
                                    <div class="circle-placeholder"></div>
                                </div>
                                <div class="content-placeholder">
                                    <div class="theme-title-placeholder"></div>
                                    <div class="theme-description-placeholder"></div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>
            </template>

            <section v-else-if="errorOnFetchingThemes">
                <div class="container">
                    <p class="typography-body">{{ errorOnFetchingThemes }}</p>
                </div>
            </section>

            <template v-else>
                <div class="container">
                    <p class="typography-body">Темы не найдены.</p>
                </div>
            </template>
        </main>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useRouter } from 'vue-router';
import VocabularyItem from '@/components/Vocabulary/Item.vue';

const vocabularyStore = useVocabularyStore();
const router = useRouter();

const themes = computed(() => vocabularyStore.getThemes);
const isFetching = computed(() => vocabularyStore.isFetching);
const errorOnFetchingThemes = computed(() => vocabularyStore.errorOnFetchingThemes);

onMounted(async () => {
    if (process.client && window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: '/' });
        });
    }
    await vocabularyStore.fetchThemes();
});

onBeforeUnmount(() => {
    if (process.client && window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});
</script>

<style scoped lang="scss">
.page.vocabulary-page {
    /* Ваши стили для страницы словаря */
}
</style>
