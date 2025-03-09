// src/controllers/refferalController.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import TelegramUserModel from '../models/TelegramUsers';
import dotenv from 'dotenv';
import updateRating from '../utils/updateRatingTelegram';
dotenv.config(); // Загружаем переменные окружения из файла .env

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;

const refferalController = {
    // Проверка статуса подписки
    checkSubscription: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { userId } = req.body;
            logger.info(`Запрос на проверку подписки на канал`)
            if (!userId) {
                res.status(400).json({ message: 'userId обязателен' });
                return;
            }

            const user = await TelegramUserModel.findOne({
                id: Number(userId),
            });

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            // const now = new Date();
            const response = await fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=@${CHANNEL_USERNAME}&user_id=${userId}`,
            );
            const data: any = await response.json();
            if (data.ok) {
                const status = data.result.status;
                // Статусы "member", "creator" или "administrator" означают, что пользователь подписан
                if (['member', 'creator', 'administrator'].includes(status)) {
                    await updateRating(user._id, 300)
                    res.json({ subscribed: true, status });
                    return;
                }
            }
            res.json({ subscribed: false });
            return; 
        } catch (error) {
            logger.error(`Ошибка в checkSubscription: ${error}`);
            res.status(500).json({ message: 'Внутренняя ошибка сервера' });
            next(error);
        }
    },
};

export default refferalController;
