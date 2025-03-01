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
          <h2 class="heading mb-0">Тестирование урока</h2>
          <!-- <h1>{{ lesson.title }}</h1> -->
          <!-- <h2>{{ lesson.title }}</h2> -->
          <!-- <h3>{{ lesson.title }}</h3> -->
          <!-- <h4>{{ lesson.title }}</h4> -->
          <h5>{{ lesson.title }}</h5>
          <!-- <h6>{{ lesson.title }}</h6> -->
          <p class="breadcrumb">
            <nuxt-link to="/">Главная</nuxt-link>
            <span class="split">/</span>
            <nuxt-link :to="'/modules/' + lesson.moduleId._id">
              {{ lesson.moduleId.short_title ? lesson.moduleId.short_title : '{module}' }}
            </nuxt-link>
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
        <!-- Отображаем компонент с тестами, передаём массив вопросов -->
        <TestComponent :questions="lesson.questions" :lessonId="lessonId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeMount, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TestComponent from '@/components/TestComponent.vue';

// Предположим, вы импортируете store:
import { useLessonsStore, type Lesson } from '@/stores/Lessons';

// Инициализируем route/router/stores
const route = useRoute();
const router = useRouter();
const lessonsStore = useLessonsStore();

// Считываем lessonId из маршрута
const lessonId = route.params.lesson_id as string;

// Реактивные данные
const isFetching = computed(() => lessonsStore.isFetching);
const lesson = ref<Lesson | null>(null);

// Загружаем урок перед монтированием
onBeforeMount(async () => {
  if (lessonId) {
    try {
      await lessonsStore.fetchLessonById(lessonId);
      lesson.value = lessonsStore.getLesson; // после загрузки из store
    } catch (error) {
      console.error('Error loading lesson:', error);
    }
  }
});

// При монтировании настраиваем кнопку "Назад" Telegram
onMounted(() => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.BackButton.show();
    window.Telegram.WebApp.BackButton.onClick(() => {
      router.push({ path: `/lesson/${lessonId}` });
    });
    window.Telegram.WebApp.MainButton.hide();
  }
});
</script>
