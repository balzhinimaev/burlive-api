// src/services/user/__tests__/AddRatingHandler.spec.ts
import { Model, Types } from 'mongoose';
import { Logger } from 'winston';
import { AddRatingHandler } from '../AddRatingHandler'; // Путь к хендлеру
import {
    UserNotFoundError,
    ValidationError,
    DatabaseError,
    LevelUpdateError,
} from '../../../errors/customErrors'; // Пути к ошибкам
import { AddRatingInput } from '../../interfaces/userRating.interface'; // Путь к интерфейсу
import { ILevel } from '../../../models/Level';
import { TelegramUserDocument } from '../../../models/TelegramUsers';

// --- Моки ---
// Мок модели TelegramUser
const mockTelegramUserModel: jest.Mocked<Model<TelegramUserDocument>> = {
    exists: jest.fn(),
    findOneAndUpdate: jest.fn(),
} as any; // Используем 'as any', так как не все методы модели нужны

// Мок экземпляра документа (возвращаемого findOneAndUpdate)
// Не забываем добавить мок метода updateLevel!
const mockUserDocument: jest.Mocked<TelegramUserDocument> = {
    _id: new Types.ObjectId(),
    id: 12345, // Telegram ID для логов
    rating: 100,
    level: { _id: new Types.ObjectId(), name: 'Стартовый' } as ILevel, // Пример запопулированного уровня
    updateLevel: jest.fn().mockResolvedValue(undefined), // Мок метода экземпляра
    // ... другие необходимые поля ...
} as any;

// Мок логгера
const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
} as any;

// --- Query Mock (упрощенный, так как findOneAndUpdate мокируется напрямую) ---
// Нужен только для populate().exec() после findOneAndUpdate
const mockPopulateExec = jest.fn();
const mockPopulateQuery = {
    populate: jest.fn().mockReturnThis(),
    exec: mockPopulateExec,
};

