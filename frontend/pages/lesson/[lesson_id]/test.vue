<template>
    <div class="test-page">
        <div v-if="isFetching">
            <div class="container my-3">
                <p>Загрузка тестов...</p>
            </div>
        </div>
        <header v-else>
            <div class="container" v-if="lesson">
                <div class="header-inner">
                    <h2 class="heading">Тестирование</h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/modules/' + lesson.moduleId._id">{{ lesson.moduleId.short_title ?
                            lesson.moduleId.short_title : '{module}' }}</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/lesson/' + lesson._id">
                            {{ lesson.title ? lesson.title : '{lesson.title}' }}
                        </nuxt-link>
                    </p>
                </div>
            </div>
        </header>
        <div v-if="lesson">
            <div class="container">
                <TestComponent :questions="lesson.questions" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount } from 'vue';
import { useRoute } from 'vue-router';
import TestComponent from '@/components/TestComponent.vue';
interface ResponseFetchLessonById {
    _id: string;
    title: string;
    description: string;
    content: string;
    moduleId: {
        _id: string;
        short_title: string;
    },
    order: number;
    questions: Question[];
}
const route = useRoute();
const lessonsStore = useLessonsStore();
const isFetching = computed(() => useLessonsStore().isFetching)
const lessonId = route.params.lesson_id as string;

const lesson = ref<ResponseFetchLessonById | null>(null);

onBeforeMount(async () => {
    if (lessonId) {
        try {
            await lessonsStore.fetchLessonById(lessonId);
            lesson.value = lessonsStore.getLesson;
        } catch (error) {
            console.error('Error loading lesson:', error);
        }
    }
});
onMounted(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: `/lesson/${lessonId}` });
        });
        window.Telegram.WebApp.MainButton.hide();
    }
});
</script>
