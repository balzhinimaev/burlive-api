// src/services/user/__tests__/AddRatingHandler.spec.ts
import { Model, Types, ClientSession } from 'mongoose'; // Добавлен ClientSession
import { Logger } from 'winston';
import { AddRatingHandler } from '../AddRatingHandler'; // Путь к хендлеру
import {
    UserNotFoundError,
    ValidationError,
    DatabaseError,
    LevelUpdateError,
} from '../../../errors/customErrors'; // Пути к ошибкам
import { AddRatingInput } from '../../interfaces/userRating.interface'; // Путь к интерфейсу
import { TelegramUserDocument } from '../../../models/TelegramUsers';
import { ILevel } from '../../../models/Level';

// --- Моки ---

// Мок сессии - простой объект обычно достаточен для тестов
const mockSession = {
    /* можно добавить моки методов сессии, если они используются */
} as ClientSession;

// Мок модели TelegramUser
// Используем 'unknown as' для строгой типизации, указывая, что мы мокируем только часть
const mockTelegramUserModel = {
    exists: jest.fn(),
    findOneAndUpdate: jest.fn(),
} as unknown as jest.Mocked<Model<TelegramUserDocument>>;

// Мок экземпляра документа (возвращаемого findOneAndUpdate)
// Мок экземпляра документа (возвращаемого findOneAndUpdate)
const mockUserDocument = {
    _id: new Types.ObjectId(),
    id: 12345, // Telegram ID для логов
    rating: 100,
    // Просто определяем объект с нужными полями, БЕЗ внутреннего 'as ILevel'
    level: {
        _id: new Types.ObjectId(),
        name: 'Стартовый',
        requiredRating: 0, // Оставляем только те поля, которые реально используются в тесте или коде
        // Например, .name используется в getLevelName
    }, // <-- УБРАЛИ 'as ILevel' отсюда
    updateLevel: jest.fn().mockResolvedValue(undefined), // Мок метода экземпляра
    // Добавьте другие поля/методы, если они используются в AddRatingHandler или updateLevel
} as unknown as jest.Mocked<TelegramUserDocument>; // Внешний каст остается

// Мок логгера
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
} as unknown as jest.Mocked<Logger>;

