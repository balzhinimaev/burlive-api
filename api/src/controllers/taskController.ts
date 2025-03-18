import { Request, Response } from 'express';
import Task, { ITask } from '../models/Task';
import TaskCompletion from '../models/TaskCompletion';
import TelegramUserModel from '../models/TelegramUsers';
import logger from '../utils/logger';
import { isValidObjectId } from 'mongoose';
import Promotion from '../models/Promotion';
// import { cp } from 'fs';

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
            const tasks = await Task.find().sort({ order: 1 });
            res.status(200).json({ tasks });
            logger.info(`Задания получены`);
            // logger.info(tasks)
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении заданий' });
        }
    }

    /**
     * Получение списка всех заданий расширенная версия.
     */
    async getTasksExtended(req: Request, res: Response): Promise<void> {
        try {
            const { userId, promotionId } = req.params;

            if (!isValidObjectId(userId) || !isValidObjectId(promotionId)) {
                res.status(404).json({
                    message: 'userId & promotionId must be ObjectID',
                });
                return;
            }

            const user = await TelegramUserModel.findById(userId);

            if (!user) {
                logger.info(
                    `🟡 Пользователь делает GET запрос tasks/:userId, хотя не зарегистрирован`,
                );
                res.status(404).json({ message: 'пользователь не найден' });
                return;
            }

            const promotion = await Promotion.findById(promotionId);

            if (!promotion) {
                logger.info(
                    `🟡 Пользователь делает GET запрос tasks/:userId/:promotionId, хотя нет такого promotion`,
                );
                res.status(404).json({ message: 'promotion не найден' });
                return;
            }

            // Get all active tasks for this promotion
            const allTasks = await Task.find({
                promotionId,
                status: 'active',
            }).sort({ order: 1 });

            const completedTaskRecords = await TaskCompletion.find({
                promotion: promotionId,
                user: userId,
            }).populate('task');


            logger.info(`Выполенные задания ${completedTaskRecords}`)

            // Extract the task IDs from completed task records
            const completedTaskIds = completedTaskRecords.map((record) =>
                record.task._id.toString(),
            );

            // Filter out completed tasks from the available tasks
            const availableTasks = allTasks.filter(
                (task: ITask) => !completedTaskIds.includes(task._id.toString()),
            );

            // Get the full completed task details
            const completedTasks = await Task.find({
                _id: { $in: completedTaskIds },
                promotionId,
            });

            // Return both lists separately
            res.status(200).json({
                tasks: availableTasks,
                completedTasks,
                completedTaskRecords
            });

            logger.info(
                `Задания получены для пользователя ${userId} и акции ${promotionId}`,
            );
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

            // Обновляем глобальный рейтинг пользователя (и dailyRating, если нужно)
            const user = await TelegramUserModel.findById(userId);

            if (!user) {
                res.status(400).json({
                    message: 'Пользователь не найден, для выполнения задания',
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
                logger.info(
                    `Задание ${task.title}/${task.taskType} уже выполнено пользователем ${user.username ? user.username : user.id}`,
                );
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
            logger.info(
                `Задание ${task.title}/${task.taskType} выполнено пользователем ${user.username ? user.username : user.id}`,
            );

            user.rating += task.rewardPoints;
            user.dailyRating += task.rewardPoints;
            await user.save();

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
