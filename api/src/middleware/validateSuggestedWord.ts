import { Request, Response, NextFunction } from "express";
import SuggestedWordModel, {
  ISuggestedWordModel,
} from "../models/Vocabulary/SuggestedWordModel";
import logger from "../utils/logger";

export interface ValidateSuggestedWordRequest extends Request {
  suggestedWord?: ISuggestedWordModel;
  telegram_user_id: number;
}

const validateSuggestedWord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { suggestedWordId, telegram_user_id } = req.body;
  
  if (!suggestedWordId || !telegram_user_id) {
    return res.status(400).json({
      message: "Ошибка при принятии предложенного слова, отсутствует параметры",
    });
  }

  try {
    const suggestedWord = await SuggestedWordModel.findById(suggestedWordId);
    if (!suggestedWord) {
      return res.status(404).json({ message: "Предложенное слово не найдено" });
    }
    // Attach the found suggested word to the request object for use in the route handler
    (req as ValidateSuggestedWordRequest).suggestedWord = suggestedWord;
    (req as ValidateSuggestedWordRequest).telegram_user_id = telegram_user_id;
    next();
  } catch (error) {
    logger.error("Ошибка при проверке предложенного слова:", error);
    return res
      .status(500)
      .json({ message: "Ошибка при проверке предложенного слова" });
  }
};

export default validateSuggestedWord;
