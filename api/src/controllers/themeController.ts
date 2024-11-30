import { NextFunction, Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import logger from "../utils/logger";
import ThemeModel from "../models/Vocabulary/ThemeModel";

const themeController = {
    /**
     * Получение всех тем
     */
    getAllThemes: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const themes = await ThemeModel.find()
                .populate("words", "_id text language");

            logger.info("Все темы получены!");
            res.status(200).json({ message: "Темы найдены", themes });
        } catch (error) {
            logger.error(`Ошибка при получении тем: ${error}`);
            next(error);
        }
    },

    /**
     * Получение тем с пагинацией
     */
    getThemesPaginated: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const skip = (page - 1) * limit;

            const totalThemes = await ThemeModel.countDocuments();
            const themes = await ThemeModel.find()
                .skip(skip)
                .limit(limit)
                .populate("words", "_id text language");

            res.status(200).json({
                message: "Темы найдены",
                themes,
                totalThemes,
                currentPage: page,
                totalPages: Math.ceil(totalThemes / limit),
            });
        } catch (error) {
            logger.error(`Ошибка при получении тем: ${error}`);
            res.status(500).json({ message: "Ошибка при получении тем" });
            next(error);
        }
    },

    /**
     * Получение одной темы по ID
     */
    getThemeById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;

            if (!isValidObjectId(id)) {
                res.status(400).json({ message: "Неверный формат ID" });
                return;
            }

            const theme = await ThemeModel.findById(id)
                .populate({
                    path: 'words',
                    model: 'word',
                    select: '_id text language normalized_text translations translations_u createdAt updatedAt',
                    populate: [
                        { path: 'translations', model: 'word' },
                        { path: 'translations_u', model: 'word' },
                    ],
                });

            if (!theme) {
                res.status(404).json({ message: "Тема не найдена" });
                return;
            }

            res.status(200).json({ message: "Тема найдена", theme });
        } catch (error) {
            logger.error(`Ошибка при получении темы: ${error}`);
            res.status(500).json({ message: "Ошибка при получении темы" });
            next(error);
        }
    },

    /**
     * Создание новой темы
     */
    createTheme: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name, description, words } = req.body;

        try {
            if (!name) {
                res.status(400).json({ message: "Название темы обязательно" });
                return;
            }

            const newTheme = new ThemeModel({
                name,
                description,
                words: words || [],
            });

            await newTheme.save();

            res.status(201).json({ message: "Тема успешно создана", theme: newTheme });
        } catch (error) {
            logger.error(`Ошибка при создании темы: ${error}`);
            res.status(500).json({ message: "Ошибка при создании темы" });
            next(error);
        }
    },

    /**
     * Обновление темы
     */
    updateTheme: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { name, description, words } = req.body;

        try {
            if (!isValidObjectId(id)) {
                res.status(400).json({ message: "Неверный формат ID" });
                return;
            }

            const theme = await ThemeModel.findById(id);

            if (!theme) {
                res.status(404).json({ message: "Тема не найдена" });
                return;
            }

            if (name) theme.name = name;
            if (description) theme.description = description;
            if (words) theme.words = words;

            await theme.save();

            res.status(200).json({ message: "Тема успешно обновлена", theme });
        } catch (error) {
            logger.error(`Ошибка при обновлении темы: ${error}`);
            res.status(500).json({ message: "Ошибка при обновлении темы" });
            next(error);
        }
    },

    /**
     * Удаление темы
     */
    deleteTheme: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;

        try {
            if (!isValidObjectId(id)) {
                res.status(400).json({ message: "Неверный формат ID" });
                return;
            }

            const theme = await ThemeModel.findByIdAndDelete(id);

            if (!theme) {
                res.status(404).json({ message: "Тема не найдена" });
                return;
            }

            res.status(200).json({ message: "Тема успешно удалена" });
        } catch (error) {
            logger.error(`Ошибка при удалении темы: ${error}`);
            res.status(500).json({ message: "Ошибка при удалении темы" });
            next(error);
        }
    },
};

export default themeController;