describe('AddRatingHandler', () => {
    let handler: AddRatingHandler;
    let userObjectId: Types.ObjectId;
    const amount = 10;

    // --- Моки Query Объектов ---
    // Эти моки будут возвращаться методами exists и findOneAndUpdate
    let mockExistsQuery: ReturnType<typeof createMockExistsQuery>;
    let mockFindOneAndUpdateQuery: ReturnType<
        typeof createMockFindOneAndUpdateQuery
    >;

    // Вспомогательные функции для создания моков Query
    const createMockExistsQuery = (resolvesTo: boolean | Error) => ({
        session: jest.fn().mockReturnThis(),
        exec: jest
            .fn()
            .mockImplementation(() =>
                resolvesTo instanceof Error
                    ? Promise.reject(resolvesTo)
                    : Promise.resolve(resolvesTo),
            ),
        // Добавляем .then для возможности await напрямую (хотя лучше использовать .exec())
        then: jest.fn().mockImplementation((onfulfilled, onrejected) =>
            Promise.resolve().then(() => {
                if (resolvesTo instanceof Error) {
                    return onrejected
                        ? onrejected(resolvesTo)
                        : Promise.reject(resolvesTo);
                }
                return onfulfilled
                    ? onfulfilled(resolvesTo)
                    : Promise.resolve(resolvesTo);
            }),
        ),
    });

    const createMockFindOneAndUpdateQuery = (
        resolvesTo: TelegramUserDocument | null | Error,
    ) => ({
        session: jest.fn().mockReturnThis(), // session в findOneAndUpdate передается через опции, но на всякий случай
        populate: jest.fn().mockReturnThis(),
        exec: jest
            .fn()
            .mockImplementation(() =>
                resolvesTo instanceof Error
                    ? Promise.reject(resolvesTo)
                    : Promise.resolve(resolvesTo),
            ),
        // Добавляем .then
        then: jest.fn().mockImplementation((onfulfilled, onrejected) =>
            Promise.resolve().then(() => {
                if (resolvesTo instanceof Error) {
                    return onrejected
                        ? onrejected(resolvesTo)
                        : Promise.reject(resolvesTo);
                }
                return onfulfilled
                    ? onfulfilled(resolvesTo)
                    : Promise.resolve(resolvesTo);
            }),
        ),
    });

    beforeEach(() => {
        jest.clearAllMocks(); // Очищаем ВСЕ моки перед каждым тестом
        userObjectId = new Types.ObjectId();
        handler = new AddRatingHandler(mockTelegramUserModel, mockLogger);

        // Настраиваем моки для УСПЕШНОГО сценария по умолчанию
        mockExistsQuery = createMockExistsQuery(true); // По умолчанию пользователь существует
        (mockTelegramUserModel.exists as jest.Mock).mockReturnValue(
            mockExistsQuery,
        );

        mockFindOneAndUpdateQuery =
            createMockFindOneAndUpdateQuery(mockUserDocument); // По умолчанию обновляется успешно
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockReturnValue(
            mockFindOneAndUpdateQuery,
        );

        // Сбрасываем и перенастраиваем мок метода экземпляра
        (mockUserDocument.updateLevel as jest.Mock).mockClear();
        (mockUserDocument.updateLevel as jest.Mock).mockResolvedValue(
            undefined,
        );
    });

    // --- Тесты ---

    it('should add rating, update level and return updated user document successfully', async () => {
        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        const result = await handler.execute(input);

        // 1. Проверка exists
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.exists).toHaveBeenCalledWith({
            _id: userObjectId,
        });
        expect(mockExistsQuery.session).toHaveBeenCalledTimes(1); // Проверяем вызов .session() на query
        expect(mockExistsQuery.session).toHaveBeenCalledWith(mockSession); // Проверяем передачу сессии в .session()
        // expect(mockExistsQuery.exec).toHaveBeenCalledTimes(1); // Проверяем, что query был выполнен

        // 2. Проверка findOneAndUpdate
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        // Проверяем, что сессия передана в ОПЦИЯХ findOneAndUpdate
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: userObjectId },
            { $inc: { rating: amount } },
            { new: true, runValidators: true, session: mockSession },
        );
        // Проверяем вызовы методов на query, возвращенном из findOneAndUpdate
        expect(mockFindOneAndUpdateQuery.populate).toHaveBeenCalledTimes(1);
        expect(mockFindOneAndUpdateQuery.populate).toHaveBeenCalledWith(
            'level',
        );
        expect(mockFindOneAndUpdateQuery.exec).toHaveBeenCalledTimes(1); // Проверяем выполнение query

        // 3. Проверка вызова updateLevel на МОКЕ ДОКУМЕНТА
        expect(mockUserDocument.updateLevel).toHaveBeenCalledTimes(1);

        // 4. Проверка результата
        expect(result).toBe(mockUserDocument);

        // 5. Проверка логов
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(
                `Adding ${amount} rating points to user ObjectId ${userObjectId}. Within transaction.`,
            ),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            // Используем утверждение типа (as ILevel) ЗДЕСЬ, чтобы помочь TypeScript
            expect.stringContaining(
                `rating updated to ${mockUserDocument.rating}. Current level: ${(mockUserDocument.level as ILevel)?.name}`,
            ),
            // Альтернативно, если уверены, что level не null/undefined И не ObjectId:
            // expect.stringContaining(`rating updated to ${mockUserDocument.rating}. Current level: ${(mockUserDocument.level as { name: string }).name}`)
        );
        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.stringContaining(
                `Checked/Updated level for user ObjectId ${userObjectId}`,
            ),
        );
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if amount is not a number', async () => {
        const input: AddRatingInput = {
            userObjectId,
            amount: 'invalid' as any, // Неверный тип
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(ValidationError);
        await expect(handler.execute(input)).rejects.toThrow(
            'Количество очков рейтинга должно быть числом.',
        );

        // Убедимся, что до вызовов БД дело не дошло
        expect(mockTelegramUserModel.exists).not.toHaveBeenCalled();
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if userObjectId is invalid', async () => {
        const input: AddRatingInput = {
            userObjectId: 'invalid-id' as any, // Неверный ID
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(ValidationError);
        await expect(handler.execute(input)).rejects.toThrow(
            'Неверный формат ID пользователя (ObjectId).',
        );

        expect(mockTelegramUserModel.exists).not.toHaveBeenCalled();
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
        // Переопределяем мок exists для этого теста
        mockExistsQuery = createMockExistsQuery(false); // Пользователь не найден
        (mockTelegramUserModel.exists as jest.Mock).mockReturnValue(
            mockExistsQuery,
        );

        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(UserNotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Пользователь с ObjectId ${userObjectId} не найден для обновления рейтинга.`,
        );

        // Проверяем, что exists был вызван (дважды из-за двух await expect), а findOneAndUpdate - нет
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockExistsQuery.session).toHaveBeenCalledTimes(2);
        expect(mockExistsQuery.session).toHaveBeenCalledWith(mockSession);
        // expect(mockExistsQuery.exec).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError if findOneAndUpdate returns null', async () => {
        // exists вернет true (настройка по умолчанию в beforeEach),
        // но findOneAndUpdate вернет null
        mockFindOneAndUpdateQuery = createMockFindOneAndUpdateQuery(null);
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockReturnValue(
            mockFindOneAndUpdateQuery,
        );

        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(UserNotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Пользователь с ObjectId ${userObjectId} не найден после попытки обновления рейтинга.`,
        );

        // Проверяем, что оба метода БД были вызваны
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockExistsQuery.session).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(mockFindOneAndUpdateQuery.exec).toHaveBeenCalledTimes(2);
        // updateLevel не должен был вызваться
        expect(mockUserDocument.updateLevel).not.toHaveBeenCalled();
    });

    it('should throw LevelUpdateError if user.updateLevel fails', async () => {
        const levelUpdateError = new LevelUpdateError(
            'Test Level Update Failed',
        );
        // Настраиваем мок updateLevel на экземпляре документа на reject
        (mockUserDocument.updateLevel as jest.Mock).mockRejectedValue(
            levelUpdateError,
        );

        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(LevelUpdateError);
        await expect(handler.execute(input)).rejects.toThrow(
            'Test Level Update Failed',
        );

        // Проверяем, что все шаги до updateLevel были выполнены
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(mockFindOneAndUpdateQuery.exec).toHaveBeenCalledTimes(2);
        // Проверяем, что updateLevel был вызван (дважды) и привел к ошибке
        expect(mockUserDocument.updateLevel).toHaveBeenCalledTimes(2);
    });

    it('should throw DatabaseError for exists errors', async () => {
        const dbError = new Error('Exists connection failed');
        // Переопределяем мок exists, чтобы он возвращал ошибку
        mockExistsQuery = createMockExistsQuery(dbError);
        (mockTelegramUserModel.exists as jest.Mock).mockReturnValue(
            mockExistsQuery,
        );

        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Не удалось обновить рейтинг пользователя: ${dbError.message}`,
        );

        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockExistsQuery.session).toHaveBeenCalledTimes(2);
        // expect(mockExistsQuery.exec).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw DatabaseError for findOneAndUpdate errors', async () => {
        const dbError = new Error('Update connection failed');
        // Переопределяем мок findOneAndUpdate, чтобы он возвращал ошибку
        mockFindOneAndUpdateQuery = createMockFindOneAndUpdateQuery(dbError);
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockReturnValue(
            mockFindOneAndUpdateQuery,
        );

        const input: AddRatingInput = {
            userObjectId,
            amount,
            session: mockSession,
        };

        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Не удалось обновить рейтинг пользователя: ${dbError.message}`,
        );

        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(mockFindOneAndUpdateQuery.exec).toHaveBeenCalledTimes(2);
        expect(mockUserDocument.updateLevel).not.toHaveBeenCalled();
    });

    it('should handle case without session provided', async () => {
        // Тестируем без передачи сессии
        const input: AddRatingInput = { userObjectId, amount }; // Нет session

        await handler.execute(input);

        // Проверяем, что .session() вызывался с null
        expect(mockExistsQuery.session).toHaveBeenCalledTimes(1);
        expect(mockExistsQuery.session).toHaveBeenCalledWith(null);

        // Проверяем, что сессия НЕ передавалась в опциях findOneAndUpdate
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: userObjectId },
            { $inc: { rating: amount } },
            // Опция session должна отсутствовать или быть undefined
            expect.objectContaining({
                new: true,
                runValidators: true,
                session: undefined,
            }),
        );

        // Остальные проверки как в успешном сценарии
        expect(mockFindOneAndUpdateQuery.populate).toHaveBeenCalledWith(
            'level',
        );
        expect(mockFindOneAndUpdateQuery.exec).toHaveBeenCalledTimes(1);
        expect(mockUserDocument.updateLevel).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(`Outside transaction.`), // Проверяем лог
        );
    });
});
