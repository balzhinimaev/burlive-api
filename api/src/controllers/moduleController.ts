// src/controllers/moduleController.ts

import { NextFunction, Request, Response } from 'express';
import Module from '../models/Module';
import User from '../models/User';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import isValidObjectIdString from '../utils/isValidObjectIdString';
import updateRating from '../utils/updateRating';

const moduleController = {
    /**
     * Получение всех модулей с пагинацией
     */
    getAllModules: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page = 1, limit = 10 } = req.query;

            const pageNumber = Number(page);
            const limitNumber = Number(limit);
            const skipIndex = (pageNumber - 1) * limitNumber;

            const [count, modules] = await Promise.all([
                Module.countDocuments(),
                Module.find()
                    .sort({ createdAt: -1 })
                    .skip(skipIndex)
                    .limit(limitNumber)
                    .populate('lessons', 'title') // Предполагается, что есть модель Lesson
                    .populate('author', '_id firstName username email'), // Если есть поле author
            ]);

            if (modules.length === 0) {
                logger.warn('Модули не найдены');
                res.status(404).json({ message: 'Модули не найдены', modules: [] });
                return;
            }

            res.status(200).json({
                message: 'Модули успешно получены',
                modules,
                count: modules.length,
                total_count: count,
                current_page: pageNumber,
                total_pages: Math.ceil(count / limitNumber),
            });
        } catch (error) {
            logger.error(`Ошибка при получении модулей: ${error}`);
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении модулей' });
            next(error);
        }
    },

    /**
     * Получение модуля по ID
     */
    getModuleById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id) && !isValidObjectIdString(id)) {
                res.status(400).json({
                    message: 'Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId',
                });
                return;
            }

            const module = await Module.findById(id)
                .populate('lessons', 'title description') // Предполагается, что есть модель Lesson
                .populate('author', '_id firstName username email'); // Если есть поле author

            if (!module) {
                logger.warn(`Модуль с ID ${id} не найден`);
                res.status(404).json({ message: 'Модуль не найден' });
                return;
            }

            res.status(200).json({
                message: 'Модуль успешно получен',
                module,
            });
        } catch (error) {
            logger.error(`Ошибка при получении модуля по ID: ${error}`);
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении модуля' });
            next(error);
        }
    },

    /**
     * Создание нового модуля
     */
    createModule: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { title, description, lessons } = req.body;

            if (!req.user || !req.user._id) {
                res.status(401).json({ message: 'Вы не авторизованы!' });
                return;
            }

            if (!title || !description) {
                logger.warn('Пожалуйста, предоставьте заголовок и описание модуля');
                res.status(400).json({ message: 'Пожалуйста, предоставьте заголовок и описание модуля' });
                return;
            }

            // Проверка на существование модуля с таким же заголовком
            const existingModule = await Module.findOne({ title });
            if (existingModule) {
                res.status(409).json({ message: 'Модуль с таким заголовком уже существует' });
                return;
            }

            // Создание нового модуля
            const newModule = new Module({
                title,
                description,
                lessons: lessons || [], // Если переданы уроки
                // Предполагается, что есть поле author в модели Module
                author: new ObjectId(req.user._id),
            });

            await newModule.save();

            // Добавление модуля в список модулей пользователя (если необходимо)
            await User.findByIdAndUpdate(req.user._id, {
                $push: { modules: newModule._id },
            });

            // Обновление рейтинга пользователя (если необходимо)
            await updateRating(new ObjectId(req.user._id));

            logger.info(`Модуль создан: ${newModule._id}`);
            res.status(201).json({
                message: 'Модуль успешно создан',
                moduleId: newModule._id,
            });
        } catch (error) {
            logger.error(`Ошибка при создании модуля: ${error}`);
            console.error(error);
            res.status(500).json({ message: 'Ошибка при создании модуля' });
            next(error);
        }
    },

    /**
     * Обновление модуля по ID
     */
    updateModule: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { title, description, lessons } = req.body;

            if (!isValidObjectId(id) && !isValidObjectIdString(id)) {
                res.status(400).json({
                    message: 'Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId',
                });
                return;
            }

            // Проверка существования модуля
            const module = await Module.findById(id);
            if (!module) {
                logger.warn(`Модуль с ID ${id} не найден`);
                res.status(404).json({ message: 'Модуль не найден' });
                return;
            }

            // Обновление полей модуля
            if (title) module.title = title;
            if (description) module.description = description;
            if (lessons) module.lessons = lessons;

            await module.save();

            logger.info(`Модуль обновлён: ${id}`);
            res.status(200).json({
                message: 'Модуль успешно обновлён',
                module,
            });
        } catch (error) {
            logger.error(`Ошибка при обновлении модуля: ${error}`);
            console.error(error);
            res.status(500).json({ message: 'Ошибка при обновлении модуля' });
            next(error);
        }
    },

    /**
     * Удаление модуля по ID
     */
    deleteModule: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id) && !isValidObjectIdString(id)) {
                res.status(400).json({
                    message: 'Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId',
                });
                return;
            }

            const module = await Module.findByIdAndDelete(id);

            if (!module) {
                logger.warn(`Модуль с ID ${id} не найден`);
                res.status(404).json({ message: 'Модуль не найден' });
                return;
            }

            // Удаление модуля из списка модулей пользователя (если необходимо)
            await User.updateMany(
                { modules: module._id },
                { $pull: { modules: module._id } }
            );

            logger.info(`Модуль удалён: ${id}`);
            res.status(200).json({ message: 'Модуль успешно удалён' });
        } catch (error) {
            logger.error(`Ошибка при удалении модуля: ${error}`);
            console.error(error);
            res.status(500).json({ message: 'Ошибка при удалении модуля' });
            next(error);
        }
    },
};

export default moduleController;
