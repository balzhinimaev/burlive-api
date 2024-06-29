import { Composer, Scenes } from "telegraf";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import rlhubContext from "../models/rlhubContext";
import createPayment from "../utlis/yookassa";
const handler = new Composer<rlhubContext>();
const premium = new Scenes.WizardScene(
  "premium",
  async (ctx: rlhubContext, next) => subscribe_section_handler(ctx, next),
  handler
);

export async function subscribe_section(ctx: rlhubContext) {
  try {
    let message: string = `<b>💎 Премиум подписка</b> \n\n`;
    message += `Расширяйте свои возможности. Поддержите бурятский язык. Получите доступ к материалам. \n\n`;

    const extra: ExtraEditMessageText = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "1 месяц / 199 ₽", callback_data: "rub 199" }],
          [{ text: "6 месяцев / 837 ₽", callback_data: "rub 837" }],
          [{ text: "12 месяцев / 1436 ₽", callback_data: "rub 1436" }],
          [
            {
              text: "Назад",
              callback_data: "back",
            },
          ],
        ],
      },
    };

    if (ctx.updateType === "callback_query") {
      await ctx.editMessageText(message, extra);
    } else {
      await ctx.reply(message, extra);
    }
  } catch (err) {
    console.log(err);
  }
}
async function subscribe_section_handler(ctx: rlhubContext, next: any) {
  try {
    const data = ctx.update.callback_query.data;

    if (data === "back") {
      await ctx.scene.enter("premium");
    }

    ctx.answerCbQuery();
  } catch (error) {}
}

premium.action("rub 199", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка`;
  const amount = `199.00`;
  try {
    const payment = await createPayment(ctx, amount, description, returnUrl);
    const confirmationUrl = payment.confirmation.confirmation_url;
    await ctx.answerCbQuery("Счет сгенерирован");
    await ctx.reply(
      `Для оформления подписки перейдите по ссылке: ${confirmationUrl}`
    );
  } catch (error) {
    console.error(error);
    ctx.reply(
      "Произошла ошибка при создании платежа. Пожалуйста, попробуйте позже."
    );
  }
});
premium.action("rub 837", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка`;
  const amount = `837.00`;
  try {
    const payment = await createPayment(ctx, amount, description, returnUrl);
    const confirmationUrl = payment.confirmation.confirmation_url;
    await ctx.answerCbQuery("Счет сгенерирован");
    await ctx.reply(
      `Для оформления подписки перейдите по ссылке: ${confirmationUrl}`
    );
  } catch (error) {
    console.error(error);
    ctx.reply(
      "Произошла ошибка при создании платежа. Пожалуйста, попробуйте позже."
    );
  }
});
premium.action("rub 1436", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка \nСрок подписки: 12 месяцев`;
  const amount = `1436.00`;
  try {
    const payment = await createPayment(ctx, amount, description, returnUrl);
    const confirmationUrl = payment.confirmation.confirmation_url;
    await ctx.answerCbQuery("Счет сгенерирован");
    await ctx.reply(
      `Для оформления подписки перейдите по ссылке: ${confirmationUrl}`
    );
  } catch (error) {
    console.error(error);
    ctx.reply(
      "Произошла ошибка при создании платежа. Пожалуйста, попробуйте позже."
    );
  }
});
premium.action("back", async (ctx) => ctx.scene.enter("home"))
premium.enter(async (ctx: rlhubContext) => {
  try {
    // await saveSceneMiddleware(ctx);
    await subscribe_section(ctx);
  } catch (error) {
    console.log(error);
    await ctx.reply("Ошибка сервера");
  }
});

premium.on("message", async (ctx: rlhubContext, next) => {
  const message = ctx.update.message.text;

  if (message === "/premium") {
    return await subscribe_section(ctx);
  }

  if (message === "/start") {
    return await ctx.scene.enter("premium");
  }

  if (message === "/home") {
    return await ctx.scene.enter("home");
  }

  if (message === "/sentences") {
    return await ctx.scene.enter("sentences");
  }

  if (message === "/dictionary") {
    return await ctx.scene.enter("vocabular");
  }

  await subscribe_section(ctx);
});

premium.action(/.*/, async (ctx: rlhubContext, next) => {
  // Логирование текущей сцены
  console.log("Current scene: " + ctx.scene.current?.id);

  // Ваш код для обработки действий и пересылки пользователя на нужную сцену
  const actionData = ctx.update.callback_query.data;
  console.log(`handled action: ${actionData}`);

  // Например, можете проверять значение actionData и пересылать пользователя на соответствующие сцены
  // if (actionData === 'to_premium') {
  // await ctx.scene.enter('premium');
  // } else if (actionData === 'to_chat') {
  // await ctx.scene.enter('chat');
  // } else {
  // Обработка других действий
  // }

  // Не забудьте подтвердить получение действия, чтобы убрать "часики" в интерфейсе пользователя
  await ctx.answerCbQuery();
  await subscribe_section(ctx);
});
// premium.on("message", async (ctx) => await render_premium_section(ctx));

export default premium;
