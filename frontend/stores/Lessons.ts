// stores/lessons.ts

import { defineStore } from "pinia";
import { useUserStore } from "./userStore"; // Предполагается, что у вас есть userStore

/********************************
 * Интерфейс "пропуск" (для fill-blanks)
 ********************************/
interface Blank {
  textBefore: string;
  textAfter: string;
  options: string[]; // варианты слов для вставки
  correctIndex: number; // индекс правильного варианта
}

/********************************
 * Интерфейс основного вопроса
 ********************************/
export interface Question {
  _id: string; // ID вопроса

  question: string; // Текст вопроса
  explanation: string; // Объяснение ответа
  type:
    | "single-choice"
    | "multiple-choice"
    | "fill-blanks"
    | "image-choice"
    | "audio-choice"; // single-choice, multiple-choice, fill-blanks, image-choice, audio-choice...

  // Поля для single-choice
  correct?: number;
  singleCorrect?: boolean;

  // Поля для multiple-choice
  correctAnswers?: number[];

  // Поля для fill-blanks
  blanks?: Blank[];

  // Поля для image-choice
  imageOptions?: string[]; // ссылки на картинки
  correctImageIndex?: number; // индекс правильной картинки (или несколько)

  // Поля для audio-choice
  audioUrl?: string; // ссылка на аудиофайл

  // Общие варианты
  options?: string[]; // текстовые варианты
}

/********************************
 * Интерфейс для "создания" вопроса (CreateQuestion)
 * (что фронт отправляет при POST /api/question)
 ********************************/
export interface CreateQuestion {
  question: string;
  explanation: string;
  type: string; // single-choice, multiple-choice, fill-blanks, image-choice, audio-choice...

  // single-choice
  correct?: number;

  // multiple-choice
  correctAnswers?: number[];

  // fill-blanks
  blanks?: Blank[];

  // image-choice
  imageOptions?: string[];
  correctImageIndex?: number;

  // audio-choice
  audioUrl?: string;

  // Для всех типов (кроме fill-blanks?), если нужно
  options?: string[];
}

/********************************
 * Интерфейс Урока
 ********************************/
export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  order: number;
  moduleId: {
    _id: string;
    short_title: string;
  }
  questions: Question[];
  disabled?: boolean;
  complexity: number;
  viewsCounter?: number;
  content: string;
}

/********************************
 * Ответ от API при fetchLessonById
 ********************************/
export interface ResponseFetchLessonById {
  _id: string;
  title: string;
  description: string;
  content: string;
  moduleId: {
    _id: string;
    short_title: string;
  };
  order: number;
  questions: Question[];
}

/********************************
 * Интерфейс Module (опционально)
 ********************************/
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

/********************************
 * Pinia Store: lessons
 ********************************/
