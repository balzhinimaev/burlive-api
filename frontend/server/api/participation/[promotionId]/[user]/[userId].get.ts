// server/api/lessons/[lessonId].get.ts
import { defineEventHandler, createError, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const apiBase = config.apiBase;
  const jwtToken = config.jwtToken;

  // Извлекаем параметры из пути
  const { promotionId, userId } = event.context.params as {
    promotionId: string;
    userId: string;
  };

  if (!promotionId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: promotionId is required",
    });
  }
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request: userId is required",
    });
  }

  try {

    // Запрос к бэкенду
    const response = await $fetch(
      `${apiBase}/participation/${promotionId}/user/${userId}`,
      {
        headers: {
          Authorization: jwtToken,
        },
      }
    );

    console.log(response)
    // // Установка заголовков кэширования (опционально)
    // setHeader(event, 'Cache-Control', `public, max-age=${CACHE_DURATION}`);

    return response;
  } catch (error: any) {
    console.error("Ошибка при проверке пользователя на статус участия в розыгрыше", error);

    // Создаём и выбрасываем ошибку с помощью createError
    throw createError({
      statusCode: error.response?.status || 500,
      statusMessage: error.message || "Internal Server Error",
    });
  }
});
