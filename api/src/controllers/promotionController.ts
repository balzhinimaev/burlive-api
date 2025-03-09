// src/controllers/promotionController.ts
import { Request, Response } from 'express';
import moment from 'moment-timezone';
import Promotion from '../models/Promotion';

class PromotionController {
    /**
     * Создание новой акции.
     * Если дата начала не передана, акция стартует немедленно.
     * Дата окончания вычисляется как startDate + 48 часов с использованием часового пояса 'Asia/Shanghai' (UTC+8).
     * В запросе можно передать поле prizes – массив объектов для гибкой настройки призов.
     */
    async createPromotion(req: Request, res: Response): Promise<void> {
        try {
            const { title, description, startDate, prizes } = req.body;

            // Парсим дату начала с учетом часового пояса UTC+8 (Asia/Shanghai)
            const start = startDate
                ? moment.tz(startDate, 'Asia/Shanghai').toDate()
                : moment.tz('Asia/Shanghai').toDate();

            // Вычисляем дату окончания: startDate + 48 часов
            const end = moment(start).add(48, 'hours').toDate();

            // Если дата начала в будущем, статус 'pending', иначе 'active'
            const status = moment(start).isAfter(moment())
                ? 'pending'
                : 'active';

            const promotion = new Promotion({
                title,
                description,
                startDate: start,
                endDate: end,
                status,
                prizes: prizes || [],
            });

            await promotion.save();
            res.status(201).json({ message: 'Акция создана', promotion });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при создании акции' });
        }
    }

    /**
     * Получение текущей активной акции.
     * Ищется акция со статусом 'active' и датой начала/окончания, соответствующей текущему времени.
     */
    async getActivePromotion(_req: Request, res: Response): Promise<void> {
        try {
            const promotion = await Promotion.findOne({
                status: 'active',
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() },
            });
            if (!promotion) {
                res.status(404).json({ message: 'Нет активной акции' });
                return;
            }
            res.status(200).json({ promotion });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении акции' });
        }
    }

    /**
     * Завершение акции.
     * Изменяет статус акции на "finished" и может запускать логику определения победителей.
     * @param req.params.id — ID акции.
     */
    async endPromotion(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const promotion = await Promotion.findById(id);
            if (!promotion) {
                res.status(404).json({ message: 'Акция не найдена' });
                return;
            }
            promotion.status = 'finished';

            // Здесь можно реализовать логику определения победителей:
            // Например, получить данные лидерборда, сопоставить ранги с схемой prizes и сформировать массив winners,
            // затем обновить поле winners в документе акции.

            await promotion.save();
            res.status(200).json({ message: 'Акция завершена', promotion });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при завершении акции' });
        }
    }
}

export default new PromotionController();
