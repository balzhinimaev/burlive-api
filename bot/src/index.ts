import dotenv from "dotenv";
import { Scenes, Telegraf, session } from "telegraf";
import rlhubContext from "./bot/models/rlhubContext";
dotenv.config();

// Lazy-load модули
import("./app");
import("./webhook");

// Экспортируем бот
export const bot = new Telegraf<rlhubContext>(process.env.BOT_TOKEN!);

// Импортируем сцены с помощью Lazy-loading
import home, { loginBurlive } from "./bot/views/home.scene";
import sentences from "./bot/views/sentences.scene";
import settings from "./bot/views/settings.scene";
import dashboard from "./bot/views/dashboard.scene";
import vocabular from "./bot/views/vocabular.scene";
import moderation from "./bot/views/moderation.scene";
import study from "./bot/views/study.scene";
import premium, { subscribe_section } from "./bot/views/premium.scene";
import chat from "./bot/views/chat.scene";

const webAppUrl = <string>process.env.webapp_url;
const stage = new Scenes.Stage<rlhubContext>(
  [
    home,
    premium,
    study,
    chat,
    vocabular,
    sentences,
    dashboard,
    moderation,
    settings,
  ],
  { default: "home" }
);

bot.use(session());
bot.use(stage.middleware());

// // Обработка всех actions
// bot.action(/.*/, async (ctx, next) => {
//   console.log("Current scene: " + ctx.scene.current?.id);
//   const actionData = ctx.update.callback_query.data;
//   console.log(`Handled action: ${actionData}`);
//   await ctx.answerCbQuery();
//   await next();
// });

// Обработка сообщений
// bot.on("message", async (ctx: rlhubContext, next) => {
//   try {
//     console.log("Current scene: " + ctx.scene.current?.id);
//     const actionData = ctx.update.message.text;
//     console.log(`Handled message: ${actionData}`);
//     await next();
//   } catch (error) {
//     console.log(error);
//   }
// });

// Команды
bot.command("webapp", async (ctx) => {
  await ctx.reply(
    "Добро пожаловать! Нажмите на кнопку ниже, чтобы запустить приложение",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Внести переводы",
              web_app: { url: webAppUrl },
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
    await ctx.scene.enter("premium");
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
