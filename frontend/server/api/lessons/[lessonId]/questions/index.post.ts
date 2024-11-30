// server/api/lessons/[lessonId]/questions/index.post.ts

import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const { lessonId } = event.context.params as { lessonId: string };

    if (!lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: lessonId is required',
        });
    }

    const body = await readBody(event);

    try {
        const response = await $fetch(`${apiBase}/lessons/${lessonId}/questions`, {
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
