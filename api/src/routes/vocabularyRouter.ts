// src/routes/vocabularyRouter.ts
import express from 'express';
import { body, param, query } from 'express-validator';
import vocabularyController from '../controllers/vocabularyController';
import authenticateToken from '../middleware/authenticateToken';
import authorizeAdmin from '../middleware/authorizeAdmin';
import validate from '../middleware/validate';

const vocabularyRouter = express.Router();

// /**
//  * @route   GET /backendapi/vocabulary
//  * @desc    Получение всех слов
//  * @access  Public
//  */
// vocabularyRouter.get('/', vocabularyController.getAllWords);

// /**
//  * @route   GET /backendapi/vocabulary/paginated
//  * @desc    Получение всех слов с пагинацией и сортировкой
//  * @access  Public
//  */
// vocabularyRouter.get(
//     '/paginated',
//     [
//         query('page')
//             .optional()
//             .isInt({ min: 1 })
//             .withMessage('page должен быть целым числом больше 0'),
//         query('limit')
//             .optional()
//             .isInt({ min: 1 })
//             .withMessage('limit должен быть целым числом больше 0'),
//     ],
//     validate,
//     vocabularyController.getAllWordsPaginated,
// );

/**
 * @route   GET /backendapi/vocabulary/approval
 * @desc    Получение предложенных слов на утверждение с пагинацией (по языку)
 * @access  Public (или Admin, если доступ должен быть ограничен)
 * @query   language - Обязательный ('russian' или 'buryat')
 * @query   page - Опциональный (номер страницы, default 1)
 * @query   limit - Опциональный (количество на странице, default 10)
 */
vocabularyRouter.get(
    '/approval',
    authenticateToken,
    authorizeAdmin,
    // -------------------------------------------------------
    [
        // Валидация для page (остается опциональной)
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('page должен быть целым числом больше 0'),

        // Валидация для limit (остается опциональной)
        query('limit')
            .optional()
            .isInt({ min: 1 })
            .withMessage('limit должен быть целым числом больше 0'),

        query('language') // Проверяем query parameter 'language'
            .notEmpty()
            .withMessage('Query параметр language не может быть пустым')
            .isString()
            .withMessage('Query параметр language должен быть строкой')
            .isIn(['russian', 'buryat']) // Проверяем допустимые значения
            .withMessage(
                "Query параметр language должен быть 'russian' или 'buryat'",
            ),
    ],
    validate, // Middleware для обработки ошибок валидации
    vocabularyController.getWordsOnApproval, // Контроллер
);

/**
 * @route   POST /backendapi/vocabulary/suggest-translate
 * @desc    Предложение перевода слова
 * @access  Private
 */
vocabularyRouter.post(
    '/suggest-translate',
    authenticateToken,
    [
        body('wordId')
            .isMongoId()
            .withMessage('wordId должен быть валидным ObjectId'),
        body('targetLanguage')
            .notEmpty()
            .withMessage('targetLanguage не может быть пустым')
            .isString()
            .withMessage('targetLanguage должен быть строкой')
            .isIn(['russian', 'buryat']) // Проверяем допустимые значения
            .withMessage("targetLanguage должен быть 'russian' или 'buryat'"),
        body('translationText')
            .trim()
            .notEmpty() 
            .withMessage('translationText не может быть пустым')
            .isString()
            .withMessage('translationText должен быть строкой'),
        body('telegramUserId')
            .isNumeric()
            .withMessage('telegramUserId должен быть валидным Numeric'),
        body('dialect')
            .optional()
            .isMongoId()
            .withMessage('dialect должен быть валидным ObjectId, если указан'),
    ],
    validate,
    vocabularyController.suggestWordTranslate,
);

/**
 * @route   POST /backendapi/vocabulary/suggest-words
 * @desc    Предложение нескольких слов
 * @access  Private
 */
vocabularyRouter.post(
    '/suggest-words',
    authenticateToken,
    [
        body('text')
            .isString()
            .withMessage('text должен быть строкой')
            .notEmpty()
            .withMessage('text не может быть пустым'),

        body('language')
            .notEmpty()
            .withMessage('параметр language не может быть пустым')
            .isString()
            .withMessage('параметр language должен быть строкой')
            .isIn(['russian', 'buryat'])
            .withMessage(
                "Query параметр language должен быть 'russian' или 'buryat'",
            ),

        body('telegramUserId')
            .isNumeric()
            .withMessage('telegramUserId должен быть числом')
            .notEmpty()
            .withMessage('telegramUserId не может быть пустым'),

        body('dialect')
            .optional()
            .isMongoId()
            .withMessage('dialect должен быть валидным ObjectId, если указан'),
    ],
    validate,
    vocabularyController.suggestWords,
);

