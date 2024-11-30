// server/api/words.post.ts
import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const body = await readBody(event);
    const { ids } = body;

    try {
        const response = await $fetch(`${apiBase}/words/getByIds`, {
            method: 'POST',
            headers: {
                Authorization: jwtToken,
                'Content-Type': 'application/json',
            },
            body: { ids },
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при запросе слов к бэкенду:', error);
        throw new Error('Ошибка при запросе слов к бэкенду');
    }
});
