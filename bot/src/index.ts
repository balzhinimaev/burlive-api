import dotenv from "dotenv";
import { Context, Markup, Scenes, Telegraf, session } from "telegraf";
import fetch from "node-fetch";
import rlhubContext from "./bot/models/rlhubContext";

dotenv.config();

export const bot = new Telegraf<rlhubContext>(process.env.BOT_TOKEN!);
import "./app";
import "./webhook";
import "./database";

import home, { loginBurlive } from "./bot/views/home.scene";
import sentences from "./bot/views/sentences.scene";
import settings from "./bot/views/settings.scene";
import dashboard from "./bot/views/dashboard.scene";
import vocabular from "./bot/views/vocabular.scene";
import moderation from "./bot/views/moderation.scene";
import study from "./bot/views/study.scene";
import premium, { subscribe_section } from "./bot/views/premium.scene";
import chat from "./bot/views/chat.scene"; 
const webAppUrl = process.env.webapp_url;
const stage = new Scenes.Stage<rlhubContext>(
  [home, premium, study, chat, vocabular, sentences, dashboard, moderation, settings], { default: "home" }
);

bot.use(session());

bot.use(stage.middleware());
// // Middleware для восстановления состояния пользователя

// bot.use(async (ctx, next) => await fetchSceneMiddleware(ctx, next));

// Обработчик для всех actions
bot.action(/.*/, async (ctx: rlhubContext, next) => {
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
  await next()
});
bot.on("message", async (ctx: rlhubContext, next) => {
  try {
    // Логирование текущей сцены
    console.log("Current scene: " + ctx.scene.current?.id);

    // Ваш код для обработки действий и пересылки пользователя на нужную сцену
    const actionData = ctx.update.message.text;
    console.log(`handled message: ${actionData}`);
    await next();
  } catch (error) {
    console.log(error)
  }
})

bot.command("start", async (ctx) => {
  // await ctx.scene.enter("home");
});

bot.command("webapp", async (ctx) => {
  await ctx.reply(
    "Добро пожаловать! Нажмите на кнопку ниже, чтобы запустить приложение",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Внести переводы",
              web_app: { url: webAppUrl }, // Используем web_app вместо url
            },
          ],
        ],
      },
    }
  );
});

bot.command("home", async (ctx) => {
  await ctx.scene.enter("home");
});

bot.command("premium", async (ctx) => {
  try {
    ctx.scene.enter("premium")
  } catch (error) {
    console.log(error);
  }
});
bot.command("dictionary", async (ctx) => {
  try {
    await ctx.scene.enter("vocabular");
  } catch (error) {
    console.log(error);
  }
});