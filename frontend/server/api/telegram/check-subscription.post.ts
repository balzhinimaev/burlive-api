import { defineEventHandler, createError, readBody, setHeader } from 'h3';

// Определение интерфейса CreateUserResponse
interface CheckSubscriptionResponse {
    status: string;
    subscribed: boolean;
}

export default defineEventHandler(
  async (event): Promise<CheckSubscriptionResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
      // Чтение тела запроса
      const telegramUser = await readBody(event);

      // Прокси-запрос к бэкенду
      const response: CheckSubscriptionResponse = await $fetch(
        `${apiBase}/telegram/check-subscription`,
        {
          method: "POST",
          headers: {
            Authorization: jwtToken,
            "Content-Type": "application/json",
          },
          body: telegramUser,
        }
      );

      return response;
    } catch (error: any) {
      console.error("Ошибка при проверке подписки на канал:", error);

      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: error.message || "Internal Server Error",
      });
    }
  }
);
