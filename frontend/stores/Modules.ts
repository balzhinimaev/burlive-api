// stores/modules.ts
import { defineStore } from 'pinia';

export interface Module {
  _id: string;
  title: string;
  description: string;
  short_title: string;
  lessons: string[];
  disabled: boolean;
  order: number;
  complexity: number;
  isPremium: boolean;
  viewsCounter: number;
}

export const useModulesStore = defineStore({
    id: 'modules',

    state: () => ({
        isFetching: true as boolean,
        isErrorOnFetchingModules: false as boolean,
        errorOnFetchingModules: '' as string,
        modules: [] as Module[],
    }),

    getters: {
        getModules: (state) => state.modules,
    },

    actions: {
        async fetchModules() {
            this.isFetching = true;
            this.isErrorOnFetchingModules = false;
            this.errorOnFetchingModules = '';

            try {
                const response = await $fetch<{
                    modules: Module[];
                    count: number;
                    total_count: number;
                    current_page: number;
                    total_pages: number;
                }>(`/api/modules`, {
                    // По умолчанию Nuxt проксирует запросы через серверные API маршруты
                });

                this.modules = response.modules.map((module) => ({
                    ...module,
                    _id: module._id,
                    route: `/modules/${module._id}`,
                    disabled: false,
                }));
            } catch (error: any) {
                this.isErrorOnFetchingModules = true;
                this.errorOnFetchingModules = 'Ошибка при запросе модулей';
                console.error('Ошибка при запросе модулей:', error);
            } finally {
                this.isFetching = false;
            }
        },
    },
});
