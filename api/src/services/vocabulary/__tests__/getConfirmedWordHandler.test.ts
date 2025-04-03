// src/services/vocabulary/__tests__/getConfirmedWordHandler.test.ts
import mongoose, { Types } from 'mongoose';
import { GetConfirmedWordHandler } from '../handlers/getConfirmedWord.handler';
import AcceptedWordRussian from '../../../models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryat from '../../../models/Vocabulary/AcceptedWordBuryat';
import logger from '../../../utils/logger';
import {
    DatabaseError,
    // NotFoundError, // Раскомментируем, если будете использовать
    ValidationError,
} from '../../../errors/customErrors';
import { AcceptedWordType } from '../../../types/vocabulary.types';

// --- Mock Setup ---
jest.mock('../../../utils/logger');
jest.mock('../../../models/Vocabulary/AcceptedWordRussian');
jest.mock('../../../models/Vocabulary/AcceptedWordBuryat');
jest.mock('mongoose', () => {
    const originalMongoose = jest.requireActual('mongoose');
    return {
        ...originalMongoose,
        isValidObjectId: jest.fn(),
        Types: originalMongoose.Types,
        Schema: originalMongoose.Schema,
        model: originalMongoose.model,
    };
});

// --- Типы для моков ---
type MockMongooseType = {
    isValidObjectId: jest.Mock<boolean, [any]>;
};

type MockLoggerType = {
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
    debug: jest.Mock;
};

type MockQuery = {
    populate: jest.Mock<MockQuery, [any]>;
    lean: jest.Mock<Promise<any>, []>;
    skip: jest.Mock<MockQuery, [number]>;
};

type MockModelStatic = {
    findById: jest.Mock<MockQuery, [any]>;
    findOne: jest.Mock<MockQuery, []>;
    countDocuments: jest.Mock<Promise<number>, []>;
    mockClear: () => void;
};

// --- Приведение типов ---
const MockBuryatModel = AcceptedWordBuryat as unknown as MockModelStatic;
const MockRussianModel = AcceptedWordRussian as unknown as MockModelStatic;
const MockLogger = logger as unknown as MockLoggerType;
const MockMongoose = mongoose as unknown as MockMongooseType;

// --- Валидные тестовые ID ---
const mockObjectIdBuryat = new Types.ObjectId();
const mockObjectIdRussian = new Types.ObjectId();
const mockObjectIdNotFound = new Types.ObjectId();
const mockObjectIdAuthor1 = new Types.ObjectId();
const mockObjectIdAuthor2 = new Types.ObjectId();
const mockObjectIdTransR1 = new Types.ObjectId();
const mockObjectIdTransB1 = new Types.ObjectId();

const mockWordIdBuryat = mockObjectIdBuryat.toHexString();
const mockWordIdRussian = mockObjectIdRussian.toHexString();
const mockWordIdNotFound = mockObjectIdNotFound.toHexString();
const mockInvalidWordId = 'invalid-id';

// --- Моковые данные (с валидными ObjectId и полными полями) ---
// Убедитесь, что тип AcceptedWordType включает 'language', если вы его добавили
const mockBuryatWord: AcceptedWordType = {
    _id: mockObjectIdBuryat,
    // language: 'buryat', // Оставляем, если добавлено в тип
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T11:00:00Z'),
    text: 'Тэст_Бурят',
    normalized_text: 'тэст_бурят',
    author: {
        _id: mockObjectIdAuthor1,
        firstName: 'Test',
        username: 'tester',
    } as any,
    translations: [
        {
            _id: mockObjectIdTransR1,
            text: 'Test_Russian',
            language: 'russian',
            normalized_text: 'test_russian',
        } as any,
    ],
    contributors: [],
    translations_u: [],
    themes: [],
    dialect: null,
};

