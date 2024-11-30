// server/api/lessons/[lessonId]/questions/[questionId].delete.ts

import { defineEventHandler, createError } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const { lessonId, questionId } = event.context.params as { lessonId: string; questionId: string };

    if (!lessonId || !questionId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: lessonId and questionId are required',
        });
    }

    try {
        const response = await $fetch(`${apiBase}/lessons/${lessonId}/questions/${questionId}`, {
            method: 'DELETE',
            headers: {
                Authorization: jwtToken,
            },
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при удалении вопроса:', error);

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || 'Internal Server Error',
            data: error.data || error.message,
        });
    }
});
