// server/api/telegram/create-user.post.ts

import { defineEventHandler, createError, readBody, setHeader } from "h3";

// Определение интерфейса UpdateUserPhoto
interface UpdateUserPhoto {
  message: string;
}

export default defineEventHandler(
  async (event): Promise<UpdateUserPhoto> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
      // Чтение тела запроса
      const photo_url = await readBody(event);

      // Прокси-запрос к бэкенду
      const response: UpdateUserPhoto = await $fetch(
        `${apiBase}/telegram/user/photo`,
        {
          method: "POST",
          headers: {
            Authorization: jwtToken,
            "Content-Type": "application/json",
          },
          body: photo_url,
        }
      );

      console.log("user photo updated:", response);

      // Установка заголовков кэширования (опционально)
      // setHeader(event, 'Cache-Control', `public, max-age=300`);

      return response;
    } catch (error: any) {
      console.error("Ошибка при обновлении фотографии:", error);

      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: error.message || "Internal Server Error",
      });
    }
  }
);
