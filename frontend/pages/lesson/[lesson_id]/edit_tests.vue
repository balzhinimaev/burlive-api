<template>
    <div class="test-page">
        {{ route.params }}
        <div v-if="isFetching">
            <div class="container my-3">
                <p>Загрузка тестов...</p>
            </div>
        </div>
        <header v-else>
            <div class="container" v-if="lesson">
                <div class="header-inner">
                    <h2 class="heading">Редактирование тестов</h2>
                    <p class="breadcrumb">
                        <nuxt-link to="/">Главная</nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/modules/' + lesson.moduleId._id">
                            {{ lesson.moduleId.short_title || '{module}' }}
                        </nuxt-link>
                        <span class="split">/</span>
                        <nuxt-link :to="'/lesson/' + lesson._id">
                            {{ lesson.title || '{lesson.title}' }}
                        </nuxt-link>
                    </p>
                </div>
            </div>
        </header>

        <div v-if="lesson">
            <div class="container">
                <form class="add-test-item" @submit.prevent="createTestItemMultipleChoice">
                    <div>
                        <h4>multiple-choice</h4>
                    </div>
                    <div>
                        <label for="question" class="form-label">Введите вопрос теста</label>
                        <input type="text" id="question" class="form-control" v-model="question" required>
                    </div>
                    <div class="form-group">
                        <label for="explanation" class="form-label">Введите объяснение ответа</label>
                        <div class="input-group">
                            <input type="text" id="explanation" class="form-control" v-model="currentExplanation" />
                        </div>
                    </div>
                    <div class="answer-section">
                        <label for="answer" class="form-label">Введите вариант ответа</label>
                        <div class="input-group">
                            <input type="text" id="answer" class="form-control" v-model="currentAnswer"
                                @keyup.enter="addAnswer">
                            <button type="button" class="btn btn-outline-secondary" @click="addAnswer">
                                +
                            </button>
                        </div>
                        <ul class="list-group mt-2" v-if="answers.length">
                            <li class="list-group-item d-flex justify-content-between align-items-center"
                                v-for="(answer, index) in answers" :key="index">
                                <span v-if="editingIndex !== index" style="color: var(--text-color);">{{ answer
                                    }}</span>
                                <input v-else type="text" class="form-control me-2" v-model="editedAnswer">
                                <div>
                                    <button v-if="editingIndex !== index" type="button"
                                        class="btn btn-sm btn-primary me-2" @click="startEdit(index)">
                                        Редактировать
                                    </button>
                                    <button v-else type="button" class="btn btn-sm btn-success me-2"
                                        @click="saveEdit(index)">
                                        Сохранить
                                    </button>
                                    <button type="button" class="btn btn-sm btn-danger" @click="removeAnswer(index)">
                                        Удалить
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <!-- Новый блок для выбора корректного ответа -->
                    <div class="correct-answer-section" v-if="answers.length">
                        <label for="correctAnswer" class="form-label">Выберите корректный ответ</label>
                        <select id="correctAnswer" class="form-select" v-model="correctAnswerIndex" required>
                            <option disabled value="">-- Выберите правильный ответ --</option>
                            <option v-for="(answer, index) in answers" :key="index" :value="index">
                                {{ answer }}
                            </option>
                        </select>
                    </div>

                    <button type="submit" class="btn btn-primary mt-3">+ Добавить Тест</button>
                </form>
                {{ createNewQuestionResponse }}
            </div>
        </div>
    </div>
</template>



<script setup lang="ts">
import { ref, computed, onBeforeMount, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

interface Question {
    question: string;
    options: string[];
    correct: number;
    type: string;
    explanation: string;
}

interface CreateQuestionResponse {
    question: string;
    options: string[];
    correct: number;
    type: string;
    _id: string;
}

const route = useRoute();
const router = useRouter();
const lessonsStore = useLessonsStore();
const isFetching = computed(() => lessonsStore.isFetching);
const lessonId = route.params.lesson_id as string;
const currentExplanation = ref();
const lesson = ref();

const question = ref<string>('');
const currentAnswer = ref<string>('');
const answers = ref<string[]>([]);
const editingIndex = ref<number | null>(null);
const editedAnswer = ref<string>('');
const correctAnswerIndex = ref<number | null>(null); // Новая переменная для хранения индекса правильного ответа

const createNewQuestionResponse = ref<CreateQuestionResponse | null>(null)

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
            router.push({ path: `/lesson/${lessonId}` });
        });
        window.Telegram.WebApp.MainButton.hide();
    }
});

function addAnswer() {
    const answer = currentAnswer.value.trim();
    if (answer) {
        answers.value.push(answer);
        currentAnswer.value = '';
    }
}

function removeAnswer(index: number) {
    answers.value.splice(index, 1);
    // Если удаляется ответ, который был выбран как правильный, сбросим correctAnswerIndex
    if (correctAnswerIndex.value === index) {
        correctAnswerIndex.value = null;
    } else if (correctAnswerIndex.value !== null && index < correctAnswerIndex.value) {
        // Если удален ответ до текущего правильного, сдвинем индекс
        correctAnswerIndex.value -= 1;
    }
}

function startEdit(index: number) {
    editingIndex.value = index;
    editedAnswer.value = answers.value[index];
}

function saveEdit(index: number) {
    const updatedAnswer = editedAnswer.value.trim();
    if (updatedAnswer) {
        answers.value[index] = updatedAnswer;
        editingIndex.value = null;
        editedAnswer.value = '';
    }
}

async function createTestItemMultipleChoice() {
    if (!question.value.trim()) {
        alert('Пожалуйста, введите вопрос.');
        return;
    }
    if (answers.value.length === 0) {
        alert('Пожалуйста, добавьте хотя бы один вариант ответа.');
        return;
    }

    if (correctAnswerIndex.value === null || correctAnswerIndex.value === undefined) {
        alert('Пожалуйста, выберите корректный ответ.');
        return;
    }

    const newQuestion: Question = {
        question: question.value.trim(),
        options: answers.value,
        correct: correctAnswerIndex.value, // Добавляем индекс правильного ответа
        explanation: currentExplanation.value,
        type: 'multiple-choice'
    };

    try {
        // Предполагается, что у вас есть метод для добавления вопроса в урок
        const result: CreateQuestionResponse =  await lessonsStore.createQuestion(newQuestion);
        createNewQuestionResponse.value = result

        if (createNewQuestionResponse.value._id) {
            await lessonsStore.addQuestionToLesson(lesson.value._id, createNewQuestionResponse.value._id)
        }

        // alert('Вопрос успешно добавлен!');
        // Сброс формы
        question.value = '';
        answers.value = [];
    } catch (error) {
        console.error('Error adding test item:', error);
        alert('Произошла ошибка при добавлении вопроса.');
    }
}
</script>

<style lang="scss" scoped>
form {
    color: var(--text-color);
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .answer-section {
        display: flex;
        flex-direction: column;
    }

    .input-group {
        display: flex;
    }

    button[type="submit"] {
        display: block;
        width: 100%;
    }

    input {
        color: var(--text-color) !important;
    }

    .list-group-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .list-group-item input {
        flex-grow: 1;
        margin-right: 1rem;
    }

    .btn {
        margin-left: 0.5rem;
    }
}

.add-test-item {
    background-color: var(--background-component-color);
    padding: 1rem;
    border-radius: 1rem;
}
</style>
