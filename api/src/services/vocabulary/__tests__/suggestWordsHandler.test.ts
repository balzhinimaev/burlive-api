// src/services/vocabulary/handlers/suggestWordsHandler.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Document, Types } from 'mongoose';
// import { SuggestWordsHandler } from './suggestWordsHandler'; // Путь к вашему хендлеру
// import { ISuggestWordsHandler } from '..interfaces/interfaces'; // Путь к интерфейсам
import { IAddRatingHandler } from '../../interfaces/userRating.interface';
import { RATING_POINTS } from '../../../config/constants'; // Ваши константы

// Импортируем реальные модели и их интерфейсы/типы
import TelegramUserModel from '../../../models/TelegramUsers';
import AcceptedWordRussianModel from '../../../models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryatModel from '../../../models/Vocabulary/AcceptedWordBuryat';
import SuggestedWordRussianModel, {
    ISuggestedWordRussian,
} from '../../../models/Vocabulary/SuggestedWordModelRussian';
import SuggestedWordBuryatModel from '../../../models/Vocabulary/SuggestedWordModelBuryat';
import DialectModel from '../../../models/Dialect'; // Импортируем модель и интерфейс
import { DatabaseError, NotFoundError } from '../../../errors/customErrors';
import { SuggestWordsHandler } from '../handlers/suggestWordsHandler';
import { ISuggestWordsHandler } from '../handlers/interfaces';
import { SuggestionInput } from '../../../types/vocabulary.types';

// --- Мокирование зависимостей ---

// Мок для логгера
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};

// Мок для AddRatingHandler
const mockAddRatingHandler: IAddRatingHandler = {
    execute: jest.fn().mockResolvedValue(undefined), // По умолчанию успешно выполняется
};

// --- Настройка тестовой среды ---

