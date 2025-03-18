// server/api/tasks.get.ts
import { defineEventHandler } from 'h3';
export interface ITask {
  _id: string;
  title: string;
  description: string;
  taskType: "subscription" | "translation" | "data_entry" | "friend" | "other";
  createdAt: string;
  updatedAt: string;
  rewardPoints: number;
  order?: number;
  imageUrl?: string;
  telegram_channel?: string;
  telegram_chat_id?: number;
  status: "active" | "inactive" | "completed"; // Добавлен статус задачи
}

export interface getTasksResponse {
  tasks: ITask[] | null;
  completedTasks: ITask[] | null;
  completedTaskRecords: {
        _id: string;
        task: ITask;
        user: string;
        promotion: string;
        rewardPoints: number;
        completedAt: string;
        createdAt: string;
        updatedAt: string;
      }[]
    | [];
}

export default defineEventHandler(
  async (_event): Promise<getTasksResponse> => {
    const config = useRuntimeConfig();
    const apiBase = config.apiBase;
    const jwtToken = config.jwtToken;

    try {
      const response: getTasksResponse = await $fetch(`${apiBase}/tasks`, {
        headers: {
          Authorization: jwtToken,
        },
      });

      return response;
    } catch (error: any) {
      console.error("Ошибка при запросе к бэкенду:", error);
      throw new Error("something went wron");
    }
  }
);
