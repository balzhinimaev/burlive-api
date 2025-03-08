<template>
    <div class="page module-page">
        <UserInfo />
        <main>
            <div class="container">
                <!-- Плейсхолдеры при загрузке -->
                <template v-if="!isFetching">
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
                        <LessonItem v-for="(lesson, index) in lessonsByModuleId" :key="lesson._id" :lesson="lesson"
                            :ref="(el) => { if (el) lessonRefs[index] = el }" class="lesson-card-hidden" />
                    </section>
                </template>
                <!-- Отображение ошибки -->
                <template v-else-if="errorOnFetchingLessons">
                    <div class="container">
                        <p class="typography-body">{{ errorOnFetchingLessons }}</p>
                    </div>
                </template>
                <!-- Плейсхолдеры по умолчанию (опционально можно удалить) -->
                <!-- <template v-else>
                    <section id="lessons-list">
                        <div class="loading-placeholder lesson-card-placeholder" v-for="n in 3" :key="n">
                            <div class="lesson-icon-placeholder"></div>
                            <div class="lesson-info-placeholder">
                                <div class="lesson-title-placeholder"></div>
                                <div class="lesson-description-placeholder"></div>
                            </div>
                        </div>
                    </section>
                </template> -->
            </div>
        </main>
    </div>
</template>


<script setup lang="ts">
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

// Наблюдатель для прокрутки
const observer = ref<IntersectionObserver | null>(null);
const lessonRefs = ref<any>([]);

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
    observer.value = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                // Проверяем, виден ли элемент
                if (entry.isIntersecting) {
                    // Элемент виден: добавляем класс для анимации появления
                    entry.target.classList.add('lesson-card-visible');
                    entry.target.classList.remove('lesson-card-hidden');
                } else {
                    // Элемент не виден: удаляем класс анимации и добавляем скрытие
                    entry.target.classList.remove('lesson-card-visible');
                    entry.target.classList.add('lesson-card-hidden');
                }
            });
        },
        { threshold: 0.4 } // Порог видимости
    );
});

watch(
    lessonsByModuleId,
    (newLessons) => {
        if (newLessons && newLessons.length > 0) {
            nextTick(() => {
                lessonRefs.value.forEach((lessonItem: any) => {
                    if (lessonItem && lessonItem.$el) {
                        observer.value?.observe(lessonItem.$el);
                    }
                });
            });
        }
    },
    { immediate: true }
);
// Скрываем кнопку назад при размонтировании компонента
onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.BackButton.offClick();
    }
    observer.value?.disconnect();
});
</script>


<style scoped lang="scss">
#lessons-list {
    margin: 2rem 0 calc(-1rem - 20px);
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

.lesson-card-with-animation {
    opacity: 0;
    transform: translateY(10px);
    /* Исходное положение */
    animation: fadeInUp 0.6s ease-out forwards;
    animation-delay: 0.1s;
    /* Добавьте задержку для последовательного появления */

    /* Появление при загрузке */
    &.lesson-card-with-animation:nth-child(n) {
        animation-delay: calc(0.1s * var(--index));
    }
}

/* Ключевая анимация для плавного появления */
@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
        /* Завершающее положение */
    }
}
.lesson-card-hidden {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.9s ease-out, transform 0.9s ease-out;
}

.lesson-card-visible {
    opacity: 1;
    transform: translateY(-20px);
    transition: opacity 0.9s ease-out, transform 0.9s ease-out;
}
</style>
