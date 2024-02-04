// sentenceController.ts
import { Request, Response } from 'express';
import SuggestedSentence from '../models/SuggestedSentence';
import AcceptedSentence from '../models/AcceptedSentences';
import { AuthRequest } from '../middleware/authenticateToken';
import { ObjectId } from 'mongodb';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import isValidObjectIdString from '../utils/isValidObjectIdString';
import User from '../models/User';
import updateRating from '../utils/updateRating';
import Sentence from '../models/AcceptedSentences';

const sentenceController = {
    getAllSentences: async (req: Request, res: Response) => {
        try {
            const { notAccepted } = req.query;
            let sentences;

            if (notAccepted) {
                sentences = await SuggestedSentence.find();
            } else {
                sentences = await Sentence.find();
            }

            if (sentences.length === 0) {
                logger.error(`Предложений не найдено`);
                res.status(404).json({ message: 'Предложения не найдены', sentences });
            } else {
                logger.info(`Предложения получены!`);
                res.status(200).json({ message: `Предложения найдены`, sentences, count: sentences.length });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при получении предложений!' });
        }
    },

    getAcceptedSentence: async (req: AuthRequest, res: Response) => {
        try {
            
            const sentence = await SuggestedSentence.findOne({
                status: 'accepted'
            });

            if (sentence) {
                return res.status(200).json({ message: 'Предложение для перевода получено', sentence })
            }

            return res.status(404).json({ message: `Предложение для перевода не найдено`, sentence })

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error retrieving sentence' });
        }
    },

    getNewSentence: async (req: AuthRequest, res: Response) => {
        try {

            const sentence = await SuggestedSentence.findOne({
                status: 'new'
            });

            if (sentence) {

                // // Проверяем, есть ли пользователь уже в массиве watchers
                // const isWatching = sentence.watchers.some((watcherId) => watcherId.equals(new ObjectId(req.user.userId)));

                // if (!isWatching) {
                //     // Добавляем пользователя в массив watchers
                //     await SuggestedSentence.findByIdAndUpdate(sentence._id, {
                //         $addToSet: { watchers: new ObjectId(req.user.userId) }
                //     });

                // }

                return res.status(200).json({ message: 'Предложение для рассмотрения получено', sentence })
            }

            return res.status(404).json({ message: `Предложения для рассмотрения не найдены` })

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error retrieving sentence' });
        }
    },

    getSentence: async (req: Request, res: Response) => {
        try {

            const { id } = req.params

            if (!isValidObjectId(id)) {
                // return res.status(400).json({ message: 'Неверные входные данные' });

                if (!isValidObjectIdString(id)) {

                    return res.status(400).json({ message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId` })

                }

            }

            const sentence = await SuggestedSentence.findById(new ObjectId(id))
            
            if (sentence) {

                return res.status(200).json(sentence)

            }

            return res.status(404).json({ message: 'Предложение не найдено' })

        } catch (error) {
            
            console.error(error);
            logger.error(`Ошибка при получении предложения: ${ req.params.id }`)
            res.status(500).json({ message: `Ошибка при получении предложения` })

        }
    },

    createSentence: async (req: AuthRequest, res: Response) => {
        try {

            const { text, language } = req.body;
            const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

            if (!text || !language || !author) {
                logger.error(`Пожалуйста, предоставьте текст, язык и автора`);
                return res.status(400).json({ message: 'Пожалуйста, предоставьте текст, язык и автора' });
            }

            // Валидация текста
            if (!text || typeof text !== 'string' || text.trim().length === 0) {
                logger.error(`Неверный формат текста`);
                return res.status(400).json({ message: 'Неверный формат текста' });
            }

            // Валидация языка
            if (!language || typeof language !== 'string' || language.trim().length === 0) {
                logger.error(`Неверный формат языка`);
                return res.status(400).json({ message: 'Неверный формат языка' });
            }

            const isExists = await SuggestedSentence.findOne({ text })

            if (isExists) {

                await SuggestedSentence.updateOne({ text }, {
                    $addToSet: {
                        contributors: author
                    }
                }).then(() => { console.log('автор записан') }).catch(error => console.log(error))

                return res.status(200).json({ message: 'Такое предложение существует, вы добавлены в контрибьютеры', isExists })

            }

            const newSentence = await new SuggestedSentence({ text, language, author }).save();

            await User.findByIdAndUpdate(author, { $push: { suggestedSentences: newSentence._id } })
            logger.info(`Предложение успешно создано: ${newSentence._id}`);

            // Вызываем метод обновления рейтинга пользователя
            const updateR = await updateRating(author);
            logger.info(`typeof(updateR) ${ typeof(updateR) }`)
            
            res.status(201).json({ message: 'Предложение успешно создано', sentenceId: newSentence._id });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при создании предложения' });
        }
    },

    createSentenceMultiple: async (req: AuthRequest, res: Response) => {
        try {

            const { sentences, language } = req.body;
            const author = new ObjectId(req.user.userId); // Assuming you have user information in the request after authentication

            if (!sentences || !Array.isArray(sentences) || sentences.length === 0) {
                return res.status(400).json({ message: 'Поле sentences должно быть непустым массивом!' });
            }

            if (!language || !author) {
                logger.error(`Пожалуйста, предоставьте текст, язык и автора`);
                return res.status(400).json({ message: 'Пожалуйста, предоставьте текст, язык и автора' });
            }

            // Валидация языка
            if (!language || typeof language !== 'string' || language.trim().length === 0) {
                logger.error(`Неверный формат языка`);
                return res.status(400).json({ message: 'Неверный формат языка' });
            }

            let addedSentences: any[] = []
            let existsSentences: any[] = []
            let authorIsAuthor: any[] = []
            let existsTranslations: any[] = []

            for (let i = 0; i < sentences.length; i++) {

                const sentence: {
                    text: string
                } = sentences[i]

                // Валидация текста
                if (!sentence.text || typeof sentence.text !== 'string' || sentence.text.trim().length === 0) {
                
                    logger.error(`Неверный формат текста`);
                    return res.status(400).json({ message: 'Неверный формат текста' });
                
                }

                const isExists = await SuggestedSentence.findOne({ text: sentence.text })
                const isExistsInAcceptedSentences = await AcceptedSentence.findOne({ text: sentence.text })
                
                if (isExistsInAcceptedSentences) {
                    
                    existsTranslations.push(isExistsInAcceptedSentences)
                    continue

                }

                if (isExists) {

                    if (isExists.author.toString() == author.toString()) {
                        
                        authorIsAuthor.push(isExists)
                        continue

                    } else {
                        await SuggestedSentence.updateOne({ text: sentence.text }, {
                            $addToSet: {
                                contributors: author
                            }
                        }).then((document) => { logger.info(`Автор записан в контрибьюторы при добавлении предложения`); existsSentences.push(document); }).catch(error => {
                            logger.error(`Ошибка при записи автора в контрибюторы при добавлении предложения: ${error}`)

                        })
                    }

                    // return res.status(200).json({ message: 'Такое предложение существует, вы добавлены в контрибьютеры', isExists })

                } else {

                    const newSentence = await new SuggestedSentence({ text: sentence.text, language, author }).save();

                    await User.findByIdAndUpdate(author, { $push: { suggestedSentences: newSentence._id } })

                    logger.info(`Предложение успешно создано: ${newSentence._id}`);
                    
                    addedSentences.push(newSentence)

                    // Вызываем метод обновления рейтинга пользователя
                    await updateRating(author);

                }

            }

            return res.status(200).json({ message: `Предложения успешно добавлены!`, existsTranslations, addedSentences, existsSentences, authorIsAuthor })
        
        } catch (error) {
            console.error(error);
            logger.error(error);
            res.status(500).json({ message: 'Ошибка при создании предложения' });
        }
    },

    // updateStatus: async (req: Request, res: Response) => {
    //     try {
    //         const { id } = req.params;
    //         const { status, contributorId } = req.body;

    //         const validStatuses: ('processing' | 'accepted' | 'rejected')[] = ['processing', 'accepted', 'rejected'];

    //         if (!isValidObjectId(id)) {
    //             // return res.status(400).json({ message: 'Неверные входные данные' });

    //             if (!isValidObjectIdString(id)) {

    //                 return res.status(400).json({ message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId` })

    //             }

    //         }

    //         if (contributorId && (!isValidObjectId(contributorId))) {

    //             return res.status(400).json({ message: `Неверный contributorId` })

    //         } else if (contributorId) {

    //             const contributorIsExists = await User.findOne({ _id: contributorId })

    //             if (!contributorIsExists) {

    //                 return res.status(404).json({ message: `Контрибьютора не существует` })

    //             }

    //         }

    //         if (!validStatuses.includes(status)) {
    //             return res.status(400).json({ message: 'Неверный статус' });
    //         }

    //         const sentence = await SuggestedSentence.findById({ _id: new ObjectId(id) });

    //         if (sentence === null) {
    //             return res.status(404).json({ message: 'Предложение не найдено', sentence });
    //         }

    //         // Добавление нового участника, если статус 'accepted' и передан contributorId
    //         if (status === 'accepted' && contributorId) {
    //             sentence.contributors.push(contributorId);
    //         }

    //         sentence.status = status;
    //         await sentence.save();

    //         res.status(200).json({ message: 'Статус предложения успешно обновлен', sentence });
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ message: 'Ошибка при обновлении статуса предложения' });
    //     }
    // },

    acceptSentence: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const sentence = await SuggestedSentence.findById(new ObjectId(id));
            new AcceptedSentence({
                _id: sentence._id,
                text: sentence.text,
                language: sentence.language,
                author: sentence.author
            }).save().then(async () => {
                await SuggestedSentence.findByIdAndDelete(new ObjectId(id)).then(() => {
                    logger.info(`Предложенное предложение удалено! ${id}`)
                })
            })

            if (!sentence) {
                return res.status(404).json({ message: 'Предложение не найдено' });
            }

            res.json({ message: 'Предложение принято для перевода', sentence });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при принятии предложения для перевода' });
        }
    },

    rejectSentence: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const sentence = await SuggestedSentence.findByIdAndUpdate(id, { status: 'rejected' }, { new: true });

            if (!sentence) {
                return res.status(404).json({ message: 'Предложение не найдено' });
            }

            res.json({ message: 'Предложение отклонено', sentence });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при отклонении предложения' });
        }
    }
};

export default sentenceController;