describe('AddRatingHandler', () => {
    let handler: AddRatingHandler;
    let userObjectId: Types.ObjectId;
    const amount = 10;

    beforeEach(() => {
        jest.clearAllMocks();
        userObjectId = new Types.ObjectId(); // Генерируем новый ID для каждого теста
        handler = new AddRatingHandler(mockTelegramUserModel, mockLogger);

        // Сбрасываем и настраиваем мок findOneAndUpdate для успешного случая
        // findOneAndUpdate возвращает Query, который затем вызывает populate и exec
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockReturnValue(
            mockPopulateQuery,
        );
        // Мок populate().exec() возвращает мок документа
        mockPopulateExec.mockResolvedValue(mockUserDocument);
        // Мок exists возвращает true
        (mockTelegramUserModel.exists as jest.Mock).mockResolvedValue(true);
        // Сбрасываем мок updateLevel у документа
        mockUserDocument.updateLevel.mockClear();
        mockUserDocument.updateLevel.mockResolvedValue(undefined); // Перенастраиваем на resolve
    });

    it('should add rating, update level and return updated user document successfully', async () => {
        const input: AddRatingInput = { userObjectId, amount };
        // const initialRating = mockUserDocument.rating; // Сохраняем начальный рейтинг для проверки

        // ACT
        const result = await handler.execute(input);

        // ASSERT
        // 1. Проверка exists
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.exists).toHaveBeenCalledWith({
            _id: userObjectId,
        });

        // 2. Проверка findOneAndUpdate
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: userObjectId },
            { $inc: { rating: amount } },
            { new: true, runValidators: true },
        );

        // 3. Проверка populate().exec()
        expect(mockPopulateQuery.populate).toHaveBeenCalledWith('level');
        expect(mockPopulateExec).toHaveBeenCalledTimes(1);

        // 4. Проверка вызова updateLevel на МОКЕ ДОКУМЕНТА
        expect(mockUserDocument.updateLevel).toHaveBeenCalledTimes(1);

        // 5. Проверка результата
        expect(result).toBe(mockUserDocument);
        // Можно добавить проверку на изменение рейтинга в моке документа, если нужно
        // (хотя findOneAndUpdate возвращает уже "обновленный" мок)
        // expect(mockUserDocument.rating).toBe(initialRating + amount); // Это может не сработать, т.к. мок статичен

        // 6. Проверка логов

        // --- Вспомогательная проверка для уровня в логе ---
        const levelNameForLog = (
            level: Types.ObjectId | ILevel | null | undefined,
        ): string => {
            if (
                level &&
                typeof level === 'object' &&
                !(level instanceof Types.ObjectId) &&
                'name' in level
            ) {
                return String(level.name);
            }
            return 'N/A'; // Или другое значение по умолчанию
        };

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(
                `Adding ${amount} rating points to user ObjectId ${userObjectId}`,
            ),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            // --- ИСПОЛЬЗУЕМ inline проверку ---
            expect.stringContaining(
                `rating updated to ${mockUserDocument.rating}. Current level: ${levelNameForLog(mockUserDocument.level)}`,
            ), // <-- ИЗМЕНЕНО
        );
        // Аналогично для debug лога, если там есть имя уровня
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
            amount: 'invalid' as any,
        };

        await expect(handler.execute(input)).rejects.toThrow(ValidationError);
        await expect(handler.execute(input)).rejects.toThrow(
            'Количество очков рейтинга должно быть числом.',
        );
        expect(mockTelegramUserModel.exists).not.toHaveBeenCalled();
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if userObjectId is invalid', async () => {
        const input: AddRatingInput = {
            userObjectId: 'invalid-id' as any,
            amount,
        };

        await expect(handler.execute(input)).rejects.toThrow(ValidationError);
        await expect(handler.execute(input)).rejects.toThrow(
            'Неверный формат ID пользователя (ObjectId).',
        );
        expect(mockTelegramUserModel.exists).not.toHaveBeenCalled();
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError if user does not exist', async () => {
        (mockTelegramUserModel.exists as jest.Mock).mockResolvedValue(false); // Мокируем exists на false
        const input: AddRatingInput = { userObjectId, amount };

        await expect(handler.execute(input)).rejects.toThrow(UserNotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Пользователь с ObjectId ${userObjectId} не найден`,
        );
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2); // Вызывается дважды из-за rejects.toThrow
        expect(mockTelegramUserModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw UserNotFoundError if findOneAndUpdate returns null', async () => {
        // exists возвращает true, но findOneAndUpdate возвращает null
        mockPopulateExec.mockResolvedValue(null);
        const input: AddRatingInput = { userObjectId, amount };

        await expect(handler.execute(input)).rejects.toThrow(UserNotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Пользователь с ObjectId ${userObjectId} не найден после попытки`,
        );

        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(mockUserDocument.updateLevel).not.toHaveBeenCalled(); // updateLevel не должен вызываться
    });

    it('should throw LevelUpdateError if user.updateLevel fails', async () => {
        const levelUpdateError = new LevelUpdateError(
            'Failed to find next level',
        );
        // Mock rejection ONCE
        mockUserDocument.updateLevel.mockRejectedValueOnce(levelUpdateError);
        const input: AddRatingInput = { userObjectId, amount };

        // --- Call execute ONCE within a single expect ---
        await expect(handler.execute(input)).rejects.toThrow(LevelUpdateError);
        // Optional: If you also want to check the exact message (less common for Error class checks)
        // await expect(handler.execute(input)).rejects.toThrow('Failed to find next level');
        // Note: Using both might require calling execute twice again, stick to one.
        // Checking the class is usually sufficient.

        // Check that the underlying methods were still called before the rejection
        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(1); // Only called once now
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1); // Only called once now
        // updateLevel was called, but caused the rejection
        expect(mockUserDocument.updateLevel).toHaveBeenCalledTimes(1);
    });
    
    it('should throw DatabaseError for other findOneAndUpdate errors', async () => {
        const dbError = new Error('Connection failed');
        mockPopulateExec.mockRejectedValue(dbError); // Мокируем ошибку БД при exec
        const input: AddRatingInput = { userObjectId, amount };

        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toThrow(
            `Не удалось обновить рейтинг пользователя: ${dbError.message}`,
        );

        expect(mockTelegramUserModel.exists).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
        expect(mockUserDocument.updateLevel).not.toHaveBeenCalled();
    });
});
