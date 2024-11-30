// server/api/vocabulary/[id].get.ts

import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;
    const id = event.context.params?.id;

    try {
        const response = await $fetch(`${apiBase}/themes/${id}`, {
            headers: {
                Authorization: jwtToken,
            },
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при запросе темы к бэкенду:', error);
        throw new Error('Ошибка при запросе темы к бэкенду');
    }
});