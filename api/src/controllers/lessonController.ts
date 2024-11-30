import { Request, Response, NextFunction } from 'express';
import Lesson, { ILesson } from '../models/Lesson';
import mongoose, { Types } from 'mongoose';
import Module, { IModule } from '../models/Module';
import logger from '../utils/logger';
import View, { IView } from '../models/View';
import { ObjectId } from 'mongodb';

// Создание нового урока
export const createLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, content, moduleId, order, questions, description } = req.body;
        const lesson: ILesson = new Lesson({ title, content, moduleId, order, questions, description });
        const module: IModule | null = await Module.findById(moduleId)
        if (!Types.ObjectId.isValid(moduleId)) {
            res.status(400).json({ message: "Неверный формат moduleId" });
            return;
        }
        if (!module) {
            res.status(404).json({
                message: "Модуль не найден!"
            })
            return
        }
        logger.info(`Модуль ${moduleId} найден`)
        logger.info(`Урок ${title} создан`)
        module.lessons.push(lesson._id); // Прямое использование lesson._id
        await module.save()
        logger.info(`В модуль добавлен созданный урок`)
        await lesson.save();
        res.status(201).json(lesson);
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map(err => ({
                msg: err.message,
                param: err.path,
            }));
            res.status(400).json({ errors });
            return;
        }
        next(error);
    }
};

// Получение всех уроков
export const getAllLessons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const lessons = await Lesson.find().sort({ order: 1 }).populate('moduleId');
        res.status(200).json(lessons);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Получение урока по ID
export const getLessonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }
        const lesson = await Lesson.findById(id).populate('moduleId');
        if (!lesson) {
            res.status(404).json({ message: 'Урок не найден' });
            return;
        }
        res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Получение урока по ID
export const getLessonByIdByTelegram = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id, telegram_id } = req.params;

        logger.info(`Подтягивание урока по ID`)
        
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(telegram_id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }

        const lesson = await Lesson.findById(id).populate('moduleId').populate("questions");
        logger.info(`Подтягивание урока ${id}`)
        if (!lesson) {
            res.status(404).json({ message: 'Урок не найден' });
            return;
        }
        
        // Создание нового просмотра (View)
        const newView: IView = new View({
            tu: new ObjectId(telegram_id),
            lesson: lesson._id,
            // Если у вас есть конкретный урок, который просматривается:
            // lesson: lessonId
        });
        await newView.save()
        lesson.views.push(newView._id)
        lesson.viewsCounter += 1;

        await lesson.save()

        res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Получение урока по moduleID
export const getLessonByModuleId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { telegramUser } = req.body

        logger.info(`Пользователь ${telegramUser} запрашивает уроки по модулю ${id}`)

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(telegramUser)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }
        
        const module = await Module.findById(id).populate("lessons")
        if (!module) {
            res.status(404).json({ message: "Модуль не найден" })
            return 
        }        
        // Создание нового просмотра (View)
        const newView: IView = new View({
            tu: new ObjectId(telegramUser),
            module: module._id,
            // Если у вас есть конкретный урок, который просматривается:
            // lesson: lessonId
        });
        await newView.save();
        // Добавление нового View в массив views модуля и обновление счетчика
        module.views.push(newView._id);
        module.viewsCounter += 1;
        // const lesson = await Lesson.findById(id).populate('moduleId');

        await module.save();

        res.status(200).json(module);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// Обновление урока
export const updateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, content, moduleId, order, questions } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }

        const lesson = await Lesson.findByIdAndUpdate(
            id,
            { title, content, moduleId, order, questions },
            { new: true, runValidators: true }
        );

        if (!lesson) {
            res.status(404).json({ message: 'Урок не найден' });
            return;
        }

        res.status(200).json(lesson);
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map(err => ({
                msg: err.message,
                param: err.path,
            }));
            res.status(400).json({ errors });
            return;
        }
        next(error);
    }
};

export const addQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id, question_id } = req.params;

        logger.info(`Добавление элемента теста ${question_id} к уроку ${id}`)

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(question_id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }
        const lesson = await Lesson.findById(id);
        if (!lesson) {
            res.status(404).json({ message: 'Урок не найден' });
            return;
        }

        lesson.questions.push(new ObjectId(question_id))
        await lesson.save()
        res.status(200).json({ mesage: 'Вопрос добавлен к уроку' })
    } catch (error) {
        logger.error(error)
        next(error)
    }
}

export const deleteLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return;
        }
        const lesson = await Lesson.findByIdAndDelete(id);
        if (!lesson) {
            res.status(404).json({ message: 'Урок не найден' });
            return;
        }
        res.status(200).json({ message: 'Урок удалён' });
    } catch (error) {
        console.error(error);
        next(error);
    }
};
