import { defineEventHandler, createError, setHeader } from 'h3';
import { User } from '~/stores/userStore';

export default defineEventHandler(async (event): Promise<User[]> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;


    try {

        // Прокси-запрос к бэкенду
        const response: User[] = await $fetch(`${apiBase}/telegram/leaderboard`, {
            headers: {
                Authorization: jwtToken,
            },
        });

        return response;
    } catch (error: any) {
        throw createError({
            statusCode: error.response?.status || 500,
            statusMessage: error.message || 'Internal Server Error',
        });
    }
});
