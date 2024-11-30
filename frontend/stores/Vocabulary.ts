// stores/vocabulary.ts
import { defineStore } from 'pinia';

export interface Word {
    _id: string;
    text: string;
    language: string;
    normalized_text: string;
    translations: Word[];
    translations_u: Word[];
    createdAt: string;
    updatedAt: string;
}

export interface Theme {
    _id: string;
    name: string;
    description?: string;
    words: Word[]; // Массив объектов Word
    complexity: number;
    viewCounter: number;
}

export const useVocabularyStore = defineStore({
    id: 'vocabulary',

    state: () => ({
        isFetching: true as boolean,
        isErrorOnFetchingThemes: false as boolean,
        errorOnFetchingThemes: '' as string,
        themes: [] as Theme[],
    }),

    getters: {
        getThemes: (state) => state.themes,
    },

    actions: {
        async fetchThemes() {
            this.isFetching = true;
            this.isErrorOnFetchingThemes = false;
            this.errorOnFetchingThemes = '';

            try {
                const response = await $fetch<{
                    themes: Theme[];
                    totalThemes: number;
                    currentPage: number;
                    totalPages: number;
                }>(`/api/vocabulary`, {
                    // По умолчанию Nuxt проксирует запросы через серверные API маршруты
                });

                this.themes = response.themes.map((theme) => ({
                    ...theme,
                    _id: theme._id,
                    route: `/vocabulary/${theme._id}`,
                }));
            } catch (error: any) {
                this.isErrorOnFetchingThemes = true;
                this.errorOnFetchingThemes = 'Ошибка при запросе тем словаря';
                console.error('Ошибка при запросе тем словаря:', error);
            } finally {
                this.isFetching = false;
            }
        },

        async fetchThemeById(themeId: string): Promise<Theme | null> {
            try {
                const response = await $fetch<{ message: string; theme: Theme }>(`/api/vocabulary/${themeId}`);
                return response.theme;
            } catch (error: any) {
                console.error('Ошибка при запросе темы:', error);
                return null;
            }
        },
    },
});
