// translationController.ts
import { NextFunction, Request, Response } from "express";
import Translation from "../models/Translation";
import { AuthRequest } from "../middleware/authenticateToken";
import { ObjectId } from "mongodb";
import { isValidObjectId } from "mongoose";
import logger from "../utils/logger";
import isValidObjectIdString from "../utils/isValidObjectIdString";
import User from "../models/User";
import updateRating from "../utils/updateRating";
import Sentence from "../models/SuggestedSentence";
import Vote from "../models/Vote";
const translationController = {
  getAllTranslations: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const translations = await Translation.find();

      if (!translations.length) {
        res
          .status(404)
          .json({ message: "Переводов не найдено", translations }); return
      }

      res
        .status(200)
        .json({
          message: `Переводы получены`,
          translations,
          count: translations.length,
        });
      return
    } catch (error) {
      logger.error(`Ошибка при получении переводов: ${error}`);
      console.error(error);
      res.status(500).json({ message: "Error retrieving translation" });
      next(error)
    }
  },

  getSuggestedTranslation: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const suggestedTranslation = await Translation.findOne();

      if (suggestedTranslation) {
        res
          .status(200)
          .json({ message: "Перевод получен", suggestedTranslation });
        return
      } else {
        res
          .status(404)
          .json({ message: `Предложенные переводы не найдены` });
        return
      }
    } catch (error) {
      console.error(error);
      logger.error(`Error retrieving suggestedTranslation, ${error}`);
      res
        .status(500)
        .json({ message: "Error retrieving suggestedTranslation" });
      next(error)
    }
  },

  createTranslation: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { text, language, sentenceId, dialect } = req.body;
      if (!req.user) {
        res.json({ message: "Вы не авторизованы!" });
        return
      }
      const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

      if (!text || !language || !author || !sentenceId) {
        logger.error(
          `Пожалуйста, предоставьте текст, язык, автора и айди предложения`
        );
        res
          .status(400)
          .json({
            message:
              "Пожалуйста, предоставьте текст, язык, автора и айди предложения",
          });
        return
      }

      if (!isValidObjectId(sentenceId)) {
        // return res.status(400).json({ message: 'Неверные входные данные' });

        if (!isValidObjectIdString(sentenceId)) {
          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            });
          return
        }
      }

      const sentence = await Sentence.findById({ _id: sentenceId });

      if (!sentence) {
        res.status(404).json({ message: `Предложение не существует` });
        return
      }

      const sentenceTranslations = sentence.translations;

      // existsing translations

      let existsingTranslations = [];

      if (sentenceTranslations && sentence.translations.length) {
        console.log("is running");

        for (let i = 0; i < sentenceTranslations.length; i++) {
          const translation = await Translation.findById(
            sentenceTranslations[i]
          );

          if (translation) {
            existsingTranslations.push(translation.text);
          }

        }
      }

      console.log(existsingTranslations);

      if (existsingTranslations.indexOf(text) !== -1) {
        res
          .status(409)
          .json({ message: "Такой перевод уже существует" });

        return
      }

      const translation = await new Translation({
        text,
        language,
        dialect,
        author,
        sentenceId: new ObjectId(sentenceId),
      })
        .save()
        .then(async (document) => {
          logger.info(
            `Перевод успешно добавлен. translationId: ${document._id}`
          );

          await updateRating(author);

          await User.findByIdAndUpdate(author, {
            $addToSet: {
              suggestedTranslations: document._id,
            },
          }).then(() => {
            logger.info(
              `Поле suggestedTranslations у пользователя обновлён. ${document._id}`
            );
          });

          await Sentence.findByIdAndUpdate(new ObjectId(sentenceId), {
            $addToSet: {
              translations: document._id,
            },
          });

          return document;
        });

      res
        .status(201)
        .json({
          message: "Перевод успешно добавлен",
          translationId: translation._id,
        });
      return
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при создании перевода" });
      next(error)
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, contributorId } = req.body;

      const validStatuses: ("processing" | "accepted" | "rejected")[] = [
        "processing",
        "accepted",
        "rejected",
      ];

      if (!isValidObjectId(id)) {
        // return res.status(400).json({ message: 'Неверные входные данные' });

        if (!isValidObjectIdString(id)) {
          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            });
          return
        }
      }

      if (contributorId && !isValidObjectId(contributorId)) {
        res.status(400).json({ message: `Неверный contributorId` });
        return
      } else if (contributorId) {
        const contributorIsExists = await User.findOne({ _id: contributorId });

        if (!contributorIsExists) {
          res
            .status(404)
            .json({ message: `Контрибьютора не существует` });
          return
        }
      }

      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Неверный статус" });
        return
      }

      const translation = await Translation.findById({ _id: new ObjectId(id) });

      if (translation === null) {
        res
          .status(404)
          .json({ message: "Перевод не найден", translation });
        return
      }

      // Добавление нового участника, если статус 'accepted' и передан contributorId
      if (status === "accepted" && contributorId) {
        translation.contributors.push(contributorId);
      }

      translation.status = status;
      await translation.save();

      res
        .status(200)
        .json({ message: "Статус перевода успешно обновлен", translation });
      return
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Ошибка при обновлении статуса перевода" });
      next(error)
    }
  },

  acceptTranslation: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const translation = await Translation.findByIdAndUpdate(
        id,
        { status: "accepted" },
        { new: true }
      );

      if (!translation) {
        res.status(404).json({ message: "Перевод не найдено" });
        return
      }

      res.json({ message: "Перевод принят", translation });
      return
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при принятии перевода" });
      next(error)
    }
  },

  rejectTranslation: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const translation = await Translation.findByIdAndUpdate(
        id,
        { status: "rejected" },
        { new: true }
      );

      if (!translation) {
        res.status(404).json({ message: "Перевод не найден" });
        return
      }

      res.json({ message: "Перевод отклонен", translation });
      return
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при отклонении перевода" });
      next(error)
    }
  },

  vote: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isUpvote } = req.body;

      if (typeof isUpvote !== "boolean") {
        res
          .status(400)
          .json({
            message: `Параметр isUpvote является обязательным и тип Boolean`,
          });
        return
      }
      if (!req.user) {
        res.status(400).json({ message: 'Вы не авторизованы' }); return
      }
      const userId = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

      if (!isValidObjectId(id)) {
        // return res.status(400).json({ message: 'Неверные входные данные' });

        if (!isValidObjectIdString(id)) {
          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            }); return
        }
      }

      const translationId = new ObjectId(id);

      const vote = await new Vote({
        userId,
        translationId,
        isUpvote,
      }).save();

      await Translation.findByIdAndUpdate(translationId, {
        $push: {
          votes: vote._id,
        },
      })
        .then(async (document) => {

          if (!document) {
            return false
          }

          logger.info(`Голос успешно добавлен, к переводу ${document._id}`);

          await User.findByIdAndUpdate(userId, {
            $push: {
              votes: vote._id,
            },
          }).then(() => {
            logger.info(`Голос записан в документ пользователя ${userId}`);
          });

          await updateRating(userId);

          return res
            .status(201)
            .json({
              message: "Голос успешно добавлен",
              translationId: document._id,
            });
        })
        .catch(async (error) => {
          logger.error(`Ошибка при добавлении голоса к переводу: ${error}`);
        });

      return;
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Ошибка при добавлении голоса к переводу" });
      next(error)
    }
  },
};

export default translationController;
