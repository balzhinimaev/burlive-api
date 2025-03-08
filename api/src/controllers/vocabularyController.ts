// src/controllers/vocabularyController.ts
import { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import WordModel from '../models/Vocabulary/WordModel';
import SuggestedWordModel, {
    ISuggestedWordModel,
} from '../models/Vocabulary/SuggestedWordModel';
import updateRating from '../utils/updateRatingTelegram';
import DeclinedWordModel from '../models/Vocabulary/DeclinedWordModel';
import TelegramUserModel, { TelegramUser } from '../models/TelegramUsers';
import SearchedWordModel, {
    IWordModel,
} from '../models/Vocabulary/SearchedWordModel';

// Интерфейсы для типов запросов
interface SuggestWordTranslateBody {
    word_id: string;
    translate_language: string;
    translate: string;
    dialect?: string;
    normalized_text: string;
    telegram_user_id: string;
}

// interface SuggestWordsBody {
//   text: string;
//   language: string;
//   id: string;
//   dialect?: string;
// }

interface TranslateBody {
    userInput: string;
    target_language: string;
    telegram_user_id: number;
}

const vocabularyController = {
    /**
     * Получение всех слов
     */
    getAllWords: async (
        _req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const words = await WordModel.find()
                .sort({ _id: 1 })
                .populate('author', '_id firstName username email')
                .populate('translations', '_id text')
                .populate(
                    'translations_u',
                    '_id text language dialect createdAt pre_translations normalized_text author contributors',
                );

            logger.info('Все слова получены!');
            res.status(200).json({ message: 'Словарь найден', words });
        } catch (error) {
            logger.error(`Ошибка при получении слов: ${error}`);
            next(error); // Передаём ошибку в следующий middleware
        }
    },

    /**
     * Получение всех слов с пагинацией и сортировкой по количеству переводов
     */
    getAllWordsPaginated: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const skip = (page - 1) * limit;

            // Считаем общее количество слов в базе данных
            const totalWords = await WordModel.countDocuments();

            // Получаем слова с разбивкой по страницам и сортировкой по количеству переводов
            const words = await WordModel.find()
                .sort({ translations: 1 }) // Сортировка по количеству переводов
                .skip(skip)
                .limit(limit)
                .populate('author', '_id firstName username email')
                .populate('translations', '_id text')
                .populate(
                    'translations_u',
                    '_id text language dialect createdAt pre_translations normalized_text author contributors',
                );

            // Формируем ответ с данными
            res.status(200).json({
                message: 'Словарь найден',
                words,
                totalWords, // Общее количество слов
                currentPage: page, // Текущая страница
                totalPages: Math.ceil(totalWords / limit), // Общее количество страниц
            });
        } catch (error) {
            logger.error(`Ошибка при получении слов: ${error}`);
            res.status(500).json({ message: 'Ошибка при получении слов' });
            next(error);
        }
    },

    /**
     * Получение предложенных слов на утверждение с пагинацией
     */
    getWordsOnApproval: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const skip = (page - 1) * limit;

            const count = await SuggestedWordModel.countDocuments();
            const words = await SuggestedWordModel.find()
                .sort({ _id: 1 })
                .skip(skip)
                .limit(limit)
                .populate('author', '_id firstName username email')
                .populate('pre_translations', '_id text');

            logger.info(
                `Все предложенные слова получены! total count: ${count}`,
            );
            res.status(200).json({
                message: 'Словарь найден',
                words,
                total_count: count,
            });
        } catch (error) {
            logger.error(`Ошибка при получении предложенных слов: ${error}`);
            res.status(500).json({
                message: 'Ошибка при получении предложенных слов',
            });
            next(error);
        }
    },

    /**
     * Предложение перевода слова
     */
    suggestWordTranslate: async (
        req: Request<{}, {}, SuggestWordTranslateBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const {
            word_id,
            translate_language,
            translate,
            dialect,
            normalized_text,
            telegram_user_id,
        } = req.body;

        try {
            // Проверка обязательных параметров
            if (
                !word_id ||
                !translate_language ||
                !translate ||
                !telegram_user_id ||
                !normalized_text
            ) {
                logger.error('Отсутствует один из обязательных параметров');
                res.status(400).json({
                    message:
                        'Ошибка: отсутствует один из обязательных параметров',
                });
                return;
            }

            // Проверка валидности ObjectId
            if (
                !isValidObjectId(word_id) ||
                typeof telegram_user_id !== 'number'
            ) {
                res.status(400).json({
                    message: 'Неверный формат word_id или telegram_user_id',
                });
                return;
            }

            const telegram_author = await TelegramUserModel.findOne({
                id: telegram_user_id,
            });

            // Поиск исходного слова в базе данных
            const existingWord = await WordModel.findById(word_id);
            if (!telegram_author) {
                res.status(404).json({ message: 'Пользователь не найден!' });
                return;
            }
            
            if (!existingWord) {
                res.status(404).json({ message: 'Исходное слово не найдено' });
                return;
            }

            // Проверка на существование перевода (предложенного слова)
            const existingSuggestedWord = await SuggestedWordModel.findOne({
                normalized_text,
            });

            if (existingSuggestedWord) {
                if (existingSuggestedWord.language !== translate_language) {
                    logger.warn(
                        'Нужно проверить языковую соответствие предложенного перевода',
                    );
                    // Дополнительная логика, если языки не совпадают
                    // Например, можно вернуть ошибку или обновить язык
                }

                logger.info(`Предложенное слово уже существует в коллекции`);

                // Обновляем исходное слово
                await WordModel.findByIdAndUpdate(word_id, {
                    $addToSet: {
                        translations_u: existingSuggestedWord._id,
                        contributors: telegram_author?._id,
                    },
                });

                // Обновляем предложенное слово
                await SuggestedWordModel.findByIdAndUpdate(
                    existingSuggestedWord._id,
                    {
                        $addToSet: {
                            pre_translations: existingWord._id,
                            contributors: telegram_author?._id,
                        },
                    },
                );

                logger.info(`Данные успешно обновлены`);
            } else {
                console.log(translate_language);
                // Создаём новое предложенное слово
                const newSuggestedWord = new SuggestedWordModel({
                    text: translate,
                    language:
                        translate_language == 'russian' ||
                        translate_language == 'русский'
                            ? 'buryat'
                            : translate_language,
                    author: telegram_author?._id,
                    dialect,
                    normalized_text: translate.toLowerCase().trim(),
                });

                // Сохраняем новое предложенное слово
                const savedSuggestedWord = await newSuggestedWord.save();

                if (!savedSuggestedWord) {
                    logger.error('Ошибка при сохранении предложенного слова');
                    res.status(500).json({
                        message: 'Ошибка при сохранении слова',
                    });
                    return;
                }

                updateRating(telegram_author._id, 15);

                logger.info(
                    `Предложенное слово успешно сохранено с ID: ${savedSuggestedWord._id}`,
                );

                // Обновляем исходное слово
                await WordModel.findByIdAndUpdate(word_id, {
                    $addToSet: { translations_u: savedSuggestedWord._id },
                });

                // Связываем новое предложенное слово с исходным словом
                await SuggestedWordModel.findByIdAndUpdate(
                    savedSuggestedWord._id,
                    {
                        $addToSet: { pre_translations: existingWord._id },
                    },
                );
            }

            res.status(200).json({
                message: `Перевод успешно предложен и добавлен в словарь, пользователем ${telegram_author?._id}`,
            });
        } catch (error) {
            logger.error(`Ошибка при предложении перевода: ${error}`);
            next(error);
        }
    },

    /**
     * Предложение нескольких слов
     */
    suggestWords: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { text, language, telegram_user_id, dialect } = req.body;

        try {
            if (!text || !language) {
                logger.error(
                    'Ошибка при предложении слов, отсутствует один из параметров',
                );
                res.status(400).json({
                    message: 'Отсутствует один из параметров',
                });
                return;
            }

            if (!req.user || !req.user._id) {
                res.status(401).json({ message: 'Вы не авторизованы!' });
                return;
            }

            if (!telegram_user_id) {
                logger.error(`Отсутствует telegramID`);
                res.status(400).json({ message: 'Ошибка запроса' });
                return;
            }

            // Найти пользователя и получить только его _id
            const user = await TelegramUserModel.findOne({
                id: telegram_user_id,
            }).select('_id');

            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            const userId = user._id; // Извлечение _id как ObjectId

            const results: Array<{
                message: string;
                word?: ISuggestedWordModel;
            }> = [];
            const wordsArray = text.split(',').map((word: string) => ({
                normalized: word.trim().toLowerCase(),
                original: word.trim(),
            }));

            for (const { normalized, original } of wordsArray) {
                let existingWord = await SuggestedWordModel.findOne({
                    normalized_text: normalized,
                });

                if (existingWord) {
                    if (!existingWord.contributors.includes(userId)) {
                        existingWord.contributors.push(userId);
                        await existingWord.save();
                        await updateRating(userId, 30); // Передаем бонус, если необходимо
                    }
                    results.push({
                        message:
                            'Слово уже существует, автор добавлен в список контрибьюторов',
                        word: existingWord,
                    });
                } else {
                    const newSuggestedWord = new SuggestedWordModel({
                        text: original,
                        normalized_text: normalized, // Добавление нормализованного текста
                        language,
                        author: userId,
                        contributors: [userId],
                    });

                    if (language === 'buryat' && typeof dialect === 'string') {
                        newSuggestedWord.dialect = dialect;
                        logger.info(`Диалект присвоен к слову`);
                    }

                    await newSuggestedWord.save();
                    results.push({
                        message: 'Слово успешно предложено',
                        word: newSuggestedWord,
                    });
                    await updateRating(userId, 30);
                }
            }

            res.status(200).json(results);
        } catch (error) {
            logger.error(`Ошибка при предложении слов: ${error}`);
            res.status(500).json({ message: 'Ошибка при предложении слов' });
            next(error);
        }
    },

    /**
     * Принятие предложенного слова
     */
    acceptSuggestedWord: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const suggestedWord = req.suggestedWord as ISuggestedWordModel;
        if (typeof req.telegram_user_id !== 'number') {
            res.status(400).json({
                message: 'Телеграм пользователь не указан или не найден',
            });
            return;
        }
        const telegram_user_id = req.telegram_user_id as number;

        try {
            if (!suggestedWord) {
                res.status(400).json({ message: 'suggestedWord не указан' });
                return;
            }

            if (!telegram_user_id) {
                res.status(400).json({ message: 'telegram_user_id не указан' });
                return;
            }

            // Поиск пользователя по telegram_user_id
            const user = await TelegramUserModel.findOne({
                id: telegram_user_id,
            });
            if (!user) {
                res.status(404).json({ message: 'Пользователь не найден' });
                return;
            }

            // Создание нового подтвержденного слова
            const word = new WordModel({
                text: suggestedWord.text,
                normalized_text: suggestedWord.normalized_text,
                language: suggestedWord.language,
                dialect: suggestedWord.dialect,
                translations: suggestedWord.pre_translations,
                author: suggestedWord.author,
                contributors: suggestedWord.contributors,
            });

            await word.save();

            // Обновление исходных слов с новым переводом
            await WordModel.findByIdAndUpdate(suggestedWord.pre_translations, {
                $addToSet: { translations: word._id },
            });

            // Удаление предложенного слова
            await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

            logger.info(
                `Предложенное слово принято и добавлено в словарь: ${word._id}`,
            );
            res.status(200).json({
                message: 'Слово успешно принято и добавлено в словарь',
                word,
            });
        } catch (error) {
            logger.error(`Ошибка при принятии предложенного слова: ${error}`);
            res.status(500).json({
                message: 'Ошибка при принятии предложенного слова',
            });
            next(error);
        }
    },

    /**
     * Отклонение предложенного слова
     */
    declineSuggestedWord: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const suggestedWord = req.suggestedWord as ISuggestedWordModel;

        try {
            if (!suggestedWord) {
                res.status(400).json({ message: 'SuggestedWord не указан' });
                return;
            }

            // Найти слово в SuggestedWordModel
            const wordToDecline = await SuggestedWordModel.findById(
                suggestedWord._id,
            );

            if (!wordToDecline) {
                res.status(404).json({ message: 'Слово не найдено' });
                return;
            }

            // Создать новый документ в DeclinedWordModel с теми же данными
            const declinedWord = new DeclinedWordModel({
                text: wordToDecline.text,
                normalized_text: wordToDecline.normalized_text,
                language: wordToDecline.language,
                dialect: wordToDecline.dialect,
                translations: wordToDecline.pre_translations, // соответствие переводам
                author: wordToDecline.author,
                contributors: wordToDecline.contributors,
            });

            // Сохранить отклонённое слово
            await declinedWord.save();

            // Удалить слово из SuggestedWordModel
            await SuggestedWordModel.findByIdAndDelete(suggestedWord._id);

            logger.info(
                `Слово отклонено и перенесено в архив отклонённых слов: ${suggestedWord._id}`,
            );
            res.status(200).json({
                message:
                    'Слово успешно отклонено и перенесено в архив отклонённых слов.',
            });
        } catch (error) {
            logger.error(`Ошибка при отклонении предложенного слова: ${error}`);
            res.status(500).json({
                message: 'Ошибка при отклонении предложенного слова',
            });
            next(error);
        }
    },

    /**
     * Получение одного подтверждённого слова или случайного
     */
    getConfirmedWord: async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        try {
            const { wordId } = req.query;
            logger.info(`Получение подтвержденного слова`);
            let word;
            if (wordId && typeof wordId === 'string') {
                if (!isValidObjectId(wordId)) {
                    res.status(400).json({ message: 'Неверный формат wordId' });
                    return;
                }
                word = await WordModel.findById(wordId)
                    .populate('author', '_id firstName username email')
                    .populate(
                        'translations',
                        '_id text language dialect createdAt pre_translations normalized_text author contributors',
                    )
                    .populate(
                        'translations_u',
                        '_id text language dialect createdAt pre_translations normalized_text author contributors',
                    );
            } else {
                // Получение случайного слова
                const count = await WordModel.countDocuments();
                const random = Math.floor(Math.random() * count);
                word = await WordModel.findOne()
                    .skip(random)
                    .populate('author', '_id firstName username email')
                    .populate(
                        'translations',
                        '_id text language dialect createdAt pre_translations normalized_text author contributors',
                    )
                    .populate(
                        'translations_u',
                        '_id text language dialect createdAt pre_translations normalized_text author contributors',
                    );
            }

            if (!word) {
                res.status(404).json({ message: 'Слово не найдено' });
                return;
            }

            res.status(200).json({
                message: 'Подтверждённое слово найдено',
                word,
            });
        } catch (error) {
            logger.error(`Ошибка при получении слова: ${error}`);
            res.status(500).json({ message: 'Ошибка при получении слова' });
            next(error);
        }
    },

    /**
     * Перевод слова
     */
    translateWord: async (
        req: Request<{}, {}, TranslateBody>,
        res: Response,
        next: NextFunction,
    ): Promise<void> => {
        const { userInput, target_language, telegram_user_id } = req.body;

        try {

            logger.info(`Целевой язык: ${target_language}\nTelegram ID пользователя: ${telegram_user_id}`)

            // Нормализация входного слова
            const normalized_userInput = userInput.toLocaleLowerCase().trim();

            // Проверка валидности telegram_user_id
            if (!telegram_user_id) {
                res.status(400).json({
                    message: 'Неверный формат telegram_user_id',
                });
                return;
            }

            // Поиск слова в вашей базе данных (опционально)
            const existingWord = await WordModel.findOne({
                normalized_text: normalized_userInput,
            })
                .populate('translations')
                .populate('translations_u');

            let burlivedb: any = [];

            if (existingWord) {
                logger.info(`Найденное слово в базе данных:\n ${existingWord}`);

                if (existingWord.translations.length) {
                    burlivedb = existingWord.translations;
                }

                logger.info(
                    `Найденные предложенные переводы в базе данных: ${existingWord?.translations_u}`,
                );
            }

            // console.log(
            //     `Тут надо добавить функцион добавления искомого слова в бд на проверку для дальнейшего перевода`,
            // );
            
            logger.info(`${normalized_userInput}`);
            const user: TelegramUser | null = await TelegramUserModel.findOne({
                id: telegram_user_id,
            });
            if (!user) {
                logger.error("Попытка перевести слово без telegram_user_id")    
                res.status(404).json({ message: "Пользователь не найден" })
                return
                throw Error;
            }

            const searchResultExists: IWordModel | null = await SearchedWordModel.findOne({
                normalized_text: normalized_userInput
            })
            if (searchResultExists === null) {
                await new SearchedWordModel({
                    normalized_text: normalized_userInput,
                    text: userInput,
                    language: target_language,
                    users: [user?._id]
                }).save()
                logger.info(`Создана история поиска`)
            } else {
                await SearchedWordModel.findByIdAndUpdate(searchResultExists._id, {
                    $addToSet: { users: user._id }
                })
                logger.info(`Пользователь добавлен в поле users`)
            }
            logger.info(`Пользователь проверяет на существование искомого слова в таблице searched-word`)
            // logger.info(searchResultExists)
            // const searchWord = await new SearchedWordModel({
            //     normalized_text: normalized_userInput,
            //     text: userInput,
            //     language: target_language,
            //     users: [user?._id]
            // })

            // const existsWord: IWordModel | null =
            //     await SearchedWordModel.findOne({
            //         normalized_text: normalized_userInput,
            //     });
            // if (existsWord) {
            //     await SearchedWordModel.findByIdAndUpdate(existsWord._id, {
            //         $addToSet: { users: user._id },
            //     });
            //     logger.info(`Пользователь добавлен в искомое слово`);
            // } else {
            //     new SearchedWordModel({
            //         text: userInput,
            //         normalized_text: normalized_userInput,
            //         language: target_language,
            //         users: [user._id],
            //     }).save();
            // }
            // await new SearchedWordModel({
            //   text: userInput,
            //   normalized_text: normalized_userInput,
            //   language: target_language,
            //   users: []
            // })
            // Определение источника языка слова с помощью внешних API
            // let source_language = target_language;

            // Функция для поиска слова в указанном API
            // const searchWord = async (language: 'russian' | 'buryat'): Promise<boolean> => {
            //   const searchUrl = `https://burlang.ru/api/v1/${source_language}-word/search?q=${encodeURIComponent(normalized_userInput)}`;
            //   try {
            //     const response = await fetch(searchUrl);
            //     if (!response.ok) {
            //       logger.error(`Ошибка при поиске слова в ${language} API: ${response.statusText}`);
            //       return false;
            //     }
            //     const data = await response.json();
            //     // Предполагаем, что API возвращает массив результатов
            //     // return Array.isArray(data) && data.length > 0;
            //     console.log(data)
            //     return true
            //   } catch (error: any) {
            //     logger.error(`Ошибка при выполнении запроса к ${language} API: ${error.message}`);
            //     return false;
            //   }
            // };

            // Проверяем, является ли слово русским
            // const isRussian = await searchWord('russian');
            // if (isRussian) {
            //   source_language = 'russian';
            // } else {
            //   // Проверяем, является ли слово бурятским
            //   const isBuryat = await searchWord('buryat');
            //   if (isBuryat) {
            //     source_language = 'buryat';
            //   }
            // }

            // if (!source_language) {
            //   res.status(404).json({ message: "Слово не найдено в русских или бурятских словарях." });
            //   return;
            // }

            // Определяем URL для перевода на основе источника языка
            let translateUrl = '';
            if (target_language === 'russian') {
                translateUrl = `https://burlang.ru/api/v1/russian-word/translate?q=${encodeURIComponent(normalized_userInput)}`;
            } else if (target_language === 'buryat') {
                translateUrl = `https://burlang.ru/api/v1/buryat-word/translate?q=${encodeURIComponent(normalized_userInput)}`;
            }

            logger.info(`url перевода ${translateUrl}`);

            // Выполняем запрос к API перевода
            const translateResponse = await fetch(translateUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            let burlang_translate_result: string = ``;
            interface translateResponse {
                translations: {
                    value: string;
                }[];
            }
            if (!translateResponse.ok) {
                // logger.error(`Ошибка при переводе слова: ${translateResponse.statusText}`);
                // res.status(500).json({ message: "Ошибка при переводе слова." });
                // return;
                burlang_translate_result = `Переводов не найдено`;
            } else {
                const translateData =
                    (await translateResponse.json()) as translateResponse;
                console.log(translateData);
                for (let i = 0; i < translateData.translations.length; i++) {
                    let translate = translateData.translations[i].value;
                    if (translateData.translations.length === i + 1) {
                        burlang_translate_result += `${translate}`;
                    } else {
                        burlang_translate_result =
                            burlang_translate_result + `${translate}, `;
                    }
                }
            }

            // Предполагаем, что API возвращает объект с полем translatedText
            // const translatedText = translateData.translatedText;

            // if (!translatedText) {
            // logger.error("Переведённый текст не найден в ответе API.");
            // res.status(500).json({ message: "Ошибка при получении перевода." });
            // return;
            // }

            // (Опционально) Сохранение перевода в вашей базе данных
            // Например, если вы хотите сохранять переводы
            /*
      const newTranslation = new TranslationModel({
        original_word: existingWord._id,
        translated_word: translatedText,
        source_language,
        target_language
      });
      await newTranslation.save();
      */

            // (Опционально) Обновление рейтинга пользователя
            // await updateRating(new ObjectId(telegram_user_id), 10); // Например, добавить 10 баллов
            await updateRating(user._id, 2)
            res.status(200).json({
                message: burlang_translate_result,
                burlivedb,
                // translatedText,
            });
        } catch (error: any) {
            logger.error(error)
            logger.error(`Ошибка при переводе слова: ${error.message}`);
            res.status(500).json({ message: 'Ошибка при переводе слова' });
            next(error);
        }
    },
};

export default vocabularyController;
