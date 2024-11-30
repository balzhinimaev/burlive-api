// server/api/telegram/user/is-exists/[telegramId].get.ts

import { defineEventHandler, createError, setHeader } from 'h3';

// Определение интерфейса User
interface User {
    id: number;
    _id: string;
    username?: string;
    email?: string;
    c_username?: string;
    theme: "light" | "dark";
    first_name?: string;
    rating?: number;
    createdAt?: string;
    photo_url?: string;
}

// Определение интерфейса UserExistsResponse
interface UserExistsResponse {
    is_exists: boolean;
    user?: User;
    message: string;
}

export default defineEventHandler(async (event): Promise<UserExistsResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    // Извлекаем telegramId из параметров пути и явно указываем его тип
    const { telegramId } = event.context.params as { telegramId: string };

    if (!telegramId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: telegramId is required',
        });
    }

    try {
        console.log(`Fetching user existence for telegramId: ${telegramId}`);

        // Прокси-запрос к бэкенду
        const response: UserExistsResponse = await $fetch(`${apiBase}/telegram/user/is-exists/${telegramId}`, {
            headers: {
                Authorization: jwtToken,
            },
        });

        console.log(`Fetched user existence for telegramId: ${telegramId}`, response);

        // Установка заголовков кэширования (опционально)
        // setHeader(event, 'Cache-Control', `public, max-age=300`);

        return response;
    } catch (error: any) {
        console.error('Ошибка при проверке существования пользователя:', error);

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
