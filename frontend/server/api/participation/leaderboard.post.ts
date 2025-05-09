import { defineEventHandler, createError, setHeader } from 'h3';
import { User } from '~/stores/userStore';

export interface leaderboardUser {
    id: number;
    _id: string;
    rating: number;
    username?: string;
    first_name?: string;
}

export interface leaderboardItem {
    _id: string;
    promotion: string;
    user: leaderboardUser | null;
    points: number;
    tasksCompleted: string[]; //????
    createdAt: string;
    updatedAt: string;
}

export interface getLeaderboardResponse {
    userRank: number | null,
    leaderboard: leaderboardItem[]
}

export default defineEventHandler(
  async (event): Promise<getLeaderboardResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const body = await readBody(event);

    try {

      console.log(`Пользователь ${body.currentUserId} подтягивает лидерборд`)

      // Прокси-запрос к бэкенду
      const response: getLeaderboardResponse = await $fetch(
        `${apiBase}/participation/leaderboard`,
        {
          method: "POST",
          headers: {
            Authorization: jwtToken,
          },
          body,
        }
      );

      console.log(
        `Лидерборд получен, количество участников: ${response.leaderboard.length}. Позиция пользователя: ${response.userRank}`
      );

      return response;
    } catch (error: any) {
      throw createError({
        statusCode: error.response?.status || 500,
        statusMessage: error.message || "Internal Server Error",
      });
    }
  }
);
