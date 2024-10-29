import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import { home_greeting, render_home_section } from "./homeView/greeting";
import { bot } from "../..";
import createPayment from "../utlis/yookassa";
import { saveSceneMiddleware } from "../utlis/saveSceneMiddleware";
const handler = new Composer<rlhubContext>();
const home = new Scenes.WizardScene("home", handler);

export async function loginBurlive() {
  try {
    const mytoken = process.env.mytoken;

    if (mytoken) {
      return {
        token: mytoken,
        userId: "66d9c56d3ed0a7722ecd2bd3",
      };
    }

    const response = await fetch(`${process.env.api_url}/users/login`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: process.env.telegram_user_password,
        email: process.env.telegram_user_email,
        username: process.env.telegram_user_username,
      }),
    });

    const result = await response.json(); // Сначала получаем текст ответа

    return result;
  } catch (error) {
    console.error("Error in loginBurlive:", error);
    throw error; // Добавляем выброс ошибки, чтобы можно было её обработать
  }
}

home.action("check_subscription", async (ctx) => {
  const userId = ctx.from.id;

  try {
    if (
      !process.env.telegram_channel_username ||
      typeof process.env.telegram_channel_username !== "string"
    ) {
      return false;
    }

    if (
      !process.env.telegram_channel_link ||
      typeof process.env.telegram_channel_link !== "string"
    ) {
      return false;
    }

    const chatMember = await bot.telegram.getChatMember(
      process.env.telegram_channel_username,
      userId
    );

    const isMember =
      chatMember.status !== "left" && chatMember.status !== "kicked";

    if (isMember) {
      ctx.answerCbQuery("Спасибо за подписку! \nТеперь вы можете продолжить.");
      ctx.editMessageText("Начало");
    } else {
      await ctx.deleteMessage();
      await ctx.reply(
        `Вы все еще не подписаны на канал. Пожалуйста, подпишитесь для продолжения работы ${process.env.telegram_channel_link}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Подписаться", url: process.env.telegram_channel_link },
                {
                  text: "Проверить подписку",
                  callback_data: "check_subscription",
                },
              ],
            ],
          },
        }
      );
    }
  } catch (error) {
    console.error(error);
    ctx.reply("An error occurred while checking the subscription status.");
  }
});

home.action("vocabular", async (ctx, next) => {
  try {
    await ctx.scene.enter("vocabular");
    ctx.answerCbQuery();
  } catch (error) {
    await render_home_section(ctx);
  }
});

home.action("sentences", async (ctx) => {
  return ctx.scene.enter("sentences");
});

home.action("to_subscribe", async (ctx) => {
  try {
    ctx.scene.enter("premium");
  } catch (error) {
    await render_home_section(ctx);
  }
});

home.action("translater", async (ctx) => {
  let message: string = `<b>План по развитию Бурятского языка</b> \n\n`;
  message += `<a href="https://telegra.ph/Znachimost-Mashinnogo-Perevodchika-dlya-Buryatskogo-YAzyka-09-01">На данный момент отсутствует машинный переводчик с Бурятского языка, над чем мы и работаем</a>\n`;

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    link_preview_options: {
      is_disabled: true,
    },
  });

  await render_home_section(ctx, true);
  return ctx.answerCbQuery("На стадии разработки 🎯");
});

// Токен провайдера платежей от ЮKassa
const providerToken = process.env.PROVIDER_TOKEN;

// Функция для отправки счета
async function sendInvoice(ctx: rlhubContext) {
  try {

    if (!ctx.chat || typeof(ctx.chat) === 'undefined') {
      return false
    } 

    const invoice = {
      chat_id: ctx.chat.id,
      provider_token: providerToken,
      start_parameter: "start",
      title: "Подписка на сервис",
      description: "Подписка на использование всех функций Burlive на 1 месяц",
      currency: "RUB",
      prices: [{ label: "Подписка", amount: 19900 }], // 19900 копеек = 199 рублей
      payload: JSON.stringify({ unique_id: `${ctx.from.id}_${Date.now()}` }),
      need_phone_number: true,
      need_email: true,
    };
    await ctx.deleteMessage();
    // @ts-ignore
    await ctx.replyWithInvoice(invoice);
  } catch (error) {
    console.log("Ошибка при отправке счета:", error);
    ctx.reply("Произошла ошибка при создании счета.");
  }
}

home.action("rub 199", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка`;
  const amount = `199.00`;
  try {
    // @ts-ignore
    const payment = await createPayment(ctx, amount, description, returnUrl);
    // @ts-ignore
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
home.action("rub 837", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка`;
  const amount = `837.00`;
  try {
    // @ts-ignore
    const payment = await createPayment(ctx, amount, description, returnUrl);
    // @ts-ignore
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
home.action("rub 1436", async (ctx) => {
  const returnUrl = `https://t.me/burlive_bot`;
  const description = `Подписка на сервис по изучению и развитию бурятского языка \nСрок подписки: 12 месяцев`;
  const amount = `1436.00`;
  try {
    // @ts-ignore
    const payment = await createPayment(ctx, amount, description, returnUrl);
    // @ts-ignore
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

// Обработка PreCheckoutQuery
home.on("pre_checkout_query", (ctx) => {
  ctx.answerPreCheckoutQuery(true);
});

// Обработка SuccessfulPayment
home.on("successful_payment", async (ctx) => {
  console.log("Успешный платеж:", ctx.message.successful_payment);
  const payment = ctx.message.successful_payment;

  // Сохраните provider_payment_charge_id для дальнейшего использования
  const providerPaymentChargeId = payment.provider_payment_charge_id;
  console.log(payment);
  // Дополнительные действия после успешного платежа
  await ctx.reply("Спасибо за оплату! Ваша подписка активирована.");
  await render_home_section(ctx, true);
});

home.action("study", async (ctx) => {
  // console.log('study')
  ctx.scene.enter("study");
  // return ctx.answerCbQuery('Программа обучения на стадии разработки 🎯')
});

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

home.action("chatgpt", async (ctx) => {
  ctx.answerCbQuery();
  return ctx.scene.enter("chatgpt");
});

home.action("dashboard", async (ctx: rlhubContext, next) => {
  await ctx.answerCbQuery("Личный кабинет");
  await ctx.scene.enter("dashboard", next);
});

home.enter(async (ctx: rlhubContext) => {
  try {
    // await saveSceneMiddleware(ctx);
    await home_greeting(ctx);
  } catch (error) {
    console.log(error);
    await ctx.reply("Ошибка сервера");
  }
});

home.command("add_sentences", async (ctx) => {
  await ctx.reply(
    "Отправьте список предложений на русском которые хотите добавить в базу данных для их перевода в дальнейшем"
  );
  ctx.wizard.selectStep(1);
});

home.command("reset_activet", async (ctx) => {
  await Sentence.updateMany({
    active_translator: [],
  });
});

home.on("message", async (ctx: rlhubContext, next) => {
  const message = ctx.update.message.text;

  if (message === "/premium") {
    return ctx.scene.enter("premium");
  }

  if (message === "/start") {
    return await home_greeting(ctx);
  }

  if (message === "/dictionary") {
    return await ctx.scene.enter("vocabular");
  }
  if (message === "/webapp") {
    return next();
  }

  await render_home_section(ctx);
});

home.action(/.*/, async (ctx: rlhubContext, next) => {
  // Логирование текущей сцены
  console.log("Current scene: " + ctx.scene.current?.id);

  // Ваш код для обработки действий и пересылки пользователя на нужную сцену
  const actionData = ctx.update.callback_query.data;
  console.log(`handled action: ${actionData}`);

  // Например, можете проверять значение actionData и пересылать пользователя на соответствующие сцены
  // if (actionData === 'to_home') {
  // await ctx.scene.enter('home');
  // } else if (actionData === 'to_chat') {
  // await ctx.scene.enter('chat');
  // } else {
  // Обработка других действий
  // }

  // Не забудьте подтвердить получение действия, чтобы убрать "часики" в интерфейсе пользователя
  await ctx.answerCbQuery();
  await render_home_section(ctx);
});
// home.on("message", async (ctx) => await render_home_section(ctx));

export default home;
