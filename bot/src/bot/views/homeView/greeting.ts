import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import { bot } from "../../..";
import rlhubContext from "../../models/rlhubContext";
import { loginBurlive } from "../home.scene";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import userIsExists from "../../utlis/userIsExists";

export async function home_greeting(ctx: rlhubContext, next?: any, enter?: boolean) {
  try {

    let refererID: string | number = ctx.startPayload    

    if (refererID) {
      refererID = refererID.replace("ref_", "")
      refererID = Number(refererID);
      const isExists = await userIsExists(ctx, refererID)
      if (!isExists) {
        ctx.reply("Реферальная ссылка битая")
      }
    }

    const data = await loginBurlive();

    const response = await fetch(
      `${process.env.api_url}/telegram/user/is-exists/${ctx.from.id}`,
      {
        method: "get",
        headers: {
          "Content-Type": "appliscation/json",
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

    const chatMember = await bot.telegram.getChatMember(
      process.env.telegram_channel_username,
      ctx.from.id
    );
    const isMember =
      chatMember.status !== "left" && chatMember.status !== "kicked";

    console.log(
      `Проверка подписки пользователя на канал ${process.env.telegram_channel_username}`
    );

    if (!isMember) {
      await ctx.reply(
        `Подпишитесь на канал для продолжения работы ${process.env.telegram_channel_link}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Подписаться",
                  url: process.env.telegram_channel_link,
                },
                {
                  text: "Проверить подписку",
                  callback_data: "check_subscription",
                },
              ],
            ],
          },
        }
      );

      if (next) {
        return next();
      } else {
        return true;
      }

    }

    console.log("Пользователь подписан на канал");

    if (!query.is_exists) {
      ctx.reply("Вы не зарегистрированы в системе!");
      const createUser = await fetch(
        `${process.env.api_url}/telegram/create-user`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify(ctx.from),
        }
      );
      const createUserParse = await createUser.json();
      console.log(createUserParse);
      await ctx.reply("Поздравляю, Вы зарегистрированы!");
      await render_home_section(ctx, true);
    } else {
      // console.log("Пользователь зарегистрирован в бд");
      await render_home_section(ctx)
    }

    if (enter) {
      console.log(ctx.scene)
      // @ts-ignore
      ctx.scene.leave(ctx.scene.current.id)
      ctx.scene.enter("home")
    }

    // Здесь можно добавить логику для работы с результатом
  } catch (err) {
    console.error("Error in home.start:", err);
  }
}

export async function render_home_section(ctx: rlhubContext, reply?: boolean) {
  try {
    const message = `Самоучитель бурятского языка \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nВыберите раздел, чтобы приступить`;
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: "Самоучитель", callback_data: "study" },
          { text: "Словарь", callback_data: "vocabular" },
        ],
        [{ text: "Предложения", callback_data: "sentences" }],
        [{ text: "💎 Премиум", callback_data: "to_subscribe" }],
        [{ text: "Личный кабинет", callback_data: "dashboard" }],
      ],
    };

    const extra: ExtraEditMessageText = {
      parse_mode: "HTML",
      reply_markup: keyboard,
    };

    if (reply) {
      await ctx.reply(message, extra);
    } else {
      ctx.updateType === "callback_query"
        ? await ctx.editMessageText(message, extra)
        : await ctx.reply(message, extra);
    }

  } catch (error) {
    console.error(`Error on render home section`, error);
  }
}
