import rlhubContext from "../models/rlhubContext";
import { loginBurlive } from "../views/home.scene";

export const saveSceneMiddleware = async (
  ctx: rlhubContext,
  next?: () => Promise<void>,
  is_no_next?: boolean
) => {
  const userId = ctx.from?.id;
  if (userId) {
    console.log("Saving state for user:", userId);
    const data = await loginBurlive();
    const sceneId = ctx.scene.current?.id;
    const stateData = {
      state: ctx.scene.state,
      step: ctx.wizard?.cursor, // добавляем текущий шаг сцены
    };

    try {
      const response = await fetch(
        `${process.env.api_url}/telegram/user/save-state`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({ userId, scene: sceneId, stateData }),
        }
      );
      if (!response.ok) {
        console.error("Failed to save user state:", response.statusText);
      }
    } catch (error) {
      console.error("Error saving user state:", error);
    }
  }
  if (is_no_next) {
    return true;
  } else if (next) {
    return next();
  } else {
    return true
  }
};
