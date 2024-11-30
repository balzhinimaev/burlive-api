// server/api/vocabulary.get.ts
import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
        const response = await $fetch(`${apiBase}/themes`, {
            headers: {
                Authorization: jwtToken,
            },
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при запросе к бэкенду:', error);
        throw new Error('Ошибка при запросе к бэкенду');
    }
});
