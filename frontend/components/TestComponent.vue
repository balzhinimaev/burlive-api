<template>
    <div class="test-component">
        <div v-for="(question, index) in questions" :key="question._id">
            <component :is="getComponentForQuestionType(question.type)" :question="question"
                @answer="handleAnswer(index, $event)" />
        </div>
        <button class="btn btn-primary mt-3" @click="submitAnswers">Отправить ответы</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MultipleChoiceQuestion from "@/components/questions/MultipleChoiceQuestion.vue";
// import AudioChoiceQuestion from './questions/AudioChoiceQuestion.vue';
// Импортируйте другие компоненты вопросов по мере необходимости
defineProps<{
    questions: Question[];
}>();

const answers = ref<any[]>([]);

const getComponentForQuestionType = (type: string) => {
    switch (type) {
        case 'multiple-choice':
            return MultipleChoiceQuestion;
        // case 'audio-choice':
        //     return AudioChoiceQuestion;
        // Добавьте другие типы вопросов
        default:
            return null;
    }
};

const handleAnswer = (index: number, answer: any) => {
    answers.value[index] = answer;
};

const submitAnswers = () => {
    // Логика отправки ответов на сервер или проверки на клиенте
};
</script>
