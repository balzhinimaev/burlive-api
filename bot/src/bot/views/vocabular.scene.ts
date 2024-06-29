import { Composer, Scenes } from "telegraf";
import rlhubContext from "../models/rlhubContext";
import greeting from "./vocabularView/greeting";
import { ExtraEditMessageText } from "telegraf/typings/telegram-types";
import { IUser, User } from "../../models/IUser";
import { buryatWordModel } from "../../models/vocabular/IBuryatWord";
import { russianWordModel } from "../../models/vocabular/IRussianWord";
import { translationPairModel } from "../../models/IVocabular";
import { loginBurlive } from "./home.scene";

const handler = new Composer<rlhubContext>();
const vocabular = new Scenes.WizardScene(
  "vocabular",
  handler,
  async (ctx: rlhubContext) => await translate_word(ctx),
  async (ctx: rlhubContext) => await add_pair_handler(ctx),
  async (ctx: rlhubContext) => await add_translate_handler(ctx)
);

async function add_translate_handler(ctx: rlhubContext) {
  try {
    if (ctx.updateType === "message" && ctx.update.message?.text) {
      const russian_phrase = ctx.scene.session.russian_dict_word;
      const buryat_phrase = ctx.message.text;

      if (buryat_phrase === `/back`) {
        await greeting(ctx);
      } else {
        ctx.scene.session.buryat_dict_word = buryat_phrase;

        const extra: ExtraEditMessageText = {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "Отправить на проверку", callback_data: "save" }],
              [{ text: "Заполнить заново", callback_data: "again" }],
              [{ text: "Назад", callback_data: "back" }],
            ],
          },
        };

        await ctx.reply(`${russian_phrase} - ${buryat_phrase}`, extra);
      }
    }

    if (ctx.updateType === "callback_query") {
      const data = ctx.update.callback_query.data as "save" | "again" | "back";

      if (data === "back") {
        await greeting(ctx);
        ctx.wizard.selectStep(1); // Вернемся к шагу 1
      }

      if (data === "save") {
        const user = await User.findOne({ id: ctx.from?.id });
        if (user) {
          const author = user._id;
          const create_buryat_word = new buryatWordModel({
            value: ctx.scene.session.buryat_dict_word,
            author,
          }).save();
          const create_russian_word = new russianWordModel({
            value: ctx.scene.session.russian_dict_word,
            author,
          }).save();

          const response = await new translationPairModel({
            russian_word: [(await create_russian_word)._id],
            buryat_word: [(await create_buryat_word)._id],
            author: [author],
            status: 0,
          }).save();

          const id1 = (await create_buryat_word)._id;
          const id2 = (await create_russian_word)._id;

          await buryatWordModel.findByIdAndUpdate(id1, {
            $addToSet: { translations: response._id },
          });

          await russianWordModel.findByIdAndUpdate(id2, {
            $addToSet: { translations: response._id },
          });

          await User.findByIdAndUpdate(author, {
            $addToSet: {
              "dictionary_section.suggested_words_on_dictionary.suggested":
                response._id,
            },
          });

          ctx.answerCbQuery("Ваша фраза отправлена на проверку");
          await greeting(ctx);
          ctx.wizard.selectStep(1); // Вернемся к шагу 1
        }
      }
    }
  } catch (error) {
    await greeting(ctx);
    console.error(error);
    ctx.wizard.selectStep(1); // Вернемся к шагу 1 в случае ошибки
  }
}

async function add_pair_handler(ctx: rlhubContext) {
  try {
    if (ctx.updateType === "callback_query") {
      const data = ctx.update.callback_query.data as
        | "back"
        | "suggest-words"
        | "suggest-words-translate";

      if (data === "back") {
        ctx.wizard.selectStep(1);
        await greeting(ctx);
      }

      ctx.answerCbQuery();
    } else if (ctx.message?.text) {
      if (ctx.message.text === "/back") {
        await greeting(ctx);
        ctx.wizard.selectStep(1);
      } else {
        ctx.scene.session.russian_dict_word = ctx.message.text;

        const message = `Теперь отправьте перевод на бурятском языке к введеному тексту: <code>${ctx.message.text}</code>\n\n— Буквы отсутствующие в кириллице — <code>һ</code>, <code>ү</code>, <code>өө</code>, копируем из предложенных.\n\n`;

        await ctx.reply(message, { parse_mode: "HTML" }).then(async () => {
          ctx.wizard.selectStep(2);
        });
      }
    }
  } catch (error) {
    console.error(error);
    ctx.wizard.selectStep(1); // Вернемся к шагу 1 в случае ошибки
  }
}

async function updateVocabularSectionRender(ctx: rlhubContext) {
  try {
    const message = `<b>✍️ Внести вклад в словарь</b>\n\nВы можете предложить свои варианты <b>слов и фраз</b> для их дальнейшего перевода сообществом\nТак же можете предлагать свои варианты переводов!`;

    const extra: ExtraEditMessageText = {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Предложить слова", callback_data: "suggest-words" }],
          [
            {
              text: "Предложить переводы",
              callback_data: "suggest-words-translate",
            },
          ],
          [{ text: "Назад", callback_data: "back" }],
        ],
      },
    };

    if (ctx.updateType === "callback_query") {
      await ctx.editMessageText(message, extra);
      ctx.wizard.selectStep(2);
    } else {
      await ctx.reply(message, extra);
    }
  } catch (error) {
    console.error(error);
    ctx.wizard.selectStep(1); // Вернемся к шагу 1 в случае ошибки
  }
}

