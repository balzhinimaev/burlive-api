// stores/lessons.ts
import { defineStore } from 'pinia';

// Определение интерфейсов
interface Module {
    _id: string;
    title: string;
    description: string;
    short_title: string;
    lessons: { _id: string; title: string }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    order: number;
    viewsCounter: number;
}

export interface Question {
    question: string;
    options: string[];
    correct: number;
    type: string;
    _id: string;
    explanation: string;
}

interface CreateQuestion {
    question: string;
    options: string[];
    correct: number;
}

export interface Lesson {
    _id: string;
    title: string;
    description?: string;
    order: number;
    moduleId: string;
    questions: Question[];
    disabled?: boolean;
    viewsCounter?: number;
}

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

export const useLessonsStore = defineStore({
    id: 'lessons',

    state: () => ({
        isFetching: true as boolean,
        isErrorOnFetchingLessons: false as boolean,
        errorOnFetchingLessons: '' as string,
        lesson: {} as ResponseFetchLessonById,
        lessons: [] as Lesson[],
        title: "" as string,
        short_title: "" as string,
        description: "" as string,
        content: "" as string,
        module: null as null | Module,
        questions: null as null | Question[],
        // Удалили свойства, связанные с кэшированием
    }),

    getters: {
        getLessons: (state) => state.lessons,
        getLesson: (state) => state.lesson,
    },

    actions: {
        /**
         * Получить уроки по ID модуля
         * @param moduleId ID модуля
         */
        async fetchLessonsByModuleId(moduleId: string, telegram_id?: any) {
            this.isFetching = true;
            this.isErrorOnFetchingLessons = false;
            this.errorOnFetchingLessons = '';

            try {
                const userStore = useUserStore()
                if (!userStore.user?._id) {
                    await userStore.checkUserExists(telegram_id)
                }

                const response = await $fetch<{
                    lessons: Lesson[];
                    title: string;
                    short_title: string;
                    description?: string;
                }>(`/api/lessons/module/${moduleId}`, {
                    method: 'POST',
                    body: {
                        telegramUser: useUserStore().getUser?._id
                    }
                });

                console.log('fetchLessonsByModuleId response:', response); // Добавьте эту строку

                this.lessons = response.lessons || [];
                this.title = response.title;
                this.short_title = response.short_title;
                this.description = response.description ? response.description : '';
            } catch (error: any) {
                this.isErrorOnFetchingLessons = true;
                this.errorOnFetchingLessons = 'Ошибка при запросе уроков';
                console.error('Ошибка при запросе уроков:', error);

                this.lessons = []; // Убедитесь, что в случае ошибки, lessons пустой массив
            } finally {
                this.isFetching = false;
            }
        },


        /**
         * Получить конкретный урок по его ID
         * @param lessonId ID урока
         */
        async fetchLessonById(lessonId: string) {
            this.isFetching = true;
            this.isErrorOnFetchingLessons = false;
            this.errorOnFetchingLessons = '';
            console.log(lessonId)
            try {
                const _id = useUserStore().user?._id
                const response = await $fetch<ResponseFetchLessonById>(`/api/lessons/${_id}/${lessonId}`);

                console.log('API Response for fetchLessonById:', response);

                if (!response || !response._id) {
                    throw new Error('Некорректный формат ответа от API');
                }

                this.lesson = response;
                this.title = response.title || '';
                // this.module = response.moduleId;
                this.description = response.description || '';
                this.content = response.content || '';
                this.questions = response.questions || [];
            } catch (error: any) {
                this.isErrorOnFetchingLessons = true;
                this.errorOnFetchingLessons = 'Ошибка при запросе уроков';
                console.error('Ошибка при запросе уроков:', error);
            } finally {
                this.isFetching = false;
            }
        },

        /**
         * Добавить новый элемент теста
         * @param question Объект теста
         */
        async createQuestion(question: CreateQuestion): Promise<Question | any> {
            try {
                
                const response = await $fetch<Question>(`/api/question`, {
                    method: 'POST',
                    body: question,
                });

                return response

            } catch (error: any) {
                console.error('Ошибка при добавлении вопроса:', error);
                return error
            }
        },

        /**
         * Добавить новый вопрос к уроку
         * @param lessonId ID урока
         * @param question ID вопроса
         */
        async addQuestionToLesson(lessonId: string, question: string) {
            try {
                await $fetch<Question>(`/api/question/${lessonId}/${question}`, {
                    method: 'PUT'
                });

                // Добавляем новый вопрос в локальное состояние
                // if (this.lesson && this.lesson._id === lessonId) {
                    // this.lesson.questions.push(response);
                // }
            } catch (error: any) {
                console.error('Ошибка при добавлении вопроса:', error);
            }
        },

        /**
         * Обновить существующий вопрос в уроке
         * @param lessonId ID урока
         * @param questionId ID вопроса
         * @param updatedQuestion Обновленный объект вопроса
         */
        async updateQuestionInLesson(lessonId: string, questionId: string, updatedQuestion: Question) {
            try {
                const response = await $fetch<Question>(`/api/lessons/${lessonId}/questions/${questionId}`, {
                    method: 'PUT',
                    body: updatedQuestion,
                });
                // Обновляем вопрос в локальном состоянии
                if (this.lesson && this.lesson._id === lessonId) {
                    const index = this.lesson.questions.findIndex(q => q._id === questionId);
                    if (index !== -1) {
                        this.lesson.questions.splice(index, 1, response);
                    }
                }
            } catch (error: any) {
                console.error('Ошибка при обновлении вопроса:', error);
            }
        },

        /**
         * Удалить вопрос из урока
         * @param lessonId ID урока
         * @param questionId ID вопроса
         */
        async deleteQuestionFromLesson(lessonId: string, questionId: string) {
            try {
                await $fetch(`/api/lessons/${lessonId}/questions/${questionId}`, {
                    method: 'DELETE' as any,
                });
                // Удаляем вопрос из локального состояния
                if (this.lesson && this.lesson._id === lessonId) {
                    this.lesson.questions = this.lesson.questions.filter(q => q._id !== questionId);
                }
            } catch (error: any) {
                console.error('Ошибка при удалении вопроса:', error);
            }
        },

        /**
         * Изменить порядок вопросов в уроке
         * @param lessonId ID урока
         * @param questions Массив вопросов с новым порядком
         */
        async reorderQuestionsInLesson(lessonId: string, questions: Question[]) {
            try {
                await $fetch(`/api/lessons/${lessonId}/questions/reorder`, {
                    method: 'PUT',
                    body: { questions },
                });
                // Обновляем порядок вопросов в локальном состоянии
                if (this.lesson && this.lesson._id === lessonId) {
                    this.lesson.questions = questions;
                }
            } catch (error: any) {
                console.error('Ошибка при изменении порядка вопросов:', error);
            }
        },
    },
});
