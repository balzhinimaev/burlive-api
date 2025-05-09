// server/api/telegram/users/index.post.ts

import {
  defineEventHandler,
  createError,
  readBody,
  H3Event,
  // setHeader, // Не нужно для POST create
} from "h3";
import { FetchError } from "ofetch";

// --- Интерфейсы ---

// Интерфейс для тела запроса, ожидаемого от ФРОНТЕНДА к этому Nuxt API
// botusername можно не требовать от фронта, если он статичен
interface FrontendRequestBody {
  id: number; // Обязательно
  first_name: string; // Обязательно
  username?: string | null;
  email?: string | null;
  photo_url?: string | null;
  referral?: string | null; // Если фронт может передавать реферальный код при регистрации
}

// Интерфейс для тела запроса, отправляемого от Nuxt API к БЭКЕНДУ
interface BackendRequestBody extends FrontendRequestBody {
  botusername: string; // Добавляется сервером Nuxt
}

// Интерфейс для УСПЕШНОГО ответа, ожидаемого от БЭКЕНДА
interface BackendSuccessResponse {
  message: string;
  userId: number;
  userMongoId: string; // MongoDB _id пользователя
}

// --- Обработчик Nuxt API ---

export default defineEventHandler(
  async (event: H3Event): Promise<BackendSuccessResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase; // URL бэкенда
    const jwtToken = config.jwtToken; // Серверный токен для бэкенда
    const botUsername = config.telegramBotUsername; // Имя вашего бота из конфига

    // 1. Проверка критической конфигурации
    if (!apiBase) {
      console.error(
        '[API /telegram/users POST] Runtime config "apiBase" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: API base URL missing.",
      });
    }
    if (!jwtToken) {
      console.error(
        '[API /telegram/users POST] Runtime config "apiToken" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Server Configuration Error: API authentication token missing.",
      });
    }
    if (!botUsername) {
      // Считаем botUsername обязательным для регистрации на бэкенде
      console.error(
        '[API /telegram/users POST] Runtime config "telegramBotUsername" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: Bot username missing.",
      });
    }

    // 2. Чтение и валидация тела запроса от фронтенда
    let frontendBody: FrontendRequestBody;
    try {
      frontendBody = await readBody(event);

      // Проверка обязательных полей
      if (!frontendBody || typeof frontendBody !== "object") {
        throw new Error("Invalid request body. Expected an object.");
      }
      if (typeof frontendBody.id !== "number") {
        throw new Error('Missing or invalid "id" (number) in request body.');
      }
      if (
        typeof frontendBody.first_name !== "string" ||
        !frontendBody.first_name
      ) {
        throw new Error(
          'Missing or invalid "first_name" (string) in request body.'
        );
      }
      // Дополнительные проверки типов для опциональных полей (если нужно)
      // ...
    } catch (parseError: any) {
      console.error(
        "[API /telegram/users POST] Error reading or validating request body:",
        parseError
      );
      throw createError({
        statusCode: 400, // Bad Request
        statusMessage: `Bad Request: ${parseError.message}`,
      });
    }

    // 3. Формирование тела запроса для бэкенда
    const backendRequestBody: BackendRequestBody = {
      ...frontendBody, // Копируем все поля от фронтенда
      botusername: botUsername, // Добавляем имя бота из конфига
    };

    // 4. Формирование URL и опций для запроса к бэкенду
    //    ВАЖНО: URL указывает на коллекцию '/telegram/users'
    const backendUrl = `${apiBase}/telegram/users`;

    const fetchOptions: {
      method: "POST";
      headers: { Authorization: string; "Content-Type": string };
      body: string;
    } = {
      method: "POST",
      headers: {
        Authorization: jwtToken, // Серверный токен
        "Content-Type": "application/json",
      },
      // Преобразуем объект в JSON-строку
      body: JSON.stringify(backendRequestBody),
    };

    console.log(
      `[API /telegram/users POST] Proxying user creation request to ${backendUrl}`
    );
    // console.log(`[API /telegram/users POST] Sending body to backend:`, backendRequestBody);

    try {
      // 5. Выполнение прокси-запроса к бэкенду
      //    Ожидаем ответ типа BackendSuccessResponse
      const backendResponse = await $fetch<BackendSuccessResponse>(
        backendUrl,
        fetchOptions
      );

      // Успех! Бэкенд вернул 201 (или другой 2xx), $fetch вернул результат
      console.log(
        `[API /telegram/users POST] User created successfully. Backend response:`,
        backendResponse
      );

      // Устанавливаем статус 201 Created для ответа фронтенду
      event.node.res.statusCode = 201;

      // 6. Возвращение УСПЕШНОГО ответа от бэкенда фронтенду
      return backendResponse;
    } catch (error: unknown) {
      console.error(
        `[API /telegram/users POST] Error creating user via ${backendUrl}:`,
        error
      );

      // 7. Обработка ошибок запроса к бэкенду
      if (error instanceof FetchError) {
        // Ошибка HTTP от бэкенда (4xx, 5xx) или сетевая проблема
        const status = error.response?.status || 500;
        // Пытаемся получить сообщение из тела ответа бэкенда
        // Бэкенд при ошибках (400, 409, 500) возвращает { message: "..." }
        const message =
          error.response?._data?.message || // Сообщение из JSON-тела ошибки бэкенда
          error.message || // Сообщение самой FetchError
          "Failed to proxy user creation request to backend API.";

        // Перебрасываем ошибку фронтенду с кодом и сообщением от бэкенда
        throw createError({
          statusCode: status,
          statusMessage: message, // Используем сообщение от бэкенда
          data: error.response?._data, // Можно передать и все данные ошибки
        });
      } else {
        // Неизвестная ошибка (не от $fetch)
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred in the API proxy.",
        });
      }
    }
  }
);
