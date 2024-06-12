import { Composer, Scenes } from "telegraf";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { ISentence, Sentence } from "../../models/ISentence";
import { IUser, User } from "../../models/IUser";
import rlhubContext from "../models/rlhubContext";
import { home_greeting, render_home_section } from "./homeView/greeting";
import { bot } from "../..";
const handler = new Composer<rlhubContext>();
const home = new Scenes.WizardScene("home", handler);

export async function greeting(ctx: rlhubContext, reply?: boolean) {
  let user: IUser | null = await User.findOne({ id: ctx.from?.id });

  if (user) {
    if (user.interface_language) {
      ctx.scene.session.interface_ln = user.interface_language;
    } else {
      ctx.scene.session.interface_ln = "russian";
    }
  }

  let keyboard_translates: any = {
    learns: {
      russian: "Самоучитель",
      english: "Learns",
      buryat: "Заабари",
    },
    dictionary: {
      russian: "Словарь",
      english: "Dictionary",
      buryat: "Толи",
    },
    sentences: {
      russian: "Предложения",
      english: "Sentences",
      buryat: "Мэдуулэлнуд",
    },
    translator: {
      russian: "Переводчик",
      english: "Translator",
      buryat: "Оршуулгари",
    },
    moderation: {
      russian: "Модерация",
      english: "Moderation",
      buryat: "Зохисуулал",
    },
    dashboard: {
      russian: "Личный кабинет",
      english: "Dashboard",
      buryat: "Оорын таhaг",
    },
  };

  const extra: ExtraEditMessageText = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: keyboard_translates.learns[ctx.scene.session.interface_ln],
            callback_data: "study",
          },
          {
            text: keyboard_translates.dictionary[
              ctx.scene.session.interface_ln
            ],
            callback_data: "vocabular",
          },
        ],
        [
          {
            text: keyboard_translates.sentences[ctx.scene.session.interface_ln],
            callback_data: "sentences",
          },
        ],
        [
          {
            text: keyboard_translates.translator[
              ctx.scene.session.interface_ln
            ],
            callback_data: "translater",
          },
        ],
        [
          {
            text: keyboard_translates.moderation[
              ctx.scene.session.interface_ln
            ],
            callback_data: "moderation",
          },
        ],
        [{ text: "🔓 Chat GPT", callback_data: "chatgpt" }],
        // [{ text: "📈 Общая статистика", callback_data: "table" }],
        [
          {
            text: keyboard_translates.dashboard[ctx.scene.session.interface_ln],
            callback_data: "dashboard",
          },
        ],
      ],
    },
  };

  let message: any = {
    russian: `Самоучитель бурятского языка \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nВыберите раздел, чтобы приступить`,
    buryat: `Буряд хэлэнэ заабари \n\nКаждое взаимодействие с ботом, \nвлияет на сохранение и дальнейшее развитие <b>Бурятского языка</b> \n\nЭхилхиин, нэгэ юумэ дарагты`,
    english: `Buryat Language Tutorial \n\nEvery interaction with the bot affects the preservation and further development of the Buryat language \n\nChoose a section to start`,
  };

  try {
    if (reply) {
      return ctx.reply(message[ctx.scene.session.interface_ln], extra);
    }

    // ctx.updateType === 'message' ? await ctx.reply(message, extra) : false
    ctx.updateType === "callback_query"
      ? await ctx.editMessageText(
          message[ctx.scene.session.interface_ln],
          extra
        )
      : ctx.reply(message[ctx.scene.session.interface_ln], extra);
  } catch (err) {
    console.log(err);
  }
}

export async function loginBurlive() {
  try {
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

    const text = await response.text(); // Сначала получаем текст ответа
    console.log("Response Text:", text);

    const data = JSON.parse(text); // Затем пытаемся распарсить JSON
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    return data;
  } catch (error) {
    console.error("Error in loginBurlive:", error);
    throw error; // Добавляем выброс ошибки, чтобы можно было её обработать
  }
}

home.start(async (ctx: rlhubContext) => await home_greeting(ctx));

home.action("check_subscription", async (ctx) => {
  const userId = ctx.from.id;

  try {
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

home.action("vocabular", async (ctx) => {
    console.log("Переход в словарь")
  ctx.answerCbQuery();
  return ctx.scene.enter("vocabular");
});

home.action("sentences", async (ctx) => {
  return ctx.scene.enter("sentences");
});

home.action("translater", async (ctx) => {
  let message: string = `<b>План по развитию Бурятского языка</b> \n\n`;
  message += `<a href="https://telegra.ph/Znachimost-Mashinnogo-Perevodchika-dlya-Buryatskogo-YAzyka-09-01">На данный момент отсутствует машинный переводчик с Бурятского языка, над чем мы и работаем</a>\n`;

  await ctx.editMessageText(message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
  await greeting(ctx, true);
  return ctx.answerCbQuery("На стадии разработки 🎯");
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

home.action("dashboard", async (ctx) => {
  await ctx.answerCbQuery("Личный кабинет");
  return ctx.scene.enter("dashboard");
});

home.enter(async (ctx) => {
 await render_home_section(ctx);
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

export default home;
