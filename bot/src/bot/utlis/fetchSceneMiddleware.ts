import rlhubContext from "../models/rlhubContext";
import { loginBurlive } from "../views/home.scene";

export const fetchSceneMiddleware = async (
  ctx: rlhubContext,
  next: () => Promise<void>
) => {
  const userId = ctx.from?.id;

  if (userId) {
    console.log(userId);
    // Логирование
    console.log("Restoring state for user:", userId);
    const data = await loginBurlive();
    try {
      // Подтягиваем стейт пользователя
      const response = await fetch(
        `${process.env.api_url}/telegram/user/get-state/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${data.token}`,
          },
        }
      );

      // Если запрос успешен
      if (response.ok) {
        console.log("Fetch user state response ok");
        const result = await response.json();
        // console.log(result)
        // Ensure result and necessary properties are defined
        if (
          result &&
          result.scene &&
          result.stateData &&
          result.stateData.state
        ) {
          // Заводим пользователя в сцену стейта
          await ctx.scene.enter(result.scene, result.stateData.state)
          ctx.wizard.selectStep(result.stateData.step); // восстанавливаем шаг сцены

          console.log(ctx.scene.current.id)
          console.log(ctx.wizard)
        } else {
          // If stateData or state is not defined, enter the default home scene
          await ctx.scene.enter("home");
          console.log(ctx)
          console.error("State data is incomplete:", result);
        }
      } else {
        await ctx.scene.enter("home");
        console.error("Failed to restore user state:", response.statusText);
      }
    } catch (error) {
      console.error("Error restoring user state:", error);
      await ctx.scene.enter("home");
    }
  }

  return next();
};
