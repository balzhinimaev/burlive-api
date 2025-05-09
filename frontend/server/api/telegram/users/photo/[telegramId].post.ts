// server/api/telegram/users/photo/[telegramId].post.ts

import {
  defineEventHandler,
  createError,
  readBody,
  H3Event,
  // setHeader, // Раскомментируйте, если нужно кэширование
} from "h3";
import { FetchError } from "ofetch";

// --- Интерфейсы ---

// Интерфейс для тела запроса, ожидаемого от фронтенда
interface FrontendRequestBody {
  photo_url: string | null; // Позволяем null для удаления фото
}

// Интерфейс для тела ответа, ожидаемого от бэкенда
interface BackendResponseBody {
  message: string;
}

// --- Обработчик Nuxt API ---

export default defineEventHandler(
  async (event: H3Event): Promise<BackendResponseBody> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase; // URL бэкенда
    const jwtToken = config.jwtToken; // Токен для сервер-сервер аутентификации

    // 1. Проверка критической конфигурации
    if (!apiBase) {
      console.error(
        '[API /telegram/users/photo] Runtime config "apiBase" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: API base URL missing.",
      });
    }
    if (!jwtToken) {
      console.error(
        '[API /telegram/users/photo] Runtime config "apiToken" (or your name for it) is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Server Configuration Error: API authentication token missing.",
      });
    }

    // 2. Извлечение и валидация параметра telegramId из URL
    const telegramId = event.context.params?.telegramId;

    if (!telegramId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Telegram ID is required in the URL path.",
      });
    }

    const idAsNumber = Number(telegramId);
    if (isNaN(idAsNumber)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Bad Request: Invalid Telegram ID format. Expected a number, got "${telegramId}".`,
      });
    }

    // 3. Чтение и валидация тела запроса от фронтенда
    let requestBody: FrontendRequestBody;
    try {
      requestBody = (await readBody(event)) as FrontendRequestBody;
      // Проверяем наличие обязательного поля
      if (requestBody?.photo_url === undefined) {
        throw new Error('Missing "photo_url" in request body.');
      }
      // Дополнительная валидация: photo_url должен быть строкой или null
      if (
        typeof requestBody.photo_url !== "string" &&
        requestBody.photo_url !== null
      ) {
        throw new Error('Invalid "photo_url" type. Expected string or null.');
      }
    } catch (parseError: any) {
      console.error(
        "[API /telegram/users/photo] Error reading or validating request body:",
        parseError
      );
      throw createError({
        statusCode: 400,
        statusMessage: `Bad Request: Invalid request body. ${parseError.message}`,
      });
    }

    const photoUrlFromFrontend = requestBody.photo_url;

    // 4. Формирование URL и опций для запроса к бэкенду
    //    URL бэкенда НЕ содержит ID, он передается в теле
    const backendUrl = `${apiBase}/telegram/users/photo`;

    // Формируем тело для отправки на бэкенд
    const backendRequestBody = {
      userId: idAsNumber, // Передаем ID пользователя
      photo_url: photoUrlFromFrontend, // Передаем URL фото (или null)
    };

    // Указываем КОНКРЕТНЫЙ метод 'POST' в типе
    const fetchOptions: {
      method: "POST"; // <--- ИЗМЕНЕНИЕ ЗДЕСЬ (тип)
      headers: {
        Authorization: string; // Лучше указать string, если jwtToken всегда строка
        "Content-Type": string;
      };
      body: string; // Тело должно быть строкой (JSON.stringify)
    } = {
      method: "POST", // <--- ИЗМЕНЕНИЕ ЗДЕСЬ (значение)
      headers: {
        Authorization: jwtToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(backendRequestBody), // Убедитесь, что тело - строка
    };

    console.log(
      `[API /telegram/users/photo] Proxying photo update for telegramId: ${telegramId} to ${backendUrl}`
    );
    // console.log(`[API /telegram/users/photo] Sending body to backend:`, backendRequestBody);

    try {
      // 5. Выполнение прокси-запроса к бэкенду
      const backendResponse = await $fetch<BackendResponseBody>(
        backendUrl,
        fetchOptions
      );

      console.log(
        `[API /telegram/users/photo] Photo updated successfully for ${telegramId}. Backend response:`,
        backendResponse
      );

      // Опционально: Установка заголовков кэширования (для POST обычно не нужно)
      // setHeader(event, 'Cache-Control', 'no-store');

      // 6. Возвращение ответа от бэкенда фронтенду
      return backendResponse;
    } catch (error: unknown) {
      console.error(
        `[API /telegram/users/photo] Error updating photo for telegramId ${telegramId} via ${backendUrl}:`,
        error
      );

      // 7. Обработка ошибок запроса к бэкенду
      if (error instanceof FetchError) {
        const status = error.response?.status || 500;
        const message =
          error.response?._data?.message || // Сообщение из тела ответа бэкенда
          error.message ||
          "Failed to proxy photo update request to backend API.";

        throw createError({
          statusCode: status,
          statusMessage: message,
          data: error.response?._data,
        });
      } else {
        // Неизвестная ошибка
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred in the API proxy.",
        });
      }
    }
  }
);
