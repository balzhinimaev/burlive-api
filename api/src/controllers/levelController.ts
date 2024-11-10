// src/controllers/levelController.ts

import { Request, Response, NextFunction } from 'express';
import Level from '../models/Level';
import mongoose from 'mongoose';

// Создание нового уровня
export const createLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, description, order } = req.body;
        const level = new Level({ title, description, order });
        await level.save();
        res.status(201).json(level);
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map(err => ({
                msg: err.message,
                param: err.path,
            }));
            res.status(400).json({ errors });
            return; // Явный возврат
        }
        next(error); // Передаём ошибку следующему обработчику
    }
};

// Получение всех уровней
export const getAllLevels = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const levels = await Level.find().sort({ order: 1 }).populate('modules');
        res.status(200).json(levels);
    } catch (error) {
        console.error(error);
        next(error); // Передаём ошибку следующему обработчику
    }
};

// Получение уровня по ID
export const getLevelById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return; // Явный возврат
        }
        const level = await Level.findById(id).populate('modules');
        if (!level) {
            res.status(404).json({ message: 'Уровень не найден' });
            return; // Явный возврат
        }
        res.status(200).json(level);
    } catch (error) {
        console.error(error);
        next(error); // Передаём ошибку следующему обработчику
    }
};

// Обновление уровня
export const updateLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { title, description, order } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return; // Явный возврат
        }

        const level = await Level.findByIdAndUpdate(
            id,
            { title, description, order },
            { new: true, runValidators: true } // runValidators включает валидацию схемы при обновлении
        );

        if (!level) {
            res.status(404).json({ message: 'Уровень не найден' });
            return; // Явный возврат
        }

        res.status(200).json(level);
    } catch (error) {
        console.error(error);
        if (error instanceof mongoose.Error.ValidationError) {
            const errors = Object.values(error.errors).map(err => ({
                msg: err.message,
                param: err.path,
            }));
            res.status(400).json({ errors });
            return; // Явный возврат
        }
        next(error); // Передаём ошибку следующему обработчику
    }
};

// Удаление уровня
export const deleteLevel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Неверный формат ID' });
            return; // Явный возврат
        }
        const level = await Level.findByIdAndDelete(id);
        if (!level) {
            res.status(404).json({ message: 'Уровень не найден' });
            return; // Явный возврат
        }
        res.status(200).json({ message: 'Уровень удалён' });
    } catch (error) {
        console.error(error);
        next(error); // Передаём ошибку следующему обработчику
    }
};
