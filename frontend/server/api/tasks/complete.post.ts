import { defineEventHandler, createError, readBody, setHeader } from "h3";

// Определение интерфейса CreateUserResponse
interface TaskCompletionResponse {
  message: string;
  taskCompletion: {
    _id: string;
    task: string;
    user: string;
    promotion: string;
    rewardPoints: number;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export default defineEventHandler(
  async (event): Promise<TaskCompletionResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
      // Чтение тела запроса
      const telegramUser = await readBody(event);

      // Прокси-запрос к бэкенду
      const response: TaskCompletionResponse = await $fetch(
        `${apiBase}/tasks/complete`,
        {
          method: "POST",
          headers: {
            Authorization: jwtToken,
            "Content-Type": "application/json",
          },
          body: telegramUser,
        }
      );

      console.log(response);

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
