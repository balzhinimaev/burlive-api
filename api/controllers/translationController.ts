// translationController.ts
import { Request, Response } from 'express';
import Translation from '../models/Translation';
import { AuthRequest } from '../middleware/authenticateToken';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import isValidObjectIdString from '../utils/isValidObjectIdString';
import User from '../models/User';
import updateRating from '../utils/updateRating';

const translationController = {
    getAllTranslations: async (req: Request, res: Response) => {
        try {
            const translation = await Translation.find();

            if (translation.length === 0) {
                logger.error(`Переводов не найдено`);
                res.status(404).json({ message: 'Переводы не найдены' });
            } else {
                logger.error(`Переводы получены: ${translation.length}`);
                res.status(200).json(translation);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error retrieving translation' });
        }
    },


    createTranslation: async (req: AuthRequest, res: Response) => {
        try {

            const { text, language, sentenceId } = req.body;
            console.log(req.body)
            const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

            if (!text || !language || !author || !sentenceId) {
                logger.error(`Пожалуйста, предоставьте текст, язык, автора и айди предложения`);
                return res.status(400).json({ message: 'Пожалуйста, предоставьте текст, язык, автора и айди предложения' });
            }

            if (!isValidObjectId(sentenceId)) {
                // return res.status(400).json({ message: 'Неверные входные данные' });

                if (!isValidObjectIdString(sentenceId)) {

                    return res.status(400).json({ message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId` })

                }

            }

            const newTranslation = await new Translation({ text, language, author, sentenceId: new ObjectId(sentenceId) }).save();

            await User.findByIdAndUpdate({ _id: author }, { $push: { suggestedTranslations: newTranslation._id } })
            logger.info(`Перевод успешно создан: ${newTranslation}`);

            // Вызываем метод обновления рейтинга пользователя
            const updateR = await updateRating(author);
            
            res.status(201).json({ message: 'Перевод успешно создан', translationId: newTranslation._id });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при создании перевода' });
        }
    },

    updateStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, contributorId } = req.body;

            const validStatuses: ('processing' | 'accepted' | 'rejected')[] = ['processing', 'accepted', 'rejected'];

            if (!isValidObjectId(id)) {
                // return res.status(400).json({ message: 'Неверные входные данные' });

                if (!isValidObjectIdString(id)) {

                    return res.status(400).json({ message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId` })

                }

            }

            if (contributorId && (!isValidObjectId(contributorId))) {

                return res.status(400).json({ message: `Неверный contributorId` })

            } else if (contributorId) {

                const contributorIsExists = await User.findOne({ _id: contributorId })

                if (!contributorIsExists) {

                    return res.status(404).json({ message: `Контрибьютора не существует` })

                }

            }

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Неверный статус' });
            }

            const translation = await Translation.findById({ _id: new ObjectId(id) });

            if (translation === null) {
                return res.status(404).json({ message: 'Перевод не найден', translation });
            }

            // Добавление нового участника, если статус 'accepted' и передан contributorId
            if (status === 'accepted' && contributorId) {
                translation.contributors.push(contributorId);
            }

            translation.status = status;
            await translation.save();

            res.status(200).json({ message: 'Статус перевода успешно обновлен', translation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при обновлении статуса перевода' });
        }
    },

    acceptTranslation: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const translation = await Translation.findByIdAndUpdate(id, { status: 'accepted' }, { new: true });

            if (!translation) {
                return res.status(404).json({ message: 'Перевод не найдено' });
            }

            res.json({ message: 'Перевод принят', translation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при принятии перевода' });
        }
    },

    rejectTranslation: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const translation = await Translation.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });

            if (!translation) {
                return res.status(404).json({ message: 'Перевод не найден' });
            }

            res.json({ message: 'Перевод отклонен', translation });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при отклонении перевода' });
        }
    }
};

export default translationController;
