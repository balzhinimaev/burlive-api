<template>
    <div class="page module-page">
        <header>
            <div class="container">
                <div class="header-inner">
                    <h2 class="heading">
                        <template v-if="isFetching">
                            <div class="loading-placeholder title-placeholder">
                                <div class="line" style="width: 90%; height: 20px;"></div>
                            </div>
                        </template>
                        <template v-else>
                            {{ title }}
                        </template>
                    </h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/modules/' + _id">{{ short_title ? short_title : title }}</nuxt-link>
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
                            {{ description }}
                        </template>
                    </p>
                </div>
            </div>
        </header>
        <main>
            <div class="container">
                <!-- Плейсхолдеры при загрузке -->
                <template v-if="isFetching">
                    <section id="lessons-list">
                        <div class="loading-placeholder lesson-card-placeholder" v-for="n in 3" :key="n">
                            <div class="lesson-icon-placeholder"></div>
                            <div class="lesson-info-placeholder">
                                <div class="lesson-title-placeholder"></div>
                                <div class="lesson-description-placeholder"></div>
                            </div>
                        </div>
                    </section>
                </template>
                <!-- Основной контент после загрузки -->
                <template v-else-if="lessonsByModuleId && lessonsByModuleId.length > 0">
                    <section id="lessons-list">
                        <LessonItem v-for="(lesson, index) in lessonsByModuleId" :key="lesson._id" :lesson=lesson />
                        <!-- <a href="javascript:void(0)" @click.prevent="goToLesson(lesson._id)" class="lesson-card"
                            v-for="(lesson, index) in lessonsByModuleId" :key="lesson._id">
                            <div class="lesson-icon">
                                {{ index + 1 }}
                                <div class="circle"></div>
                            </div>
                            <div class="lesson-info">
                                <h3 class="lesson-title">{{ lesson.title }}</h3>
                                <p class="lesson-description">{{ lesson.description || '' }}</p>
                            </div>
                        </a> -->
                    </section>
                </template>
                <!-- Отображение ошибки -->
                <template v-else-if="errorOnFetchingLessons">
                    <div class="container">
                        <p class="typography-body">{{ errorOnFetchingLessons }}</p>
                    </div>
                </template>
                <!-- Плейсхолдеры по умолчанию (опционально можно удалить) -->
                <template v-else>
                    <section id="lessons-list">
                        <div class="loading-placeholder lesson-card-placeholder" v-for="n in 3" :key="n">
                            <div class="lesson-icon-placeholder"></div>
                            <div class="lesson-info-placeholder">
                                <div class="lesson-title-placeholder"></div>
                                <div class="lesson-description-placeholder"></div>
                            </div>
                        </div>
                    </section>
                </template>
            </div>
        </main>
    </div>
</template>


<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const lessonsStore = useLessonsStore();
const route = useRoute();
const router = useRouter();

// Получаем реактивное значение _id
const _id = computed(() => route.params._id as string);
// Геттеры из хранилища
const lessonsByModuleId = computed(() => lessonsStore.getLessons);

const isFetching = computed(() => lessonsStore.isFetching);
const errorOnFetchingLessons = computed(() => lessonsStore.errorOnFetchingLessons);
const title = computed(() => lessonsStore.title);
const description = computed(() => lessonsStore.description);
const short_title = computed(() => lessonsStore.short_title);

// Функция для загрузки уроков по ID модуля
function fetchLessons(telegramId?: number) {
    if (typeof _id.value === 'string') {
        lessonsStore.fetchLessonsByModuleId(_id.value, telegramId);
    }
}

// Вызываем fetchLessons при монтировании компонента
onMounted(async () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            router.push({ path: '/selectmodule' });
        });
        if (window.Telegram.WebApp.initDataUnsafe) {
            fetchLessons(window.Telegram.WebApp.initDataUnsafe.user.id);
        }
    }
});
onBeforeMount(async () => {
    // fetchLessons()
})

// Наблюдаем за изменениями _id и вызываем fetchLessons при изменении
watch(_id, () => {
    fetchLessons();
});

// Скрываем кнопку назад при размонтировании компонента
onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
});
</script>


<style scoped lang="scss">
#lessons-list {
    margin: -8px 0;
}
.loading-placeholder {
    position: relative;
    overflow: hidden;
    background-color: var(--background-component-color);
    /* Цвет фона плейсхолдера */
    border-radius: 4px;
    margin-bottom: 16px;
}

/* Эффект мерцания (shimmer) */
.loading-placeholder::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(100%);
    }
}

/* Плейсхолдер для заголовка */
.title-placeholder {
    width: 90%;
    height: 24px;
    margin-bottom: 16px;
    border-radius: 4px;
}

/* Плейсхолдер для описания */
.description-placeholder {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.description-placeholder .line {
    border-radius: 4px;
}

/* Плейсхолдер для карточек уроков */
.lesson-card-placeholder {
    display: flex;
    align-items: center;
    padding: 16px;
    // border: 1px solid #333;
    border-radius: 8px;
    margin-bottom: 16px;
}

/* Плейсхолдер для иконки урока */
.lesson-icon-placeholder {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    // background-color: #3a3a3a;
    margin-right: 16px;
    position: relative;
}

/* Плейсхолдер для информации об уроке */
.lesson-info-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* Плейсхолдер для названия урока */
.lesson-title-placeholder {
    width: 80%;
    height: 20px;
    border-radius: 4px;
}

/* Плейсхолдер для описания урока */
.lesson-description-placeholder {
    width: 100%;
    height: 16px;
    border-radius: 4px;
}

/* Дополнительные стили для адаптивности (опционально) */
@media (max-width: 768px) {
    .lesson-card-placeholder {
        flex-direction: column;
        align-items: flex-start;
    }

    .lesson-icon-placeholder {
        margin-right: 0;
        margin-bottom: 12px;
    }

    .lesson-title-placeholder {
        width: 100%;
    }
}

/* Дополнительные стили для анимации плавности */
.loading-placeholder,
.title-placeholder,
.description-placeholder,
.lesson-card-placeholder,
.lesson-icon-placeholder,
.lesson-title-placeholder,
.lesson-description-placeholder {
    // background-color: #2c2c2c;
    /* Общий цвет фона */
}
</style>
