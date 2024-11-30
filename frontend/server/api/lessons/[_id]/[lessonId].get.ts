// server/api/lessons/[lessonId].get.ts
import { defineEventHandler, createError, setHeader } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    // Извлекаем lessonId из параметров пути
    const { lessonId, _id } = event.context.params as { lessonId: string, _id: string };

    if (!lessonId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: lessonId is required',
        });
    }

    const cacheKey = `lesson_${lessonId}`;
    const CACHE_DURATION = 300; // 5 минут в секундах

    try {
        // Если реализовано кэширование (например, с Redis), можно добавить логику здесь

        if (!lessonId) {
            console.log(`${lessonId} должен быть строкой айди урока`)
            return false
        }

        // Запрос к бэкенду
        const response = await $fetch(`${apiBase}/lessons/${_id}/${lessonId}`, {
            headers: {
                Authorization: jwtToken,
            },
        });

        // // Установка заголовков кэширования (опционально)
        // setHeader(event, 'Cache-Control', `public, max-age=${CACHE_DURATION}`);

        return response;
    } catch (error: any) {
        console.error('Ошибка при запросе конкретного урока:', error);

        // Создаём и выбрасываем ошибку с помощью createError
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
