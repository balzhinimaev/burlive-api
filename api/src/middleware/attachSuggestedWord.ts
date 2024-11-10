// src/middleware/attachSuggestedWord.ts
import { Request, Response, NextFunction } from "express";
import SuggestedWordModel from "../models/Vocabulary/SuggestedWordModel";
import { Types } from "mongoose";

const attachSuggestedWord = async (req: Request, res: Response, next: NextFunction) => {
    const { suggestedWordId, telegram_user_id } = req.body;

    if (suggestedWordId) {
        if (!Types.ObjectId.isValid(suggestedWordId)) {
            res.status(400).json({ message: "Неверный формат suggestedWordId" });
            return;
        }

        const suggestedWord = await SuggestedWordModel.findById(suggestedWordId);
        if (!suggestedWord) {
            res.status(404).json({ message: "Предложенное слово не найдено" });
            return;
        }

        req.suggestedWord = suggestedWord;
    }

    if (telegram_user_id) {
        req.telegram_user_id = telegram_user_id;
    }

    next();
};

export default attachSuggestedWord;
