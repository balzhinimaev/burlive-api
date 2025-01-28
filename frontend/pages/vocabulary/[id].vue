<template>
    <div class="page theme-detail-page">
        <!-- Отображение состояния загрузки -->
        <div v-if="isLoading">Загрузка...</div>

        <!-- Отображение ошибки -->
        <div v-else-if="error">{{ error }}</div>

        <!-- Отображение темы и слов -->
        <div v-else>
            <header>
                <div class="container">
                    <h2>{{ theme?.name }}</h2>
                    <p>{{ theme?.description }}</p>
                </div>
            </header>

            <main>
                <div class="container">
                    <ul class="words-list">
                        <li v-for="word in words" :key="word._id">
                            <p>{{ word.text }}</p>
                            <!-- Отобразить дополнительные данные слова, если нужно -->
                        </li>
                    </ul>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

interface Word {
    _id: string;
    text: string;
    language: string;
    normalized_text: string;
    translations: Word[];
    translations_u: Word[];
    createdAt: string;
    updatedAt: string;
}

interface Theme {
    _id: string;
    name: string;
    description?: string;
    words: Word[]; // Массив объектов Word
    complexity: number;
    viewCounter: number;
}

const route = useRoute();
const vocabularyStore = useVocabularyStore();

const theme = ref<Theme | null>(null);
const words = ref<Word[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const router = useRouter()
onMounted(async () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: `/vocabulary` });
        });
    }
    
    const themeId = route.params.id as string;
    try {
        theme.value = await vocabularyStore.fetchThemeById(themeId);
        if (theme.value) {
            words.value = theme.value.words;
        } else {
            error.value = 'Тема не найдена';
        }
    } catch (e) {
        error.value = 'Ошибка при загрузке темы';
        console.error(e);
    } finally {
        isLoading.value = false;
    }
});
</script>

<style scoped>
/* Ваши стили */
.page.theme-detail-page {
    /* Стили для страницы темы */
}

header {
    /* Стили для заголовка */
}

main {
    /* Стили для основного контента */
}

.words-list {
    list-style-type: none;
    padding: 0;
}

.words-list li {
    padding: 8px 0;
    border-bottom: 1px solid #ccc;
}
</style>
