// telegramController.ts
import { Request, Response } from "express";
import logger from "../utils/logger";
import { DialogModel } from "../models/Dialog";
import TelegramUserModel from "../models/TelegramUsers";
import WordModel from "../models/Vocabulary/WordModel";
import SearchedWordModel from "../models/Vocabulary/SearchedWordModel";
import TelegramUserState from "../models/Telegram/UserState";

const telegramController = {
  create: async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      console.log(messages);

      await new DialogModel(messages)
        .save()
        .then((result) => console.log(result));

      return res.status(200).json({ messages });
    } catch {
      logger.error("error");
    }
  },
  paymentCb: async (req: Request, res: Response) => {
    try {
      console.log(req.body);

      return res.status(200);
    } catch {
      logger.error("error");
    }
  },
  new_word_translate_request: async (req: Request, res: Response) => {
    try {
      const { word, language, user_id } = req.body;
      const user = await TelegramUserModel.findOne({ id: user_id });

      // Преобразование слова в нижний регистр для поиска
      const normalizedWord = word.toLowerCase();
      let selectedLanguage = language === "russian" ? "русский" : "бурятский";

      let translations = [];

      const is_exists_on_searchdata = await SearchedWordModel.findOne({
        normalized_text: normalizedWord,
      });

      if (is_exists_on_searchdata) {
        // Если слово существует, обновить поле users и добавить запись в search_data
        await SearchedWordModel.findOneAndUpdate(
          { normalized_text: normalizedWord },
          {
            $addToSet: { users: user._id },
            $push: { search_data: { content: word, user_id: user._id } },
          }
        );
      } else {
        // Если слово не существует, создать новую запись в SearchedWordModel
        await SearchedWordModel.create({
          text: word,
          normalized_text: normalizedWord,
          language: selectedLanguage,
          users: [user._id],
          search_data: [{ content: word, user_id: user._id }],
        });
      }

      // Найти слово в WordModel и получить переводы
      const words_on_my_database = await WordModel.find({
        normalized_text: normalizedWord,
        language: selectedLanguage,
      }).populate(
        "translations",
        "_id text language author contributors dialect"
      );

      // Если переводы найдены, добавить их в массив translations
      if (words_on_my_database.length > 0) {
        words_on_my_database.forEach((element) => {
          element.translations.forEach((subelement) => {
            translations.push(subelement);
          });
        });
      }

      let selectedLanguageForBurlang =
        language === "russian" ? "russian-word" : "buryat-word";
      const burlang_fetch = await fetch(
        `https://burlang.ru/api/v1/${selectedLanguageForBurlang}/translate?q=${normalizedWord}`
      );
      const burlang_response = await burlang_fetch.json();

      if (burlang_fetch.status == 200) {
        console.log(burlang_response);
        return res
          .status(200)
          .json({ translations, burlang_api: burlang_response });
      } else {
        return res.status(200).json({ translations });
      }
    } catch (error) {
      logger.error(`Ошибка при переводе слова: \n${error}`);
      return res.status(500).json({ message: "Ошибка сервера" });
    }
  },

  user_is_exists: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await TelegramUserModel.findOne({ id }).select(
        "_id id c_username email createdAt first_name rating theme"
      );

      if (!user) {
        return res
          .status(200)
          .json({ is_exists: false, message: "Пользователь не существует" });
      }

      return res.status(200).json({
        is_exists: true,
        message: "Пользователь существует",
        user: {
          _id: user._id,
          id: user.id,
          c_username: user.c_username,
          createdAt: user.createdAt,
          first_name: user.first_name,
          rating: user.rating,
          theme: user.theme
        },
      });
    } catch (error) {
      logger.error("Error in user_is_exists:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  
  register_telegram_user: async (req: Request, res: Response) => {
    try {
      const { id, username, first_name, last_name, email } = req.body;
      console.log(req.body)
      logger.info("create user")
      // Проверка на существование пользователя
      const existingUser = await TelegramUserModel.findOne({ id });
      if (existingUser) {
        return res.status(409).json({ 
          message: "Пользователь уже зарегистрирован!" 
        });
      }

      // Сохранение нового пользователя
      const newUser = new TelegramUserModel({
        id,
        username,
        first_name,
        last_name,
        email: email || "", // Обработка возможного отсутствия email
      });

      await newUser.save();

      return res.status(201).json({ 
        message: "Пользователь успешно зарегистрирован!" 
      });
    } catch (error) {
      logger.error(`Ошибка при регистрации телеграмм пользователя: ${error}`);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  select_language_for_vocabular: async (req: Request, res: Response) => {
    try {
      const { language, id } = req.body;
      await TelegramUserModel.findOneAndUpdate(
        { id },
        {
          $set: {
            "vocabular.select_language_for_vocabular": language,
          },
        }
      );
      return res.status(200).json({ message: "Язык выбран" });
    } catch (error) {
      logger.error(`Ошибка при сохранении выбора языка для словаря, ${error}`);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  save: async (req: Request, res: Response) => {
    try {
      console.log(123);
      const dialogs = await DialogModel.find();
      console.log(dialogs);

      return res.status(200);
    } catch (error) {
      logger.error("error");
    }
  },

  save_user_state: async (req: Request, res: Response) => {
    try {
      console.log("сохранение стейта");
      const { userId, scene, stateData } = req.body;
      await TelegramUserState.findOneAndUpdate(
        { userId },
        { scene, stateData },
        { upsert: true }
      );
      return res.status(200).json({ message: "State saved successfully" });
    } catch (error) {
      logger.error(`Error saving user state: ${error}`);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  get_user_state: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(id);
      const userState = await TelegramUserState.findOne({ userId: id });
      if (!userState) {
        return res.status(404).json({ message: "User state not found" });
      }
      return res.status(200).json(userState);
    } catch (error) {
      logger.error(`Error fetching user state: ${error}`);
      return res.status(500).json({ error: "Internal server error" });
    }
  },
  // Получение текущей темы пользователя
  getUserTheme: async (req: Request, res: Response) => {
    try {
      
      
      const { id } = req.params;
      logger.info(`Запрос на получении темы пользователя ${id}`)
      const user = await TelegramUserModel.findOne({ id });

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      return res.status(200).json({ theme: user.theme });
    } catch (error) {
      logger.error("Ошибка при получении темы пользователя:", error);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
  },

  // Обновление темы пользователя
  updateUserTheme: async (req: Request, res: Response) => {
    try {
      const { id, theme } = req.body;
      
      logger.info(`Запрос на сохранение пользовательской темы WebApp telegram bot`)

      const user = await TelegramUserModel.findOneAndUpdate(
        { id },
        { theme },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }

      return res.status(200).json({ message: "Тема успешно обновлена" });
    } catch (error) {
      logger.error("Ошибка при обновлении темы пользователя:", error);
      return res.status(500).json({ error: "Ошибка сервера" });
    }
  },
};

export default telegramController;
