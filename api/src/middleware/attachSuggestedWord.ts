// src/middleware/attachSuggestedWord.ts
import { Request, Response, NextFunction } from 'express';
import SuggestedWordModel from '../models/Vocabulary/SuggestedWordModel';

const attachSuggestedWord = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const { suggestedWordId } = req.body;

    const suggestedWord = await SuggestedWordModel.findById(suggestedWordId);
    if (!suggestedWord) {
        res.status(404).json({ message: 'Предложенное слово не найдено' });
        return;
    }

    req.suggestedWord = suggestedWord;

    next();
};

export default attachSuggestedWord;
