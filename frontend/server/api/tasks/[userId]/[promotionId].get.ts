import { defineEventHandler } from "h3";
import { ITask } from "../../tasks.get";

export interface getTasksResponse {
  tasks: ITask[] | null;
  completedTasks: ITask[] | null;
}

export default defineEventHandler(async (event): Promise<getTasksResponse> => {
  const config = useRuntimeConfig();
  const apiBase = config.apiBase;
  const jwtToken = config.jwtToken;

  const { userId, promotionId } = event.context.params as {
    userId: string;
    promotionId: string;
  };

  console.log({ userId, promotionId });

  try {
    const response: getTasksResponse = await $fetch(
      `${apiBase}/tasks/${userId}/${promotionId}`,
      {
        headers: {
          Authorization: jwtToken,
        },
      }
    );

    return response;
  } catch (error: any) {
    console.error("Ошибка при запросе к бэкенду:", error);
    throw new Error("something went wron");
  }
});
