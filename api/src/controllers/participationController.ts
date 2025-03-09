// src/controllers/participationController.ts
import { Request, Response } from 'express';
import Participation from '../models/Participation';
import logger from '../utils/logger';

class ParticipationController {
    /**
     * Получить данные участия пользователя в конкретной акции.
     * @param req.params.promotionId — ID акции.
     * @param req.params.userId — ID пользователя.
     */
    async getParticipation(req: Request, res: Response): Promise<void> {
        try {

            
            const { promotionId, userId } = req.params;
            
            logger.info(`Проверка пользователя на участие в розыгрыше ${promotionId}:${userId}`)
            
            if (!promotionId || !userId) {
                res.status(400).json({ message: "Не все поля указаны" })
                return
            }

            const participation = await Participation.findOne({
                promotion: promotionId,
                user: userId,
            });
            if (!participation) {
                res.status(404).json({ message: 'Данные участия не найдены' });
                return;
            }
            res.status(200).json({ participation });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Ошибка при получении данных участия',
            });
            return;
        }
    }

    /**
     * Регистрация участия пользователя в акции.
     * При вызове создаётся запись, если её ещё нет.
     * @param req.body.promotionId — ID акции.
     * @param req.body.userId — ID пользователя.
     */
    async joinPromotion(req: Request, res: Response): Promise<void> {
        try {
            const { promotionId, userId } = req.body;

            logger.info(`Присоединение пользователя ${userId} к розыгрышу ${promotionId}`)

            // Проверка существования записи участия
            let participation = await Participation.findOne({
                promotion: promotionId,
                user: userId,
            });
            if (participation) {
                res.status(400).json({
                    message: 'Пользователь уже участвует в акции',
                });
                return;
            }
            participation = new Participation({
                promotion: promotionId,
                user: userId,
                points: 1,
            });
            await participation.save();
            logger.info(`Новый участник розыгрыша ${userId}:${promotionId}`)
            res.status(201).json({
                message: 'Участие зарегистрировано',
                participation,
            });
        } catch (error) {
            console.error(error);
            logger.info(
                `Ошибка регистрации участника розыгрыша`,
            );
            res.status(500).json({ message: 'Ошибка при регистрации участия' });
            return;
        }
    }

    /**
     * Добавление очков к участию (например, при выполнении задания).
     * @param req.body.promotionId — ID акции.
     * @param req.body.userId — ID пользователя.
     * @param req.body.points — количество очков для добавления.
     * @param req.body.taskId — (опционально) ID задания, которое было выполнено.
     */
    async addPoints(req: Request, res: Response): Promise<void> {
        try {
            const { promotionId, userId, points, taskId } = req.body;
            let participation = await Participation.findOne({
                promotion: promotionId,
                user: userId,
            });
            if (!participation) {
                res.status(404).json({ message: 'Данные участия не найдены' });
                return;
            }
            participation.points += points;
            if (taskId) {
                participation.tasksCompleted.push(taskId);
            }
            await participation.save();
            res.status(200).json({
                message: 'Очки добавлены успешно',
                participation,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при обновлении очков' });
            return;
        }
    }

    /**
     * Получение лидерборда по конкретной акции.
     * @param req.params.promotionId — ID акции.
     * Для определения позиции пользователя используется userId,
     * который передаётся в req.body или в query-параметрах.
     */
    async getLeaderboard(req: Request, res: Response): Promise<void> {
        try {
            const { currentUserId, promotionId } = req.body;

            logger.info(`Получение лидерборда пользователем ${currentUserId}:${promotionId}`)

            if (!currentUserId) {
                res.status(404).json({
                    message: 'Поле currentUserId обязателен',
                });
                return;
            }
            if (!promotionId) {
                res.status(404).json({
                    message: 'Поле promotionId обязателен',
                });
                return;
            }

            const leaderboard = await Participation.find({
                promotion: promotionId,
            })
                .sort({ points: -1 })
                .populate('user', 'id username first_name rating dailyRating');

            let userRank: number | null = null;
            if (currentUserId) {
                const currentUserIdStr = currentUserId.toString();
                const index = leaderboard.findIndex(
                    (p) =>
                        p.user &&
                        p.user._id &&
                        p.user._id.toString() === currentUserIdStr,
                );
                if (index !== -1) {
                    userRank = index + 1; // Ранг начинается с 1
                }
            }

            res.status(200).json({ leaderboard, userRank });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                message: 'Ошибка при получении лидерборда',
            });
        }
    }
}

export default new ParticipationController();