/**
 * @route   POST /backendapi/vocabulary/accept-suggested-word
 * @desc    Принятие предложенного слова
 * @access  Private/Admin
 */
vocabularyRouter.post(
    '/accept-suggested-word',
    authenticateToken, // Проверка JWT токена
    authorizeAdmin, // Проверка прав администратора
    [
        // Валидация ID предложенного слова
        body('suggestedWordId')
            .isMongoId()
            .withMessage('suggestedWordId должен быть валидным ObjectId'),

        // Валидация ID модератора (передается в теле)
        body('telegramUserId') // Убедитесь, что фронтенд передает именно telegramUserId модератора
            .isNumeric()
            .withMessage('telegramUserId должен быть валидным Number'),

        // Валидация языка
        body('language')
            .notEmpty()
            .withMessage('language не может быть пустым') // Проверяем, что не пустой
            .isString()
            .withMessage('language должен быть строкой') // Проверяем, что строка
            .isIn(['russian', 'buryat']) // Проверяем, что значение 'russian' ИЛИ 'buryat'
            .withMessage("language должен быть 'russian' или 'buryat'"), // Сообщение об ошибке, если проверка isIn не прошла
    ],
    validate, // Middleware для обработки ошибок валидации
    vocabularyController.acceptSuggestedWord, // Контроллер, который будет вызван, если валидация прошла
);

/**
 * @route   POST /backendapi/vocabulary/decline-suggested-word
 * @desc    Отклонение предложенного слова
 * @access  Private/Admin
 */
vocabularyRouter.post(
    '/decline-suggested-word',
    authenticateToken,
    authorizeAdmin,
    [
        body('suggestedWordId')
            .notEmpty()
            .withMessage('suggestedWordId не может быть пустым')
            .isMongoId()
            .withMessage('suggestedWordId должен быть валидным ObjectId'),

        body('telegramUserId')
            .notEmpty()
            .withMessage('telegramUserId не может быть пустым')
            .isNumeric()
            .withMessage('telegramUserId должен быть валидным Number'),

        body('language')
            .notEmpty()
            .withMessage('language не может быть пустым') // Проверяем, что не пустой
            .isString()
            .withMessage('language должен быть строкой') // Проверяем, что строка
            .isIn(['russian', 'buryat']) // Проверяем, что значение 'russian' ИЛИ 'buryat'
            .withMessage("language должен быть 'russian' или 'buryat'"), // Сообщение об ошибке, если проверка isIn не прошла
        body('reason')
            .optional()
            .trim()
            .isString()
            .withMessage('reason должен быть строкой')
            .notEmpty()
            .withMessage('reason не может быть пустым, если указан'),
    ],
    validate,
    vocabularyController.declineSuggestedWord,
);

/**
 * НОВЫЙ РОУТ
 * @route   GET /backendapi/vocabulary/confirmed-words
 * @desc    Получение подтвержденных слов с пагинацией (по языку)
 * @access  Public (или Private/Admin, если нужно ограничить доступ)
 * @query   language - Обязательный ('russian' или 'buryat')
 * @query   page - Опциональный (номер страницы, default 1)
 * @query   limit - Опциональный (количество на странице, default 10)
 */
vocabularyRouter.get(
    // Можно выбрать эндпоинт, например '/confirmed-words' или '/confirmed/paginated'
    '/confirmed-words',
    [
        // Валидация обязательного параметра 'language'
        query('language')
            .notEmpty().withMessage('Query параметр language обязателен')
            .isString().withMessage('Query параметр language должен быть строкой')
            .isIn(['russian', 'buryat']).withMessage("Query параметр language должен быть 'russian' или 'buryat'"),

        // Валидация опционального параметра 'page'
        query('page')
            .optional() // Опциональный
            .isInt({ min: 1 }).withMessage('Query параметр page должен быть целым числом больше 0, если передан')
            .toInt(), // Конвертируем в число после валидации

        // Валидация опционального параметра 'limit'
        query('limit')
            .optional() // Опциональный
            .isInt({ min: 1 }).withMessage('Query параметр limit должен быть целым числом больше 0, если передан')
            .toInt(), // Конвертируем в число после валидации
    ],
    validate, // Middleware для обработки ошибок валидации
    vocabularyController.getConfirmedWordsPaginated, // Контроллер для этого роута
);

/**
 * @route   GET /backendapi/vocabulary/confirmed-word
 * @desc    Получение одного подтверждённого слова или случайного
 * @access  Public
 */
vocabularyRouter.get(
    '/confirmed-word',
    [
        query('wordId')
            .optional()
            .isMongoId()
            .withMessage('wordId должен быть валидным ObjectId'),
    ],
    validate,
    vocabularyController.getConfirmedWord,
);