async function translate_word(ctx: rlhubContext) {
  try {
    if (
      ctx.updateType === "callback_query" &&
      ctx.update.callback_query?.data
    ) {
      const data = ctx.update.callback_query?.data as "back" | "add_pair";

      if (data === "back") {
        ctx.wizard.selectStep(0);
        await greeting(ctx);
      }
    }

    if (ctx.updateType === "message" && ctx.message?.text) {
      const word = ctx.message.text;

      if (word === "/dictionary") {
        return ctx.scene.enter("vocabular");
      }
      if (word === "/home") {
        return ctx.scene.enter("home");
      }
      if (word === "/start") {
        return ctx.scene.enter("home");
      }
      if (word === "/premium") {
        return ctx.scene.enter("home");
      }

      const language = ctx.session.language;

      const data = await loginBurlive();
      const query = await fetch(
        `${process.env.api_url}/telegram/new-word-translate-request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            word,
            language,
            user_id: ctx.from.id,
          }),
        }
      );

      let message = `<b>Словарь 📖</b>\n\n`;

      if (query.ok) {
        const response = await query.json();
        console.log(response);
        const burliveT = response.translations;
        const burlangT = response.burlang_api?.translations;

        if (burliveT.length > 0) {
          message += burliveT
            .map(
              (item: any) =>
                `${word} - ${item.text} (${item.language}, ${item.dialect})`
            )
            .join("\n");

          // ctx.wizard.selectStep(0);
        }
        if (burlangT && burlangT.length > 0) {
          message += burlangT
            .map((item: any) => `${word} - ${item.value}`)
            .join("\n");

          // ctx.wizard.selectStep(0);
        }

        if (burliveT.length === 0 && (!burlangT || burlangT.length === 0)) {
          const variants = [
            `К сожалению, переводов не найдено. Ваше слово "${word}" добавлено в базу для будущего перевода сообществом. Спасибо за ваш вклад!`,
            `Переводы отсутствуют. Слово "${word}" успешно сохранено в базе данных для дальнейшего перевода нашим сообществом. Благодарим за помощь!`,
            `Пока что переводов не обнаружено. Ваше слово "${word}" занесено в базу данных для последующего перевода участниками сообщества. Спасибо за ваше содействие!`,
          ];
          message += variants[Math.floor(Math.random() * variants.length)];
        }

        message += `\n\nМожете отправить еще слова на перевод`;
        await ctx.reply(message, { parse_mode: "HTML", reply_markup: {
          inline_keyboard: [[{ text: 'Назад', callback_data: 'back' }]]
        } });
      } else {
        await ctx.reply("Возникла ошибка");
      }
    }
  } catch (error) {
    console.error(error);
    ctx.wizard.selectStep(0); // Вернемся к шагу 0 в случае ошибки
  }
}

vocabular.enter(async (ctx: rlhubContext) => {
  try {
    await greeting(ctx);
  } catch (error) {
    console.error(error);
    ctx.wizard.selectStep(0); // Вернемся к шагу 0 в случае ошибки
  }
});

handler.action("back", async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter("home");
});

vocabular.action(/selectlanguage (.+)/, async (ctx: rlhubContext) => {
  try {
    const selectedLanguage = ctx.update.callback_query.data.split(" ")[1]; // Получаем выбранный язык из callback_data
    ctx.session.language = selectedLanguage; // Сохраняем язык в сессии пользователя
    const login = await loginBurlive();
    // Отправляем выбранный язык на API
    const response = await fetch(
      `${process.env.api_url}/telegram/select-language-for-vocabular`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${login.token}`,
        },
        body: JSON.stringify({
          id: ctx.from.id,
          language: selectedLanguage,
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      await ctx.answerCbQuery(
        `Язык ${
          selectedLanguage === "russian" ? "русский" : "бурятский"
        } успешно выбран.`
      );
      return await render_translate_section(ctx);
    } else {
      console.error("Error saving language:", result);
      await ctx.answerCbQuery("Ошибка при сохранении языка. Попробуйте снова.");
      ctx.wizard.selectStep(0); // Вернемся к шагу 0 в случае ошибки
    }
  } catch (err) {
    console.error("Error handling selectlanguage action:", err);
    await ctx.answerCbQuery("Произошла ошибка. Попробуйте снова.");
    ctx.wizard.selectStep(0); // Вернемся к шагу 0 в случае ошибки
  }
});

async function render_translate_section(ctx: rlhubContext) {
  try {
    let message = `Выбран язык для перевода: ${
      ctx.session.language === "buryat" ? "<b>Бурятский</b>" : "<b>Русский</b>"
    } \nОтправьте слово которое нужно перевести`;
    await ctx.editMessageText(message, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Назад",
              callback_data: "back",
            },
          ],
        ],
      },
    });
    ctx.wizard.selectStep(1);
    console.log("Первый шаг выбран");
  } catch (err) {
    console.log(err);
    ctx.wizard.selectStep(0); // Вернемся к шагу 0 в случае ошибки
  }
}

handler.on("message", async (ctx: rlhubContext, next) => {
  try {
    const message = ctx.update.message.text;

    if (message === "/premium") {
      return await ctx.scene.enter("premium");
    }

    if (message === "/start") {
      return await ctx.scene.enter("home");
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

    // next();
    ctx.scene.enter("vocabular");
  } catch (error) {
    console.log(error);
    return await ctx.reply("Возникла ошибка");
  }
});

export default vocabular;
