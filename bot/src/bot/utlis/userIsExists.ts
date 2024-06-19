import rlhubContext from "../models/rlhubContext";
import { loginBurlive } from "../views/home.scene";

export default async function (ctx: rlhubContext, userId: number) {
  try {
    const data = await loginBurlive();
    const response = await fetch(
      `${process.env.api_url}/telegram/user/is-exists/${ctx.from.id}`,
      {
        method: "get",
        headers: {
          //   "Content-Type": "appliscation/json",
          Authorization: `Bearer ${data.token}`,
        },
      }
    );

    const query = await response.json();

    console.log(`Запрос на проверку существование пользователя...`);

    // Проверка статуса ответа
    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      throw new Error(query);
    }

    console.log(
      "Получен ответ от сервера на запрос проверки существования пользователя"
    );

    return true

  } catch (error) {
    console.log(error);
    return error;
  }
}
