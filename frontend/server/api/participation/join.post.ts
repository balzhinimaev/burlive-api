import { defineEventHandler, createError, setHeader } from 'h3';

interface leaderboardItem {
    _id: string;
    promotion: string;
    user: string;
    points: number;
    tasksCompleted: string[]; //????
    createdAt: string;
    updatedAt: string;
}

export interface participationJoinResponse {
  message: string;
  participation: leaderboardItem;
}

export default defineEventHandler(
  async (event): Promise<participationJoinResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    const body = await readBody(event);

    try {
      // Прокси-запрос к бэкенду
      const response: participationJoinResponse = await $fetch(
        `${apiBase}/participation/join`,
        {
          method: "POST",
          headers: {
            Authorization: jwtToken,
          },
          body,
        }
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
