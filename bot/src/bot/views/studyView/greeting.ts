import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../../models/IUser";
import rlhubContext from "../../models/rlhubContext";
import format_money from "../../utlis/format_money";
import { ConfirmedTranslations, translation } from "../../../models/ISentence";

export default async function greeting(ctx: rlhubContext) {
  const extra: ExtraEditMessageText = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "История бурятского языка",
            callback_data: "history",
          },
        ],
        [
          {
            text: "Назад",
            callback_data: "back",
          },
        ],
      ],
    },
  };

  const message = `<b>Самоучитель бурятского языка</b>`

  try {
    await ctx.editMessageText(message, extra)
  } catch (err) {
    console.error(err);
  }
}
