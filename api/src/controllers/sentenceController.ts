// src/controllers/sentenceController.ts

import { NextFunction, Request, Response } from "express";
import SuggestedSentence from "../models/SuggestedSentence";
import AcceptedSentence from "../models/AcceptedSentences";
import User from "../models/User";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import logger from "../utils/logger";
import isValidObjectIdString from "../utils/isValidObjectIdString";
import updateRating from "../utils/updateRating";
import Watcher from "../models/Watcher";

const sentenceController = {
  getAllSentences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { notAccepted, page = 1, limit = 10 } = req.query;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      let count: number;
      let sentences: any[];
      const skipIndex = (pageNumber - 1) * limitNumber;

      if (notAccepted === "true") {
        count = await SuggestedSentence.find({
          status: "pending",
        }).countDocuments();
        sentences = await SuggestedSentence.find({ status: "pending" })
          .sort({ _id: 1 })
          .skip(skipIndex)
          .limit(limitNumber)
          .populate("author", "_id firstName username email");
      } else {
        count = await AcceptedSentence.find().countDocuments();
        sentences = await AcceptedSentence.find()
          .sort({ _id: 1 })
          .skip(skipIndex)
          .limit(limitNumber)
          .populate("author", "_id firstName username email");
      }

      if (sentences.length === 0) {
        logger.error(`Предложений не найдено`);
        res.status(404).json({ message: "Предложения не найдены", sentences: [] });
        return;
      } else {
        // Возвращаем также общее количество записей для поддержки пагинации на клиенте
        logger.info(`Предложения получены!`);
        res.status(200).json({
          message: `Предложения найдены`,
          sentences,
          count: sentences.length,
          total_count: count,
        });
        return;
      }
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при получении предложений: ${error}`);
      res.status(500).json({ message: "Ошибка при получении предложений!" });
      next(error);
    }
  },

  getAcceptedSentence: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sentence = await AcceptedSentence.aggregate([
        {
          $addFields: {
            watchersCount: { $size: { $ifNull: ["$watchers", []] } },
          },
        },
        {
          $sort: { watchersCount: 1 },
        },
        {
          $limit: 1,
        },
      ]).exec();

      if (sentence.length === 0) {
        res.status(404).json({ message: "Предложение для перевода не найдено" });
        return;
      }

      const populatedSentence = await AcceptedSentence.populate(sentence[0], {
        path: "author",
        select: "_id firstName username email",
      });

      res.status(200).json({
        message: "Предложение для перевода получено",
        sentence: populatedSentence,
      });
      return;
    } catch (error) {
      logger.error(`Ошибка при получении предложения для перевода: ${error}`);
      console.error(error);
      res.status(500).json({ message: "Error retrieving sentence" });
      next(error);
    }
  },

  getNewSentence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Вы не авторизованы!" });
        return;
      }

      const sentence = await SuggestedSentence.findOne({
        status: "pending",
      })
        .sort({ watchers: 1 })
        .exec();

      if (sentence) {
        // Добавляем пользователя в массив watchers
        await SuggestedSentence.findByIdAndUpdate(sentence._id, {
          $addToSet: { watchers: new ObjectId(req.user._id) },
        });

        const expiresAt = new Date(Date.now() + 5 * 1000); // 5 секунд (похоже на временную метку, возможно, нужно изменить)

        await new Watcher({
          telegramUserId: new ObjectId("667310420bff561a88320643"),
          sentenceId: new ObjectId("6672dcb652ac724f7c56dd3b"),
          expiresAt,
        }).save();

        res.status(200).json({ message: "Предложение для рассмотрения получено", sentence });
        return;
      }

      res.status(404).json({ message: `Предложения для рассмотрения не найдены` });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при получении нового предложения: ${error}`);
      res.status(500).json({ message: "Error retrieving sentence" });
      next(error);
    }
  },

  // Получение предложения по ID
  getSentence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      console.log(req.params);

      if (!isValidObjectId(id)) {
        if (!isValidObjectIdString(id)) {
          res.status(400).json({
            message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
          });
          return;
        }
      }

      const sentence = await SuggestedSentence.findById(new ObjectId(id));

      if (sentence) {
        res.status(200).json(sentence);
        return;
      }

      res.status(404).json({ message: "Предложение не найдено" });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при получении предложения: ${req.params.id} - ${error}`);
      res.status(500).json({ message: `Ошибка при получении предложения` });
      next(error);
    }
  },

  // Создание одного предложения
  createSentence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, language } = req.body;

      if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Вы не авторизованы!" });
        return;
      }

      const author = new ObjectId(req.user._id);

      if (!text || !language || !author) {
        logger.error(`Пожалуйста, предоставьте текст, язык и автора`);
        res.status(400).json({ message: "Пожалуйста, предоставьте текст, язык и автора" });
        return;
      }

      // Валидация текста
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        logger.error(`Неверный формат текста`);
        res.status(400).json({ message: "Неверный формат текста" });
        return;
      }

      // Валидация языка
      if (!language || typeof language !== "string" || language.trim().length === 0) {
        logger.error(`Неверный формат языка`);
        res.status(400).json({ message: "Неверный формат языка" });
        return;
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
            console.log("Автор записан");
          })
          .catch((error) => console.log(error));

        res.status(200).json({
          message: "Такое предложение существует, вы добавлены в контрибьютеры",
          isExists,
        });
        return;
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
      logger.info(`Рейтинг пользователя обновлён: ${updateR}`);

      res.status(201).json({
        message: "Предложение успешно создано",
        sentenceId: newSentence._id,
      });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при создании предложения: ${error}`);
      res.status(500).json({ message: "Ошибка при создании предложения" });
      next(error);
    }
  },

  // Создание нескольких предложений
  createSentenceMultiple: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sentences, language, ctx } = req.body;
      console.log(ctx);

      if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Вы не авторизованы!" });
        return;
      }

      const author = new ObjectId(req.user._id);

      if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
        res.status(400).json({ message: "Поле sentences должно быть непустым массивом!" });
        return;
      }

      if (!language || typeof language !== "string" || language.trim().length === 0) {
        logger.error(`Неверный формат языка`);
        res.status(400).json({ message: "Неверный формат языка" });
        return;
      }

      let addedSentences: any[] = [];
      let existsSentences: any[] = [];
      let authorIsAuthor: any[] = [];
      let existsTranslations: any[] = [];

      for (let i = 0; i < sentences.length; i++) {
        const sentence: { text: string } = sentences[i];

        // Валидация текста
        if (!sentence.text || typeof sentence.text !== "string" || sentence.text.trim().length === 0) {
          logger.error(`Неверный формат текста`);
          res.status(400).json({ message: "Неверный формат текста" });
          return;
        }

        const isExists = await SuggestedSentence.findOne({ text: sentence.text });
        const isExistsInAcceptedSentences = await AcceptedSentence.findOne({ text: sentence.text });

        if (isExistsInAcceptedSentences) {
          existsTranslations.push(isExistsInAcceptedSentences);
          continue;
        }

        if (isExists) {
          if (isExists.author.toString() === author.toString()) {
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
                logger.info(`Автор записан в контрибьюторы при добавлении предложения`);
                existsSentences.push(document);
              })
              .catch((error) => {
                logger.error(`Ошибка при записи автора в контрибюторы при добавлении предложения: ${error}`);
              });
          }

          // res.status(200).json({ message: 'Такое предложение существует, вы добавлены в контрибьютеры', isExists })
        } else {
          const newSentence = await new SuggestedSentence({
            text: sentence.text,
            language,
            author,
            context: ctx,
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

      res.status(200).json({
        message: `Предложения успешно добавлены!`,
        existsTranslations,
        addedSentences,
        existsSentences,
        authorIsAuthor,
      });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при создании нескольких предложений: ${error}`);
      res.status(500).json({ message: "Ошибка при создании предложения" });
      next(error);
    }
  },

  // Принятие предложения
  acceptSentence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Поиск предложенного предложения
      const sentence = await SuggestedSentence.findById(id);
      if (!sentence) {
        res.status(404).json({ message: "Предложение не найдено" });
        return;
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
      logger.info(`Предложенное предложение удалено! ID: ${id}`);

      res.status(200).json({ message: "Предложение принято для перевода", sentence });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при принятии предложения для перевода: ${error}`);
      res.status(500).json({ message: "Ошибка при принятии предложения для перевода" });
      next(error);
    }
  },

  // Отклонение предложения
  rejectSentence: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const isExists = await SuggestedSentence.findById(id);

      if (!isExists) {
        res.status(404).json({ message: "Предложение не найдено" });
        return;
      }

      const sentence = await SuggestedSentence.findByIdAndUpdate(
        id,
        { status: "rejected" },
        { new: true }
      );

      if (!sentence) {
        res.status(404).json({ message: "Предложение не найдено" });
        return;
      }

      logger.info(`Предложение отклонено: ${sentence._id}`);
      res.status(200).json({ message: "Предложение отклонено", sentence });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при отклонении предложения: ${error}`);
      res.status(500).json({ message: "Ошибка при отклонении предложения" });
      next(error);
    }
  },

  // Удаление предложений
  deleteSentences: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sentences } = req.body;

      if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
        res.status(400).json({ message: "Параметр предложений отсутствует или пуст!" });
        return;
      }

      // Создаём массив для хранения всех _id
      const ids = sentences
        .map((sentence: any) => sentence._id)
        .filter((id: any) => isValidObjectId(id));

      if (ids.length !== sentences.length) {
        res.status(400).json({ message: "Некоторые _id невалидны!" });
        return;
      }

      // Удаление всех предложений с валидными _id одним запросом
      const deleteResult = await SuggestedSentence.deleteMany({ _id: { $in: ids } });

      res.status(200).json({
        message: "Предложения удалены!",
        deletedCount: deleteResult.deletedCount,
      });
      return;
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при удалении предложений: ${error}`);
      res.status(500).json({ message: "Ошибка при удалении предложений!" });
      next(error);
    }
  },
};

export default sentenceController;
