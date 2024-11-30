// server/api/lessons/module/[moduleId].get.ts
import { defineEventHandler, createError, setHeader } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    // Извлекаем moduleId из параметров пути
    const { moduleId } = event.context.params as { moduleId: string };

    if (!moduleId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: moduleId is required',
        });
    }

    const cacheKey = `lessons_module_${moduleId}`;
    const CACHE_DURATION = 300; // 5 минут в секундах

    try {
        // Если реализовано кэширование (например, с Redis), можно добавить логику здесь
        // Чтение тела запроса
        const telegramUser = await readBody(event);
        
        // Запрос к бэкенду
        const response = await $fetch(`${apiBase}/lessons/module/${moduleId}`, {
            method: 'POST',
            headers: {
                Authorization: jwtToken,
            },
            body: telegramUser
        });

        // Установка заголовков кэширования (опционально)
        // setHeader(event, 'Cache-Control', `public, max-age=${CACHE_DURATION}`);

        return response;
    } catch (error: any) {
        console.error('Ошибка при запросе уроков по модулю:', error);

        // Создаём и выбрасываем ошибку с помощью createError
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
