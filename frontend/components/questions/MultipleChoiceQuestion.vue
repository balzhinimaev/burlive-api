<template>
  <div class="multiple-choice">
    <p class="question-text">{{ question.question }}</p>

    <!-- Если разрешён только один правильный ответ, используем radio -->
    <div v-if="question.singleCorrect">
      <div v-for="(option, index) in question.options" :key="index" class="option">
        <label>
          <input type="radio" :value="index" v-model="selectedSingle" />
          {{ option }}
        </label>
      </div>
    </div>

    <!-- Если можно выбрать несколько вариантов, используем checkbox -->
    <div v-else>
      <div v-for="(option, index) in question.options" :key="index" class="option">
        <label>
          <input type="checkbox" :value="index" v-model="selectedMultiple" />
          {{ option }}
        </label>
      </div>
    </div>

    <!-- Кнопка подтверждения ответа -->
    <button @click="submitAnswer" class="btn btn-primary">Подтвердить ответ</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTestStore } from '@/stores/test';
import type { Question } from '@/stores/Lessons';

const props = defineProps<{ question: Question }>();

const testStore = useTestStore();

// Если для данного вопроса разрешается только один вариант (singleCorrect === true),
// то используем computed для radio‑группы (одиночный выбор)
const selectedSingle = computed<number | null>({
  get() {
    const stored = testStore.getAnswer(props.question._id);
    return typeof stored === 'number' ? stored : null;
  },
  set(value: number | null) {
    if (value === null) {
      testStore.setAnswer(props.question._id, -1); // Если ничего не выбрано, ставим -1
    } else {
      testStore.setAnswer(props.question._id, value);
    }
  },
});

// Если можно выбирать несколько вариантов, то используем computed для checkbox‑группы (массив)
const selectedMultiple = computed<number[]>({
  get() {
    const stored = testStore.getAnswer(props.question._id);
    return Array.isArray(stored) ? stored : [];
  },
  set(value: number[]) {
    testStore.setAnswer(props.question._id, value);
  },
});

function submitAnswer() {
  // Проверка выбранного ответа
  if (props.question.singleCorrect) {
    if (selectedSingle.value === null) {
      alert('Пожалуйста, выберите ответ!');
      return;
    }
    console.log(
      'Отправлен ответ для вопроса:',
      props.question._id,
      'Выбран вариант:',
      selectedSingle.value
    );
  } else {
    console.log(
      'Отправлен ответ для вопроса:',
      props.question._id,
      'Выбраны варианты:',
      selectedMultiple.value
    );
  }

  // Обновляем состояние после ответа (например, можно сделать кнопку "Следующий вопрос" видимой)
  // Это должно активировать переход к следующему вопросу
}
</script>

<style scoped>
.multiple-choice {
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
