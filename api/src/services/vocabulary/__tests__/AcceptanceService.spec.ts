// src/services/__tests__/AcceptanceService.spec.ts

import mongoose, { Types, ClientSession } from 'mongoose';
import { Logger } from 'winston';
import { RATING_POINTS } from '../../../config/constants';
import {
    ISuggestedWordRussian,
    IAcceptedWordRussian,
    AcceptedWordType,
} from '../../../types/vocabulary.types';
import { IAddRatingHandler } from '../../interfaces/userRating.interface';
import { AcceptanceService } from '../../AcceptanceService';
// import { NotFoundError, DatabaseError, ConflictError } from '../../../errors/customErrors';

// --- Мокируем зависимости ---
let isInTransactionState = false;
const mockSession: jest.Mocked<ClientSession> = {
    startTransaction: jest.fn(() => {
        isInTransactionState = true;
    }),
    commitTransaction: jest.fn().mockImplementation(async () => {
        isInTransactionState = false;
        return Promise.resolve(undefined);
    }),
    abortTransaction: jest.fn().mockImplementation(async () => {
        isInTransactionState = false;
        return Promise.resolve(undefined);
    }),
    endSession: jest.fn().mockResolvedValue(undefined),
    inTransaction: jest.fn(() => isInTransactionState),
} as any;

jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);

const mockQueryExecutor = jest.fn();
const mockQuery = {
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: mockQueryExecutor,
    then: function (onFulfilled: any, onRejected?: any) {
        return this.exec().then(onFulfilled, onRejected);
    },
    catch: function (onRejected: any) {
        return this.exec().catch(onRejected);
    },
    toObject: jest
        .fn()
        .mockImplementation(() => mockQueryExecutor()?.MOCK_RESULT),
};
(mockQuery as any).MOCK_RESULT = null; // Helper for toObject mock

// --- ИСПРАВЛЕНЫ МОКИ findByIdAndDelete ---
const mockSuggestedWordRussian = {
    findById: jest.fn().mockReturnValue(mockQuery),
    findByIdAndDelete: jest.fn(), // Мок возвращает Promise
    modelName: 'SuggestedWordRussianModel',
};
const mockSuggestedWordBuryat = {
    findById: jest.fn().mockReturnValue(mockQuery),
    findByIdAndDelete: jest.fn(), // Мок возвращает Promise
    modelName: 'SuggestedWordBuryatModel',
};
const mockAcceptedWordRussian = {
    findOne: jest.fn().mockReturnValue(mockQuery),
    findById: jest.fn().mockReturnValue(mockQuery),
    create: jest.fn(),
    updateMany: jest.fn().mockReturnValue(mockQuery),
    updateOne: jest.fn().mockReturnValue(mockQuery),
    modelName: 'AcceptedWordRussianModel',
};
const mockAcceptedWordBuryat = {
    findOne: jest.fn().mockReturnValue(mockQuery),
    findById: jest.fn().mockReturnValue(mockQuery),
    create: jest.fn(),
    updateMany: jest.fn().mockReturnValue(mockQuery),
    updateOne: jest.fn().mockReturnValue(mockQuery),
    modelName: 'AcceptedWordBuryatModel',
};
const mockTelegramUserModel = {
    findOne: jest.fn().mockReturnValue(mockQuery),
    modelName: 'TelegramUserModel',
};

// --- СОЗДАЕМ МОК ДЛЯ AddRatingHandler ---
const mockAddRatingHandler: jest.Mocked<IAddRatingHandler> = {
    execute: jest.fn().mockResolvedValue({}), // Мок метода execute, возвращает пустой объект или мок документа, если нужно
};

const mockLoggerMethods = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};
const mockRatingPoints = {
    ...RATING_POINTS,
    MODERATION_ACCEPTED: 5,
    ACCEPTED_CONTRIBUTION: 15,
    SUGGESTION_ACCEPTED: 20,
};

