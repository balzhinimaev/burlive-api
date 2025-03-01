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
      {{ addQuestionToLessonResult }}
      <div class="container">
        <form @submit.prevent="createTestItem">
          <div>
            <h4>Добавить новый вопрос</h4>
          </div>
          
          <!-- Вопрос -->
          <div>
            <label for="question" class="form-label">Введите вопрос теста</label>
            <input
              type="text"
              id="question"
              class="form-control"
              autocomplete="off"
              v-model="question"
              required
            />
          </div>

          <!-- Объяснение -->
          <div class="form-group">
            <label for="explanation" class="form-label">Введите объяснение ответа</label>
            <input
              type="text"
              id="explanation"
              autocomplete="off"
              class="form-control"
              v-model="currentExplanation"
              required
            />
          </div>

          <!-- Тип вопроса -->
          <div>
            <label for="type" class="form-label">Тип вопроса</label>
            <select id="type" class="form-select" v-model="questionType" required>
              <option value="multiple-choice">Multiple Choice (несколько верных)</option>
              <option value="fill-blanks">Fill in the blanks</option>
              <option value="single-choice">Single choice</option>
              <option value="image-choice">Image Choice</option>
              <option value="audio-choice">Audio Choice</option>
            </select>
          </div>

          <!-- multiple-choice: ввод ответов + выбор нескольких правильных -->
          <div v-if="questionType === 'multiple-choice'">
            <div class="answer-section">
              <label for="answer" class="form-label">Введите вариант ответа</label>
              <div class="input-group">
                <input
                  type="text"
                  id="answer"
                  class="form-control"
                  autocomplete="off"
                  v-model="currentAnswer"
                  @keyup.enter="addAnswer"
                />
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="addAnswer"
                >
                  +
                </button>
              </div>
              <ul class="list-group mt-2" v-if="answers.length">
                <li
                  class="list-group-item d-flex justify-content-between align-items-center"
                  v-for="(answer, index) in answers"
                  :key="index"
                >
                  <span v-if="editingIndex !== index" style="color: var(--text-color)">
                    {{ answer }}
                  </span>
                  <input
                    v-else
                    type="text"
                    class="form-control me-2"
                    v-model="editedAnswer"
                  />
                  <div>
                    <button
                      v-if="editingIndex !== index"
                      type="button"
                      class="btn btn-sm btn-primary me-2"
                      @click="startEdit(index)"
                    >
                      Редактировать
                    </button>
                    <button
                      v-else
                      type="button"
                      class="btn btn-sm btn-success me-2"
                      @click="saveEdit(index)"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm btn-danger"
                      @click="removeAnswer(index)"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Чекбоксы для выбора нескольких правильных ответов -->
            <div v-if="answers.length">
              <label class="form-label">Выберите один или несколько верных ответов</label>
              <div
                class="form-check"
                v-for="(answer, idx) in answers"
                :key="idx"
                style="margin-bottom: 8px;"
              >
                <input
                  class="form-check-input"
                  type="checkbox"
                  :value="idx"
                  v-model="correctAnswerIndexes"
                  :id="'answerCheck_' + idx"
                />
                <label class="form-check-label" :for="'answerCheck_' + idx">
                  {{ answer }}
                </label>
              </div>
            </div>
          </div>

          <!-- fill-blanks, image-choice, audio-choice и т.д. -->
          <div v-if="questionType === 'fill-blanks'">
            <p>TODO: Реализовать логику для fill-blanks</p>
          </div>

          <div v-if="questionType === 'image-choice'">
            <p>TODO: Реализовать логику для image-choice</p>
          </div>

          <div v-if="questionType === 'audio-choice'">
            <p>TODO: Реализовать логику для audio-choice</p>
          </div>

          <button type="submit" class="btn btn-primary mt-3">+ Добавить тест</button>
        </form>

        <div v-if="createNewQuestionResponse">
          <p>Question Created: {{ createNewQuestionResponse._id }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeMount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLessonsStore, type Question } from '@/stores/Lessons';

const route = useRoute();
const router = useRouter();
// Считываем lessonId из маршрута
const lessonId = route.params.lesson_id as string;

const lessonsStore = useLessonsStore();
const lesson = lessonsStore.getLesson;
// const lesson: Lesson = computed(() => lessonsStore.getLesson) -> optional
const question = ref('');
const currentExplanation = ref('');
const currentAnswer = ref('');
const answers = ref<string[]>([]);

// Редактирование вариантa
const editingIndex = ref<number | null>(null);
const editedAnswer = ref('');

// Для multiple-choice: массив индексов
const correctAnswerIndexes = ref<number[]>([]);

// Тип вопроса
const questionType = ref('multiple-choice');

// После создания вопроса
const createNewQuestionResponse = ref<Question | null>(null);

// Фетчинг
const isFetching = computed(() => lessonsStore.isFetching);

const addQuestionToLessonResult = ref<any>(null)

/** Загружаем урок */
onBeforeMount(async () => {
  if (lessonId) {
    await lessonsStore.fetchLessonById(lessonId);
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
  }});

/** Методы */
function addAnswer() {
  if (currentAnswer.value.trim()) {
    answers.value.push(currentAnswer.value.trim());
    currentAnswer.value = '';
  }
}

function removeAnswer(index: number) {
  answers.value.splice(index, 1);
  // Удаляем индекс из correctAnswerIndexes, если он там есть
  const pos = correctAnswerIndexes.value.indexOf(index);
  if (pos !== -1) {
    correctAnswerIndexes.value.splice(pos, 1);
  }
  // Корректируем все индексы > index (для аккуратного сдвига)
  correctAnswerIndexes.value = correctAnswerIndexes.value.map(i =>
    i > index ? i - 1 : i
  );
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

/** Сабмит формы */
async function createTestItem() {
  if (!question.value.trim()) {
    alert('Пожалуйста, введите вопрос.');
    return;
  }
  if (!answers.value.length) {
    alert('Добавьте хотя бы один вариант ответа.');
    return;
  }

  // Для multiple-choice нужно хотя бы одно правильное
  if (questionType.value === 'multiple-choice') {
    if (correctAnswerIndexes.value.length === 0) {
      alert('Выберите хотя бы один правильный ответ (multiple).');
      return;
    }
  }

  // Формируем объект
  const newQuestionData: any = {
    question: question.value.trim(),
    explanation: currentExplanation.value.trim(),
    type: questionType.value,
    options: [...answers.value],
  };

  if (questionType.value === 'multiple-choice') {
    newQuestionData.correctAnswers = [...correctAnswerIndexes.value];
  }

  try {
    // 1. Создаём вопрос
    const result = await lessonsStore.createQuestion(newQuestionData);
    createNewQuestionResponse.value = result;

    // 2. Привязываем к уроку
    if (result._id) {
      await lessonsStore.addQuestionToLesson(lessonId, result._id);
    }

    // 3. Сброс формы
    question.value = '';
    currentExplanation.value = '';
    answers.value = [];
    correctAnswerIndexes.value = [];

    alert('Вопрос успешно добавлен!');
  } catch (error) {
    console.error('Ошибка при добавлении вопроса:', error);
    alert('Произошла ошибка при добавлении вопроса.');
  }
}
</script>

<style lang="scss" scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answer-section {
  display: flex;
  flex-direction: column;
}

.input-group {
  display: flex;
}

button[type='submit'] {
  display: block;
  width: 100%;
}

.add-test-item {
  padding: 1rem;
  border-radius: 1rem;
}
</style>
