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

const vocabularyController = {
  getAllWords: async (req: Request, res: Response) => {
    try {
      // const wordsCount = await Vocabulary.find().countDocuments();
      const words = await Vocabulary.find()
        .sort({ _id: 1 })
        .populate("author", "_id firstname username email");

      logger.info(`Все слова получены!`);
      res.status(200).json({ message: `Словарь найден`, words });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error retrieving words" });
    }
  },

  suggestWordTranslate: async (req: AuthRequest, res: Response) => {
    const { word_id, translate_language, translate } = req.body;
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

      // Создание нового документа с переводом
      const newSuggestedWord = await new SuggestedWordModel({
        text: translate,
        language: translate_language,
        author: new Types.ObjectId(req.user.userId),
      }).save();

      // Получение ID нового документа
      const newSuggestedWordId = newSuggestedWord._id;

      // Обновление поля translations в исходном слове
      is_exists.translations.push(newSuggestedWordId);
      await is_exists.save();

      // Обновление поля pre_translations в новом документе с переводом
      await SuggestedWordModel.findByIdAndUpdate(newSuggestedWordId, {
        $push: { pre_translations: is_exists._id },
      });

      return res
        .status(200)
        .json({ message: "Перевод успешно предложен и добавлен в словарь" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при предлоджении перевода" });
    }
  },

  suggestWord: async (req: AuthRequest, res: Response) => {
    const { text, language } = req.body;
    try {
      if (!text || !language) {
        logger.error(
          `Ошибка при предложении слова, отсутствует один из параметров`
        );
        return res.status(400).json({
          message: `Ошибка при предложении слова, отсутствует один из параметров`,
        });
      }

      const existingWord = await SuggestedWordModel.findOne({ text });

      if (existingWord) {
        if (
          !existingWord.contributors.includes(new ObjectId(req.user.userId))
        ) {
          existingWord.contributors.push(new Types.ObjectId(req.user.userId));
          await existingWord.save();
        }
        return res.status(200).json({
          message:
            "Слово уже существует, автор добавлен в список контрибьюторов",
          existingWord,
        });
      } else {
        const newSuggestedWord = await new SuggestedWordModel({
          text,
          language,
          author: new Types.ObjectId(req.user.userId),
          contributors: [new Types.ObjectId(req.user.userId)],
        }).save();

        return res
          .status(200)
          .json({ message: "Слово успешно предложено", newSuggestedWord });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка при предложении слова" });
    }
  },

  acceptSuggestedWord: async (req: AuthRequest, res: Response) => {
    const { suggestedWordId } = req.body;
    try {
      if (!suggestedWordId) {
        logger.error(`Ошибка при принятии предложенного слова, отсутствует ID`);
        return res.status(400).json({
          message: `Ошибка при принятии предложенного слова, отсутствует ID`,
        });
      }

      const suggestedWord = await SuggestedWordModel.findById(suggestedWordId);
      if (!suggestedWord) {
        return res.status(404).json({
          message: `Предложенное слово не найдено`,
        });
      }

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
          _id: suggestedWordId,
          text: suggestedWord.text,
          language: suggestedWord.language,
          author: suggestedWord.author,
          contributors: suggestedWord.contributors,
          translations: suggestedWord.pre_translations, // предполагается, что переводы обрабатываются в другом месте
        }).save();
      }

      await SuggestedWordModel.findByIdAndDelete(suggestedWordId);

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
  // suggestWordTranslate: async (req: Request, res: Response) => {},
  // suggestWordTranslate: async (req: Request, res: Response) => {},
  // suggestWordTranslate: async (req: Request, res: Response) => {},
};

export default vocabularyController;
