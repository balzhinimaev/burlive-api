// server/api/question/index.post.ts

import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const body = await readBody(event);

    try {
        const response = await $fetch(`${apiBase}/questions`, {
            method: 'POST',
            headers: {
                Authorization: jwtToken,
                'Content-Type': 'application/json',
            },
            body,
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при добавлении вопроса:', error);

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || 'Internal Server Error',
            data: error.data || error.message,
        });
    }
});
