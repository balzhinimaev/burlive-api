<template>
  <div class="test-component">
    <div v-if="currentQuestion">
      <div class="question-container">
        <p class="question-text">{{ currentQuestion.question }}</p>

        <!-- В зависимости от типа вопроса, показываем соответствующие элементы -->
        <div v-if="currentQuestion.type === 'single-choice' || currentQuestion.singleCorrect">
          <!-- Если singleCorrect: true, показываем кастомные кнопки для одного выбора -->
          <div v-for="(option, index) in currentQuestion.options" :key="index" class="option">
            <button :class="['custom-button', { selected: selectedAnswer === index }]" @click="selectedAnswer = index">
              {{ option }}
            </button>
          </div>
        </div>

        <div v-if="currentQuestion.type === 'multiple-choice' && !currentQuestion.singleCorrect">
          <!-- Если singleCorrect: false, показываем кастомные кнопки для множественного выбора -->
          <div v-for="(option, index) in currentQuestion.options" :key="index" class="option">
            <button :class="['custom-button', { selected: selectedAnswers.includes(index) }]"
              @click="toggleMultipleChoice(index)">
              {{ option }}
            </button>
          </div>
        </div>

        <div v-if="currentQuestion.type === 'fill-blanks'">
          <div v-for="(blank, index) in currentQuestion.blanks" :key="index" class="blank">
            <p>{{ blank.textBefore }}
              <select v-model="selectedBlanks[index]" class="select">
                <option v-for="(option, optionIndex) in blank.options" :key="optionIndex" :value="optionIndex">
                  {{ option }}
                </option>
              </select>
              {{ blank.textAfter }}
            </p>
          </div>
        </div>
      </div>

      <!-- Прогресс теста -->
      <div v-if="!isTestCompleted" class="progress-bar">
        <p>Прогресс: {{ progress }}%</p>
      </div>
    </div>

    <!-- Сообщение о завершении теста -->
    <div v-if="isTestCompleted">
      <p>Тест завершён! Ваши ответы отправлены на сервер.</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useLessonsStore, type Question } from '@/stores/Lessons';
import { useRouter } from 'vue-router';

const lessonsStore = useLessonsStore();
const router = useRouter();

const questions = computed(() => lessonsStore.lesson.questions);
const lessonId = router.currentRoute.value.params.lesson_id as string;

let currentIndex = ref(0);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const selectedAnswer = ref<number | null>(null);
const selectedAnswers = ref<number[]>([]);
const selectedBlanks = ref<number[]>([]);
const isTestCompleted = ref(false);

// Прогресс теста
const progress = computed(() => {
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100);
});

const isAnswerDisabled = computed(() => {
  if (currentQuestion.value.type === 'fill-blanks') {
    return selectedBlanks.value.some((value) => value === undefined);
  }
  if (currentQuestion.value.type === 'multiple-choice' && !currentQuestion.value.singleCorrect) {
    return selectedAnswers.value.length === 0;
  }
  return selectedAnswer.value === null;
});

const showTelegramButton = computed(() => {
  // Показывать кнопку, если ответ выбран
  return currentQuestion.value.singleCorrect
    ? selectedAnswer.value !== null
    : selectedAnswers.value.length > 0;
});

onMounted(() => {
  if (window.Telegram?.WebApp) {
    // Инициализация кнопки в WebApp
    window.Telegram.WebApp.MainButton.setText("Подтвердить ответ");

    // Настройка скрытия и отображения кнопки
    window.Telegram.WebApp.MainButton.onClick(() => {
      submitAnswer();
    });

    window.Telegram.WebApp.MainButton.hide(); // Скрываем кнопку до выбора ответа
  }
});

const submitAnswer = async () => {
  const answerData = {
    lessonId,
    questionId: currentQuestion.value._id,
    answer: currentQuestion.value.type === 'multiple-choice' && currentQuestion.value.singleCorrect
      ? selectedAnswer.value // Если singleCorrect: true, отправляем только один ответ
      : selectedAnswers.value, // Если множественный выбор, отправляем все выбранные ответы
  };

  // Отправляем ответ на сервер
  await fetch('/api/test/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(answerData),
  });

  // Сохраняем данные в Pinia (если необходимо)
  lessonsStore.addAnswer(answerData);

  // Переходим к следующему вопросу
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
    selectedAnswer.value = null;
    selectedAnswers.value = [];
    selectedBlanks.value = [];
  } else {
    isTestCompleted.value = true;
  }
};

const toggleMultipleChoice = (index: number) => {
  if (selectedAnswers.value.includes(index)) {
    selectedAnswers.value = selectedAnswers.value.filter(item => item !== index);
  } else {
    selectedAnswers.value.push(index);
  }
};

watch(showTelegramButton, (newVal) => {
  if (window.Telegram?.WebApp) {
    if (newVal) {
      window.Telegram.WebApp.MainButton.show();
    } else {
      window.Telegram.WebApp.MainButton.hide();
    }
  }
});
</script>

<style scoped>

.question-container {
  margin-bottom: 20px;
}

.question-text {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.option {
  margin: 10px 0;
}

.custom-button {
  display: inline-block;
  padding: 10px 14px;
  background-color: #ffffff;
  color: rgb(50, 50, 50);
  border: none;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s ease;
}

.custom-button.selected {
  background-color: #dcdcdc;
}

.custom-button:hover {
  background-color: #d2d2d2;
}

.custom-button:active {
  background-color: #dfdfdf;
}

.custom-button:disabled {
  background-color: #d6d6d6;
  cursor: not-allowed;
}

.select {
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 100%;
  font-size: 14px;
}

.progress-bar {
  margin-top: 20px;
  font-weight: bold;
  font-size: 14px;
}

.finish-message {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: #28a745;
}

.finish-message p {
  margin-top: 20px;
  color: #28a745;
}
</style>
