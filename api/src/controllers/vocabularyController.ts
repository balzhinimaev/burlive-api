import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authenticateToken";
import { Types } from "mongoose";
import logger from "../utils/logger";
import WordModel from "../models/Vocabulary/WordModel";
import SuggestedWordModel from "../models/Vocabulary/SuggestedWordModel";
import { ValidateSuggestedWordRequest } from "../middleware/validateSuggestedWord";

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
    const { word_id, translate_language, translate, dialect } = req.body;
    try {
      if (!word_id || !translate_language || !translate) {
        logger.error(
          "Ошибка при предложении перевода в словарь, отсутствует один из параметров"
        );
        return res
          .status(400)
          .json({ message: "Отсутствует один из параметров" });
      }

      const existingWord = await WordModel.findById(word_id);
      if (!existingWord) {
        return res.status(400).json({ message: "Исходное слово не найдено" });
      }

      const existingSuggestedWord = await SuggestedWordModel.findOne({
        text: translate,
      });
      if (existingSuggestedWord) {
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations: existingSuggestedWord._id },
        });
        await SuggestedWordModel.findByIdAndUpdate(existingSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id },
        });
      } else {
        const newSuggestedWord = new SuggestedWordModel({
          text: translate,
          language: translate_language,
          author: new Types.ObjectId(req.user?.userId),
          dialect,
        });
        await newSuggestedWord.save();

        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations: newSuggestedWord._id },
        });
        await SuggestedWordModel.findByIdAndUpdate(newSuggestedWord._id, {
          $addToSet: { pre_translations: existingWord._id },
        });
      }

      await existingWord.save();
      return res
        .status(200)
        .json({ message: "Перевод успешно предложен и добавлен в словарь" });
    } catch (error) {
      logger.error(`Ошибка при предложении перевода: ${error}`);
      return res
        .status(500)
        .json({ message: "Ошибка при предложении перевода" });
    }
  },

  suggestWords: async (req: AuthRequest, res: Response) => {
    const { text, language } = req.body;
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

      const userId = new Types.ObjectId(req.user.userId);
      const results = [];
      const wordsArray = text.split(",").map((word: string) => word.trim());

      for (const word of wordsArray) {
        let existingWord = await SuggestedWordModel.findOne({ text: word });

        if (existingWord) {
          if (!existingWord.contributors.includes(userId)) {
            existingWord.contributors.push(userId);
            await existingWord.save();
          }
          results.push({
            message:
              "Слово уже существует, автор добавлен в список контрибьюторов",
            existingWord,
          });
        } else {
          const newSuggestedWord = new SuggestedWordModel({
            text: word,
            language,
            author: userId,
            contributors: [],
          });
          await newSuggestedWord.save();
          results.push({
            message: "Слово успешно предложено",
            newSuggestedWord,
          });
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
    const suggestedWord = req.suggestedWord;

    try {

      if (!suggestedWord) {
        return res.status(400).json({ message: 'suggestedWord не указан' })
      }

      const wordToUpdate = await WordModel.findOne({
        text: suggestedWord.text,
      });

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
        await wordToUpdate.save();
      } else {
        await new WordModel({
          _id: suggestedWord._id,
          text: suggestedWord.text,
          language: suggestedWord.language,
          dialect: suggestedWord.dialect,
          author: suggestedWord.author,
          contributors: suggestedWord.contributors,
          translations: suggestedWord.pre_translations,
        }).save();
      }

      await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

      return res
        .status(200)
        .json({ message: "Слово успешно принято и добавлено в словарь" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Ошибка при принятии предложенного слова" });
    }
  },

  declineSuggestedWord: async (
    req: ValidateSuggestedWordRequest,
    res: Response
  ) => {
    const suggestedWord = req.suggestedWord;
    try {
      
      if (!suggestedWord) {
        return res.status(400).json({ message: 'SuggestedWord не указан' })
      }
      
      await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);
      return res.status(200).json({ message: "Слово успешно отклонено" });
    } catch (error) {
      logger.error(`Ошибка при отклонении предложенного слова: ${error}`);
      res
        .status(500)
        .json({ message: "Ошибка при отклонении предложенного слова" });
    }
  },
};

export default vocabularyController;
