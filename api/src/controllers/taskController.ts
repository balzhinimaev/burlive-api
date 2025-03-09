import { Request, Response } from 'express';
import Task from '../models/Task';
import TaskCompletion from '../models/TaskCompletion';
import TelegramUserModel from '../models/TelegramUsers';

class TaskController {
    /**
     * Создание нового задания.
     * Ожидаемые поля в теле запроса:
     * - title: название задания (обязательное)
     * - description: описание задания (опциональное)
     * - taskType: тип задания (например, 'subscription', 'translation', 'data_entry' или 'other')
     * - rewardPoints: количество очков за выполнение задания (обязательное)
     * - imageUrl: ссылка на изображение (необязательное)
     */
    async createTask(req: Request, res: Response): Promise<void> {
        try {
            const { title, description, taskType, rewardPoints, imageUrl } =
                req.body;
            if (!title || !taskType || rewardPoints === undefined) {
                res.status(400).json({
                    message: 'Поля title, taskType и rewardPoints обязательны',
                });
                return;
            }

            const newTask = new Task({
                title,
                description,
                taskType,
                rewardPoints,
                imageUrl: imageUrl || '',
            });
            await newTask.save();
            res.status(201).json({ message: 'Задание создано', task: newTask });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при создании задания' });
        }
    }

    /**
     * Получение списка всех заданий.
     */
    async getTasks(_req: Request, res: Response): Promise<void> {
        try {
            const tasks = await Task.find();
            res.status(200).json({ tasks });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении заданий' });
        }
    }

    /**
     * Подтверждение выполнения задания.
     * Ожидается, что в теле запроса переданы:
     * - taskId: ID задания,
     * - userId: ID пользователя,
     * - promotionId: (опционально) ID акции, если выполнение связано с акцией.
     */
    async completeTask(req: Request, res: Response): Promise<void> {
        try {
            const { taskId, userId, promotionId } = req.body;
            if (!taskId || !userId) {
                res.status(400).json({
                    message: 'taskId и userId обязательны',
                });
                return;
            }

            // Проверка существования задания
            const task = await Task.findById(taskId);
            if (!task) {
                res.status(404).json({ message: 'Задание не найдено' });
                return;
            }

            // Проверяем, что задание не выполнено ранее данным пользователем
            const existing = await TaskCompletion.findOne({
                task: taskId,
                user: userId,
            });
            if (existing) {
                res.status(400).json({ message: 'Задание уже выполнено' });
                return;
            }

            // Создаем запись о выполнении задания
            const taskCompletion = new TaskCompletion({
                task: taskId,
                user: userId,
                promotion: promotionId, // может быть undefined, если не привязано к акции
                rewardPoints: task.rewardPoints,
            });
            await taskCompletion.save();

            // Обновляем глобальный рейтинг пользователя (и dailyRating, если нужно)
            const user = await TelegramUserModel.findById(userId);
            if (user) {
                user.rating += task.rewardPoints;
                user.dailyRating += task.rewardPoints;
                await user.save();
            }

            res.status(200).json({
                message: 'Задание выполнено',
                taskCompletion,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при выполнении задания' });
        }
    }
}

export default new TaskController();
