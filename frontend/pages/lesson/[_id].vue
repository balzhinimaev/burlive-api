<template>
    <div class="lesson-page">
        <UserInfo />
        <div class="breadcrumb">
            <div class="container">
                <p>Главная / модули / урок</p>
            </div>
        </div>

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
                    <!-- <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link to="/selectmodule">Модули</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/modules/' + lesson?.moduleId._id">
                            {{ lesson?.moduleId.short_title ? lesson?.moduleId.short_title : '{module}' }}
                        </nuxt-link>
                    </p> -->
                </div>
            </div>
        </header>
        <!-- конец заголовка -->

        <main ref="contentRef">
            <section>
                {{ errorGo }}
                <div class="container">
                    <template v-if="isFetching">
                        <div class="loading-placeholder content-placeholder">
                            <div class="line" style="width: 90%; height: 20px;"></div>
                            <div class="line" style="width: 80%; height: 16px;"></div>
                            <div class="line" style="width: 95%; height: 16px;"></div>
                            <div class="line" style="width: 85%; height: 16px;"></div>
                        </div>
                    </template>
                    <template v-else>
                        <div class="content typography-body" v-html="parsedContent"></div>
                    </template>
                </div>
            </section>
        </main>
        <!-- конец контента -->

        <footer class="d-flex my-3" v-if="user?.role === 'admin'">
            <!-- <button v-if="!isFetching" class="btn btn-primary m-auto" @click="startTest()">Перейти к тестированию</button> -->
            <div><button v-if="!isFetching" class="btn btn-primary m-auto" @click="goToEditTests(_id)">Добавить
                    тесты</button></div>
        </footer>
    </div>
</template>



<script lang="ts" setup>
import { marked } from 'marked'; // Ensure you're importing from 'marked'
import DOMPurify from 'dompurify';

const lessonsStore = useLessonsStore();
const userStore = useUserStore();
const user = computed(() => useUserStore().getUser)
const isFetching = computed(() => useLessonsStore().isFetching)
const route = useRoute();
const router = useRouter();
const _id = ref(<string>route.params._id);
const errorGo = ref()
const contentRef = ref<HTMLElement | null>(null);
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

const lesson = ref<Lesson | null>(null);
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

onBeforeMount(async () => {
    if (_id) {
        try {
            lessonsStore.lessons.forEach(element => {
                if (_id.value === element._id) {
                    lessonsStore.lesson = element
                }
            })
            // await lessonsStore.fetchLessonById(_id.value);
            lesson.value = lessonsStore.getLesson as Lesson;

            if (lesson.value && lesson.value.content) {
                parsedContent.value = parseContent(lesson.value.content);
            }
        } catch (error) {
            console.error('Error loading lesson:', error);
        }
    }
});

watch(
    () => lessonsStore.getLesson,
    (newLesson: Lesson) => {
        lesson.value = newLesson;
        if (lesson.value && lesson.value.content) {
            parsedContent.value = parseContent(lesson.value.content);
            // Проверяем позицию прокрутки после обновления контента
        }
    }
);

onMounted(async () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.show();
        window.Telegram.WebApp.BackButton.onClick(() => {
            useRouter().push({ path: `/modules/${lesson.value?.moduleId}` });
        });
        window.Telegram.WebApp.MainButton.setText('Пройти тест');
        window.Telegram.WebApp.MainButton.onClick(() => startTest());
        window.Telegram.WebApp.MainButton.show();
    }

    // Загружаем урок
    if (_id.value) {
        // try {
        //     await lessonsStore.fetchLessonById(_id.value);
        //     lesson.value = lessonsStore.getLesson as LessonData;

        //     if (lesson.value?.content) {
        //         parsedContent.value = parseContent(lesson.value.content);
        //     }
        // } catch (error) {
        //     console.error('Ошибка загрузки урока:', error);
        // }
    }

});

onBeforeUnmount(() => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.BackButton.hide();
        window.Telegram.WebApp.MainButton.hide();
    }
});

</script>

<style lang="scss" scoped>
div.breadcrumb {
    margin: .3rem 1rem;
    p {
        font-size: 12px;
    }
}
main,
header {
    margin: 0;
    h2 {
        margin-bottom: 0;
    }
}
header {
    margin: 15px 15px 0;
}
main {
    margin: 0
}
.content {
    color: var(--text-color);
    p, ul {
        margin-bottom: 1rem;
    }
}

</style>