const mockRussianWord: AcceptedWordType = {
    _id: mockObjectIdRussian,
    // language: 'russian', // Оставляем, если добавлено в тип
    createdAt: new Date('2023-01-02T12:00:00Z'),
    updatedAt: new Date('2023-01-02T13:00:00Z'),
    text: 'Тест_Русский',
    normalized_text: 'тест_русский',
    author: {
        _id: mockObjectIdAuthor2,
        firstName: 'Dev',
        username: 'developer',
    } as any,
    translations: [
        {
            _id: mockObjectIdTransB1,
            text: 'Test_Buryat',
            language: 'buryat',
            normalized_text: 'test_buryat',
        } as any,
    ],
    contributors: [],
    translations_u: [],
    themes: [],
};

// --- Мокирование цепочек вызовов Mongoose ---
const mockBuryatQuery: MockQuery = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    skip: jest.fn().mockReturnThis(),
};
const mockRussianQuery: MockQuery = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn(),
    skip: jest.fn().mockReturnThis(),
};

// --- Test Suite ---
describe('GetConfirmedWordHandler', () => {
    let handler: GetConfirmedWordHandler;
    let mathRandomSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();

        MockMongoose.isValidObjectId.mockReturnValue(true);

        MockBuryatModel.findById.mockReturnValue(mockBuryatQuery);
        MockBuryatModel.findOne.mockReturnValue(mockBuryatQuery);
        MockRussianModel.findById.mockReturnValue(mockRussianQuery);
        MockRussianModel.findOne.mockReturnValue(mockRussianQuery);

        // Сбрасываем результаты lean/countDocuments перед каждым тестом
        mockBuryatQuery.lean.mockResolvedValue(null);
        mockRussianQuery.lean.mockResolvedValue(null);
        MockBuryatModel.countDocuments.mockResolvedValue(0);
        MockRussianModel.countDocuments.mockResolvedValue(0);

        if (mathRandomSpy) {
            mathRandomSpy.mockRestore();
        }
        handler = new GetConfirmedWordHandler();
    });

    afterEach(() => {
        if (mathRandomSpy) {
            mathRandomSpy.mockRestore();
        }
    });

    // --- Tests for searching by ID ---
    describe('execute with wordId', () => {
        it('should throw ValidationError if wordId is invalid', async () => {
            MockMongoose.isValidObjectId.mockReturnValue(false);

            await expect(
                handler.execute({ wordId: mockInvalidWordId }),
            ).rejects.toThrow(ValidationError);

            expect(MockMongoose.isValidObjectId).toHaveBeenCalledWith(
                mockInvalidWordId,
            );
            // ИСПРАВЛЕНО: Ожидаем один аргумент
            expect(MockLogger.warn).toHaveBeenCalledWith(
                `Invalid word ID format provided: ${mockInvalidWordId}`,
            );
            expect(MockBuryatModel.findById).not.toHaveBeenCalled();
            expect(MockRussianModel.findById).not.toHaveBeenCalled();
        });

        it('should find and return word from Buryat collection if ID matches', async () => {
            mockBuryatQuery.lean.mockResolvedValueOnce(mockBuryatWord);

            const result = await handler.execute({ wordId: mockWordIdBuryat });

            expect(result).toEqual(mockBuryatWord);
            expect(MockMongoose.isValidObjectId).toHaveBeenCalledWith(
                mockWordIdBuryat,
            );
            expect(MockBuryatModel.findById).toHaveBeenCalledWith(
                mockWordIdBuryat,
            );
            expect(mockBuryatQuery.populate).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findById).not.toHaveBeenCalled();
            // ИСПРАВЛЕНО: Ожидаем один аргумент
            expect(MockLogger.info).toHaveBeenCalledWith(
                `Found word ID ${mockWordIdBuryat} in Buryat collection.`,
            );
        });

        it('should find and return word from Russian collection if not found in Buryat', async () => {
            mockRussianQuery.lean.mockResolvedValueOnce(mockRussianWord);

            const result = await handler.execute({ wordId: mockWordIdRussian });

            expect(result).toEqual(mockRussianWord);
            expect(MockMongoose.isValidObjectId).toHaveBeenCalledWith(
                mockWordIdRussian,
            );
            expect(MockBuryatModel.findById).toHaveBeenCalledWith(
                mockWordIdRussian,
            );
            expect(mockBuryatQuery.populate).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findById).toHaveBeenCalledWith(
                mockWordIdRussian,
            );
            expect(mockRussianQuery.populate).toHaveBeenCalledTimes(1);
            expect(mockRussianQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем один аргумент для debug
            expect(MockLogger.debug).toHaveBeenCalledWith(
                `Word ID ${mockWordIdRussian} not found in Buryat, checking Russian collection...`,
            );
            // ИСПРАВЛЕНО: Ожидаем один аргумент для info
            expect(MockLogger.info).toHaveBeenCalledWith(
                `Found word ID ${mockWordIdRussian} in Russian collection.`,
            );
        });

        it('should return null if wordId is not found in either collection', async () => {
            const result = await handler.execute({
                wordId: mockWordIdNotFound,
            });

            expect(result).toBeNull();
            expect(MockMongoose.isValidObjectId).toHaveBeenCalledWith(
                mockWordIdNotFound,
            );
            expect(MockBuryatModel.findById).toHaveBeenCalledWith(
                mockWordIdNotFound,
            );
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findById).toHaveBeenCalledWith(
                mockWordIdNotFound,
            );
            expect(mockRussianQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем один аргумент
            expect(MockLogger.info).toHaveBeenCalledWith(
                `Word ID ${mockWordIdNotFound} not found in either collection.`,
            );
        });

        it('should throw DatabaseError if Buryat findById chain fails', async () => {
            const dbError = new Error('Buryat DB connection failed');
            mockBuryatQuery.lean.mockRejectedValueOnce(dbError);

            await expect(
                handler.execute({ wordId: mockWordIdBuryat }),
            ).rejects.toThrow(DatabaseError);

            expect(MockBuryatModel.findById).toHaveBeenCalledWith(
                mockWordIdBuryat,
            );
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки в логе
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: mockWordIdBuryat,
                    error: dbError, // Логгер пишет оригинальную ошибку
                }),
            );
        });

        it('should throw DatabaseError if Russian findById chain fails (after Buryat check)', async () => {
            const dbError = new Error('Russian DB connection failed');
            mockRussianQuery.lean.mockRejectedValueOnce(dbError);

            await expect(
                handler.execute({ wordId: mockWordIdRussian }),
            ).rejects.toThrow(DatabaseError);

            expect(MockBuryatModel.findById).toHaveBeenCalledWith(
                mockWordIdRussian,
            );
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findById).toHaveBeenCalledWith(
                mockWordIdRussian,
            );
            expect(mockRussianQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки в логе
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: mockWordIdRussian,
                    error: dbError, // Логгер пишет оригинальную ошибку
                }),
            );
        });
    });

    // --- Tests for random word retrieval ---
    describe('execute without wordId (random word)', () => {
        beforeEach(() => {
            mathRandomSpy = jest.spyOn(Math, 'random');
        });

        it('should return null if both collections are empty', async () => {
            const result = await handler.execute({});

            expect(result).toBeNull();
            expect(MockBuryatModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockBuryatModel.findOne).not.toHaveBeenCalled();
            expect(MockRussianModel.findOne).not.toHaveBeenCalled();
            // ИСПРАВЛЕНО: Ожидаем один аргумент
            expect(MockLogger.warn).toHaveBeenCalledWith(
                'No confirmed words found in the database.',
            );
        });

        it('should fetch a random word from Buryat collection when random index falls within its range', async () => {
            const buryatCount = 5;
            const russianCount = 3;
            const totalCount = buryatCount + russianCount;
            const randomValue = 0.3;
            const expectedSkip = Math.floor(randomValue * totalCount);

            mathRandomSpy.mockReturnValue(randomValue);
            MockBuryatModel.countDocuments.mockResolvedValue(buryatCount);
            MockRussianModel.countDocuments.mockResolvedValue(russianCount);
            mockBuryatQuery.lean.mockResolvedValueOnce(mockBuryatWord);

            const result = await handler.execute({});

            expect(result).toEqual(mockBuryatWord);
            expect(MockBuryatModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(mathRandomSpy).toHaveBeenCalledTimes(1);
            expect(MockBuryatModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.skip).toHaveBeenCalledWith(expectedSkip);
            expect(mockBuryatQuery.populate).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findOne).not.toHaveBeenCalled();
            // ИСПРАВЛЕНО: Ожидаем один аргумент для debug
            expect(MockLogger.debug).toHaveBeenCalledWith(
                `Fetching random word from Buryat collection (skip: ${expectedSkip})...`,
            );
            // ИСПРАВЛЕНО: Ожидаем один аргумент для info
            expect(MockLogger.info).toHaveBeenCalledWith(
                `Successfully fetched a random word (ID: ${mockBuryatWord._id}).`,
            );
        });

        it('should fetch a random word from Russian collection when random index falls within its range', async () => {
            const buryatCount = 2;
            const russianCount = 4;
            const totalCount = buryatCount + russianCount;
            const randomValue = 0.8;
            const randomIndex = Math.floor(randomValue * totalCount);
            const expectedRussianSkip = randomIndex - buryatCount;

            mathRandomSpy.mockReturnValue(randomValue);
            MockBuryatModel.countDocuments.mockResolvedValue(buryatCount);
            MockRussianModel.countDocuments.mockResolvedValue(russianCount);
            mockRussianQuery.lean.mockResolvedValueOnce(mockRussianWord);

            const result = await handler.execute({});

            expect(result).toEqual(mockRussianWord);
            expect(MockBuryatModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(mathRandomSpy).toHaveBeenCalledTimes(1);
            expect(MockBuryatModel.findOne).not.toHaveBeenCalled();
            expect(MockRussianModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockRussianQuery.skip).toHaveBeenCalledWith(
                expectedRussianSkip,
            );
            expect(mockRussianQuery.populate).toHaveBeenCalledTimes(1);
            expect(mockRussianQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем один аргумент для debug
            expect(MockLogger.debug).toHaveBeenCalledWith(
                `Fetching random word from Russian collection (skip: ${expectedRussianSkip})...`,
            );
            // ИСПРАВЛЕНО: Ожидаем один аргумент для info
            expect(MockLogger.info).toHaveBeenCalledWith(
                `Successfully fetched a random word (ID: ${mockRussianWord._id}).`,
            );
        });

        it('should return null if findOne returns null (e.g., race condition)', async () => {
            const buryatCount = 5;
            mathRandomSpy.mockReturnValue(0.1);
            MockBuryatModel.countDocuments.mockResolvedValue(buryatCount);
            MockRussianModel.countDocuments.mockResolvedValue(3);
            mockBuryatQuery.lean.mockResolvedValueOnce(null);

            const result = await handler.execute({});

            expect(result).toBeNull();
            expect(MockBuryatModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.findOne).not.toHaveBeenCalled();
            // ИСПРАВЛЕНО: Ожидаем один аргумент
            expect(MockLogger.warn).toHaveBeenCalledWith(
                'Could not fetch a random word despite non-zero count. Possible race condition?',
            );
        });

        it('should throw DatabaseError if Buryat countDocuments fails', async () => {
            const dbError = new Error('Buryat Count failed');
            MockBuryatModel.countDocuments.mockRejectedValue(dbError);

            await expect(handler.execute({})).rejects.toThrow(DatabaseError);

            expect(MockBuryatModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.countDocuments).not.toHaveBeenCalled();
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: undefined,
                    error: dbError,
                }),
            );
        });

        it('should throw DatabaseError if Russian countDocuments fails', async () => {
            const dbError = new Error('Russian Count failed');
            MockBuryatModel.countDocuments.mockResolvedValue(5);
            MockRussianModel.countDocuments.mockRejectedValue(dbError);

            await expect(handler.execute({})).rejects.toThrow(DatabaseError);

            expect(MockBuryatModel.countDocuments).toHaveBeenCalledTimes(1);
            expect(MockRussianModel.countDocuments).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: undefined,
                    error: dbError,
                }),
            );
        });

        it('should throw DatabaseError if Buryat findOne chain fails', async () => {
            const dbError = new Error('Buryat FindOne failed');
            mathRandomSpy.mockReturnValue(0.1);
            MockBuryatModel.countDocuments.mockResolvedValue(5);
            MockRussianModel.countDocuments.mockResolvedValue(3);
            mockBuryatQuery.lean.mockRejectedValueOnce(dbError);

            await expect(handler.execute({})).rejects.toThrow(DatabaseError);

            expect(MockBuryatModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockBuryatQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: undefined,
                    error: dbError,
                }),
            );
        });

        it('should throw DatabaseError if Russian findOne chain fails', async () => {
            const dbError = new Error('Russian FindOne failed');
            mathRandomSpy.mockReturnValue(0.9);
            MockBuryatModel.countDocuments.mockResolvedValue(2);
            MockRussianModel.countDocuments.mockResolvedValue(5);
            mockRussianQuery.lean.mockRejectedValueOnce(dbError);

            await expect(handler.execute({})).rejects.toThrow(DatabaseError);

            expect(MockRussianModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockRussianQuery.lean).toHaveBeenCalledTimes(1);
            // ИСПРАВЛЕНО: Ожидаем сообщение оригинальной ошибки
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${dbError.message}`,
                expect.objectContaining({
                    wordId: undefined,
                    error: dbError,
                }),
            );
        });
    });

    // --- General Error Handling Tests ---
    describe('General Error Handling', () => {
        // Этот тест проходил, но проверим логику логгера на всякий случай
        it('should correctly handle and log specific caught errors like ValidationError', async () => {
            const validationError = new ValidationError(
                'Invalid input detected.',
            );
            MockMongoose.isValidObjectId.mockImplementation(() => {
                throw validationError;
            });

            await expect(
                handler.execute({ wordId: 'invalid-id' }),
            ).rejects.toThrow(ValidationError);
            await expect(
                handler.execute({ wordId: 'invalid-id' }),
            ).rejects.toEqual(validationError);

            // В catch блоке для ValidationError ошибка логируется с 2 аргументами
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${validationError.message}`,
                expect.objectContaining({
                    wordId: 'invalid-id',
                    error: validationError,
                }),
            );
            try {
                await handler.execute({ wordId: 'invalid-id' });
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationError);
                expect(e).not.toBeInstanceOf(DatabaseError);
            }
        });

        it('should wrap unexpected errors in a DatabaseError', async () => {
            const unexpectedError = new Error(
                'Something totally unexpected happened!',
            );
            // Мокируем findById чтобы он сразу выбросил ошибку
            MockBuryatModel.findById.mockImplementationOnce(() => {
                throw unexpectedError;
            });
            MockMongoose.isValidObjectId.mockReturnValue(true);

            // --- ИСПРАВЛЕНО: Используем try/catch для явной проверки типа и сообщения ---
            let caughtError: any; // Используем any для простоты доступа к свойствам
            try {
                // Вызываем execute и ожидаем, что он выбросит ошибку
                await handler.execute({ wordId: mockWordIdBuryat });
                // Если мы дошли сюда, значит ошибка не была выброшена - тест должен упасть
                throw new Error(
                    'Expected handler.execute to throw an error, but it did not.',
                );
            } catch (e) {
                // Ловим выброшенную ошибку
                caughtError = e;
            }

            // 1. Проверяем, что ошибка была поймана
            expect(caughtError).toBeDefined();

            // 2. Проверяем ТИП пойманной ошибки (самый надежный способ)
            expect(caughtError).toBeInstanceOf(DatabaseError);

            // 3. Проверяем СООБЩЕНИЕ пойманной ошибки
            expect(caughtError.message).toBe(
                `Failed to get confirmed word: ${unexpectedError.message}`,
            );

            // 4. (Опционально) Проверяем причину (cause), если ваш DatabaseError её устанавливает
            // expect(caughtError.cause).toBe(unexpectedError);

            // --- Проверка логгера остается как есть ---
            // Убеждаемся, что логгер был вызван ПЕРЕД тем, как ошибка была перехвачена и обернута
            expect(MockLogger.error).toHaveBeenCalledWith(
                `Error in GetConfirmedWordHandler: ${unexpectedError.message}`, // Логгируется оригинальное сообщение
                expect.objectContaining({
                    wordId: mockWordIdBuryat,
                    error: unexpectedError, // В лог попадает оригинальная ошибка
                }),
            );
        });
    });
});