// --- Тестовый набор ---
describe('AcceptanceService', () => {
    let service: AcceptanceService;
    const mockModeratorMongoId = new Types.ObjectId();
    const mockAuthorMongoId = new Types.ObjectId();
    const mockContributorMongoId = new Types.ObjectId();
    const mockSuggestedWordId = new Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
        mockQueryExecutor.mockClear();
        mockQuery.session.mockClear();
        mockQuery.lean.mockClear();
        mockQuery.populate.mockClear();
        isInTransactionState = false;

        // --- ИНЖЕКТИРУЕМ ПРАВИЛЬНЫЙ МОК addRatingHandler ---
        service = new AcceptanceService(
            mockSuggestedWordRussian as any,
            mockSuggestedWordBuryat as any,
            mockAcceptedWordRussian as any,
            mockAcceptedWordBuryat as any,
            mockTelegramUserModel as any,
            mockAddRatingHandler, // <-- Передаем мок обработчика рейтинга
            mockLoggerMethods as unknown as Logger,
            mockRatingPoints,
        );
    });

    // --- Тест: Успешное принятие НОВОГО русского слова ---
    it('should accept a new Russian word suggestion successfully', async () => {
        // --- Arrange ---
        const moderatorTelegramId = 12345;
        const language = 'russian';
        const newAcceptedWordId = new Types.ObjectId();

        const mockModeratorData = { _id: mockModeratorMongoId };

        const mockSuggestedWordData: ISuggestedWordRussian & {
            _id: Types.ObjectId;
        } = {
            _id: mockSuggestedWordId,
            text: 'новое слово',
            normalized_text: 'новое слово',
            author: mockAuthorMongoId,
            contributors: [mockAuthorMongoId, mockContributorMongoId],
            status: 'new',
            themes: [],
            pre_translations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const expectedContributorIdsForCreate = [
            // Ожидаем автора, второго контрибьютора и модератора
            mockAuthorMongoId,
            mockContributorMongoId,
            mockModeratorMongoId,
        ]
            .filter((id) => !!id)
            .sort(); // Убираем undefined и сортируем для сравнения

        const expectedDataForCreate: Omit<
            IAcceptedWordRussian,
            '_id' | 'createdAt' | 'updatedAt'
        > = {
            text: mockSuggestedWordData.text,
            normalized_text: mockSuggestedWordData.normalized_text,
            author: mockAuthorMongoId,
            // Проверяем, что массив содержит правильные ID, порядок не важен
            contributors: expect.arrayContaining(
                expectedContributorIdsForCreate,
            ),
            translations: [],
            translations_u: [],
            themes: [],
        };

        const mockCreatedDoc = {
            _id: newAcceptedWordId,
            ...expectedDataForCreate,
            contributors: expectedContributorIdsForCreate, // Используем ожидаемые ID для консистентности
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const mockFinalPopulatedLeanData: AcceptedWordType = {
            _id: newAcceptedWordId,
            text: mockSuggestedWordData.text,
            normalized_text: mockSuggestedWordData.normalized_text,
            author: {
                _id: mockAuthorMongoId,
                id: 999,
                firstName: 'Author',
                username: 'author_user',
            } as any,
            // Заполняем контрибьюторов на основе expectedContributorIdsForCreate
            contributors: expectedContributorIdsForCreate.map((id) => {
                if (id.equals(mockModeratorMongoId))
                    return {
                        _id: id,
                        id: moderatorTelegramId,
                        firstName: 'Moderator',
                        username: 'mod_user',
                    };
                if (id.equals(mockAuthorMongoId))
                    return {
                        _id: id,
                        id: 999,
                        firstName: 'Author',
                        username: 'author_user',
                    };
                return {
                    _id: id,
                    id: 888,
                    firstName: 'Contributor',
                    username: 'contrib_user',
                };
            }) as any[],
            translations: [],
            translations_u: [],
            themes: [],
            createdAt: expect.any(Date), // Используем expect.any для дат
            // Добавляем язык, так как AcceptedWordType его требует
            // language: 'russian',
            // Добавляем опциональные поля, если они есть в AcceptedWordType
            dialect: undefined, // Пример для бурятского, для русского не нужно
            updatedAt: expect.any(Date),
        };

        // --- Настройка последовательности моков ---
        mockQueryExecutor.mockResolvedValueOnce(mockModeratorData); // 1. findOne(moderator)
        mockQueryExecutor.mockResolvedValueOnce(mockSuggestedWordData); // 2. findById(suggested)
        mockQueryExecutor.mockResolvedValueOnce(null); // 3. findOne(accepted) -> null
        mockAcceptedWordRussian.create.mockResolvedValueOnce([
            mockCreatedDoc,
        ] as any); // 4. create(accepted)
        mockQueryExecutor.mockResolvedValueOnce(mockFinalPopulatedLeanData); // 5. findById(newAccepted) - reload
        // --- ИСПРАВЛЕНО: Мок findByIdAndDelete возвращает Promise ---
        mockSuggestedWordRussian.findByIdAndDelete.mockResolvedValueOnce(
            mockSuggestedWordData,
        ); // 6. findByIdAndDelete(suggested)

        // --- Act ---
        const result = await service.execute({
            suggestedWordId: mockSuggestedWordId, // Можно передать ObjectId
            moderatorTelegramId,
            language,
        });

        // --- Assert ---

        // 1. Проверяем результат
        expect(result).toBeDefined();
        // Используем toEqual для глубокого сравнения объектов
        expect(result).toEqual(mockFinalPopulatedLeanData);

        // 2. Проверяем вызовы методов моделей
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordRussian.findById).toHaveBeenCalledTimes(1);
        expect(mockAcceptedWordRussian.findOne).toHaveBeenCalledTimes(1);
        expect(mockAcceptedWordRussian.create).toHaveBeenCalledTimes(1);
        // Проверяем аргументы create более точно
        expect(mockAcceptedWordRussian.create).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    normalized_text: mockSuggestedWordData.normalized_text,
                    author: mockAuthorMongoId,
                    // Сравнение массивов ObjectId может быть сложным, проверим наличие ID
                    contributors: expect.arrayContaining(
                        expectedContributorIdsForCreate,
                    ),
                }),
            ],
            { session: mockSession },
        );
        expect(mockAcceptedWordRussian.findById).toHaveBeenCalledTimes(1);
        expect(
            mockSuggestedWordRussian.findByIdAndDelete,
        ).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordRussian.findByIdAndDelete).toHaveBeenCalledWith(
            mockSuggestedWordId, // Сравниваем ObjectId напрямую
            { session: mockSession },
        );

        // 3. Проверяем вызовы цепочек Query
        expect(mockQuery.lean).toHaveBeenCalledTimes(3); // findModerator, findSuggested, reloadAccepted
        expect(mockQuery.session).toHaveBeenCalledTimes(4); // findModerator, findSuggested, findAccepted, reloadAccepted
        expect(mockQuery.populate).toHaveBeenCalledTimes(1); // reloadAccepted

        // 4. Проверяем вызовы сессии Mongoose
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
        expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
        expect(mockSession.abortTransaction).not.toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalledTimes(1);
        expect(isInTransactionState).toBe(false); // Проверяем конечное состояние

        // --- ИСПРАВЛЕНО: Проверяем вызовы addRatingHandler.execute ---
        // Ожидаем вызовы для автора, второго контрибьютора и модератора
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(3);

        // Проверяем аргументы вызовов addRatingHandler.execute
        // Очки за ПРИНЯТИЕ ПРЕДЛОЖЕНИЯ для автора и контрибьютора
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: mockAuthorMongoId,
            amount: mockRatingPoints.SUGGESTION_ACCEPTED,
        });
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: mockContributorMongoId,
            amount: mockRatingPoints.SUGGESTION_ACCEPTED,
        });
        // Очки за МОДЕРАЦИЮ для модератора
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: mockModeratorMongoId,
            amount: mockRatingPoints.MODERATION_ACCEPTED,
        });

        // 6. Проверяем логи
        expect(mockLoggerMethods.info).toHaveBeenCalledWith(
            expect.stringContaining(`Starting acceptance`),
        );
        expect(mockLoggerMethods.info).toHaveBeenCalledWith(
            expect.stringContaining(`Creating new accepted Russian word`),
        );
        expect(mockLoggerMethods.info).toHaveBeenCalledWith(
            expect.stringContaining(
                `accepted as NEW Russian word ${newAcceptedWordId}`,
            ),
        );
        // ... другие важные логи info ...
        expect(mockLoggerMethods.info).toHaveBeenCalledWith(
            expect.stringContaining(`Deleting original russian suggestion`),
        );
        expect(mockLoggerMethods.info).toHaveBeenCalledWith(
            expect.stringContaining(`Successfully accepted suggestion`),
        );
        expect(mockLoggerMethods.error).not.toHaveBeenCalled();
        expect(mockLoggerMethods.warn).not.toHaveBeenCalledWith(
            expect.stringContaining('Transaction for accepting'),
        ); // Убираем проверку на warn в finally, т.к. он там не должен вызываться
    });

    // TODO: Добавить тесты для других сценариев:
    // - Успешное принятие НОВОГО бурятского слова
    // - Успешное СЛИЯНИЕ с существующим русским словом (contributors НЕ меняются)
    // - Успешное СЛИЯНИЕ с существующим русским словом (contributors МЕНЯЮТСЯ)
    // - Успешное СЛИЯНИЕ с существующим бурятским словом
    // - Принятие слова с pre_translations (проверить вызовы updateMany/updateOne для связывания)
    // - Ошибка: модератор не найден (проверить warn и отсутствие moderatorId)
    // - Ошибка: предложенное слово не найдено (NotFound)
    // - Ошибка: слово уже принято/отклонено (ConflictError?)
    // - Ошибка: сбой БД при create/update/delete (DatabaseError, abortTransaction)
    // - Ошибка: сбой при обновлении рейтинга (проверить error лог, но транзакция должна коммититься)
});
