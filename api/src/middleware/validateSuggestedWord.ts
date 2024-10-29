// validateSuggestedWord.ts
import { Request, Response, NextFunction } from "express";
import SuggestedWordModel from "../models/Vocabulary/SuggestedWordModel";
import logger from "../utils/logger";

const validateSuggestedWord = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { suggestedWordId, telegram_user_id } = req.body;

  if (!suggestedWordId || !telegram_user_id) {
    res.status(400).json({
      message: "Ошибка: отсутствуют необходимые параметры",
    });
    return;
  }

  try {
    const suggestedWord = await SuggestedWordModel.findById(suggestedWordId);
    if (!suggestedWord) {
      res.status(404).json({ message: "Предложенное слово не найдено" });
      return;
    }

    // Присваиваем свойства напрямую, они теперь доступны в интерфейсе Request
    req.suggestedWord = suggestedWord;
    req.telegram_user_id = telegram_user_id;

    next();
  } catch (error) {
    logger.error("Ошибка при проверке предложенного слова:", error);
    res.status(500).json({ message: "Ошибка при проверке предложенного слова" });
    next(error);
  }
};

export default validateSuggestedWord;