/**
 * @route   POST /backendapi/vocabulary/translate
 * @desc    Перевод слова
 * @access  Public
 */
vocabularyRouter.post(
    '/translate',
    [
        body('userInput')
            .trim()
            .notEmpty()
            .withMessage('userInput не может быть пустым')
            .isString()
            .withMessage('userInput должен быть строкой'),
        body('targetLanguage')
            .trim()
            .notEmpty()
            .withMessage('targetLanguage не может быть пустым')
            .isIn(['russian', 'buryat'])
            .withMessage("targetLanguage должен быть 'russian' или 'buryat'"),
        body('sourceLanguage')
            .trim()
            .notEmpty()
            .withMessage('sourceLanguage не может быть пустым')
            .isIn(['russian', 'buryat'])
            .withMessage("sourceLanguage должен быть 'russian' или 'buryat'"),
        body('telegramUserId')
            .isNumeric()
            .withMessage('telegramUserId должен быть числовым значением')
            .notEmpty()
            .withMessage('telegramUserId не может быть пустым'),
    ],
    validate,
    vocabularyController.translateWord,
);

/**
 * НОВЫЙ РОУТ ДЛЯ ЧАСТИЧНОГО ПОИСКА
 * @route   GET /backendapi/vocabulary/search/partial
 * @desc    Поиск подтвержденных слов по частичному совпадению (началу слова)
 * @access  Public (или Private, если нужно ограничить доступ)
 * @query   q - Поисковый запрос (часть слова) - Обязательный
 * @query   language - Язык для поиска ('russian' или 'buryat') - Обязательный
 * @query   limit - Максимальное количество результатов (опционально, default 10)
 */
vocabularyRouter.get(
    '/search/partial',
    // authenticateToken, // Раскомментируй, если доступ должен быть только для авторизованных
    [
        query('q')
            .trim()
            .notEmpty().withMessage('Query параметр "q" (поисковый запрос) не может быть пустым.')
            .isString().withMessage('Query параметр "q" должен быть строкой.'),

        query('language')
            .notEmpty().withMessage('Query параметр "language" обязателен.')
            .isString().withMessage('Query параметр "language" должен быть строкой.')
            .isIn(['russian', 'buryat']).withMessage(`Query параметр "language" должен быть 'russian' или 'buryat'.`),

        query('limit')
            .optional() // Опциональный
            .isInt({ min: 1, max: 50 }).withMessage('Query параметр "limit" должен быть целым числом от 1 до 50, если передан.') // Ограничим max limit
            .toInt(), // Конвертируем в число после валидации
    ],
    validate, // Middleware для обработки ошибок валидации
    vocabularyController.searchPartialWords, // Новый метод контроллера
);

/**
 * @route   GET /backendapi/vocabulary/search-history/:telegramUserId
 * @desc    Получение истории поиска слов для пользователя с пагинацией
 * @access  Private (требуется токен пользователя, чья история запрашивается, или админа)
 * @param   telegramUserId - ID пользователя Telegram в URL
 * @query   page - Опциональный номер страницы (default 1)
 * @query   limit - Опциональное количество на странице (default 10)
 */
vocabularyRouter.get(
    '/search-history/:telegramUserId',
    authenticateToken, // Доступ только для аутентифицированных (возможно, нужна доп. проверка прав)
    [
        // Валидация параметра пути 'telegramUserId'
        param('telegramUserId')
            .isNumeric().withMessage('Параметр telegramUserId должен быть числом.')
            .notEmpty().withMessage('Параметр telegramUserId не может быть пустым.'),
            // .toInt(), // Можно конвертировать сразу, но контроллер тоже это делает

        // Валидация опционального параметра 'page'
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Query параметр page должен быть целым числом больше 0, если передан.')
            .toInt(),

        // Валидация опционального параметра 'limit'
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Query параметр limit должен быть целым числом от 1 до 100, если передан.') // Ограничим max limit
            .toInt(),
    ],
    validate, // Middleware для обработки ошибок валидации
    vocabularyController.getSearchHistory, // Контроллер для этого роута
);

/**
 * НОВЫЙ РОУТ
 * @route   GET /backendapi/vocabulary/parts-of-speech
 * @desc    Получение списка всех доступных частей речи (классификаторов)
 * @access  Public (или Private, если требуется аутентификация)
 */
vocabularyRouter.get(
    '/parts-of-speech',
    authenticateToken,
    // [] - Валидация здесь не нужна, т.к. нет параметров
    // validate, // Тоже не нужен, т.к. нет валидации
    vocabularyController.getPartsOfSpeech, // Новый метод контроллера
);

export default vocabularyRouter;
