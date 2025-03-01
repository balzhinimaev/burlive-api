<template>
  <div class="single-choice">
    <p class="question-text">{{ question.question }}</p>
    <div v-for="(option, index) in question.options" :key="index" class="option">
      <label>
        <input 
          type="radio" 
          :value="index" 
          v-model="selectedAnswer" 
        />
        {{ option }}
      </label>
    </div>
    <button @click="submitAnswer" class="btn btn-primary">Подтвердить ответ</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTestStore } from '@/stores/test';
import type { Question } from '@/stores/Lessons'; // Импортируйте тип Question из вашего модуля

// Получаем объект вопроса через пропсы
const props = defineProps<{ question: Question }>();

// Подключаем store для теста
const testStore = useTestStore();

// Двусторонняя связь для single‑choice (значение – номер выбранного варианта)
const selectedAnswer = computed<number | null>({
  get() {
    const stored = testStore.getAnswer(props.question._id);
    // Если в store уже число – возвращаем его, иначе null (ничего не выбрано)
    return typeof stored === 'number' ? stored : null;
  },
  set(value: number | null) {
    if (value === null) {
      // Можно сбросить ответ, например, установив -1 или удалив ключ
      testStore.setAnswer(props.question._id, -1);
    } else {
      testStore.setAnswer(props.question._id, value);
    }
  },
});

// Функция подтверждения ответа (например, можно сделать запрос через промежуточный API)
function submitAnswer() {
  console.log(
    'Отправлен ответ для вопроса:',
    props.question._id,
    'Выбран вариант:',
    selectedAnswer.value
  );
  // Пример запроса через Nuxt API (при необходимости):
  /*
  await $fetch(`/api/test/submit`, {
    method: 'POST',
    body: { questionId: props.question._id, answer: selectedAnswer.value }
  });
  */
}
</script>

<style scoped>
.single-choice {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.question-text {
  font-weight: bold;
  margin-bottom: 0.5rem;
}
.option {
  margin-bottom: 0.5rem;
}
</style>
