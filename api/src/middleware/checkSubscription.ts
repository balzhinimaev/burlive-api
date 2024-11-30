// src/middleware/checkSubscription.ts

import { Request, Response, NextFunction } from "express";
import TelegramUserModel from "../models/TelegramUsers";

const checkSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.body.userId || req.params.userId;

        if (!userId) {
            res.status(400).json({ message: "userId не предоставлен" });
            return 
        }

        const user = await TelegramUserModel.findById(userId);

        if (!user) {
            res.status(404).json({ message: "Пользователь не найден" });
            return 
        }

        if (user.subscription.isActive && user.subscription.endDate && user.subscription.endDate > new Date()) {
            next();
        } else {
            res.status(403).json({ message: "Подписка не активна" });
            return 
        }
    } catch (error) {
        next(error);
    }
};

export default checkSubscription;
