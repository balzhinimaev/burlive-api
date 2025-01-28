<template>
    <div class="lesson-page">
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
                            {{ lesson?.title }}
                        </template>
                    </h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/modules/' + lesson?.moduleId._id">
                            {{ lesson?.moduleId.short_title ? lesson?.moduleId.short_title : '{module}' }}
                        </nuxt-link>
                    </p>
                </div>
            </div>
        </header>
        <main>
            <section>
                {{ errorGo }}
                <div class="container">
                    <!-- Плейсхолдер при загрузке -->
                    <template v-if="isFetching">
                        <div class="loading-placeholder content-placeholder">
                            <div class="line" style="width: 90%; height: 20px;"></div>
                            <div class="line" style="width: 80%; height: 16px;"></div>
                            <div class="line" style="width: 95%; height: 16px;"></div>
                            <div class="line" style="width: 85%; height: 16px;"></div>
                            <!-- Добавьте больше линий при необходимости -->
                        </div>
                    </template>
                    <!-- Основной контент после загрузки -->
                    <template v-else>
                        <!-- {{ user }} -->
                        <!-- <button v-if="user?.role === 'admin'" class="btn btn-primary mb-3" @click="goToEditTests(lessonId)">+ Добавить тесты</button> -->
                        <div class="content typography-body" v-html="parsedContent"></div>
                    </template>
                </div>
            </section>
        </main>
    </div>
</template>



<script lang="ts" setup>
import { ref, onBeforeMount, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { marked } from 'marked'; // Ensure you're importing from 'marked'
import DOMPurify from 'dompurify';

const lessonsStore = useLessonsStore();
const userStore = useUserStore();

const user = computed(() => userStore.getUser)
const isFetching = computed(() => useLessonsStore().isFetching)
const route = useRoute();
const lessonId = ref<string>(useRoute().params._id as string);

const router = useRouter();
const _id = ref(<string>route.params._id);
const errorGo = ref()
async function goToEditTests(gotoid: string) {
    try {
        router.push(`/lesson/${gotoid}/edit_tests`)
    } catch (error) {
        errorGo.value = error
    }
}
interface Module {
    _id: string;
    short_title?: string;
}

interface LessonData {
    _id: string;
    title: string;
    description: string;
    content: string;
    moduleId: Module;
    questions: Question[];
    // Add other fields if necessary
}

const lesson = ref<LessonData | null>(null);
const parsedContent = ref<string>('');

const parseContent = (content: string): string => {
    // Use parseSync to ensure synchronous parsing
    const rawHtml = marked.parse(content) as string;
    return DOMPurify.sanitize(rawHtml);
};
const startTest = () => {
    if (lesson.value) {
        router.push({ path: `/lesson/${lesson.value._id}/test` });
    }
};

// onBeforeMount(async () => {
//     if (_id) {
//         try {
//             await lessonsStore.fetchLessonById(_id.value);
//             lesson.value = lessonsStore.getLesson as LessonData;

//             if (lesson.value && lesson.value.content) {
//                 parsedContent.value = parseContent(lesson.value.content);
//             }
//         } catch (error) {
//             console.error('Error loading lesson:', error);
//         }
//     }
// });

watch(
    () => lessonsStore.getLesson,
    (newLesson: LessonData) => {
        lesson.value = newLesson;
        if (lesson.value && lesson.value.content) {
            parsedContent.value = parseContent(lesson.value.content);
        }
    }
);

onMounted(async () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            if (lesson.value) {
                router.push({ path: `/modules/${lesson.value.moduleId._id}` });
            }
        });
        window.Telegram.WebApp.MainButton.setText('Продолжить');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.enable();
        // Добавляем обработчик нажатия на MainButton
        window.Telegram.WebApp.MainButton.onClick(() => {
            startTest();
        });
        if (_id) {
            try {
                await lessonsStore.fetchLessonById(_id.value);
                lesson.value = lessonsStore.getLesson as LessonData;

                if (lesson.value && lesson.value.content) {
                    parsedContent.value = parseContent(lesson.value.content);
                }
            } catch (error) {
                console.error('Error loading lesson:', error);
            }
        }
    }
});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.MainButton.hide();
        window.Telegram.WebApp.MainButton.disable();
        window.Telegram.WebApp.BackButton.offClick();
    }
});
</script>

<style lang="scss" scoped>
.lesson-page {
    // background-color: #191919;
}

main,
header {
    margin: 0;
}

.content {
    color: var(--text-color);
    p, ul {
        margin-bottom: 1rem;
    }
}

</style>