describe('SuggestWordsHandler', () => {
    let mongoServer: MongoMemoryServer;
    let handler: ISuggestWordsHandler; // Тестируем через интерфейс

    // Переменные для хранения ID созданных документов
    let testUserId: Types.ObjectId;
    let existingAcceptedRuId: Types.ObjectId;
    let existingAcceptedBuId: Types.ObjectId;
    let existingSuggestedRuId: Types.ObjectId;
    let existingSuggestedBuId: Types.ObjectId;
    let sargaagDialectId: Types.ObjectId;

    // ---- SETUP: Запуск сервера и подключение перед всеми тестами ----
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);

        // Создаем экземпляр обработчика с реальными моделями (но моками для других сервисов)
        handler = new SuggestWordsHandler(
            TelegramUserModel, // Используем реальную модель, подключенную к тестовой БД
            AcceptedWordRussianModel,
            AcceptedWordBuryatModel,
            SuggestedWordRussianModel,
            SuggestedWordBuryatModel,
            mockAddRatingHandler, // Передаем мок
            mockLogger as any, // Приводим тип мока к типу логгера
            RATING_POINTS,
            DialectModel, // Передаем реальную модель диалектов
        );
    });

    // ---- CLEANUP: Остановка сервера и отключение после всех тестов ----
    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // ---- SEEDING: Очистка и заполнение БД перед каждым тестом ----
    beforeEach(async () => {
        // Очищаем все коллекции
        await TelegramUserModel.deleteMany({});
        await AcceptedWordRussianModel.deleteMany({});
        await AcceptedWordBuryatModel.deleteMany({});
        await SuggestedWordRussianModel.deleteMany({});
        await SuggestedWordBuryatModel.deleteMany({});
        await DialectModel.deleteMany({});

        // Сбрасываем вызовы моков
        jest.clearAllMocks();

        // Создаем тестовые данные
        const user = await TelegramUserModel.create({
            id: 12345,
            first_name: 'Test',
            username: 'testuser',
            rating: 10,
            level: new Types.ObjectId(), // Просто мок ObjectId
            referral_code: 'TESTCODE',
            // другие обязательные поля...
        });
        testUserId = user._id;

        const acceptedRu = await AcceptedWordRussianModel.create({
            text: 'Привет',
            normalized_text: 'привет',
            author: testUserId,
            contributors: [testUserId],
        });
        existingAcceptedRuId = acceptedRu._id;

        const dialect = await DialectModel.create({ name: 'Сарааг диалект' });
        sargaagDialectId = dialect._id;

        const acceptedBu = await AcceptedWordBuryatModel.create({
            text: 'Сайн',
            normalized_text: 'сайн',
            author: testUserId,
            contributors: [testUserId],
            dialect: sargaagDialectId,
        });
        existingAcceptedBuId = acceptedBu._id;

        const suggestedRu = await SuggestedWordRussianModel.create({
            text: 'Пока',
            normalized_text: 'пока',
            author: testUserId,
            contributors: [testUserId],
            status: 'new',
        });
        existingSuggestedRuId = suggestedRu._id;

        const suggestedBu = await SuggestedWordBuryatModel.create({
            text: 'Баяртай',
            normalized_text: 'баяртай',
            author: testUserId,
            contributors: [testUserId],
            status: 'new',
            dialect: sargaagDialectId,
        });
        existingSuggestedBuId = suggestedBu._id;
    });

    // ---- ТЕСТЫ ----

    it('should throw NotFoundError if user does not exist', async () => {
        const input: SuggestionInput = {
            text: 'новоеслово',
            language: 'russian',
            telegramUserId: 99999,
        };
        await expect(handler.execute(input)).rejects.toThrow(NotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            `User with Telegram ID ${input.telegramUserId} not found.`,
        );
    });

    // --- Тесты для русского языка ---

    it('[RU] should suggest a new russian word', async () => {
        const input: SuggestionInput = {
            text: 'НовоеСлово',
            language: 'russian',
            telegramUserId: 12345,
        };
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].message).toContain('успешно предложено');
        expect(results[0].word).toBeDefined();
        expect(results[0].word?.text).toBe('НовоеСлово');
        expect(results[0].word?.normalized_text).toBe('новоеслово');
        expect(
            (results[0].word as any)?.language === undefined ||
                (results[0].word as any)?.language === 'russian',
        ).toBeTruthy(); // Assuming language is not stored or is 'russian'
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: testUserId,
            amount: RATING_POINTS.NEW_SUGGESTION,
        });

        // Проверяем, что слово действительно создано в БД
        const createdWord = await SuggestedWordRussianModel.findById(
            results[0].word?._id,
        );
        expect(createdWord).not.toBeNull();
        expect(createdWord?.text).toBe('НовоеСлово');
    });

    it('[RU] should add contributor to existing accepted russian word', async () => {
        // Создаем нового пользователя
        const newUser = await TelegramUserModel.create({
            id: 54321,
            first_name: 'New',
            level: new Types.ObjectId(),
            referral_code: 'NEWCODE',
        });
        const newUserId = newUser._id;

        const input: SuggestionInput = {
            text: 'Привет ',
            language: 'russian',
            telegramUserId: 54321,
        }; // Предлагаем существующее принятое слово
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('accepted_exists');
        expect(results[0].message).toContain(
            'уже принято. Вы добавлены в соавторы',
        );
        expect(results[0].word?._id).toEqual(existingAcceptedRuId);
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        ); // Оба пользователя
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: newUserId,
            amount: RATING_POINTS.ACCEPTED_CONTRIBUTION,
        });

        // Проверяем БД
        const updatedWord =
            await AcceptedWordRussianModel.findById(existingAcceptedRuId);
        expect(updatedWord?.contributors).toHaveLength(2);
        expect(updatedWord?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
    });

    it('[RU] should add contributor to existing suggested russian word', async () => {
        const newUser = await TelegramUserModel.create({
            id: 54321,
            first_name: 'New',
            level: new Types.ObjectId(),
            referral_code: 'NEWCODE',
        });
        const newUserId = newUser._id;

        const input: SuggestionInput = {
            text: ' Пока',
            language: 'russian',
            telegramUserId: 54321,
        }; // Предлагаем существующее предложенное
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('suggested_exists');
        expect(results[0].message).toContain(
            'уже предложено. Вы добавлены в контрибьюторы',
        );
        expect(results[0].word?._id).toEqual(existingSuggestedRuId);
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: newUserId,
            amount: RATING_POINTS.SUGGESTION_CONTRIBUTION,
        });

        const updatedWord = await SuggestedWordRussianModel.findById(
            existingSuggestedRuId,
        );
        expect(updatedWord?.contributors).toHaveLength(2);
        expect(updatedWord?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
    });

    it('[RU] should not add contributor or rating if already contributing to accepted word', async () => {
        const input: SuggestionInput = {
            text: 'привет',
            language: 'russian',
            telegramUserId: 12345,
        }; // Исходный автор предлагает снова
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('accepted_exists');
        expect(results[0].message).toContain(
            'уже принято. Вы уже являетесь соавтором',
        );
        expect(results[0].word?._id).toEqual(existingAcceptedRuId);
        expect(results[0].word?.contributors).toHaveLength(1); // Не добавился дубликат
        expect(mockAddRatingHandler.execute).not.toHaveBeenCalled(); // Рейтинг не должен меняться

        const word =
            await AcceptedWordRussianModel.findById(existingAcceptedRuId);
        expect(word?.contributors).toHaveLength(1);
    });

    it('[RU] should not add contributor or rating if already contributing to suggested word', async () => {
        const input: SuggestionInput = {
            text: 'пока',
            language: 'russian',
            telegramUserId: 12345,
        }; // Исходный автор предлагает снова
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('suggested_exists');
        expect(results[0].message).toContain(
            'уже предложено. Вы уже являетесь контрибьютором',
        );
        expect(results[0].word?._id).toEqual(existingSuggestedRuId);
        expect(results[0].word?.contributors).toHaveLength(1);
        expect(mockAddRatingHandler.execute).not.toHaveBeenCalled();

        const word = await SuggestedWordRussianModel.findById(
            existingSuggestedRuId,
        );
        expect(word?.contributors).toHaveLength(1);
    });

    // --- Тесты для бурятского языка ---

    it('[BU] should suggest a new buryat word without dialect', async () => {
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
        }; // Диалект не указан
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].message).toContain('успешно предложено');
        expect(results[0].word?.text).toBe('Шэнэ Yгэ');
        expect(results[0].word?.normalized_text).toBe('шэнэ yгэ');
        expect((results[0].word as any)?.dialect).toBeNull(); // Диалект должен быть null
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: testUserId,
            amount: RATING_POINTS.NEW_SUGGESTION,
        });

        const createdWord = await SuggestedWordBuryatModel.findById(
            results[0].word?._id,
        );
        expect(createdWord).not.toBeNull();
        expect(createdWord?.dialect).toBeNull();
    });

    it('[BU] should suggest a new buryat word with found dialect', async () => {
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
            dialect: ' Сарааг диалект ',
        }; // Указываем диалект с пробелами
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].word?.text).toBe('Шэнэ Yгэ');
        expect(results[0].word?.normalized_text).toBe('шэнэ yгэ');
        expect((results[0].word as any)?.dialect).toEqual(sargaagDialectId); // Диалект должен быть найденным ID
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);

        const createdWord = await SuggestedWordBuryatModel.findById(
            results[0].word?._id,
        );
        expect(createdWord).not.toBeNull();
        expect(createdWord?.dialect).toEqual(sargaagDialectId);
    });

    it('[BU] should suggest a new buryat word when dialect name not found', async () => {
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
            dialect: 'Неизвестный Диалект',
        };
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('newly_suggested');
        expect((results[0].word as any)?.dialect).toBeNull(); // Диалект должен быть null
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                'Dialect with name "Неизвестный Диалект" not found',
            ),
        );

        const createdWord = await SuggestedWordBuryatModel.findById(
            results[0].word?._id,
        );
        expect(createdWord).not.toBeNull();
        expect(createdWord?.dialect).toBeNull();
    });

    it('[BU] should add contributor to existing accepted buryat word', async () => {
        const newUser = await TelegramUserModel.create({
            id: 54321,
            first_name: 'New',
            level: new Types.ObjectId(),
            referral_code: 'NEWCODE',
        });
        const newUserId = newUser._id;

        const input: SuggestionInput = {
            text: ' сайн',
            language: 'buryat',
            telegramUserId: 54321,
        };
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('accepted_exists');
        expect(results[0].message).toContain(
            'уже принято. Вы добавлены в соавторы',
        );
        expect(results[0].word?._id).toEqual(existingAcceptedBuId);
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: newUserId,
            amount: RATING_POINTS.ACCEPTED_CONTRIBUTION,
        });

        const updatedWord =
            await AcceptedWordBuryatModel.findById(existingAcceptedBuId);
        expect(updatedWord?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
    });

    it('[BU] should add contributor to existing suggested buryat word', async () => {
        const newUser = await TelegramUserModel.create({
            id: 54321,
            first_name: 'New',
            level: new Types.ObjectId(),
            referral_code: 'NEWCODE',
        });
        const newUserId = newUser._id;

        const input: SuggestionInput = {
            text: ' баяртай ',
            language: 'buryat',
            telegramUserId: 54321,
        };
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('suggested_exists');
        expect(results[0].message).toContain(
            'уже предложено. Вы добавлены в контрибьюторы',
        );
        expect(results[0].word?._id).toEqual(existingSuggestedBuId);
        expect(results[0].word?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: newUserId,
            amount: RATING_POINTS.SUGGESTION_CONTRIBUTION,
        });

        const updatedWord = await SuggestedWordBuryatModel.findById(
            existingSuggestedBuId,
        );
        expect(updatedWord?.contributors).toEqual(
            expect.arrayContaining([testUserId, newUserId]),
        );
    });

    // --- Тесты для нескольких слов и ошибок ---

    it('should process multiple words in one request', async () => {
        const input: SuggestionInput = {
            text: ' НовоеRU , ШэнэBU , привет , сайн ',
            language: 'russian',
            telegramUserId: 12345,
        };
        // Примечание: язык 'russian', но передаем и бурятские для теста (они должны обработаться как русские)
        const results = await handler.execute(input);

        expect(results).toHaveLength(4);

        // 1. НовоеRU - newly_suggested (russian)
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].originalWord).toBe('НовоеRU');
        expect(results[0].word?.normalized_text).toBe('новоеru');

        // 2. ШэнэBU - newly_suggested (russian)
        expect(results[1].status).toBe('newly_suggested');
        expect(results[1].originalWord).toBe('ШэнэBU');
        expect(results[1].word?.normalized_text).toBe('шэнэbu');

        // 3. привет - accepted_exists (russian)
        expect(results[2].status).toBe('accepted_exists');
        expect(results[2].originalWord).toBe('привет');
        expect(results[2].word?._id).toEqual(existingAcceptedRuId);

        // 4. сайн - newly_suggested (russian) - т.к. язык в input = russian
        expect(results[3].status).toBe('newly_suggested');
        expect(results[3].originalWord).toBe('сайн');
        expect(results[3].word?.normalized_text).toBe('сайн');

        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(3); // 3 новых слова
    });
    it('should return error status for words causing database errors during creation', async () => {
        let saveCallCount = 0;

        // Сохраняем оригинальный метод прототипа
        const originalSave = SuggestedWordRussianModel.prototype.save;

        // Создаем мок-функцию и СОХРАНЯЕМ ЕЕ В ПЕРЕМЕННУЮ
        const mockSaveFn = jest.fn().mockImplementation(async function (
            this: Document<unknown, {}, ISuggestedWordRussian> &
                ISuggestedWordRussian & { _id?: Types.ObjectId },
        ) {
            saveCallCount++;
            // const currentWordText = this.text;
            if (saveCallCount === 2) {
                // console.log(
                //     `[TEST MOCK] Simulating DB save error for word: "${currentWordText}" (call: ${saveCallCount})`,
                // );
                throw new DatabaseError(
                    'Simulated DB save error on second call',
                );
            }
            // console.log(
            //     `[TEST MOCK] Simulating successful save for word: "${currentWordText}" (call: ${saveCallCount})`,
            // );
            this._id = this._id || new Types.ObjectId();
            return this;
        });

        // Присваиваем СОЗДАННЫЙ МОК прототипу
        SuggestedWordRussianModel.prototype.save = mockSaveFn;

        const input: SuggestionInput = {
            text: 'Слово1,Слово2Err,Слово3',
            language: 'russian',
            telegramUserId: 12345,
        };

        const results = await handler.execute(input);

        // --- Проверки ---
        expect(results).toHaveLength(3);

        // Слово 1
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].originalWord).toBe('Слово1');

        // Слово 2
        expect(results[1].status).toBe('error');
        expect(results[1].originalWord).toBe('Слово2Err');
        expect(results[1].message).toBe(
            `Ошибка при обработке слова "Слово2Err": Simulated DB save error on second call`,
        );
        // Слово 3
        expect(results[2].status).toBe('newly_suggested');
        expect(results[2].originalWord).toBe('Слово3');

        // Проверка вызовов рейтинга
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(2);

        // --- Проверка логов ошибок ---
        const executeErrorLog = mockLogger.error.mock.calls.find((call) =>
            call[0]?.includes(
                'Failed to process suggestion "Слово2Err" (russian):',
            ),
        );
        expect(executeErrorLog).toBeDefined();
        if (executeErrorLog) {
            expect(executeErrorLog[1]).toHaveProperty('originalError');
            expect(executeErrorLog[1].originalError).toBeInstanceOf(
                DatabaseError,
            );
            expect(executeErrorLog[1].originalError.message).toBe(
                'Simulated DB save error on second call',
            );
        }

        const ratingErrorLog = mockLogger.error.mock.calls.find((call) =>
            call[0]?.includes('Rating update failed'),
        );
        expect(ratingErrorLog).toBeUndefined();

        const creationErrorLog = mockLogger.error.mock.calls.find((call) =>
            call[0]?.includes(
                'Error creating new Russian suggestion for "Слово2Err"',
            ),
        );
        expect(creationErrorLog).toBeDefined();
        if (creationErrorLog) {
            expect(creationErrorLog[1]).toBeInstanceOf(DatabaseError);
            expect(creationErrorLog[1].message).toBe(
                'Simulated DB save error on second call',
            );
        }

        expect(mockLogger.error).toHaveBeenCalledTimes(2);

        // Проверка вызовов save: ПРОВЕРЯЕМ ПЕРЕМЕННУЮ С МОКОМ
        expect(mockSaveFn).toHaveBeenCalledTimes(3); // <-- ИЗМЕНЕНО ЗДЕСЬ

        // ВОССТАНАВЛИВАЕМ ОРИГИНАЛ ПОСЛЕ ВСЕХ ПРОВЕРОК
        SuggestedWordRussianModel.prototype.save = originalSave;
    });
});
