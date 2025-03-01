// server/api/lessons/[lessonId]/questions/[questionId].put.ts

import { defineEventHandler, readBody, createError } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const { lessonId, questionId } = event.context.params as { lessonId: string; questionId: string };

    console.log(`Айди урока ${lessonId}`)
    console.log(`questionId: ${questionId}`)

    if (!lessonId || !questionId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: lessonId and questionId are required',
        });
    }

    const body = await readBody(event);

    try {
        const response = await $fetch(`${apiBase}/lessons/${lessonId}/${questionId}`, {
            method: 'PUT',
            headers: {
                Authorization: jwtToken,
                'Content-Type': 'application/json',
            },
            body,
        });

        return response;
    } catch (error: any) {
        console.error('Ошибка при обновлении вопроса:', error);

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.response?.statusText || 'Internal Server Error',
            data: error.data || error.message,
        });
    }
});
