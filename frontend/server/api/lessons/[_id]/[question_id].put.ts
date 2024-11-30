// server/api/lessons/module/[_id]/[question_id].put.ts
import { defineEventHandler, createError, setHeader } from 'h3';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    // Извлекаем параметры пути
    const { _id } = event.context.params as { _id: string };
    const { question_id } = event.context.params as { question_id: string };

    console.log(_id)
    console.log(question_id)

    if (!_id || !question_id) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: _id is required',
        });
    }

    const CACHE_DURATION = 300; // 5 минут в секундах

    try {
        // Если реализовано кэширование (например, с Redis), можно добавить логику здесь
        // Чтение тела запроса
        // const telegramUser = await readBody(event);

        // Запрос к бэкенду
        const response = await $fetch(`${apiBase}/lessons/${_id}/${question_id}`, {
            method: 'PUT',
            headers: {
                Authorization: jwtToken,
            }
        });

        // Установка заголовков кэширования (опционально)
        // setHeader(event, 'Cache-Control', `public, max-age=${CACHE_DURATION}`);

        return response;
    } catch (error: any) {
        console.error('Ошибка при добавлении элемента теста к уроку:', error);

        // Создаём и выбрасываем ошибку с помощью createError
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
