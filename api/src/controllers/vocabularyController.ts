import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import logger from "../utils/logger";
import WordModel from "../models/Vocabulary/WordModel";
import SuggestedWordModel, { ISuggestedWordModel } from "../models/Vocabulary/SuggestedWordModel";
import TelegramUserModel from "../models/TelegramUsers";
import updateRating from "../utils/updateRatingTelegram";
import DeclinedWordModel from "../models/Vocabulary/DeclinedWordModel";
import { ObjectId } from "mongodb";

const vocabularyController = {
  getAllWords: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const words = await WordModel.find()
        .sort({ _id: 1 })
        .populate("author", "_id firstname username email")
        .populate("translations", "_id text");

      logger.info("Все слова получены!");
      res.status(200).json({ message: "Словарь найден", words });
    } catch (error) {
      logger.error(`Ошибка при получении слов: ${error}`);
      next(error); // Передаем ошибку в следующий middleware
    }
  },
  // Контроллер для получения всех слов с пагинацией и сортировкой по количеству переводов
  getAllWordsPaginated: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skip = (page - 1) * limit;

      // Считаем общее количество слов в базе данных
      const totalWords = await WordModel.countDocuments();

      // Получаем слова с разбивкой по страницам и сортировкой по количеству переводов
      const words = await WordModel.find()
        .sort({ translations: 1 }) // Сортировка по количеству переводов
        .skip(skip)
        .limit(limit)
        .populate("author", "_id firstname username email")
        .populate("translations", "_id text")

      // Формируем ответ с данными
      res.status(200).json({
        message: "Словарь найден",
        words,
        totalWords, // Общее количество слов
        currentPage: page, // Текущая страница
        totalPages: Math.ceil(totalWords / limit), // Общее количество страниц
      });
    } catch (error) {
      console.error(`Ошибка при получении слов: ${error}`);
      res.status(500).json({ message: "Ошибка при получении слов" });
    }
  },
  getWordsOnApproval: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const skipIndex = (pageNumber - 1) * limitNumber;

      const count = await SuggestedWordModel.countDocuments();
      const words = await SuggestedWordModel.find()
        .sort({ _id: 1 })
        .skip(skipIndex)
        .limit(limitNumber)
        .populate("author", "_id firstname username email")
        .populate("pre_translations", "_id text");

      logger.info("Все предложенные слова получены!");
      res
        .status(200)
        .json({ message: "Словарь найден", words, total_count: count });
    } catch (error) {
      logger.error(`Ошибка при получении предложенных слов: ${error}`);
      res
        .status(500)
        .json({ message: "Ошибка при получении предложенных слов" });
    }
  },

  suggestWordTranslate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { word_id, translate_language, translate, dialect, normalized_text, telegram_user_id } = req.body;

    try {
      // Проверка обязательных параметров
      if (!word_id || !translate_language || !translate || !telegram_user_id || !normalized_text) {
        logger.error("Отсутствует один из обязательных параметров");
        res.status(400).json({
          message: "Ошибка: отсутствует один из обязательных параметров",
        });
        return;
      }

      // Поиск исходного слова в базе данных
      const existingWord = await WordModel.findById(word_id);
      if (!existingWord) {
        res.status(400).json({ message: "Исходное слово не найдено" });
        return;
      }

      // Проверка на существование перевода (предложенного слова)
      const existingSuggestedWord = await SuggestedWordModel.findOne({
        normalized_text,
      });

      if (existingSuggestedWord) {
        if (existingSuggestedWord.language !== translate_language) {
          console.log("Надо посмотреть!");
        }

        logger.info(`Предложенное слово уже существует в коллекции`);

        // Обновляем исходное слово
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations_u: existingSuggestedWord._id, contributors: new ObjectId(telegram_user_id) },
        });

        // Обновляем предложенное слово
        await SuggestedWordModel.findByIdAndUpdate(existingSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id, contributors: new ObjectId(telegram_user_id) },
        });

        logger.info(`Данные успешно обновлены`);
      } else {
        // Создаём новое предложенное слово
        const newSuggestedWord = new SuggestedWordModel({
          text: translate,
          language: translate_language,
          author: new Types.ObjectId(telegram_user_id),
          dialect,
          normalized_text: translate.toLowerCase().trim(),
        });

        // Сохраняем новое предложенное слово
        const savedSuggestedWord = await newSuggestedWord.save();

        if (!savedSuggestedWord) {
          logger.error("Ошибка при сохранении предложенного слова");
          res.status(500).json({ message: "Ошибка при сохранении слова" });
          return;
        }

        logger.info(`Предложенное слово успешно сохранено с ID: ${savedSuggestedWord._id}`);

        // Обновляем исходное слово
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations_u: savedSuggestedWord._id },
        });

        // Связываем новое предложенное слово с исходным словом
        await SuggestedWordModel.findByIdAndUpdate(savedSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id },
        });
      }

      res.status(200).json({ message: "Перевод успешно предложен и добавлен в словарь" });
    } catch (error) {
      logger.error(`Ошибка при предложении перевода: ${error}`);
      next(error);
    }
  },

  suggestWords: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { text, language, id, dialect } = req.body;
    try {
      if (!text || !language) {
        logger.error(
          "Ошибка при предложении слов, отсутствует один из параметров"
        );
        res
          .status(400)
          .json({ message: "Отсутствует один из параметров" });
        return;
      }

      if (!req.user) {
        res.status(400).json({ message: "Отсутствует токен" });
        return
      }

      if (!id) {
        logger.error(`Отсутствует telegramID`);
        res.status(400).json({ message: "Ошибка запроса" });
        return
      }

      // const userId = new Types.ObjectId(req.user.userId);
      // Найти пользователя и получить только его _id
      const user = await TelegramUserModel.findOne({ id }).select("_id");

      if (!user) {
        res.status(404).json({ message: "Пользователь не найден" });
        return
      }

      const userId = user?._id; // Извлечение _id как ObjectId

      const results = [];
      const wordsArray = text.split(",").map((word: string) => ({
        normalized: word.trim().toLowerCase(),
        original: word.trim(),
      }));

      for (const { normalized, original } of wordsArray) {
        let existingWord = await SuggestedWordModel.findOne({
          normalized_text: normalized,
        });

        if (existingWord) {
          if (!existingWord.contributors.includes(userId)) {
            existingWord.contributors.push(userId);
            await existingWord.save();
            await updateRating(userId);
          }
          results.push({
            message:
              "Слово уже существует, автор добавлен в список контрибьюторов",
            existingWord,
          });
        } else {
          const newSuggestedWord = new SuggestedWordModel({
            text: original,
            normalized_text: normalized, // Добавление нормализованного текста
            language,
            author: userId,
            contributors: [userId],
          });

          if (language === "buryat") {
            if (typeof dialect === "string") {
              newSuggestedWord.dialect = dialect;
              logger.info(`Диалект присвоен к слову`);
            }
          }

          await newSuggestedWord.save();
          results.push({
            message: "Слово успешно предложено",
            newSuggestedWord,
          });
          await updateRating(userId, 30);
        }
      }

      res.status(200).json(results);
      return;
    } catch (error) {
      logger.error(`Ошибка при предложении слов: ${error}`);
      res.status(500).json({ message: "Ошибка при предложении слов" });
      next(error)
    }
  },

  acceptSuggestedWord: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const suggestedWord = req.suggestedWord as ISuggestedWordModel;
    // const telegram_user_id = req.telegram_user_id;

    try {
      if (!suggestedWord) {
        res.status(400).json({ message: "suggestedWord не указан" });
        return;
      }

      // Ваш код по обработке suggestedWord и telegram_user_id

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при принятии предложенного слова" });
      next(error);
    }
  },
  declineSuggestedWord: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { suggestedWord } = req;

    try {
      if (!suggestedWord) {
        res.status(400).json({ message: "SuggestedWord не указан" });
        return
      }

      // Найти слово в SuggestedWordModel
      const wordToDecline = await SuggestedWordModel.findById(
        suggestedWord._id
      );

      if (!wordToDecline) {
        res.status(404).json({ message: "Слово не найдено" });
        return
      }

      // Создать новый документ в DeclinedWordModel с теми же данными
      const declinedWord = new DeclinedWordModel({
        text: wordToDecline.text,
        normalized_text: wordToDecline.normalized_text,
        language: wordToDecline.language,
        author: wordToDecline.author,
        contributors: wordToDecline.contributors,
        translations: wordToDecline.pre_translations, // предполагаю, что это соответствие переводам
        dialect: wordToDecline.dialect,
      });

      // Сохранить отклонённое слово
      await declinedWord.save();

      // Удалить слово из SuggestedWordModel
      await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

      res.status(200).json({
        message:
          "Слово успешно отклонено и перенесено в архив отклонённых слов.",
      });
      return
    } catch (error) {
      logger.error(`Ошибка при отклонении предложенного слова: ${error}`);
      res
        .status(500)
        .json({ message: "Ошибка при отклонении предложенного слова" });
      next(error)
    }
  },

  // Новый метод для получения одного подтверждённого слова
  getConfirmedWord: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { wordId } = req.query;

      // Если указан ID, ищем по ID
      let word;
      if (wordId) {
        word = await WordModel.findById(wordId)
          .populate("author", "_id firstname username email")
          .populate("translations", "_id text")
          .populate(
            "translations_u",
            "_id text language dialect createdAt pre_translations normalized_text author contributors"
          );
      } else {
        // Если ID не указан, получаем случайное слово
        const count = await WordModel.countDocuments();
        const random = Math.floor(Math.random() * count);
        word = await WordModel.findOne()
          .skip(random)
          .populate("author", "_id firstname username email")
          .populate(
            "translations",
            "_id text language dialect createdAt pre_translations normalized_text author contributors"
          )
          .populate(
            "translations_u",
            "_id text language dialect createdAt pre_translations normalized_text author contributors"
          );
      }

      if (!word) {
        res.status(404).json({ message: "Слово не найдено" });
        return
      }

      res.status(200).json({
        message: "Подтверждённое слово найдено",
        word,
      });
      return
    } catch (error) {
      console.error(`Ошибка при получении слова: ${error}`);
      res.status(500).json({ message: "Ошибка при получении слова" });
      next(error)
    }
  },
};

export default vocabularyController;
