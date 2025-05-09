// server/api/telegram/leaderboard/index.get.ts

import {
  defineEventHandler,
  createError,
  H3Event,
  getQuery,
  setHeader, // Для установки заголовков кэширования
} from "h3";
import { FetchError } from "ofetch";
import { ParsedUrlQuery } from "querystring"; // Для типизации getQuery

// --- Интерфейсы ---

// Интерфейс для одного пользователя в таблице лидеров
// Основан на полях, выбираемых в telegramController.getLeaderboard
interface LeaderboardUser {
  _id: string; // Добавим MongoDB ID на всякий случай
  id: number; // Telegram ID
  username?: string | null;
  first_name?: string;
  photo_url?: string | null;
  // level: string | object | null; // В getLeaderboard level НЕ ПОПУЛИРУЕТСЯ, будет ObjectId (строка)
  level?:
    | {
        // Если вы решите ПОПУЛИРОВАТЬ level на бэкенде для лидерборда
        _id: string;
        name: string;
        // ...другие поля уровня...
      }
    | string
    | null; // Оставляем и строку для обратной совместимости или если не популярен
  subscription?: {
    type?: "monthly" | "quarterly" | "annual" | null;
    endDate?: string | null; // Даты придут как строки
    isActive?: boolean;
    // ...другие поля подписки...
  } | null;
  rating?: number;
  // dailyRating?: number; // Если вы добавите это поле в select на бэкенде
}

// Тип ответа от бэкенда - массив пользователей
type BackendLeaderboardResponse = LeaderboardUser[];

// --- Обработчик Nuxt API ---

export default defineEventHandler(
  async (event: H3Event): Promise<BackendLeaderboardResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase; // URL бэкенда
    const jwtToken = config.jwtToken; // Серверный токен для бэкенда

    // 1. Проверка критической конфигурации
    if (!apiBase) {
      console.error(
        '[API /telegram/leaderboard] Runtime config "apiBase" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: API base URL missing.",
      });
    }
    if (!jwtToken) {
      console.error(
        '[API /telegram/leaderboard] Runtime config "apiToken" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage:
          "Server Configuration Error: API authentication token missing.",
      });
    }

    // 2. Получение и валидация query-параметров от фронтенда
    const query: ParsedUrlQuery = getQuery(event);
    const limitParam = query.limit;
    const sortByParam = query.sortBy;

    let limit = 10; // Значение по умолчанию, как на бэкенде
    if (limitParam) {
      const parsedLimit = Number(limitParam);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = parsedLimit;
      } else {
        console.warn(
          `[API /telegram/leaderboard] Invalid 'limit' parameter received: ${limitParam}. Using default ${limit}.`
        );
        // Можно выбросить ошибку 400, если хотите быть строже
        // throw createError({ statusCode: 400, statusMessage: 'Bad Request: Invalid limit parameter. Must be a positive number.' });
      }
    }

    // По умолчанию сортируем по 'rating', как на бэкенде
    const sortBy =
      typeof sortByParam === "string" && sortByParam ? sortByParam : "rating";
    // Тут можно добавить проверку на допустимые значения sortBy, если нужно

    // 3. Формирование URL и опций для запроса к бэкенду
    const backendUrl = new URL(`${apiBase}/telegram/leaderboard`);
    backendUrl.searchParams.append("limit", String(limit));
    backendUrl.searchParams.append("sortBy", sortBy);

    const fetchOptions = {
      // method: 'GET', // <-- УБРАНО
      headers: {
        Authorization: jwtToken,
      },
    };

    console.log(
      `[API /telegram/leaderboard] Proxying request to ${backendUrl.toString()}`
    );

    try {
      // 4. Выполнение прокси-запроса к бэкенду
      const backendResponse = await $fetch<BackendLeaderboardResponse>(
        backendUrl.toString(),
        fetchOptions
      );

      console.log(
        `[API /telegram/leaderboard] Leaderboard fetched successfully. Count: ${backendResponse.length}`
      );

      // 5. Установка заголовков кэширования (например, кэш на 5 минут)
      // Помогает снизить нагрузку, если лидерборд не обновляется ежесекундно
      setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300"); // 300 секунд = 5 минут

      // 6. Возвращение успешного ответа от бэкенда фронтенду
      return backendResponse;
    } catch (error: unknown) {
      console.error(
        `[API /telegram/leaderboard] Error fetching leaderboard from ${backendUrl.toString()}:`,
        error
      );

      // 7. Обработка ошибок запроса к бэкенду
      if (error instanceof FetchError) {
        const status = error.response?.status || 500;
        const message =
          error.response?._data?.message || // Сообщение из тела ответа бэкенда
          error.message ||
          "Failed to proxy leaderboard request to backend API.";

        // Очищаем заголовок Cache-Control в случае ошибки
        setHeader(event, "Cache-Control", "no-store");

        throw createError({
          statusCode: status,
          statusMessage: message,
          data: error.response?._data,
        });
      } else {
        setHeader(event, "Cache-Control", "no-store");
        // Неизвестная ошибка
        throw createError({
          statusCode: 500,
          statusMessage: "An unexpected error occurred in the API proxy.",
        });
      }
    }
  }
);
