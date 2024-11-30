// server/api/telegram/create-user.post.ts

import { defineEventHandler, createError, readBody, setHeader } from 'h3';

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

// Определение интерфейса CreateUserResponse
interface CreateUserResponse {
    message: string;
    user: User;
}

export default defineEventHandler(async (event): Promise<CreateUserResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
        // Чтение тела запроса
        const telegramUser = await readBody(event);

        console.log('Creating user with data:', telegramUser);

        // Прокси-запрос к бэкенду
        const response: CreateUserResponse = await $fetch(`${apiBase}/telegram/create-user`, {
            method: 'POST',
            headers: {
                Authorization: jwtToken,
                'Content-Type': 'application/json',
            },
            body: telegramUser,
        });

        console.log('Created user:', response);

        // Установка заголовков кэширования (опционально)
        // setHeader(event, 'Cache-Control', `public, max-age=300`);

        return response;
    } catch (error: any) {
        console.error('Ошибка при создании пользователя:', error);

        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
