// server/api/participation/leaderboard/index.post.ts

import {
  defineEventHandler,
  createError,
  H3Event,
  readBody, // Для чтения тела POST-запроса
  setHeader, // Для установки заголовков кэширования
} from "h3";
import { FetchError } from "ofetch";

// --- Интерфейсы ---

// Интерфейс для данных, ожидаемых в теле запроса от фронтенда
interface ParticipationLeaderboardRequestBody {
  currentUserId: string; // ID текущего пользователя для определения его ранга
  promotionId: string; // ID акции, для которой нужен лидерборд
}

// Интерфейс для пользователя в данных участия (основан на populate в контроллере)
interface LeaderboardParticipantUser {
  _id: string; // MongoDB ID
  id: number; // Telegram ID
  username?: string | null;
  first_name?: string;
  // photo_url?: string | null; // Если добавите в populate
  rating?: number;
  dailyRating?: number; // Если добавите в populate
  photo_url?: string;
}

// Интерфейс для одного элемента в массиве leaderboard
export interface LeaderboardParticipation {
  _id: string;
  promotion: string; // ID акции
  user: LeaderboardParticipantUser | null; // Данные пользователя (может быть null, если populate не сработал)
  points: number;
  tasksCompleted: string[]; // Массив ID выполненных задач
  joinDate: string; // Дата приходит как строка из JSON
  // Добавьте другие поля из модели Participation, если они нужны
}

// Интерфейс для всего ответа от бэкенда
export interface BackendLeaderboardResponse {
  leaderboard: LeaderboardParticipation[];
  userRank: number | null; // Ранг текущего пользователя (или null)
}

// --- Обработчик Nuxt API ---

export default defineEventHandler(
  async (event: H3Event): Promise<BackendLeaderboardResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.public.apiBase; // URL бэкенда (используем public, если он нужен и на клиенте)
    // const jwtToken = config.jwtToken; // Секретный серверный токен для бэкенда
    const jwtToken = event.context.token; // Получаем токен пользователя из контекста, добавленный мидлваром

    // 1. Проверка критической конфигурации
    if (!apiBase) {
      console.error(
        '[API /participation/leaderboard] Runtime config "apiBase" is not defined.'
      );
      throw createError({
        statusCode: 500,
        statusMessage: "Server Configuration Error: API base URL missing.",
      });
    }
    // Убрана проверка jwtToken т.к. теперь он берется из контекста запроса пользователя
    // if (!jwtToken) {
    //   console.error(
    //     '[API /participation/leaderboard] Server Authorization Token is not available.'
    //   );
    //   throw createError({
    //     statusCode: 500, // Или 401, если токен должен быть всегда
    //     statusMessage:
    //       "Server Configuration Error: API authentication token missing.",
    //   });
    // }
    if (!jwtToken) {
      console.error(
        "[API /participation/leaderboard] No user token found in request context."
      );
      throw createError({
        statusCode: 401, // Unauthorized
        statusMessage: "Authentication required.",
      });
    }

    // 2. Чтение и валидация тела запроса от фронтенда
    let requestBody: ParticipationLeaderboardRequestBody;
    try {
      requestBody = await readBody<ParticipationLeaderboardRequestBody>(event);
    } catch (error) {
      console.warn(
        "[API /participation/leaderboard] Invalid request body:",
        error
      );
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Invalid request body.",
      });
    }

    // Проверка наличия обязательных полей
    if (!requestBody.currentUserId || !requestBody.promotionId) {
      console.warn(
        "[API /participation/leaderboard] Missing required fields in request body:",
        requestBody
      );
      throw createError({
        statusCode: 400,
        statusMessage:
          "Bad Request: Missing required fields 'currentUserId' or 'promotionId'.",
      });
    }

    // 3. Формирование URL и опций для запроса к бэкенду
    const backendUrl = new URL(`${apiBase}/participation/leaderboard`); // Конечная точка бэкенда

    const fetchOptions = {
      method: "POST" as const, // <--- Use as const here
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    };

    console.log(
      `[API /participation/leaderboard] Proxying POST request for user ${
        requestBody.currentUserId
      } to ${backendUrl.toString()}`
    );

    try {
      // 4. Выполнение прокси-запроса к бэкенду
      const backendResponse = await $fetch<BackendLeaderboardResponse>(
        backendUrl.toString(),
        fetchOptions
      );

      console.log(
        `[API /participation/leaderboard] Leaderboard fetched successfully for user ${requestBody.currentUserId}. Rank: ${backendResponse.userRank}, Count: ${backendResponse.leaderboard.length}`
      );

      // 5. Установка заголовков кэширования
      // Лидерборды могут часто меняться, особенно ранг пользователя.
      // Используем короткое время кэширования или отключаем его.
      // 'no-store' - полностью отключает кэширование
      // 'public, max-age=60, s-maxage=60' - кэш на 1 минуту
      setHeader(event, "Cache-Control", "no-store"); // Безопаснее для динамических данных

      // 6. Возвращение успешного ответа от бэкенда фронтенду
      return backendResponse;
    } catch (error: unknown) {
      console.error(
        `[API /participation/leaderboard] Error fetching leaderboard from ${backendUrl.toString()}:`,
        error
      );

      // 7. Обработка ошибок запроса к бэкенду
      // Очищаем заголовок Cache-Control в случае ошибки
      setHeader(event, "Cache-Control", "no-store");

      if (error instanceof FetchError) {
        const status = error.response?.status || 500;
        const message =
          error.response?._data?.message || // Сообщение из тела ответа бэкенда
          error.message ||
          "Failed to proxy participation leaderboard request to backend API.";

        throw createError({
          statusCode: status,
          statusMessage: message,
          data: error.response?._data, // Передаем доп. данные из ошибки бэкенда, если есть
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
