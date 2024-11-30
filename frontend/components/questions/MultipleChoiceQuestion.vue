<!-- components/questions/MultipleChoiceQuestion.vue -->
<template>
    <div class="multiple-choice-question">
        <p>{{ question.question }}</p>
        <div v-for="(option, index) in question.options" :key="index" class="option-container" :class="{
            correct: isSelected(index) && isCorrect(index),
            incorrect: isSelected(index) && !isCorrect(index),
        }" @click="selectOption(index)">
            <label class="option-label">
                <input type="radio" :value="index" v-model="selectedOption" @change="emitAnswer" class="radio-input" />
                <span class="option-text">{{ option }}</span>
            </label>
            <transition name="fade">
                <div v-if="isSelected(index)" class="explanation">
                    <span v-if="isCorrect(index)">{{ question.explanation }}</span>
                    <span v-else>Объяснение: {{ question.explanation }}</span>
                </div>
            </transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Question {
    _id: string;
    type: string;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

const props = defineProps<{
    question: Question;
}>();

const emits = defineEmits(['answer']);

const selectedOption = ref<number | null>(null);

const emitAnswer = () => {
    emits('answer', selectedOption.value);
};

const selectOption = (index: number) => {
    selectedOption.value = index;
};

const isCorrect = (index: number) => {
    return index === props.question.correct;
};

const isSelected = (index: number) => {
    return selectedOption.value === index;
};
</script>

<style scoped>
.multiple-choice-question {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.option-container {
    padding: 8px;
    background-color: var(--background-component-color);
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    position: relative;
}

.option-container.correct {
    background-color: #d4edda;
    /* Зеленый цвет для правильного ответа */
}

.option-container.incorrect {
    background-color: #f8d7da;
    /* Красный цвет для неправильного ответа */
}

.option-label {
    display: flex;
    align-items: center;
}

.radio-input {
    display: none;
    /* Скрываем стандартный радио-кнопку */
}

.option-text {
    margin-left: 8px;
}

.explanation {
    margin-top: 8px;
    padding: 8px;
    background-color: #f1f1f1;
    border-radius: 4px;
    overflow: hidden;
    transition: max-height 0.5s ease, opacity 0.5s ease;
}

.fade-enter-active,
.fade-leave-active {
    transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    max-height: 0;
    opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
    max-height: 500px;
    /* Достаточно большое значение для плавного раскрытия */
    opacity: 1;
}
</style>
