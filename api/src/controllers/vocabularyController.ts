import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authenticateToken";
import { Types } from "mongoose";
import logger from "../utils/logger";
import WordModel from "../models/Vocabulary/WordModel";
import SuggestedWordModel from "../models/Vocabulary/SuggestedWordModel";
import { ValidateSuggestedWordRequest } from "../middleware/validateSuggestedWord";
import TelegramUserModel from "../models/TelegramUsers";
import updateRating from "../utils/updateRatingTelegram";
import DeclinedWordModel from "../models/Vocabulary/DeclinedWordModel";

const vocabularyController = {
  getAllWords: async (req: Request, res: Response) => {
    try {
      const words = await WordModel.find()
        .sort({ _id: 1 })
        .populate("author", "_id firstname username email")
        .populate("translations", "_id text");

      logger.info("Все слова получены!");
      res.status(200).json({ message: "Словарь найден", words });
    } catch (error) {
      logger.error(`Ошибка при получении слов: ${error}`);
      res.status(500).json({ message: "Ошибка при получении слов" });
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
        .populate("translations", "_id text");

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

  suggestWordTranslate: async (
    req: AuthRequest,
    res: Response
  ): Promise<Response> => {
    const { word_id, translate_language, translate, dialect, normalized_text, telegram_user_id } =
      req.body;

      
    try {
      // Проверка обязательных параметров
      console.log({
        word_id,
        translate_language,
        translate,
        telegram_user_id,
        normalized_text
      })
      if (!word_id || !translate_language || !translate || !telegram_user_id || !normalized_text) {
        logger.error(
          "Ошибка при предложении перевода в словарь, отсутствует один из обязательных параметров"
        );
        return res
          .status(400)
          .json({
            message:
              "Ошибка при предложении перевода в словарь, отсутствует один из обязательных параметров",
          });
      }

      // Поиск исходного слова в базе данных
      const existingWord = await WordModel.findById(word_id);
      if (!existingWord) {
        return res.status(400).json({ message: "Исходное слово не найдено" });
      }

      // Проверка на существование перевода (предложенного слова)
      const existingSuggestedWord = await SuggestedWordModel.findOne({
        normalized_text: translate.trim().toLowerCase(),
        language: translate_language, // Проверяем также язык перевода
      });

      if (existingSuggestedWord) {
        logger.info(`Предложенное слово уже существует в коллекции`)

        // Если предложенное слово уже существует, 
        // добавляем его в поле непринятых к принятому слову
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations_u: existingSuggestedWord._id }, // Обновляем исходное слово
        });
        logger.info(`_id предложенного слова добавлен к принятому слову`)

        // Добавляем айди принятого слова в массив pre_translations у предложенного слова на голосование
        await SuggestedWordModel.findByIdAndUpdate(existingSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id }, // Связываем перевод с исходным словом
        });
        logger.info(`_id принятого слова добавлен к предложенному слову`)
      } else {
        // Если перевода не существует, создаем новое предложенное слово
        const newSuggestedWord = new SuggestedWordModel({
          text: translate,
          language: translate_language,
          author: new Types.ObjectId(telegram_user_id),
          dialect,
          normalized_text: translate.toLowerCase().trim(),
        });

        // Сохраняем новое предложенное слово
        await newSuggestedWord.save().then(async(savedSuggestedWord) => {
          try {
            if (!savedSuggestedWord) {
              logger.error("Ошибка при сохранении предложенного слова");
              return res
                .status(500)
                .json({ message: "Ошибка при сохранении слова" });
            }

            logger.info(
              `Предложенное слово успешно сохранено с ID: ${savedSuggestedWord._id}`
            );

            // Обновляем исходное слово, добавляя ID нового предложенного слова
            await WordModel.findByIdAndUpdate(
              word_id,
              {
                $addToSet: { translations_u: savedSuggestedWord._id },
              },
              { new: true }
            );

            logger.info(`Исходное слово успешно обновлено`);

          } catch (error) {
            logger.error(error)
          }
        });

        // Связываем новое предложенное слово с исходным словом
        await SuggestedWordModel.findByIdAndUpdate(newSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id },
        });
        
      }

      // Сохраняем обновленное исходное слово
      await existingWord.save();

      return res
        .status(200)
        .json({ message: "Перевод успешно предложен и добавлен в словарь" });
    } catch (error) {
      // Логируем и возвращаем ошибку, если что-то пошло не так
      logger.error(`Ошибка при предложении перевода: ${error}`);
      return res
        .status(500)
        .json({ message: "Ошибка при предложении перевода" });
    }
  },

  suggestWords: async (req: AuthRequest, res: Response) => {
    const { text, language, id, dialect } = req.body;
    try {
      if (!text || !language) {
        logger.error(
          "Ошибка при предложении слов, отсутствует один из параметров"
        );
        return res
          .status(400)
          .json({ message: "Отсутствует один из параметров" });
      }

      if (!req.user) {
        return res.status(400).json({ message: "Отсутствует токен" });
      }

      if (!id) {
        logger.error(`Отсутствует telegramID`);
        return res.status(400).json({ message: "Ошибка запроса" });
      }

      // const userId = new Types.ObjectId(req.user.userId);
      // Найти пользователя и получить только его _id
      const user = await TelegramUserModel.findOne({ id }).select("_id");
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

      return res.status(200).json(results);
    } catch (error) {
      logger.error(`Ошибка при предложении слов: ${error}`);
      res.status(500).json({ message: "Ошибка при предложении слов" });
    }
  },

  acceptSuggestedWord: async (
    req: ValidateSuggestedWordRequest,
    res: Response
  ) => {
    const { suggestedWord, telegram_user_id } = req;

    try {
      if (!suggestedWord) {
        return res.status(400).json({ message: "suggestedWord не указан" });
      }

      const wordToUpdate = await WordModel.findOne({
        text: suggestedWord.text,
      });

      let updateOrCreateWord;

      if (wordToUpdate) {
        wordToUpdate.language = suggestedWord.language;
        wordToUpdate.author = suggestedWord.author;
        wordToUpdate.contributors = Array.from(
          new Set([...wordToUpdate.contributors, ...suggestedWord.contributors])
        );
        wordToUpdate.translations = Array.from(
          new Set([
            ...wordToUpdate.translations,
            ...suggestedWord.pre_translations,
          ])
        );

        updateOrCreateWord = wordToUpdate.save(); // Сохраняем слово
      } else {
        updateOrCreateWord = new WordModel({
          _id: suggestedWord._id,
          text: suggestedWord.text,
          normalized_text: suggestedWord.normalized_text,
          language: suggestedWord.language,
          dialect: suggestedWord.dialect,
          author: suggestedWord.author,
          contributors: suggestedWord.contributors,
          translations: suggestedWord.pre_translations,
        }).save(); // Создаем новое слово
      }

      // Обновляем рейтинги для пользователей
      const updateRatings = Promise.all([
        updateRating(telegram_user_id, 10),
        updateRating(suggestedWord.author, 10),
      ]);

      // Удаляем предложенное слово и ждем завершения всех операций
      await Promise.all([updateOrCreateWord, updateRatings]);
      await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

      return res
        .status(200)
        .json({ message: "Слово успешно принято и добавлено в словарь" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Ошибка при принятии предложенного слова" });
    }
  },

  declineSuggestedWord: async (
    req: ValidateSuggestedWordRequest,
    res: Response
  ) => {
    const { suggestedWord, telegram_user_id } = req;

    try {
      if (!suggestedWord) {
        return res.status(400).json({ message: "SuggestedWord не указан" });
      }

      // Найти слово в SuggestedWordModel
      const wordToDecline = await SuggestedWordModel.findById(
        suggestedWord._id
      );

      if (!wordToDecline) {
        return res.status(404).json({ message: "Слово не найдено" });
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

      return res.status(200).json({
        message:
          "Слово успешно отклонено и перенесено в архив отклонённых слов.",
      });
    } catch (error) {
      logger.error(`Ошибка при отклонении предложенного слова: ${error}`);
      return res
        .status(500)
        .json({ message: "Ошибка при отклонении предложенного слова" });
    }
  },

  // Новый метод для получения одного подтверждённого слова
  getConfirmedWord: async (req: Request, res: Response) => {
    try {
      const { wordId } = req.query;

      // Если указан ID, ищем по ID
      let word;
      if (wordId) {
        word = await WordModel.findById(wordId)
          .populate("author", "_id firstname username email")
          .populate("translations", "_id text");
      } else {
        // Если ID не указан, получаем случайное слово
        const count = await WordModel.countDocuments();
        const random = Math.floor(Math.random() * count);
        word = await WordModel.findOne()
          .skip(random)
          .populate("author", "_id firstname username email")
          .populate("translations", "_id text");
      }

      if (!word) {
        return res.status(404).json({ message: "Слово не найдено" });
      }

      return res.status(200).json({
        message: "Подтверждённое слово найдено",
        word,
      });
    } catch (error) {
      console.error(`Ошибка при получении слова: ${error}`);
      res.status(500).json({ message: "Ошибка при получении слова" });
    }
  },
};

export default vocabularyController;
