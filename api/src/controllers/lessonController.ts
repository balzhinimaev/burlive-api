import { Request, Response, NextFunction } from 'express';
import Lesson from '../models/Lesson';
import mongoose from 'mongoose';

// Создание нового урока
export const createLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, content, moduleId, order, questions } = req.body;
        const lesson = new Lesson({ title, content, moduleId, order, questions });
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

// Удаление урока
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
