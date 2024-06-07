// sentenceController.ts
import { Request, Response } from "express";
import SuggestedSentence from "../models/SuggestedSentence";
import AcceptedSentence, { ISentence } from "../models/AcceptedSentences";
import { AuthRequest } from "../middleware/authenticateToken";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import logger from "../utils/logger";
import isValidObjectIdString from "../utils/isValidObjectIdString";
import User from "../models/User";
import updateRating from "../utils/updateRating";
import Sentence from "../models/AcceptedSentences";

const sentenceController = {
  getAllSentences: async (req: Request, res: Response) => {
    try {
      const { notAccepted, page = 1, limit = 10 } = req.query;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      let count;
      let sentences;
      const skipIndex = (pageNumber - 1) * limitNumber;

      if (notAccepted === "true") {
        count = await SuggestedSentence.find({ status: "pending" }).countDocuments()
        sentences = await SuggestedSentence.find({ status: "pending" })
        .sort({ _id: 1 })
        .skip(skipIndex)
        .limit(limitNumber)
        .populate("author", "_id firstName username email");
        
      } else {
          count = await Sentence.find().countDocuments()
          sentences = await Sentence.find()
          .sort({ _id: 1 })
          .skip(skipIndex)
          .limit(limitNumber)
          .populate("author", "_id firstName username email");
      }

      if (sentences.length === 0) {
        logger.error(`Предложений не найдено`);
        res
          .status(404)
          .json({ message: "Предложения не найдены", sentences: [] });
      } else {
        // Возвращайте также общее количество записей для поддержки пагинации на клиенте
        logger.info(`Предложения получены!`);
        res.status(200).json({
          message: `Предложения найдены`,
          sentences,
          count: sentences.length,
          total_count: count,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при получении предложений!" });
    }
  },

  // В вашем контроллере
  getAcceptedSentence: async (req: AuthRequest, res: Response) => {
    try {
      const sentence = await AcceptedSentence.findOne()
        .lean()
        .populate("author", "_id firstName username email");
      if (!sentence) {
        return res
          .status(404)
          .json({ message: "Предложение для перевода не найдено" });
      }
      res
        .status(200)
        .json({ message: "Предложение для перевода получено", sentence });
    } catch (error) {
      logger.error(`Ошибка при получении предложения для переода: ${error}`);
      res.status(500).json({ message: "Error retrieving sentence" });
    }
  },

  getNewSentence: async (req: AuthRequest, res: Response) => {
    try {
      const sentence = await SuggestedSentence.findOne({
        status: "new",
      });

      if (sentence) {
        // // Проверяем, есть ли пользователь уже в массиве watchers
        // const isWatching = sentence.watchers.some((watcherId) => watcherId.equals(new ObjectId(req.user.userId)));

        // if (!isWatching) {
        //     // Добавляем пользователя в массив watchers
        //     await SuggestedSentence.findByIdAndUpdate(sentence._id, {
        //         $addToSet: { watchers: new ObjectId(req.user.userId) }
        //     });

        // }

        return res
          .status(200)
          .json({ message: "Предложение для рассмотрения получено", sentence });
      }

      return res
        .status(404)
        .json({ message: `Предложения для рассмотрения не найдены` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving sentence" });
    }
  },

  // Получение предлождения по ID
  getSentence: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log(req.params)
      if (!isValidObjectId(id)) {
        // return res.status(400).json({ message: 'Неверные входные данные' });

        if (!isValidObjectIdString(id)) {
          return res.status(400).json({
            message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
          });
        }
      }

      const sentence = await SuggestedSentence.findById(new ObjectId(id));

      if (sentence) {
        return res.status(200).json(sentence);
      }

      return res.status(404).json({ message: "Предложение не найдено" });
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при получении предложения: ${req.params.id}`);
      res.status(500).json({ message: `Ошибка при получении предложения` });
    }
  },

  // Создание одного предложения
  createSentence: async (req: AuthRequest, res: Response) => {
    try {
      const { text, language } = req.body;
      const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

      if (!text || !language || !author) {
        logger.error(`Пожалуйста, предоставьте текст, язык и автора`);
        return res
          .status(400)
          .json({ message: "Пожалуйста, предоставьте текст, язык и автора" });
      }

      // Валидация текста
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        logger.error(`Неверный формат текста`);
        return res.status(400).json({ message: "Неверный формат текста" });
      }

      // Валидация языка
      if (
        !language ||
        typeof language !== "string" ||
        language.trim().length === 0
      ) {
        logger.error(`Неверный формат языка`);
        return res.status(400).json({ message: "Неверный формат языка" });
      }

      const isExists = await SuggestedSentence.findOne({ text });

      if (isExists) {
        await SuggestedSentence.updateOne(
          { text },
          {
            $addToSet: {
              contributors: author,
            },
          }
        )
          .then(() => {
            console.log("автор записан");
          })
          .catch((error) => console.log(error));

        return res.status(200).json({
          message: "Такое предложение существует, вы добавлены в контрибьютеры",
          isExists,
        });
      }

      const newSentence = await new SuggestedSentence({
        text,
        language,
        author,
      }).save();

      await User.findByIdAndUpdate(author, {
        $push: { suggestedSentences: newSentence._id },
      });
      logger.info(`Предложение успешно создано: ${newSentence._id}`);

      // Вызываем метод обновления рейтинга пользователя
      const updateR = await updateRating(author);
      logger.info(`typeof(updateR) ${typeof updateR}`);

      res.status(201).json({
        message: "Предложение успешно создано",
        sentenceId: newSentence._id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при создании предложения" });
    }
  },

  // Создание нескольких предложений
  createSentenceMultiple: async (req: AuthRequest, res: Response) => {
    try {
      const { sentences, language, context } = req.body;
      const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

      if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
        return res
          .status(400)
          .json({ message: "Поле sentences должно быть непустым массивом!" });
      }

      if (!language || !author) {
        logger.error(`Пожалуйста, предоставьте текст, язык и автора`);
        return res
          .status(400)
          .json({ message: "Пожалуйста, предоставьте текст, язык и автора" });
      }

      // Валидация языка
      if (
        !language ||
        typeof language !== "string" ||
        language.trim().length === 0
      ) {
        logger.error(`Неверный формат языка`);
        return res.status(400).json({ message: "Неверный формат языка" });
      }

      let addedSentences: any[] = [];
      let existsSentences: any[] = [];
      let authorIsAuthor: any[] = [];
      let existsTranslations: any[] = [];

      for (let i = 0; i < sentences.length; i++) {
        const sentence: {
          text: string;
        } = sentences[i];

        // Валидация текста
        if (
          !sentence.text ||
          typeof sentence.text !== "string" ||
          sentence.text.trim().length === 0
        ) {
          logger.error(`Неверный формат текста`);
          return res.status(400).json({ message: "Неверный формат текста" });
        }

        const isExists = await SuggestedSentence.findOne({
          text: sentence.text,
        });
        const isExistsInAcceptedSentences = await AcceptedSentence.findOne({
          text: sentence.text,
        });

        if (isExistsInAcceptedSentences) {
          existsTranslations.push(isExistsInAcceptedSentences);
          continue;
        }

        if (isExists) {
          if (isExists.author.toString() == author.toString()) {
            authorIsAuthor.push(isExists);
            continue;
          } else {
            await SuggestedSentence.updateOne(
              { text: sentence.text },
              {
                $addToSet: {
                  contributors: author,
                },
              }
            )
              .then((document) => {
                logger.info(
                  `Автор записан в контрибьюторы при добавлении предложения`
                );
                existsSentences.push(document);
              })
              .catch((error) => {
                logger.error(
                  `Ошибка при записи автора в контрибюторы при добавлении предложения: ${error}`
                );
              });
          }

          // return res.status(200).json({ message: 'Такое предложение существует, вы добавлены в контрибьютеры', isExists })
        } else {
          const newSentence = await new SuggestedSentence({
            text: sentence.text,
            language,
            author,
            context,
          }).save();

          await User.findByIdAndUpdate(author, {
            $push: { suggestedSentences: newSentence._id },
          });

          logger.info(`Предложение успешно создано: ${newSentence._id}`);

          addedSentences.push(newSentence);

          // Вызываем метод обновления рейтинга пользователя
          await updateRating(author);
        }
      }

      return res.status(200).json({
        message: `Предложения успешно добавлены!`,
        existsTranslations,
        addedSentences,
        existsSentences,
        authorIsAuthor,
      });
    } catch (error) {
      console.error(error);
      logger.error(error);
      res.status(500).json({ message: "Ошибка при создании предложения" });
    }
  },

  //  Принятие предложения
  acceptSentence: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Поиск предложенного предложения
      const sentence = await SuggestedSentence.findById(id);
      if (!sentence) {
        return res.status(404).json({ message: "Предложение не найдено" });
      }

      // Создание и сохранение принятого предложения
      await new AcceptedSentence({
        _id: sentence._id,
        text: sentence.text,
        language: sentence.language,
        author: sentence.author,
        context: sentence.context,
        contributors: sentence.contributors,
        // Добавьте любые другие необходимые поля
      }).save();

      // Удаление предложенного предложения после успешного создания принятого предложения
      await SuggestedSentence.findByIdAndDelete(id);
      logger.info(`Предложенное предложение удалено! ${id}`);

      res.json({ message: "Предложение принято для перевода", sentence });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Ошибка при принятии предложения для перевода" });
    }
  },

  // Отклонение предложения
  rejectSentence: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const isExists = await SuggestedSentence.findById(id);

      if (!isExists) {
        return res.status(404).json({ message: "Предложение на найдено" });
      }

      const sentence = await SuggestedSentence.findByIdAndUpdate(
        id,
        { status: "rejected" },
        { new: true }
      );

      if (!sentence) {
        return res.status(404).json({ message: "Предложение не найдено" });
      }

      logger.info(`Предложение отклонено: ${sentence._id}`);
      res.json({ message: "Предложение отклонено", sentence });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при отклонении предложения" });
    }
  },

  // Удаление предложений
  deleteSentences: async (req: Request, res: Response) => {
    try {
      const { sentences } = req.body;

      if (!sentences || !sentences.length) {
        return res
          .status(400)
          .json({ message: "Параметр предложений отсутствует или пуст!" });
      }

      // Создаем массив для хранения всех _id
      const ids = sentences
        .map((sentence) => sentence._id)
        .filter((id) => isValidObjectId(id));

      if (ids.length !== sentences.length) {
        return res.status(400).json({ message: "Некоторые _id невалидны!" });
      }

      // Удаление всех предложений с валидными _id одним запросом
      await SuggestedSentence.deleteMany({ _id: { $in: ids } });

      return res.json({
        message: "Предложения удалены!",
        deletedCount: ids.length,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при удалении предложений!" });
    }
  },
};

export default sentenceController;
