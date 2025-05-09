// server/api/telegram/user/exists/[telegramId].get.ts

import {
  defineEventHandler,
  createError,
  // setHeader, // Раскомментируйте, если кэширование нужно
  H3Event,
} from "h3";
import { FetchError } from "ofetch"; // ofetch - это то, что использует $fetch под капотом

// --- Интерфейсы (оставляем ваши) ---

// Определение интерфейса для данных пользователя, возвращаемых бэкендом
interface BackendUser {
  id: number; // Telegram ID
  _id: string; // MongoDB ID
  username?: string | null;
  email?: string | null;
  // c_username?: string; // Это поле есть в вашем интерфейсе, но нет в select сервиса по умолчанию. Убедитесь, что оно есть в бэкенде или уберите.
  theme: "light" | "dark";
  first_name?: string;
  rating?: number;
  createdAt?: string; // Обычно строка ISO Date
  photo_url?: string | null;
  role: string;
  phone?: string | null; // Добавлено на основе select в сервисе
  // Уровень детализации подписки может отличаться от бэкенда. Адаптируйте при необходимости.
  subscription?: {
    type?: "monthly" | "quarterly" | "annual" | null;
    startDate?: string | null; // Даты от бэкенда скорее всего придут как строки ISO
    endDate?: string | null;
    isActive?: boolean;
    paymentId?: string; // Убедитесь, что бэкенд возвращает это поле
    // ... другие поля подписки, если есть
  } | null;
  // Уровень детализации level может отличаться. Адаптируйте при необходимости.
  level?: {
    _id: string;
    name: string;
    minRating: number;
    // ... другие поля уровня, если есть
  } | null;
}

// Определение интерфейса ответа от бэкенда
interface UserExistsResponse {
  is_exists: boolean;
  user?: BackendUser; // Используем обновленный интерфейс BackendUser
  message: string;
}

// --- Обработчик Nuxt API ---

export default defineEventHandler(
  async (event: H3Event): Promise<UserExistsResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase; // Предполагаем, что это публичный URL
    const jwtToken = config.jwtToken; // Используйте имя из вашего runtimeConfig

    // 1. Проверка критической конфигурации
    if (!apiBase) {
      console.error(
        '[API /telegram/user/exists] Runtime config "apiBase" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: API base URL missing.",
      });
    }
    if (!jwtToken) {
      console.error(
        '[API /telegram/user/exists] Runtime config "apiToken" (or your name for it) is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Server Configuration Error: API authentication token missing.",
      });
    }

    // 2. Извлечение и валидация параметра telegramId
    const telegramId = event.context.params?.telegramId;

    if (!telegramId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Telegram ID is required.",
      });
    }

    // Дополнительная проверка, что ID - это число
    const idAsNumber = Number(telegramId);
    if (isNaN(idAsNumber)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Bad Request: Invalid Telegram ID format. Expected a number, got "${telegramId}".`,
      });
    }

    // 3. Формирование URL и опций для запроса к бэкенду
    //    ВАЖНО: Убедитесь, что путь '/telegram/users/exists/' соответствует вашему app.ts
    const backendUrl = `${apiBase}/telegram/users/exists/${telegramId}`;
    const fetchOptions: {
      method: "GET"; // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
      headers: {
        Authorization: string; // Лучше указать string, если jwtToken всегда строка
        "Content-Type": string;
      };
    } = {
      method: "GET", // И значение тоже 'GET'
      headers: {
        Authorization: jwtToken,
        "Content-Type": "application/json",
      },
    };

    console.log(
      `[API /telegram/user/exists] Proxying request for telegramId: ${telegramId} to ${backendUrl}`
    );

    try {
      // 4. Выполнение прокси-запроса к бэкенду
      const backendResponse = await $fetch<UserExistsResponse>(
        backendUrl,
        fetchOptions
      );

      // console.log(`[API /telegram/user/exists] Received response for ${telegramId}:`, backendResponse);

      // Опционально: Установка заголовков кэширования для ответа фронтенду
      // setHeader(event, 'Cache-Control', 'public, max-age=60'); // Кэш на 1 минуту

      // 5. Возвращение ответа от бэкенда фронтенду
      return backendResponse;
    } catch (error: unknown) {
      console.error(
        `[API /telegram/user/exists] Error fetching user existence for telegramId ${telegramId} from ${backendUrl}:`,
        error
      );

      // 6. Обработка ошибок запроса к бэкенду
      if (error instanceof FetchError) {
        // Ошибка пришла от $fetch (вероятно, HTTP ошибка от бэкенда или сетевая проблема)
        const status = error.response?.status || 500;
        // Пытаемся получить сообщение из тела ответа бэкенда, если оно есть
        const message =
          error.response?._data?.message ||
          error.message || // Сообщение самой ошибки FetchError
          "Failed to proxy request to backend API.";

        throw createError({
          statusCode: status,
          statusMessage: message,
          data: error.response?._data, // Можно передать доп. данные от бэкенда, если нужно
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
