import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../../models/IUser";
import rlhubContext from "../../models/rlhubContext";
import format_money from "../../utlis/format_money";
import { ConfirmedTranslations, translation } from "../../../models/ISentence";

export default async function greeting(ctx: rlhubContext) {
  try {
    const extra: ExtraEditMessageText = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "О проекте",
              callback_data: "about",
            },
          ],
          [
            {
              text: "Мои сообщения",
              callback_data: "messages",
            },
          ],
          // [
          //   {
          //     text: "💸 Поддержка проекта",
          //     callback_data: "help",
          //   },
          // ],
          [
            {
              text: "Персональные данные",
              callback_data: "common_settings",
            },
          ],
          [
            {
              text: "Справочные материалы",
              callback_data: "reference_materials",
            },
          ],
          [
            {
              text: "Реферальная программа",
              callback_data: "referral",
            },
          ],
          [
            {
              text: "Назад",
              callback_data: "home",
            },
            {
              text: "Обратная связь",
              url: "https://t.me/bur_live",
            },
          ],
        ],
      },
    };

    const message = `<b>Личный кабинет</b> \n\n`;

    ctx.updateType === "message" ? await ctx.reply(message, extra) : false;
    if (ctx.update.callback_query.message.text === "Личный кабинет" && ctx.updateType === 'callback_query') {
      ctx.answerCbQuery()
      // return next()
      return false;
    }

    ctx.updateType === "callback_query"
      ? await ctx.editMessageText(message, extra)
      : false;
  } catch (err) {
    console.error(err);
  }
}
