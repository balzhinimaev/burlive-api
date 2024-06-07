// vocabularyController.ts
import { Request, Response } from "express";
import Sentence from "../models/SuggestedSentence";
import { AuthRequest } from "../middleware/authenticateToken";
import { ObjectId } from "mongodb";
import { Types, isValidObjectId } from "mongoose";
import logger from "../utils/logger";
import isValidObjectIdString from "../utils/isValidObjectIdString";
import User from "../models/User";
import updateRating from "../utils/updateRating";
import Vocabulary from "../models/Vocabulary";
import WordModel from "../models/Vocabulary/WordModel";
import SuggestedWordModel from "../models/Vocabulary/SuggestedWordModel";
import { validateSuggestedWordRequest } from "../middleware/validateSuggestedWord";

const vocabularyController = {
  getAllWords: async (req: Request, res: Response) => {
    try {
      // const wordsCount = await Vocabulary.find().countDocuments();
      const words = await WordModel.find()
        .sort({ _id: 1 })
        .populate("author", "_id firstname username email")
        .populate("translations", "_id text");

      logger.info(`Все слова получены!`);
      res.status(200).json({ message: `Словарь найден`, words });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving words" });
    }
  },

  getWordsOnApproval: async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNumber = Number(page);
      const limitNumber = Number(limit);
      const skipIndex = (pageNumber - 1) * limitNumber;

      const count = await SuggestedWordModel.find().countDocuments();
      const words = await SuggestedWordModel.find()
        .sort({ _id: 1 })
        .skip(skipIndex)
        .limit(limitNumber)
        .populate("author", "_id firstname username email")
        .populate("pre_translations", "_id text");

      logger.info(`Все предложенные слова получены!`);
      res
        .status(200)
        .json({ message: `Словарь найден`, words, total_count: count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving words" });
    }
  },

  suggestWordTranslate: async (req: AuthRequest, res: Response) => {
    const { word_id, translate_language, translate, dialect } = req.body;
    try {
      if (!word_id || !translate_language || !translate) {
        logger.error(
          `Ошибка при предложении перевода в словарь, отсутствует один из параметров`
        );
        return res.status(400).json({
          message: `Ошибка при предложении перевода в словарь, отсутствует один из параметров`,
        });
      }

      // Поиск исходного слова в базе данных
      const is_exists = await WordModel.findById(word_id);
      if (!is_exists) {
        return res.status(400).json({
          message: `Ошибка при предложении перевода в словарь, отсутствует исходное слово`,
        });
      }

      const is_exists_on_suggesteds = await SuggestedWordModel.findOne({
        text: translate,
      });

      if (is_exists_on_suggesteds) {
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations: is_exists_on_suggesteds._id },
        });
        await SuggestedWordModel.findByIdAndUpdate(
          is_exists_on_suggesteds._id,
          {
            $addToSet: { pre_translations: is_exists._id },
          }
        );
      } else {
        // Создание нового документа с переводом
        const newSuggestedWord = await new SuggestedWordModel({
          text: translate,
          language: translate_language,
          author: new Types.ObjectId(req.user.userId),
          dialect,
        }).save();
        // Получение ID нового документа
        const newSuggestedWordId = newSuggestedWord._id;
        // Обновление поля translations в исходном слове
        await WordModel.findByIdAndUpdate(word_id, {
          $addToSet: { translations: newSuggestedWordId },
        });
        // Обновление поля pre_translations в новом документе с переводом
        await SuggestedWordModel.findByIdAndUpdate(newSuggestedWordId, {
          $addToSet: { pre_translations: is_exists._id },
        });
      }
      await is_exists.save();

      return res
        .status(200)
        .json({ message: "Перевод успешно предложен и добавлен в словарь" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при предлоджении перевода" });
    }
  },

  suggestWords: async (req: AuthRequest, res: Response) => {
    const { text, language } = req.body;

    console.log(text)
    console.log(language)

    try {
      if (!text || !language) {
        logger.error(
          "Ошибка при предложении слов, отсутствует один из параметров"
        );
        return res.status(400).json({
          message:
            "Ошибка при предложении слов, отсутствует один из параметров",
        });
      }

      const wordsArray = text.split(",").map((word) => word.trim());
      const userId = new Types.ObjectId(req.user.userId);
      const results = [];

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
          const newSuggestedWord = await new SuggestedWordModel({
            text: word,
            language,
            author: userId,
            contributors: [],
          }).save();

          results.push({
            message: "Слово успешно предложено",
            newSuggestedWord,
          });
        }
      }

      return res.status(200).json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при предложении слов" });
    }
  },

  acceptSuggestedWord: async (
    req: validateSuggestedWordRequest,
    res: Response
  ) => {
    const suggestedWord = req.suggestedWord;

    try {
      const wordToUpdate = await WordModel.findOne({
        text: suggestedWord.text,
      });

      if (wordToUpdate) {
        // Обновление существующего документа
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
        // Создание нового документа с сохранением старого ID
        await new WordModel({
          _id: suggestedWord._id,
          text: suggestedWord.text,
          language: suggestedWord.language,
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
    req: validateSuggestedWordRequest,
    res: Response
  ) => {
    const suggestedWord = req.suggestedWord;

    try {
      await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

      return res.status(200).json({ message: "Слово успешно отклонено" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Ошибка при отклонении предложенного слова" });
    }
  },
  // suggestWordTranslate: async (req: Request, res: Response) => {},
  // suggestWordTranslate: async (req: Request, res: Response) => {},
  // suggestWordTranslate: async (req: Request, res: Response) => {},
};

export default vocabularyController;