export const useLessonsStore = defineStore({
  id: "lessons",

  state: () => ({
    // Состояния фетчинга
    isFetching: true as boolean,
    isErrorOnFetchingLessons: false as boolean,
    errorOnFetchingLessons: "" as string,
    answers: [] as Array<{ questionId: string; answer: any }>,
    // Текущий урок
    lesson: {} as Lesson,
    // Список уроков
    lessons: [] as Lesson[],

    // Поля для описания текущего модуля / урока
    title: "" as string,
    short_title: "" as string,
    description: "" as string,
    content: "" as string,

    module: null as null | Module,
    questions: null as null | Question[],

    createQuestionResult: null as any,
  }),

  getters: {
    getLessons: (state): Lesson[] => state.lessons,
    getLesson: (state): Lesson => state.lesson,
  },

  actions: {
    addAnswer(answerData: { questionId: string; answer: any }) {
      this.answers.push(answerData);
    },
    /***************************************************************
     * 1) Получить уроки по ID модуля
     ***************************************************************/
    async fetchLessonsByModuleId(moduleId: string, telegram_id?: any) {
      this.isFetching = true;
      this.isErrorOnFetchingLessons = false;
      this.errorOnFetchingLessons = "";

      try {
        // Проверяем / загружаем user, если нужно
        const userStore = useUserStore();
        if (!userStore.user?._id) {
          await userStore.checkUserExists(telegram_id);
        }

        // Предположим, что бэкенд: POST /api/lessons/module/:id
        // возвращает { lessons, title, short_title, description? }
        const response = await $fetch<{
          lessons: Lesson[];
          title: string;
          short_title: string;
          description?: string;
        }>(`/api/lessons/module/${moduleId}`, {
          method: "POST",
          body: {
            telegramUser: userStore.getUser?._id,
          },
        });

        this.lessons = response.lessons || [];
        this.title = response.title;
        this.short_title = response.short_title;
        this.description = response.description ?? "";
      } catch (error: any) {
        this.isErrorOnFetchingLessons = true;
        this.errorOnFetchingLessons = "Ошибка при запросе уроков";
        console.error("Ошибка при запросе уроков:", error);

        this.lessons = [];
      } finally {
        this.isFetching = false;
      }
    },

    /***************************************************************
     * 2) Получить конкретный урок по его ID
     ***************************************************************/
    async fetchLessonById(lessonId: string) {
      this.isFetching = true;
      this.isErrorOnFetchingLessons = false;
      this.errorOnFetchingLessons = "";

      try {
        const userStore = useUserStore();
        const userId = userStore.user?._id;

        // Предположим, бэкенд эндпоинт:
        // GET /api/lessons/:telegramUserId/:lessonId
        // Возвращает ResponseFetchLessonById
        const response = await $fetch<Lesson>(
          `/api/lessons/${userId}/${lessonId}`
        );

        if (!response || !response._id) {
          throw new Error("Некорректный формат ответа от API");
        }

        // Записываем полученный урок
        this.lesson = response;
        this.title = response.title || "";
        this.short_title = response.moduleId?.short_title || "";
        this.description = response.description || "";
        this.content = response.content || "";
        this.questions = response.questions || [];
      } catch (error: any) {
        this.isErrorOnFetchingLessons = true;
        this.errorOnFetchingLessons = "Ошибка при запросе урока";
        console.error("Ошибка при запросе уроков:", error);
      } finally {
        this.isFetching = false;
      }
    },

    /***************************************************************
     * 3) Создать вопрос (POST /api/question)
     *    Включая поля imageOptions, audioUrl, blanks, etc.
     ***************************************************************/
    async createQuestion(questionData: CreateQuestion): Promise<Question> {
      try {
        // Предположим, ваш роут: POST /api/question
        const response = await $fetch<Question>("/api/question", {
          method: "POST",
          body: questionData,
        });
        this.createQuestionResult = response;
        return response;
      } catch (error: any) {
        console.error("Ошибка при добавлении вопроса:", error);
        throw error;
      }
    },

    /***************************************************************
     * 4) Привязать вопрос к уроку (PUT /api/lessons/:lessonId/:questionId)
     ***************************************************************/
    async addQuestionToLesson(lessonId: string, questionId: string) {
      try {
        console.log("добавление теста к уроку");
        // Пример: PUT /api/lessons/:lessonId/:questionId
        // Должен быть настроен на бэкенде
        await $fetch<Question>(`/api/question/${lessonId}/${questionId}`, {
          method: "PUT",
        });

        // Если нужно — обновить локальный state
        // (например, дозагрузить урок заново или вставить вопрос в this.lesson.questions)
        return 123123;
      } catch (error: any) {
        console.error("Ошибка при добавлении вопроса к уроку:", error);
      }
    },

    /***************************************************************
     * 5) Обновить вопрос
     ***************************************************************/
    async updateQuestionInLesson(
      lessonId: string,
      questionId: string,
      updatedQuestion: Question
    ) {
      try {
        // Предположим, PUT /api/lessons/:lessonId/questions/:questionId
        const response = await $fetch<Question>(
          `/api/lessons/${lessonId}/questions/${questionId}`,
          {
            method: "PUT",
            body: updatedQuestion,
          }
        );
        // При желании обновляем локальный state
        if (this.lesson && this.lesson._id === lessonId) {
          const idx = this.lesson.questions.findIndex(
            (q) => q._id === questionId
          );
          if (idx !== -1) {
            this.lesson.questions.splice(idx, 1, response);
          }
        }
      } catch (error: any) {
        console.error("Ошибка при обновлении вопроса:", error);
      }
    },

    /***************************************************************
     * 6) Удалить вопрос из урока
     ***************************************************************/
    async deleteQuestionFromLesson(lessonId: string, questionId: string) {
      try {
        // Например, DELETE /api/lessons/:lessonId/questions/:questionId
        await $fetch(`/api/lessons/${lessonId}/questions/${questionId}`, {
          // @ts-ignore
          method: "DELETE",
        });
        if (this.lesson && this.lesson._id === lessonId) {
          this.lesson.questions = this.lesson.questions.filter(
            (q) => q._id !== questionId
          );
        }
      } catch (error: any) {
        console.error("Ошибка при удалении вопроса:", error);
      }
    },

    /***************************************************************
     * 7) Изменить порядок вопросов (reorder)
     ***************************************************************/
    async reorderQuestionsInLesson(lessonId: string, questions: Question[]) {
      try {
        // Например, PUT /api/lessons/:lessonId/questions/reorder
        await $fetch(`/api/lessons/${lessonId}/questions/reorder`, {
          method: "PUT",
          body: { questions },
        });
        // Обновляем локально
        if (this.lesson && this.lesson._id === lessonId) {
          this.lesson.questions = questions;
        }
      } catch (error: any) {
        console.error("Ошибка при изменении порядка вопросов:", error);
      }
    },
  },
});
