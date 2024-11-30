// controllers/questionController.ts

import { Request, Response, NextFunction } from 'express';
import Question from '../models/Lesson/Question';
import Lesson from '../models/Lesson';
import mongoose from 'mongoose';

// Создание нового вопроса и привязка его к уроку (если указан lessonId)
export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, options, correct, type, lessonId, explanation } = req.body;

        // Создаем новый вопрос
        const newQuestion = new Question({ question, options, correct, type, explanation });
        await newQuestion.save();

        // Если указан lessonId, добавляем вопрос к уроку
        if (lessonId && mongoose.Types.ObjectId.isValid(lessonId)) {
            const lesson = await Lesson.findById(lessonId);
            if (lesson) {
                lesson.questions.push(newQuestion._id);
                await lesson.save();
            } else {
                res.status(404).json({ message: 'Урок не найден' });
                return 
            }
        }

        res.status(201).json(newQuestion);
    } catch (error) {
        console.error('Ошибка при создании вопроса:', error);
        next(error);
    }
};

// Получение вопроса по ID
export const getQuestionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { questionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            res.status(400).json({ message: 'Неверный формат ID вопроса' });
            return 
        }

        const question = await Question.findById(questionId);

        if (!question) {
            res.status(404).json({ message: 'Вопрос не найден' });
            return
        }

        res.status(200).json(question);
    } catch (error) {
        console.error('Ошибка при получении вопроса:', error);
        next(error);
    }
};

// Обновление вопроса
export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { questionId } = req.params;
        const updates = req.body;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            res.status(400).json({ message: 'Неверный формат ID вопроса' });
            return 
        }

        const updatedQuestion = await Question.findByIdAndUpdate(questionId, updates, { new: true });

        if (!updatedQuestion) {
            res.status(404).json({ message: 'Вопрос не найден' });
            return 
        }

        res.status(200).json(updatedQuestion);
    } catch (error) {
        console.error('Ошибка при обновлении вопроса:', error);
        next(error);
    }
};

// Удаление вопроса и удаление ссылки на него из урока
export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { questionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(questionId)) {
            res.status(400).json({ message: 'Неверный формат ID вопроса' });
            return 
        }

        const question = await Question.findByIdAndDelete(questionId);

        if (!question) {
            res.status(404).json({ message: 'Вопрос не найден' });
            return 
        }

        // Удаляем ссылку на вопрос из всех уроков
        await Lesson.updateMany(
            { questions: questionId },
            { $pull: { questions: questionId } }
        );

        res.status(200).json({ message: 'Вопрос удален' });
    } catch (error) {
        console.error('Ошибка при удалении вопроса:', error);
        next(error);
    }
};

// Получение всех вопросов (опционально, может использоваться для административных целей)
export const getAllQuestions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const questions = await Question.find();
        res.status(200).json(questions);
    } catch (error) {
        console.error('Ошибка при получении списка вопросов:', error);
        next(error);
    }
};
