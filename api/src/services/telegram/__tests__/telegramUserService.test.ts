import { Model, Types } from 'mongoose';
import { Logger } from 'winston';
import {
    TelegramUserService,
    RegisterUserDTO,
    UpdateUserDTO,
} from '../telegramUserService';
import { TelegramUserDocument } from '../../../models/TelegramUsers';
import { ILevel } from '../../../models/Level';
import {
    UserExistsError,
    ConfigurationError,
    ValidationError,
    UserNotFoundError,
    DatabaseError,
} from '../../../errors/customErrors';

// --- Мокирование Зависимостей ---

const createMockLogger = (): jest.Mocked<Logger> =>
    ({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    }) as unknown as jest.Mocked<Logger>;

// Типизация моков моделей
// --- ИСПРАВЛЕНО: Типизация мока модели ---
// Модель - это КОНСТРУКТОР + статические методы
type MockTelegramUserModel = jest.Mock<
    jest.Mocked<TelegramUserDocument>, // Return type of constructor
    [data?: any] // Arguments of constructor
> & {
    // Статические методы, которые мы ИСПОЛЬЗУЕМ и мокаем в тестах
    findOne: jest.Mock;
    updateOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    countDocuments: jest.Mock;
    find: jest.Mock;
    // Добавьте сюда ЛЮБЫЕ другие СТАТИЧЕСКИЕ методы Model<TelegramUserDocument>,
    // которые вызываются внутри TelegramUserService, если они есть.
};

type MockLevelModel = jest.Mocked<Pick<Model<ILevel>, 'findOne'>>;

// --- Настройка Тестового Набора ---
describe('TelegramUserService', () => {
    let service: TelegramUserService;
    let mockLogger: jest.Mocked<Logger>;
    let mockTelegramUserModel: MockTelegramUserModel;
    let mockLevelModel: MockLevelModel;

    let mockSavedUser: jest.Mocked<TelegramUserDocument>;
    let mockReferrer: jest.Mocked<TelegramUserDocument>;
    let initialLevelData: ILevel;

    // Общие константы
    const testDate = new Date();
    const objectId = new Types.ObjectId();
    const levelId = new Types.ObjectId();
    const userId = 12345;
    const referrerId = 54321;
    const referrerObjectId = new Types.ObjectId(); // Отдельный ID для реферера

    // --- ИСПРАВЛЕНО: Функция для создания мока экземпляра документа ---
    const createMockUserDocument = (
        data: Partial<TelegramUserDocument> = {},
    ): jest.Mocked<TelegramUserDocument> => {
        const base = {
            _id: new Types.ObjectId(),
            id: 0, // Будет перезаписано в data если передано
            username: 'default_username',
            first_name: 'Default',
            email: null,
            rating: 0,
            theme: 'light',
            photo_url: '',
            role: 'user',
            subscription: {
                type: null,
                isActive: false,
                endDate: null,
                startDate: null,
                paymentId: null,
            },
            phone: '',
            level: levelId, // По умолчанию
            referrals: [],
            referred_by: null,
            referral_code: `CODE_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            blocked: false,
            currentQuestion: { lessonId: null, questionPosition: 0 },
            vocabular: { selected_language_for_translate: 'russian' },
            createdAt: testDate,
            updatedAt: testDate,
            ...data, // Перезаписываем дефолтные значения переданными
        };

        const mockDoc = {
            ...base,
            save: jest.fn(),
            updateLevel: jest.fn(),
            // Добавляем метод toObject для совместимости, если нужен
            toObject: jest.fn().mockReturnValue(base),
        } as unknown as jest.Mocked<TelegramUserDocument>;

        // save по умолчанию возвращает сам мок документа
        mockDoc.save.mockResolvedValue(mockDoc);
        // updateLevel по умолчанию ничего не возвращает (успех)
        mockDoc.updateLevel.mockResolvedValue(undefined);

        return mockDoc;
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockLogger = createMockLogger();

        // --- ИСПРАВЛЕНО: Создание мока КОНСТРУКТОРА и статических методов ---
        const mockConstructor = jest.fn((data: any) =>
            createMockUserDocument(data),
        );

        // 2. Создаем объект со статическими методами
        const staticMethods = {
            findOne: jest.fn(),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            countDocuments: jest.fn(),
            find: jest.fn(),
            // Добавьте сюда моки для других статических методов, если они нужны
        };

        // 3. Объединяем конструктор и статические методы
        mockTelegramUserModel = Object.assign(mockConstructor, staticMethods);
        // Прямое присваивание без 'as' может не сработать из-за сложной структуры,
        // но `as MockTelegramUserModel` теперь должно быть корректным, т.к. тип соответствует структуре.
        // Если все еще есть ошибка, можно попробовать `as unknown as MockTelegramUserModel`, но это менее предпочтительно.

        // Мок для LevelModel (теперь используем Pick)
        mockLevelModel = {
            findOne: jest.fn(),
        } as MockLevelModel;

        // Данные для моков
        initialLevelData = {
            _id: levelId,
            name: 'Новичок',
            minRating: 0,
        } as ILevel; // Используем 'as' т.к. это просто данные, не полный мок документа

        mockSavedUser = createMockUserDocument({
            _id: objectId,
            id: userId,
            username: 'testuser',
            first_name: 'Test',
            rating: 1,
            referral_code: 'ABCDEF',
        });

        mockReferrer = createMockUserDocument({
            _id: referrerObjectId,
            id: referrerId,
            username: 'referrer',
            referral_code: 'REF123',
            rating: 100,
        });

        // Создание сервиса
        service = new TelegramUserService(
            mockTelegramUserModel as unknown as Model<TelegramUserDocument>, // Используем 'unknown' здесь при передаче, т.к. наш мок не полный Model
            mockLevelModel as unknown as Model<ILevel>, // Используем 'unknown' здесь при передаче
            mockLogger,
        );

        // Настройка моков по умолчанию
        (mockTelegramUserModel.countDocuments as jest.Mock).mockResolvedValue(
            0,
        );
        (mockTelegramUserModel.updateOne as jest.Mock).mockResolvedValue({
            acknowledged: true,
            matchedCount: 0,
            modifiedCount: 0,
            upsertedCount: 0,
            upsertedId: null,
        });
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
            null,
        );
    });

    // --- Тесты для registerUser ---
    describe('registerUser', () => {
        const userData: RegisterUserDTO = {
            id: userId,
            username: 'testuser',
            first_name: 'Test',
            botusername: "burlive"
        };

        it('should register a new user successfully without referral code', async () => {
            // Arrange:
            // 1. findOne (user check) - НЕ нужен .exec, вернет null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel.findOne().sort() - НУЖЕН .exec, вернет уровень
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. new TelegramUser(...) - Мок конструктора вернет mockUserInstance
            // 4. mockUserInstance.save() - вернет сам mockUserInstance (настроено в хелпере)
            const mockUserInstance = createMockUserDocument({
                ...userData,
                level: initialLevelData._id,
            });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            ); // Настраиваем возврат конструктора

            // Act
            const result = await service.registerUser(userData);

            // Assert
            expect(result).toBe(mockUserInstance); // Убедимся, что вернулся наш мок
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userData.id,
            });
            expect(mockLevelModel.findOne).toHaveBeenCalled();
            expect(mockLevelQuery.sort).toHaveBeenCalledWith({ minRating: 1 });
            expect(mockLevelQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel).toHaveBeenCalledTimes(1); // Проверка вызова конструктора
            expect(mockTelegramUserModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userData.id,
                    level: initialLevelData._id, // Проверяем, что уровень установлен
                    email: null, // Проверяем установку email в null по умолчанию
                }),
            );
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Attempting to register user with ID: ${userData.id}`,
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining(
                    `User ${userData.id} successfully registered with _id ${mockUserInstance._id}`,
                ),
            );
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled(); // Обновление реферера не вызывалось
        });

        it('should throw UserExistsError if user already exists', async () => {
            // Arrange: findOne (без exec) вернет существующего пользователя
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                mockSavedUser,
            );

            // Act & Assert
            const action = service.registerUser(userData);

            await expect(action).rejects.toThrow(UserExistsError);
            await expect(action).rejects.toThrow(
                `Пользователь с ID ${userData.id} уже зарегистрирован.`,
            );
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userData.id,
            });
            expect(mockLevelModel.findOne).not.toHaveBeenCalled();
            expect(mockTelegramUserModel).not.toHaveBeenCalled(); // Конструктор не вызывался
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `User registration failed: User with ID ${userData.id} already exists.`,
            );
        });

        it('should throw ConfigurationError if initial level is not found', async () => {
            // Arrange:
            // 1. findOne (user check) - null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel.findOne().sort().exec() - null
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(null),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );

            // Act & Assert
            const action = service.registerUser(userData);

            await expect(action).rejects.toThrow(ConfigurationError);
            await expect(action).rejects.toThrow(
                'Начальный уровень не настроен в системе.',
            );
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userData.id,
            });
            expect(mockLevelModel.findOne).toHaveBeenCalled();
            expect(mockLevelQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel).not.toHaveBeenCalled(); // Конструктор не вызывался
            expect(mockLogger.error).toHaveBeenCalledWith(
                'FATAL: Initial user level not found in database.',
            );
        });

        it('should throw ValidationError if user ID is not provided', async () => {
            // Arrange
            const invalidUserData = { username: 'nouserid' } as any;

            // Act & Assert
            await expect(service.registerUser(invalidUserData)).rejects.toThrow(
                ValidationError,
            );
            await expect(service.registerUser(invalidUserData)).rejects.toThrow(
                'Telegram ID (id) is required for registration.',
            );
            expect(mockTelegramUserModel.findOne).not.toHaveBeenCalled();
        });

        it('should register user WITH valid referral code and update referrer', async () => {
            // Arrange
            const referralCode = 'REF123';
            // 1. findOne (user) -> null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel...exec() -> levelData
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. findOne (referrer) -> mockReferrer
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                mockReferrer,
            );
            // 4. new TelegramUser(...) -> mockUserInstance
            const mockUserInstance = createMockUserDocument({
                ...userData,
                level: initialLevelData._id,
                referred_by: mockReferrer._id, // Важно: устанавливается в коде
            });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );
            // 5. mockUserInstance.save() -> mockUserInstance (уже настроено)
            // 6. updateOne (referrer) -> success
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockResolvedValueOnce({ matchedCount: 1, modifiedCount: 1 });

            // Act
            const result = await service.registerUser(userData, referralCode);

            // Assert
            expect(result).toBe(mockUserInstance);
            expect(result.referred_by).toBe(mockReferrer._id);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userData.id,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: referralCode,
            });
            expect(mockLevelQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel).toHaveBeenCalledTimes(1); // Конструктор
            expect(mockTelegramUserModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userData.id,
                    level: initialLevelData._id,
                }),
            ); // Проверяем данные конструктора
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledWith(
                { _id: mockReferrer._id }, // Ищем по _id реферера
                { $addToSet: { referrals: mockUserInstance._id } }, // Добавляем _id нового юзера
            );
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Processing referral code ${referralCode} for user ${userData.id}`,
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                `User ${userData.id} will be marked as referred by ${mockReferrer.id}`,
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Referrer ${mockReferrer._id} updated with new referral ${mockUserInstance._id}`,
            );
        });

        it('should register user successfully even if referrer update fails', async () => {
            // Arrange
            const referralCode = 'REF123';
            const updateError = new Error('DB fail on updateOne');
            // 1. findOne (user) -> null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel...exec() -> levelData
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. findOne (referrer) -> mockReferrer
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                mockReferrer,
            );
            // 4. new TelegramUser(...) -> mockUserInstance
            const mockUserInstance = createMockUserDocument({
                ...userData,
                level: initialLevelData._id,
                referred_by: mockReferrer._id,
            });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );
            // 5. mockUserInstance.save() -> mockUserInstance
            // 6. updateOne (referrer) -> fails
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockRejectedValueOnce(updateError);

            // Act
            const result = await service.registerUser(userData, referralCode);

            // Assert
            expect(result).toBe(mockUserInstance); // Пользователь все равно создан и сохранен
            expect(result.referred_by).toBe(mockReferrer._id); // Ссылка на реферера установлена
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(1); // Попытка обновления была
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Failed to update referrer ${mockReferrer._id} for new user ${mockUserInstance._id}: ${updateError.message}`,
                { error: updateError }, // --- ИСПРАВЛЕНО: Проверяем структуру объекта ошибки ---
            );
            // Важно: Ошибка обновления реферера не должна прерывать регистрацию основного пользователя
            // и не должна приводить к выбросу DatabaseError из основного catch
            expect(mockLogger.error).not.toHaveBeenCalledWith(
                expect.stringContaining('Error during registration process'),
                expect.anything(),
            );
        });

        it('should handle self-referral attempt gracefully', async () => {
            // --- Arrange ---
            const selfReferralCode = 'OWN123';
            const userData: RegisterUserDTO = {
                // Убедимся, что userData определен
                id: userId, // Используем userId из setup
                username: 'testuser',
                first_name: 'Test',
            };

            // Создаем реферера с тем же ID, что и у регистрируемого пользователя
            const selfReferrer = createMockUserDocument({
                _id: new Types.ObjectId(), // Уникальный ObjectId для мока реферера
                id: userData.id, // <-- Тот же Telegram ID
                referral_code: selfReferralCode,
            });

            // 1. Мок для поиска пользователя (должен вернуть null - новый пользователь)
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );

            // 2. Мок для поиска начального уровня
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData), // initialLevelData из setup
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );

            // 3. Мок для поиска реферера (должен вернуть selfReferrer)
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                selfReferrer,
            );

            // 4. Мок для создания экземпляра НОВОГО пользователя (конструктор)
            //    Важно: referred_by НЕ будет установлен сервисом в этом случае
            const mockUserInstance = createMockUserDocument({
                ...userData, // Данные нового пользователя
                level: initialLevelData._id, // ID начального уровня
                referred_by: null, // Ожидаемое значение в СОЗДАННОМ документе
                // save уже замокан внутри createMockUserDocument
            });
            // Настраиваем, что ВЫЗОВ конструктора mockTelegramUserModel вернет наш mockUserInstance
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );

            // --- Act ---
            // Вызываем метод регистрации с кодом само-реферала
            const result = await service.registerUser(
                userData,
                selfReferralCode,
            );

            // --- Assert ---
            // 1. Проверяем, что сервис вернул наш созданный мок пользователя
            expect(result).toBe(mockUserInstance);

            // 2. Проверяем, что в ВОЗВРАЩЕННОМ (и "сохраненном") документе поле referred_by равно null
            expect(result.referred_by).toBeNull();

            // 3. Проверяем вызовы поиска в БД:
            //    - Первый раз искали пользователя по ID (вернул null)
            //    - Второй раз искали реферера по коду (вернул selfReferrer)
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userData.id,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: selfReferralCode,
            });

            // 4. Проверяем вызов поиска уровня
            expect(mockLevelModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockLevelQuery.sort).toHaveBeenCalledWith({ minRating: 1 });
            expect(mockLevelQuery.exec).toHaveBeenCalledTimes(1);

            // 5. Проверяем ВЫЗОВ КОНСТРУКТОРА пользователя
            expect(mockTelegramUserModel).toHaveBeenCalledTimes(1); // Убедимся, что конструктор вызван один раз
            // Проверяем АРГУМЕНТЫ, переданные в конструктор:
            // Должны быть основные данные, НО БЕЗ ключа 'referred_by'
            expect(mockTelegramUserModel).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: userData.id,
                    username: userData.username,
                    first_name: userData.first_name,
                    level: initialLevelData._id, // Уровень должен передаваться
                    // НЕ проверяем здесь 'referred_by'
                }),
            );
            // Дополнительно убеждаемся, что ключа 'referred_by' точно НЕ БЫЛО в аргументе конструктора
            expect(mockTelegramUserModel).toHaveBeenCalledWith(
                expect.not.objectContaining({
                    referred_by: expect.anything(),
                }),
            );

            // 6. Проверяем, что метод save был вызван на экземпляре пользователя
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);

            // 7. Проверяем, что метод обновления реферера НЕ вызывался
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();

            // 8. Проверяем, что было записано предупреждение в лог
            expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Убедимся, что вызван один раз
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `User ${userData.id} tried to use their own referral code.`,
            );
        });

        it('should handle invalid referral code gracefully', async () => {
            // Arrange
            const invalidReferralCode = 'INVALID';
            // 1. findOne (user) -> null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel...exec() -> levelData
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. findOne (referrer) -> null (не найден)
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 4. new TelegramUser(...) -> mockUserInstance (referred_by должен быть null)
            const mockUserInstance = createMockUserDocument({
                ...userData,
                level: initialLevelData._id,
                referred_by: null, // <-- Ожидаем null
            });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );
            // 5. mockUserInstance.save() -> mockUserInstance

            // Act
            const result = await service.registerUser(
                userData,
                invalidReferralCode,
            );

            // Assert
            expect(result).toBe(mockUserInstance);
            expect(result.referred_by).toBeNull(); // Ссылка не установилась
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2); // user + referrer
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: invalidReferralCode,
            });
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled(); // Обновление реферера не вызывалось
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Referral code ${invalidReferralCode} not found.`,
            );
        });

        // Внутри describe('registerUser', ...)

        it('should throw custom ValidationError on Mongoose save validation error', async () => {
            // Arrange
            const userData: RegisterUserDTO = {
                // Убедимся, что userData определен
                id: userId, // Используем userId из setup
                username: 'testuser',
                first_name: 'Test',
            };

            // 1. findOne (user check) -> null (пользователя нет)
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );

            // 2. levelModel.findOne().sort().exec() -> levelData (находит начальный уровень)
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData), // initialLevelData из setup
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );

            // 3. new TelegramUser(...) -> mockUserInstance (вызывается конструктор)
            const mockUserInstance = createMockUserDocument({
                ...userData,
                level: initialLevelData._id,
            });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            ); // Настраиваем возврат конструктора

            // --- ИСПРАВЛЕНО: Имитация ошибки Mongoose через простой объект ---
            // 4. mockUserInstance.save() -> выбрасывает имитацию ошибки валидации
            const validationError = {
                // <-- Используем объектный литерал
                name: 'ValidationError', // Имя, которое проверяет сервис
                message: 'Validation failed', // Сообщение исходной "ошибки"
            };
            // Настраиваем мок метода save, чтобы он отклонил Promise с нашим объектом
            mockUserInstance.save.mockRejectedValueOnce(validationError);
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

            // Готовим ожидаемое сообщение кастомной ошибки, которую должен выбросить сервис
            const expectedCustomErrorMessage = `Ошибка данных пользователя: ${validationError.message}`;

            // Act: Вызываем метод сервиса и сохраняем Promise
            const action = service.registerUser(userData);

            // Assert
            // 1. Проверяем, что Promise отклоняется с кастомной ошибкой ValidationError
            await expect(action).rejects.toBeInstanceOf(ValidationError); // Проверяем КЛАСС кастомной ошибки
            await expect(action).rejects.toThrow(expectedCustomErrorMessage); // Проверяем СООБЩЕНИЕ кастомной ошибки

            // 2. Проверяем, что были вызваны все ожидаемые моки до ошибки
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1); // Поиск пользователя был
            expect(mockLevelModel.findOne).toHaveBeenCalledTimes(1); // Поиск уровня был
            expect(mockTelegramUserModel).toHaveBeenCalledTimes(1); // Конструктор был вызван
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1); // Попытка сохранения была

            // 3. Проверяем, что логгер ошибки был вызван с правильными параметрами
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Сообщение об ошибке в catch блоке сервиса
                `Error during registration process for ${userData.id}: ${validationError.message}`,
                // В лог передается ИСХОДНЫЙ объект-имитация ошибки
                { error: validationError },
            );

            // 4. Убеждаемся, что обновление реферера не вызывалось
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();
        });

        it('should throw custom ValidationError on Mongoose save duplicate key error (E11000)', async () => {
            // Arrange
            // 1. findOne (user) -> null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel...exec() -> levelData
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. new TelegramUser(...) -> mockUserInstance
            const mockUserInstance = createMockUserDocument({ ...userData });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );
            // 4. mockUserInstance.save() -> throws MongoServerError E11000
            const duplicateError = new Error(
                'E11000 duplicate key error',
            ) as any;
            duplicateError.name = 'MongoServerError'; // Или просто 'MongoError' в старых версиях
            duplicateError.code = 11000;
            mockUserInstance.save.mockRejectedValueOnce(duplicateError);

            const action = service.registerUser(userData);

            // Act & Assert
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                `Ошибка данных пользователя: ${duplicateError.message}`,
            );
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error during registration process for ${userData.id}: ${duplicateError.message}`,
                { error: duplicateError }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });

        it('should throw DatabaseError on generic save error', async () => {
            // Arrange
            // 1. findOne (user) -> null
            (mockTelegramUserModel.findOne as jest.Mock).mockResolvedValueOnce(
                null,
            );
            // 2. levelModel...exec() -> levelData
            const mockLevelQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(initialLevelData),
            };
            (mockLevelModel.findOne as jest.Mock).mockReturnValueOnce(
                mockLevelQuery,
            );
            // 3. new TelegramUser(...) -> mockUserInstance
            const mockUserInstance = createMockUserDocument({ ...userData });
            (mockTelegramUserModel as jest.Mock).mockReturnValueOnce(
                mockUserInstance,
            );
            // 4. mockUserInstance.save() -> throws generic Error
            const genericError = new Error('Generic DB Error');
            mockUserInstance.save.mockRejectedValueOnce(genericError);

            const action = service.registerUser(userData);

            // Act & Assert
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка регистрации пользователя: ${genericError.message}`,
            );
            expect(mockUserInstance.save).toHaveBeenCalledTimes(1); // Попытка была
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error during registration process for ${userData.id}: ${genericError.message}`,
                { error: genericError }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });
    });

    // --- Тесты для findUserById ---
    describe('findUserById', () => {
        const defaultFields =
            '_id id username email createdAt first_name rating theme photo_url role subscription phone level';

        it('should return user if found with default fields and no populate', async () => {
            // Arrange: findOne().select().exec() вернет пользователя
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(), // populate будет в цепочке, но не вызван в этом тесте
                exec: jest.fn().mockResolvedValueOnce(mockSavedUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValue(
                mockQuery,
            );

            // Act
            const result = await service.findUserById(userId);

            // Assert
            expect(result).toEqual(mockSavedUser);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            });
            expect(mockQuery.select).toHaveBeenCalledWith(defaultFields); // Проверяем поля по умолчанию
            expect(mockQuery.populate).not.toHaveBeenCalled(); // populate не должен вызываться
            expect(mockQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                `Finding user by ID: ${userId}`,
            );
        });

        it('should return user if found with specific fields and populate', async () => {
            // Arrange
            const specificFields = 'id username level';
            const mockPopulatedUser = {
                ...mockSavedUser,
                level: initialLevelData,
            }; // Пример популяции
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(mockPopulatedUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValue(
                mockQuery,
            );

            // Act
            const result = await service.findUserById(
                userId,
                specificFields,
                true,
            );

            // Assert
            expect(result).toEqual(mockPopulatedUser);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            });
            expect(mockQuery.select).toHaveBeenCalledWith(specificFields);
            expect(mockQuery.populate).toHaveBeenCalledWith('level'); // populate должен вызываться
            expect(mockQuery.exec).toHaveBeenCalledTimes(1);
        });

        it('should return null if user not found', async () => {
            // Arrange: findOne().select().exec() вернет null
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(null),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValue(
                mockQuery,
            );

            // Act
            const result = await service.findUserById(999);

            // Assert
            expect(result).toBeNull();
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: 999,
            });
            expect(mockQuery.select).toHaveBeenCalledWith(defaultFields);
            expect(mockQuery.exec).toHaveBeenCalledTimes(1);
        });

        it('should throw DatabaseError when query execution fails', async () => {
            // Arrange
            const dbError = new Error('Exec failed');
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockRejectedValueOnce(dbError), // exec падает
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValue(
                mockQuery,
            );

            // Act & Assert

            const action = service.findUserById(userId);

            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка поиска пользователя: ${dbError.message}`,
            );

            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            });
            expect(mockQuery.select).toHaveBeenCalledWith(defaultFields);
            expect(mockQuery.populate).not.toHaveBeenCalled();
            expect(mockQuery.exec).toHaveBeenCalledTimes(1); // Вызывался один раз
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error finding user by ID ${userId}: ${dbError.message}`,
                { error: dbError }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });

        it('should throw DatabaseError when query execution fails (even with populate)', async () => {
            // Arrange
            const dbError = new Error('Exec failed during populate attempt');
            const fieldsToSelect = 'id username';
            const mockQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                // Устанавливаем отклонение промиса один раз для exec
                exec: jest.fn().mockRejectedValueOnce(dbError),
            };
            // findOne вернет mockQuery один раз
            (mockTelegramUserModel.findOne as jest.Mock)
                .mockClear() // Опционально
                .mockReturnValueOnce(mockQuery); // Важно Once, если findOne вызывается еще где-то

            const expectedErrorMessage = `Ошибка поиска пользователя: ${dbError.message}`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.findUserById(userId, fieldsToSelect, true);

            // Assert: Проверяем отклонение ОДНОГО промиса
            await expect(action).rejects.toBeInstanceOf(DatabaseError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Проверяем вызовы моков
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1); // findOne вызван один раз
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            });
            expect(mockQuery.select).toHaveBeenCalledTimes(1); // select вызван один раз
            expect(mockQuery.select).toHaveBeenCalledWith(fieldsToSelect);
            expect(mockQuery.populate).toHaveBeenCalledTimes(1); // populate вызван один раз
            expect(mockQuery.populate).toHaveBeenCalledWith('level');
            expect(mockQuery.exec).toHaveBeenCalledTimes(1); // exec вызван один раз (и упал)

            // Проверяем логгеры
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Логгер ошибки вызван один раз
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error finding user by ID ${userId}: ${dbError.message}`,
                { error: dbError },
            );
            expect(mockLogger.debug).toHaveBeenCalledTimes(1); // Логгер debug вызван один раз
            expect(mockLogger.debug).toHaveBeenCalledWith(
                `Finding user by ID: ${userId}`,
            );
        });
    });

    // --- Тесты для listUsers ---
    describe('listUsers', () => {
        const mockUsersList = [
            createMockUserDocument({ id: 1, username: 'user1' }),
            createMockUserDocument({ id: 2, username: 'user2' }),
        ];

        it('should return users and total count with default options', async () => {
            // Arrange
            // 1. countDocuments (без exec) -> total
            (
                mockTelegramUserModel.countDocuments as jest.Mock
            ).mockResolvedValue(mockUsersList.length);
            // 2. find().sort().skip().limit().exec() -> users
            const mockFindQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockUsersList),
            };
            (mockTelegramUserModel.find as jest.Mock).mockReturnValue(
                mockFindQuery,
            );

            // Act
            const result = await service.listUsers();

            // Assert
            expect(result.users).toEqual(mockUsersList);
            expect(result.total).toBe(mockUsersList.length);
            expect(mockTelegramUserModel.countDocuments).toHaveBeenCalledWith(
                {},
            ); // filter = {}
            expect(mockTelegramUserModel.find).toHaveBeenCalledWith({}); // filter = {}
            expect(mockFindQuery.sort).toHaveBeenCalledWith({ createdAt: -1 }); // default sort
            expect(mockFindQuery.skip).toHaveBeenCalledWith(0); // default offset
            expect(mockFindQuery.limit).toHaveBeenCalledWith(10); // default limit
            expect(mockFindQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                `Listing users with options: ${JSON.stringify({})}`,
            );
        });

        it('should return users and total count with specific options', async () => {
            // Arrange
            const options = {
                offset: 5,
                limit: 5,
                sortBy: 'username',
                sortOrder: 'asc' as const,
                filter: { role: 'admin' },
            };
            const totalAdmins = 10;
            // 1. countDocuments -> totalAdmins
            (
                mockTelegramUserModel.countDocuments as jest.Mock
            ).mockResolvedValue(totalAdmins);
            // 2. find()...exec() -> mockUsersList (просто для примера)
            const mockFindQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockUsersList),
            };
            (mockTelegramUserModel.find as jest.Mock).mockReturnValue(
                mockFindQuery,
            );

            // Act
            const result = await service.listUsers(options);

            // Assert
            expect(result.users).toEqual(mockUsersList);
            expect(result.total).toBe(totalAdmins);
            expect(mockTelegramUserModel.countDocuments).toHaveBeenCalledWith(
                options.filter,
            );
            expect(mockTelegramUserModel.find).toHaveBeenCalledWith(
                options.filter,
            );
            expect(mockFindQuery.sort).toHaveBeenCalledWith({
                [options.sortBy]: 1,
            }); // asc = 1
            expect(mockFindQuery.skip).toHaveBeenCalledWith(options.offset);
            expect(mockFindQuery.limit).toHaveBeenCalledWith(options.limit);
            expect(mockFindQuery.exec).toHaveBeenCalledTimes(1);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                `Listing users with options: ${JSON.stringify(options)}`,
            );
        });

        it('should throw DatabaseError on find exec error', async () => {
            // Arrange
            const dbError = new Error('Find failed');
            // 1. countDocuments -> OK (будет вызван один раз)
            (mockTelegramUserModel.countDocuments as jest.Mock)
                .mockClear() // Опционально
                .mockResolvedValue(1);
            // 2. find()...exec() -> fails (exec будет вызван один раз)
            const mockFindQuery = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                // Используем mockRejectedValueOnce, если хотим быть уверены, что ошибка только один раз
                // Но и mockRejectedValue подойдет, т.к. вызов сервиса будет один
                exec: jest.fn().mockRejectedValueOnce(dbError),
            };
            // find будет вызван один раз
            (mockTelegramUserModel.find as jest.Mock)
                .mockClear() // Опционально
                .mockReturnValue(mockFindQuery);

            const expectedErrorMessage = `Ошибка получения списка пользователей: ${dbError.message}`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.listUsers();

            // Assert: Проверяем отклонение ОДНОГО промиса
            await expect(action).rejects.toBeInstanceOf(DatabaseError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Проверяем вызовы моков (теперь ожидаем по одному вызову)
            expect(mockTelegramUserModel.countDocuments).toHaveBeenCalledTimes(
                1,
            ); // Вызывался один раз до ошибки find/exec
            expect(mockTelegramUserModel.find).toHaveBeenCalledTimes(1); // find вызывался один раз
            expect(mockFindQuery.exec).toHaveBeenCalledTimes(1); // Попытка exec была один раз

            // Проверяем логгер ошибки
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error listing users: ${dbError.message}`,
                { error: dbError },
            );
        });

        it('should throw DatabaseError on countDocuments error', async () => {
            // Arrange
            const countError = new Error('Count failed');
            // 1. countDocuments -> fails
            (
                mockTelegramUserModel.countDocuments as jest.Mock
            ).mockRejectedValueOnce(countError);

            // Act & Assert
            const action = service.listUsers();
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка получения списка пользователей: ${countError.message}`,
            );
            expect(mockTelegramUserModel.find).not.toHaveBeenCalled(); // find не должен вызываться
            expect(mockTelegramUserModel.countDocuments).toHaveBeenCalledTimes(
                1,
            ); // Попытка count была
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error listing users: ${countError.message}`,
                { error: countError }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });
    });

    // --- Тесты для updateUserProfile ---
    describe('updateUserProfile', () => {
        const updateData: UpdateUserDTO = {
            first_name: 'Updated Name',
            email: 'updated@example.com',
        };
        // Создаем ожидаемый результат ПОСЛЕ обновления
        let updatedUserDocument: jest.Mocked<TelegramUserDocument>;

        // Use a nested beforeEach specific to this describe block
        beforeEach(() => {
            // Now mockSavedUser is guaranteed to be initialized by the outer beforeEach
            // Define updatedUserDocument here
            updatedUserDocument = createMockUserDocument({
                ...mockSavedUser.toObject(), // OK: mockSavedUser exists now
                ...updateData,
                updatedAt: expect.any(Date), // updatedAt должно измениться (Mongoose делает это)
            });

            // Optional: Reset mocks specific to updateUserProfile if needed
            (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockClear();
        });

        it('should update user profile successfully', async () => {
            // Arrange: findOneAndUpdate (без exec) вернет обновленный документ
            // Use the updatedUserDocument variable defined in the beforeEach
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(updatedUserDocument);

            // Act
            const result = await service.updateUserProfile(userId, updateData);

            // Assert
            // Use the updatedUserDocument variable for comparison
            expect(result).toEqual(updatedUserDocument);
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId }, // filter
                { $set: updateData }, // update operation
                { new: true, runValidators: true }, // options
            );
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating profile for user ${userId}. Data: ${JSON.stringify(updateData)}`,
            );
            // expect(mockLogger.info).toHaveBeenCalledWith(`User ${userId} profile updated successfully.`); // This log doesn't seem to exist in the code
        });

        it('should throw UserNotFoundError if user not found', async () => {
            // Arrange: findOneAndUpdate (без exec) вернет null
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(null);

            const action = service.updateUserProfile(userId, updateData);

            // Act & Assert
            await expect(action).rejects.toThrow(UserNotFoundError);
            await expect(action).rejects.toThrow(
                `Пользователь с ID ${userId} не найден для обновления.`,
            );
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error updating profile for user ${userId}: Пользователь с ID ${userId} не найден для обновления.`, // Сообщение из UserNotFoundError
                { error: expect.any(UserNotFoundError) }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });

        it('should throw custom ValidationError on Mongoose validation error', async () => {
            // Arrange
            const updateData: UpdateUserDTO = {
                // Убедимся, что updateData определен (из setup или здесь)
                first_name: 'Updated Name',
                email: 'updated@example.com',
            };

            // --- ИСПРАВЛЕНО: Имитация ошибки Mongoose через простой объект ---
            const mongooseValidationError = {
                // <-- Используем объектный литерал
                name: 'ValidationError',
                message: 'Mongoose validation failed', // Сообщение исходной "ошибки"
            };
            // findOneAndUpdate падает с имитацией ошибки валидации при ОДНОМ вызове
            (mockTelegramUserModel.findOneAndUpdate as jest.Mock)
                .mockClear() // Опционально
                .mockRejectedValueOnce(mongooseValidationError); // Отклоняем с простым объектом
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

            const expectedCustomErrorMessage = `Ошибка валидации при обновлении профиля: ${mongooseValidationError.message}`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.updateUserProfile(userId, updateData);

            // Assert: Проверяем отклонение ОДНОГО промиса
            // 1. Проверяем, что выброшен КЛАСС кастомной ошибки ValidationError
            await expect(action).rejects.toBeInstanceOf(ValidationError);
            // 2. Проверяем СООБЩЕНИЕ кастомной ошибки
            await expect(action).rejects.toThrow(expectedCustomErrorMessage);

            // Assert: Проверяем вызовы моков
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1); // findOneAndUpdate был вызван один раз

            // Проверяем вызов логгера ОШИБКИ, который должен сработать в блоке catch
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Сообщение об ошибке из catch блока сервиса
                `Error updating profile for user ${userId}: ${mongooseValidationError.message}`,
                // В лог передается ИСХОДНЫЙ объект-имитация ошибки
                { error: mongooseValidationError },
            );

            // Проверяем, что лог INFO был вызван до ошибки
            expect(mockLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating profile for user ${userId}. Data: ${JSON.stringify(updateData)}`,
            );
        });

        it('should throw DatabaseError on generic db error', async () => {
            // Arrange
            const dbError = new Error('DB update failed');
            // findOneAndUpdate падает с другой ошибкой при ОДНОМ вызове
            (mockTelegramUserModel.findOneAndUpdate as jest.Mock)
                .mockClear() // Опционально
                .mockRejectedValueOnce(dbError);
            const expectedErrorMessage = `Не удалось обновить профиль пользователя: ${dbError.message}`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.updateUserProfile(userId, updateData); // updateData определено выше в describe

            // Assert: Проверяем отклонение ОДНОГО промиса
            await expect(action).rejects.toBeInstanceOf(DatabaseError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Проверяем вызовы моков
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1); // Был вызван один раз

            // Проверяем вызов логгера ОШИБКИ, который должен сработать в блоке catch
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error updating profile for user ${userId}: ${dbError.message}`, // Сообщение исходной ошибки
                { error: dbError }, // Сам объект исходной ошибки
            );
            // Можно также проверить, что лог INFO был вызван до ошибки
            expect(mockLogger.info).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating profile for user ${userId}. Data: ${JSON.stringify(updateData)}`,
            );
        });

        it('should return current user if updateData is empty', async () => {
            // Arrange: findUserById вернет пользователя
            const mockExistingUser = createMockUserDocument({ id: userId });
            // Настроим findUserById (который вызывается внутри updateUserProfile)
            const mockFindQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(mockExistingUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockFindQuery,
            ); // findOne для findUserById

            // Act
            const result = await service.updateUserProfile(userId, {}); // Пустой объект данных

            // Assert
            expect(result).toEqual(mockExistingUser);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            }); // Вызов из findUserById
            expect(mockFindQuery.exec).toHaveBeenCalledTimes(1);
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled(); // findOneAndUpdate не должен вызываться
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating profile for user ${userId}. Data: {}`, // Лог о начале обновления
            );
        });

        it('should throw UserNotFoundError if updateData is empty and user is not found', async () => {
            // Arrange: findUserById вернет null при ОДНОМ вызове findOne -> exec
            const mockFindQuery = {
                select: jest.fn().mockReturnThis(),
                populate: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(null), // findUserById вернет null
            };
            // findOne сработает один раз и вернет объект для цепочки вызовов
            (mockTelegramUserModel.findOne as jest.Mock)
                .mockClear() // Опционально
                .mockReturnValueOnce(mockFindQuery);
            const expectedErrorMessage = `Пользователь с ID ${userId} не найден.`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.updateUserProfile(userId, {}); // Пустой объект данных

            // Assert: Проверяем отклонение ОДНОГО промиса
            await expect(action).rejects.toBeInstanceOf(UserNotFoundError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Проверяем вызовы моков
            // findOne должен быть вызван один раз
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userId,
            });

            // select/populate/exec на возвращенном объекте должны быть вызваны
            expect(mockFindQuery.select).toHaveBeenCalled(); // Проверяем, что select был вызван
            // expect(mockFindQuery.populate).toHaveBeenCalled(); // Если populate вызывается в этом пути
            expect(mockFindQuery.exec).toHaveBeenCalledTimes(1); // exec был вызван один раз

            // findOneAndUpdate НЕ должен вызываться, так как данные для обновления пустые
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();

            // ВАЖНО: Логгер ошибки из findUserById НЕ должен вызываться,
            // так как findUserById успешно вернул null, а не упал с ошибкой.
            // Ошибка UserNotFoundError выбрасывается позже в updateUserProfile.
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
    });

    // --- Тесты-обертки (Theme, Photo, Phone) ---
    // Используют updateUserProfile, поэтому основные кейсы покрыты выше
    // Добавим тесты на валидацию входных данных
    describe('updateUserTheme', () => {
        it('should call updateUserProfile with correct theme data', async () => {
            const theme = 'dark';
            const updatedUser = createMockUserDocument({
                id: userId,
                theme: theme,
            });
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(updatedUser); // Мокаем findOneAndUpdate, который вызывается ИЗ updateUserProfile
            const spyUpdateProfile = jest.spyOn(service, 'updateUserProfile');

            const result = await service.updateUserTheme(userId, theme);

            expect(result).toEqual(updatedUser);
            expect(spyUpdateProfile).toHaveBeenCalledWith(userId, {
                theme: theme,
            });
            // Можно дополнительно проверить вызов findOneAndUpdate, если нужно
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId },
                { $set: { theme: theme } },
                expect.anything(), // Опции не так важны для этого теста
            );
        });

        it('should throw ValidationError for invalid theme value', async () => {
            const invalidTheme = 'blue' as any;
            await expect(
                service.updateUserTheme(userId, invalidTheme),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.updateUserTheme(userId, invalidTheme),
            ).rejects.toThrow(
                "Недопустимое значение темы. Допустимо 'light' или 'dark'.",
            );
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });
    });

    describe('updateUserProfile (for photo)', () => {
    it('should call findOneAndUpdate with correct photo data when updating profile', async () => {
        const photoUrl = 'http://example.com/photo.jpg';
        // updateUserProfile возвращает обновленный документ
        const updatedUser = createMockUserDocument({
            id: userId,
            photo_url: photoUrl, // Устанавливаем фото в "возвращаемом" документе
            // ... другие поля из createMockUserDocument
        });

        // Мокируем findOneAndUpdate, который вызывается внутри updateUserProfile
        (mockTelegramUserModel.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(updatedUser);

        // --- ACT: Вызываем updateUserProfile с данными для фото ---
        const result = await service.updateUserProfile(userId, { photo_url: photoUrl });

        // --- ASSERT ---
        // 1. Проверяем, что вернулся ожидаемый пользователь
        expect(result).toEqual(updatedUser);

        // 2. Проверяем, что findOneAndUpdate был вызван с правильными аргументами
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
            { id: userId },                             // Критерий поиска
            { $set: { photo_url: photoUrl } },         // Данные для обновления ($set)
            { new: true, runValidators: true }       // Опции
        );
    });
    });

    describe('updateUserPhone', () => {
        it('should call updateUserProfile with correct phone data', async () => {
            const phoneNumber = '+1234567890';
            const updatedUser = createMockUserDocument({
                id: userId,
                phone: phoneNumber,
            });
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(updatedUser);
            const spyUpdateProfile = jest.spyOn(service, 'updateUserProfile');

            const result = await service.updateUserPhone(userId, phoneNumber);

            expect(result).toEqual(updatedUser);
            expect(spyUpdateProfile).toHaveBeenCalledWith(userId, {
                phone: phoneNumber,
            });
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId },
                { $set: { phone: phoneNumber } },
                expect.anything(),
            );
        });

        it('should throw ValidationError for invalid phone number type', async () => {
            const invalidPhoneNumber = { number: '123' } as any;
            await expect(
                service.updateUserPhone(userId, invalidPhoneNumber),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.updateUserPhone(userId, invalidPhoneNumber),
            ).rejects.toThrow('Неверный формат номера телефона.');
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });
    });

    // --- Тесты для updateCurrentQuestion ---
    describe('updateCurrentQuestion', () => {
        const lessonObjectId = new Types.ObjectId();
        const lessonIdString = lessonObjectId.toHexString();
        const position = 5;
        const expectedUpdateData = {
            'currentQuestion.lessonId': lessonObjectId, // Должен быть ObjectId
            'currentQuestion.questionPosition': position,
        };
        const updatedUserDocument = createMockUserDocument({
            id: userId,
            currentQuestion: {
                lessonId: lessonObjectId,
                questionPosition: position,
            },
        });

        it('should update current question successfully', async () => {
            // Arrange: findOneAndUpdate вернет обновленный документ
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(updatedUserDocument);

            // Act
            const result = await service.updateCurrentQuestion(
                userId,
                lessonIdString,
                position,
            );

            // Assert
            expect(result).toEqual(updatedUserDocument);
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            // --- ИСПРАВЛЕНО: Проверяем аргументы findOneAndUpdate ---
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId },
                { $set: expectedUpdateData },
                { new: true, runValidators: true },
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating current question for user ${userId} to lesson ${lessonObjectId}, pos ${position}`,
            );
            // --- ИСПРАВЛЕНО: Лога об успешном обновлении нет, убираем проверку ---
            // expect(mockLogger.info).toHaveBeenCalledWith(`User ${userId} current question position updated.`);
        });

        it('should throw UserNotFoundError if user not found', async () => {
            // Arrange: findOneAndUpdate вернет null при ОДНОМ вызове
            (mockTelegramUserModel.findOneAndUpdate as jest.Mock)
                .mockClear()
                .mockResolvedValueOnce(null);
            const expectedErrorMessage = `Пользователь с ID ${userId} не найден для обновления позиции вопроса.`;

            // Act: Вызываем сервис ОДИН РАЗ
            const action = service.updateCurrentQuestion(
                userId,
                lessonIdString,
                position,
            );

            // Assert: Проверяем отклонение ОДНОГО промиса
            await expect(action).rejects.toBeInstanceOf(UserNotFoundError); // Проверяем тип
            await expect(action).rejects.toThrow(expectedErrorMessage); // Проверяем сообщение

            // Assert: Проверяем вызовы моков
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1); // findOneAndUpdate вызван один раз

            // --- ИСПРАВЛЕНО: Логгер ОШИБКИ ВЫЗЫВАЕТСЯ один раз в блоке catch ---
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            // Проверяем аргументы вызова логгера ошибки
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Сообщение об ошибке берется из пойманной UserNotFoundError
                `Error updating current question for user ${userId}: ${expectedErrorMessage}`,
                // Объект ошибки передается в лог
                { error: expect.any(UserNotFoundError) },
            );

            // Проверяем, что лог INFO о начале обновления был вызван
            expect(mockLogger.info).toHaveBeenCalledTimes(1); // Вызван один раз в начале
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Updating current question for user ${userId} to lesson ${lessonObjectId}, pos ${position}`,
            );
        });

        it('should throw ValidationError for invalid lesson ID format', async () => {
            const invalidLessonId = 'not-an-object-id';
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    invalidLessonId,
                    position,
                ),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    invalidLessonId,
                    position,
                ),
            ).rejects.toThrow('Неверный формат ID урока.');
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });

        it('should throw ValidationError for invalid question position (not a number)', async () => {
            const invalidPosition = 'five' as any;
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    lessonIdString,
                    invalidPosition,
                ),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    lessonIdString,
                    invalidPosition,
                ),
            ).rejects.toThrow('Позиция вопроса должна быть числом больше 0.');
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });

        it('should throw ValidationError for invalid question position (less than 1)', async () => {
            const invalidPosition = 0;
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    lessonIdString,
                    invalidPosition,
                ),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.updateCurrentQuestion(
                    userId,
                    lessonIdString,
                    invalidPosition,
                ),
            ).rejects.toThrow('Позиция вопроса должна быть числом больше 0.');
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });

        // Внутри describe('updateCurrentQuestion', ...)

        it('should throw custom ValidationError on Mongoose validation error during update', async () => {
            // --- Arrange ---
            // 1. Создаем ПРОСТОЙ ОБЪЕКТ, имитирующий ошибку Mongoose
            const mongooseValidationError = {
                // <-- Используем объектный литерал
                name: 'ValidationError', // Свойство, которое проверяет сервис
                message: 'Mongoose validation failed on update', // Сообщение, которое использует сервис
            };

            // 2. Настраиваем findOneAndUpdate, чтобы он отклонил Promise с этим объектом
            (mockTelegramUserModel.findOneAndUpdate as jest.Mock)
                .mockClear()
                .mockRejectedValueOnce(mongooseValidationError); // Отклоняем с простым объектом

            // 3. Ожидаемое сообщение кастомной ошибки сервиса
            const expectedCustomErrorMessage = `Ошибка валидации при обновлении позиции вопроса: ${mongooseValidationError.message}`;

            // --- Act ---
            const action = service.updateCurrentQuestion(
                userId,
                lessonIdString,
                position,
            );

            // --- Assert ---
            // Проверяем, что сервис выбросил именно *кастомный* ValidationError
            await expect(action).rejects.toBeInstanceOf(ValidationError); // Проверяем КЛАСС ошибки
            await expect(action).rejects.toThrow(expectedCustomErrorMessage); // Проверяем СООБЩЕНИЕ

            // Проверяем, что findOneAndUpdate был вызван
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            // Можно проверить аргументы вызова, если нужно:
            // expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(...)

            // Проверяем, что логгер получил *оригинальный* объект-имитацию ошибки
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error updating current question for user ${userId}: ${mongooseValidationError.message}`, // Логгируется исходное сообщение
                { error: mongooseValidationError }, // Логгируется исходный объект-имитация
            );
        });

        it('should throw DatabaseError on generic db error', async () => {
            // Arrange
            const dbError = new Error('DB update failed');
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockRejectedValueOnce(dbError); // Mock for the single call
            const expectedErrorMessage = `Не удалось обновить позицию вопроса: ${dbError.message}`;

            // Act: Call the service method ONCE
            const action = service.updateCurrentQuestion(
                userId,
                lessonIdString,
                position,
            );

            // Assert: Check rejection on the single promise
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Check mock calls (called once)
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Logger called once
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error updating current question for user ${userId}: ${dbError.message}`,
                { error: dbError },
            );
        });
    });

    // --- Тесты для blockUser ---
    describe('blockUser', () => {
        const blockedUserDocument = createMockUserDocument({
            id: userId,
            blocked: true,
        });

        it('should block user successfully', async () => {
            // Arrange: findOneAndUpdate вернет заблокированного пользователя
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(blockedUserDocument);

            // Act
            const result = await service.blockUser(userId);

            // Assert
            expect(result).toEqual(blockedUserDocument);
            expect(result.blocked).toBe(true);
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            // --- ИСПРАВЛЕНО: Проверяем аргументы ---
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId }, // filter
                { $set: { blocked: true } }, // update
                { new: true }, // options
            );
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Blocking user ${userId}.`,
            );
            // --- ИСПРАВЛЕНО: Лога info об успехе нет, убираем проверку ---
            // expect(mockLogger.info).toHaveBeenCalledWith(`User ${userId} blocked successfully.`);
        });

        it('should throw UserNotFoundError if user not found', async () => {
            // Arrange: findOneAndUpdate вернет null for the single call
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(null);
            const expectedErrorMessage = `Пользователь с ID ${userId} не найден для блокировки.`;

            // Act: Call the service method ONCE
            const action = service.blockUser(userId);

            // Assert: Check the rejection from the single promise
            await expect(action).rejects.toThrow(UserNotFoundError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Check mock calls (should be called once for this scenario)
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);

            // Assert: Check logger call
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Ensure logger called once
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error blocking user ${userId}: ${expectedErrorMessage}`, // Check the message
                { error: expect.any(UserNotFoundError) }, // Check the error object
            );
        });

        it('should throw DatabaseError on generic db error', async () => {
            // Arrange
            const dbError = new Error('DB update failed');
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockRejectedValueOnce(dbError); // Mock rejection for the single upcoming call
            const expectedErrorMessage = `Не удалось заблокировать пользователя: ${dbError.message}`;

            // Act: Call the service method ONCE
            const action = service.blockUser(userId);

            // Assert: Check the rejection type and message from the single promise
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(expectedErrorMessage);

            // Assert: Check mock calls
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);

            // Assert: Check logger call
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Ensure it was called exactly once
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error blocking user ${userId}: ${dbError.message}`, // Check the message logged
                { error: dbError }, // Check the error object logged
            );
        });
    });

    // --- Тесты для setVocabularyLanguage ---
    describe('setVocabularyLanguage', () => {
        const lang = 'buryat';
        const updatedUserDocument = createMockUserDocument({
            id: userId,
            vocabular: { selected_language_for_translate: lang },
        });

        it('should set language successfully', async () => {
            // Arrange: findOneAndUpdate вернет обновленный документ
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(updatedUserDocument);

            // Act
            const result = await service.setVocabularyLanguage(userId, lang);

            // Assert
            expect(result).toEqual(updatedUserDocument);
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            // --- ИСПРАВЛЕНО: Проверяем аргументы ---
            expect(mockTelegramUserModel.findOneAndUpdate).toHaveBeenCalledWith(
                { id: userId }, // filter
                { $set: { 'vocabular.selected_language_for_translate': lang } }, // update
                { new: true, runValidators: true }, // options
            );
            // --- ИСПРАВЛЕНО: Проверяем оба лога ---
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Setting vocabulary language to ${lang} for user ${userId}.`, // Лог 1 (начало)
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                `User ${userId} vocab language set to ${lang}.`, // Лог 2 (успех)
            );
            expect(mockLogger.info).toHaveBeenCalledTimes(2); // Убедимся, что было два вызова info
        });

        it('should throw ValidationError for invalid language value', async () => {
            const invalidLang = 'english' as any;
            await expect(
                service.setVocabularyLanguage(userId, invalidLang),
            ).rejects.toThrow(ValidationError);
            await expect(
                service.setVocabularyLanguage(userId, invalidLang),
            ).rejects.toThrow('Недопустимое значение языка словаря.');
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).not.toHaveBeenCalled();
        });

        it('should throw UserNotFoundError if user not found', async () => {
            // Arrange: findOneAndUpdate вернет null
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockResolvedValueOnce(null);

            // Act & Assert
            const action = service.setVocabularyLanguage(userId, lang);

            await expect(action).rejects.toThrow(UserNotFoundError);
            await expect(action).rejects.toThrow(
                `Пользователь с ID ${userId} не найден.`,
            );

            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error setting vocab language for user ${userId}: Пользователь с ID ${userId} не найден.`,
                { error: expect.any(UserNotFoundError) }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });

        it('should throw custom ValidationError on Mongoose validation error during update', async () => {
            // Arrange
            const mongooseValidationError = new Error(
                'Invalid language enum value',
            ) as any;
            mongooseValidationError.name = 'ValidationError';
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockRejectedValueOnce(mongooseValidationError);

            // Act & Assert
            const action = service.setVocabularyLanguage(userId, lang);

            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                `Ошибка валидации при установке языка словаря: ${mongooseValidationError.message}`,
            );
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                `Error setting vocab language for user ${userId}: ${mongooseValidationError.message}`,
                { error: mongooseValidationError }, // --- ИСПРАВЛЕНО: Проверяем структуру ---
            );
        });

        it('should throw DatabaseError on generic db error', async () => {
            // Arrange
            const dbError = new Error('DB update failed');
            (
                mockTelegramUserModel.findOneAndUpdate as jest.Mock
            ).mockRejectedValueOnce(dbError);

            // Act: Call the service method ONCE and store the promise
            const action = service.setVocabularyLanguage(userId, lang);

            // Assert: Check the rejection type and message from the single call
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Не удалось установить язык словаря: ${dbError.message}`,
            );

            // Assert: Check that mocks were called as expected (after the promise rejected)
            // Use try/catch or check after await expect().rejects to ensure these run even on failure
            // Although Jest typically handles this okay with rejects.
            expect(
                mockTelegramUserModel.findOneAndUpdate,
            ).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
        });
    });

    // Внутри describe('TelegramUserService', ...) файла TelegramUserService.spec.ts

    // --- Тесты для linkReferral ---
    describe('linkReferral', () => {
        let mockUserToLink: jest.Mocked<TelegramUserDocument>;
        let mockReferrerUser: jest.Mocked<TelegramUserDocument>;
        const userToLinkId = 67890;
        const referrerUserTelegramId = 11223;
        const validReferralCode = 'REF987';
        const userToLinkObjectId = new Types.ObjectId();
        const referrerUserObjectId = new Types.ObjectId();

        beforeEach(() => {
            // Создаем моки пользователя и реферера для каждого теста
            mockUserToLink = createMockUserDocument({
                _id: userToLinkObjectId,
                id: userToLinkId,
                username: 'linkMe',
                referred_by: null, // Важно: изначально не привязан
            });

            mockReferrerUser = createMockUserDocument({
                _id: referrerUserObjectId,
                id: referrerUserTelegramId,
                username: 'referrerUser',
                referral_code: validReferralCode,
                referrals: [], // Изначально пустой список
            });

            // Сбрасываем моки findOne и updateOne перед каждым тестом linkReferral
            (mockTelegramUserModel.findOne as jest.Mock).mockClear();
            (mockTelegramUserModel.updateOne as jest.Mock).mockClear();

            // Настройка моков по умолчанию для updateOne (успех)
            (mockTelegramUserModel.updateOne as jest.Mock).mockResolvedValue({
                acknowledged: true,
                matchedCount: 1,
                modifiedCount: 1, // По умолчанию считаем, что обновление прошло
                upsertedCount: 0,
                upsertedId: null,
            });
        });

        it('should successfully link user to referrer', async () => {
            // Arrange
            // --- MOCK ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ (успех) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink), // .select() возвращает пользователя
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK ДЛЯ ПОИСКА РЕФЕРЕРА (успех) ---
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser), // .select() возвращает реферера
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );
            // --- КОНЕЦ МОКОВ ---

            // Mocks для updateOne остаются как есть (настроены в beforeEach)

            // Act
            await service.linkReferral(userToLinkId, validReferralCode);

            // Assert
            // Проверка вызовов findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });

            // --- ДОБАВЛЕНО: Проверка вызовов select ---
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockUserQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledWith('_id id');
            // --- КОНЕЦ ДОБАВЛЕНИЯ ---

            // Проверка вызовов updateOne (остается как было)
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(2);
            // ... остальные проверки updateOne и логов ...
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Используем полное сообщение из сервиса
                `User ${userToLinkId} successfully linked to referrer ${referrerUserTelegramId} (referrer update acknowledged: true).`, // Используем ID реферера из мока
            );
            expect(mockLogger.warn).not.toHaveBeenCalled();
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        it('should throw ValidationError if userId is not provided', async () => {
            // Arrange
            const invalidUserId = null as any;
            // validReferralCode определен выше в beforeEach

            // Act
            const action = service.linkReferral(
                invalidUserId,
                validReferralCode, // Используем валидный код для этого теста
            );

            // Assert
            // Проверяем, что сервис выбросил ожидаемую ошибку
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                'userId и referralCode обязательны.', // Точное сообщение ошибки
            );

            // Убеждаемся, что НЕ было попыток обратиться к базе данных
            expect(mockTelegramUserModel.findOne).not.toHaveBeenCalled();
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();

            // --- ИСПРАВЛЕНО: Проверяем вызов логгера ---
            // Логгер вызывается ДО проверки userId и referralCode в методе сервиса
            expect(mockLogger.info).toHaveBeenCalledTimes(1); // Ожидаем, что лог был вызван один раз
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Проверяем, с какими аргументами он был вызван
                // userId будет null, т.к. мы передали invalidUserId
                `Attempting to link user ${invalidUserId} via referral code ${validReferralCode}`,
            );
            // Убеждаемся, что не было логов предупреждений или ошибок для этого сценария
            expect(mockLogger.warn).not.toHaveBeenCalled();
            expect(mockLogger.error).not.toHaveBeenCalled();
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        });

        it('should throw ValidationError if referralCode is not provided', async () => {
            // Arrange
            const invalidCode = '' as any;

            // Act
            const action = service.linkReferral(userToLinkId, invalidCode);

            // Assert
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                'userId и referralCode обязательны.',
            );
            expect(mockTelegramUserModel.findOne).not.toHaveBeenCalled();
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledTimes(1);
        });

        it('should throw UserNotFoundError if user is not found', async () => {
            // Arrange
            // --- MOCK ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ (не найден -> null) ---
            const mockUserNotFoundQuery = {
                select: jest.fn().mockResolvedValueOnce(null), // .select() успешно выполняется, но возвращает null
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserNotFoundQuery,
            );
            // --- КОНЕЦ МОКА ---

            // Второй findOne (для реферера) не будет вызван

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Теперь ожидаем правильную ошибку UserNotFoundError
            await expect(action).rejects.toThrow(UserNotFoundError);
            await expect(action).rejects.toThrow(
                `Пользователь с ID ${userToLinkId} не найден.`,
            );

            // Проверка вызовов
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userToLinkId,
            });
            expect(mockUserNotFoundQuery.select).toHaveBeenCalledTimes(1); // select был вызван
            expect(mockUserNotFoundQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled(); // updateOne не вызывался

            // Проверка логов
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Link referral failed: User ${userToLinkId} not found.`,
            );
            // Проверяем, что ошибка UserNotFoundError была залогирована
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение об ошибке из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: Пользователь с ID ${userToLinkId} не найден.`,
                expect.objectContaining({
                    // Проверяем объект ошибки
                    error: expect.any(UserNotFoundError), // Ожидаем UserNotFoundError
                }),
            );
        });

        it('should throw ValidationError if referrer is not found by referral code', async () => {
            // Arrange

            // 1. findOne (user) -> mockUserToLink (via select)
            const mockUserQuery = {
                // .select() должен вернуть Promise, который разрешается с mockUserToLink
                select: jest.fn().mockResolvedValueOnce(mockUserToLink),
            };

            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // 2. findOne (referrer) -> null (via select)
            const mockReferrerNotFoundQuery = {
                // .select() должен вернуть Promise, который разрешается в null (реферер не найден)
                select: jest.fn().mockResolvedValueOnce(null),
            };
            // Настраиваем ВТОРОЙ вызов findOne
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerNotFoundQuery,
            );

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            await expect(action).rejects.toThrow(ValidationError); // Согласно коду, бросаем ValidationError
            await expect(action).rejects.toThrow(
                `Реферальный код "${validReferralCode}" не найден.`,
            );
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2); // Оба поиска были
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Link referral failed: Referral code ${validReferralCode} not found.`,
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Error linking referral for user ${userToLinkId}`,
                ),
                { error: expect.any(ValidationError) }, // Ошибка ValidationError
            );
        });

        it('should throw ValidationError on self-referral attempt', async () => {
            // Arrange
            const selfReferralUser = createMockUserDocument({
                _id: userToLinkObjectId,
                id: userToLinkId, // Тот же ID, что и у пользователя
                username: 'selfReferrer',
                referral_code: validReferralCode,
                referred_by: null,
            });

            // 1. findOne (user) должен вернуть объект с .select()
            const mockUserQuery = {
                // .select() должен вернуть Promise, который разрешается с selfReferralUser
                select: jest.fn().mockResolvedValueOnce(selfReferralUser),
            };
            // Настраиваем ПЕРВЫЙ вызов findOne
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // 2. findOne (referrer by code) должен вернуть объект с .select()
            const mockReferrerQuery = {
                // .select() также должен вернуть Promise с selfReferralUser для этого теста
                select: jest.fn().mockResolvedValueOnce(selfReferralUser),
            };
            // Настраиваем ВТОРОЙ вызов findOne
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                'Нельзя использовать свой собственный реферальный код.',
            );
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Link referral failed: User ${userToLinkId} attempted self-referral.`,
            );
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining(
                    `Error linking referral for user ${userToLinkId}`,
                ),
                { error: expect.any(ValidationError) },
            );
        });

        it('should throw ValidationError if user already has a referrer', async () => {
            // Arrange
            // Создаем мок пользователя, у которого УЖЕ есть реферер
            const alreadyLinkedUser = createMockUserDocument({
                _id: userToLinkObjectId,
                id: userToLinkId,
                username: 'linkMe',
                referred_by: new Types.ObjectId(), // <-- Уже привязан
            });

            // --- MOCK: findOne (user) -> alreadyLinkedUser ---
            // findOne возвращает мок-запроса, select возвращает alreadyLinkedUser
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(alreadyLinkedUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK: findOne (referrer) -> mockReferrerUser ---
            // findOne возвращает мок-запроса, select возвращает mockReferrerUser
            // Важно мокировать и этот вызов, даже если до него не дойдет проверка alreadyLinkedUser.referred_by,
            // т.к. код сервиса вызывает оба findOne до проверки.
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );
            // --- КОНЕЦ МОКОВ ---

            // updateOne не будет вызван

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Ожидаем ValidationError с сообщением о существующем реферере
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                'У пользователя уже есть реферер.',
            );

            // Проверяем вызовы findOne (оба должны быть вызваны)
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });

            // Проверяем вызовы select
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockUserQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledWith('_id id');

            // Проверяем, что updateOne не был вызван
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();

            // Проверка логов
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Лог о начале
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Ожидаем одно предупреждение
            // Используем toMatch для проверки части строки, т.к. ID реферера генерируется
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringMatching(
                    // Используем stringMatching
                    `Link referral failed: User ${userToLinkId} already has a referrer \\(ID: [a-f0-9]{24}\\).`, // Экранируем скобки и ожидаем ObjectId
                ),
            );
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Ожидаем одну ошибку
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: У пользователя уже есть реферер.`,
                // Проверяем, что в лог передана ошибка ValidationError
                expect.objectContaining({ error: expect.any(ValidationError) }),
            );
        });

        it('should throw ValidationError if user update returns modifiedCount 0 and user is already linked (race condition)', async () => {
            // Arrange
            // --- MOCK: findOne (user) -> mockUserToLink (not linked initially) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK: findOne (referrer) -> mockReferrerUser ---
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );

            // --- MOCK: updateOne (user) -> Fails with modifiedCount 0 ---
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockResolvedValueOnce({
                acknowledged: true,
                matchedCount: 1,
                modifiedCount: 0, // <-- Ключевой момент
            });

            // --- MOCK: findOne (re-check user state) -> Returns user NOW linked ---
            // Создаем документ, имитирующий уже привязанного пользователя
            const userNowLinked = createMockUserDocument({
                _id: mockUserToLink._id, // Используем тот же _id
                id: userToLinkId,
                referred_by: mockReferrerUser._id, // <-- Теперь привязан
            });
            // Мокируем третий findOne, чтобы он вернул ЭТОТ документ
            const mockRecheckLinkedQuery = {
                select: jest.fn().mockResolvedValueOnce(userNowLinked),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockRecheckLinkedQuery,
            );
            // --- КОНЕЦ МОКОВ ---

            // Второй updateOne (для реферера) не будет вызван

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Ожидаем ValidationError с сообщением об уже существующем реферере
            await expect(action).rejects.toThrow(ValidationError);
            await expect(action).rejects.toThrow(
                'У пользователя уже есть реферер (обнаружено при обновлении).',
            );

            // Проверяем вызовы findOne (снова 3 вызова)
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(3);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(3, {
                _id: mockUserToLink._id,
            });

            // Проверяем вызовы select
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockUserQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledWith('_id id');
            expect(mockRecheckLinkedQuery.select).toHaveBeenCalledTimes(1); // Select при перепроверке
            expect(mockRecheckLinkedQuery.select).toHaveBeenCalledWith(
                'referred_by',
            );

            // Проверяем вызов updateOne (только один раз для пользователя)
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUserToLink._id, referred_by: null },
                { $set: { referred_by: mockReferrerUser._id } },
            );

            // Проверка логов
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Лог о начале
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Одно предупреждение
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining(`Link referral race condition?`),
            );
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Одна ошибка
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: У пользователя уже есть реферер (обнаружено при обновлении).`,
                // Проверяем, что в лог передана ошибка ValidationError
                expect.objectContaining({ error: expect.any(ValidationError) }),
            );
        });

        it('should throw DatabaseError if user update returns modifiedCount 0 and user is still not linked (DB issue)', async () => {
            // Arrange
            // --- MOCK: findOne (user) -> mockUserToLink (not linked) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK: findOne (referrer) -> mockReferrerUser ---
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );

            // --- MOCK: updateOne (user) -> Fails with modifiedCount 0 ---
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockResolvedValueOnce({
                acknowledged: true,
                matchedCount: 1, // Нашли пользователя
                modifiedCount: 0, // Но не смогли обновить (или он уже был такой)
            });

            // --- MOCK: findOne (re-check user state) -> Returns user STILL not linked ---
            // Важно: ЭТОТ findOne тоже должен возвращать объект с select!
            const mockRecheckQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink), // Снова возвращаем непривязанного пользователя
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockRecheckQuery,
            );
            // --- КОНЕЦ МОКОВ ---

            // Второй updateOne (для реферера) не будет вызван

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Ожидаем DatabaseError с конкретным сообщением из этого сценария
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Не удалось обновить referred_by для пользователя ${userToLinkId}, хотя он не был установлен.`,
            );

            // Проверка вызовов findOne (теперь их 3)
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(3);
            // Проверяем аргументы каждого вызова findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(3, {
                _id: mockUserToLink._id,
            }); // Перепроверка по _id

            // Проверяем вызовы select
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockUserQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledWith('_id id');
            expect(mockRecheckQuery.select).toHaveBeenCalledTimes(1); // Select при перепроверке
            expect(mockRecheckQuery.select).toHaveBeenCalledWith('referred_by'); // Поля при перепроверке

            // Проверка вызова updateOne (только один раз для пользователя)
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUserToLink._id, referred_by: null },
                { $set: { referred_by: mockReferrerUser._id } },
            );

            // Проверка логов
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Лог о начале
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Ожидаем одно предупреждение
            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.stringContaining(`Link referral race condition?`), // Лог о возможной гонке
            );
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Ожидаем одну ошибку
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: Не удалось обновить referred_by для пользователя ${userToLinkId}, хотя он не был установлен.`,
                // Проверяем, что в лог передана ошибка DatabaseError
                expect.objectContaining({ error: expect.any(DatabaseError) }),
            );
        });

        it('should throw DatabaseError if finding user fails', async () => {
            // Arrange
            const dbError = new Error('DB connection lost');

            // --- CORRECTED MOCK ---
            // 1. Создаем мок объекта запроса (query)
            const mockFailedQuery = {
                // 2. Мокируем метод 'select', чтобы ОН возвращал отклоненный промис
                select: jest.fn().mockRejectedValueOnce(dbError),
                // Добавьте .lean(), .populate() и т.д., если они могут быть вызваны в этой цепочке в других тестах
            };
            // 3. Настраиваем findOne, чтобы он вернул наш мок запроса
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockFailedQuery,
            );
            // --- END CORRECTED MOCK ---

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Теперь await expect().rejects должен правильно поймать ошибку,
            // так как отклонение произойдет на шаге await mockFailedQuery.select(...)
            await expect(action).rejects.toThrow(DatabaseError);
            // Проверяем конкретное сообщение перехваченной ошибки
            await expect(action).rejects.toThrow(
                `Ошибка при привязке реферала: ${dbError.message}`,
            );

            // Проверяем, что findOne был вызван
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
                id: userToLinkId,
            });

            // --- ДОБАВЛЕНО: Проверяем, что select был вызван на моке запроса ---
            expect(mockFailedQuery.select).toHaveBeenCalledTimes(1);
            expect(mockFailedQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            ); // Проверяем аргументы select
            // --- КОНЕЦ ДОБАВЛЕНИЯ ---

            // Проверяем, что updateOne НЕ был вызван
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();

            // Проверяем логгер
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Используем полное сообщение из сервиса для точности
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: ${dbError.message}`,
                expect.objectContaining({ error: dbError }), // Проверяем, что оригинальная ошибка залогирована
            );
        });

        it('should throw DatabaseError if finding referrer fails', async () => {
            // Arrange
            const dbError = new Error(
                'DB connection lost during referrer search',
            );

            // --- MOCK ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ (УСПЕХ) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink), // Пользователь найден успешно
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK ДЛЯ ПОИСКА РЕФЕРЕРА (НЕУДАЧА ПРИ ВЫПОЛНЕНИИ ЗАПРОСА) ---
            // findOne возвращает мок-запроса
            const mockReferrerFailedQuery = {
                // а select на этом моке отклоняет промис с ошибкой dbError
                select: jest.fn().mockRejectedValueOnce(dbError),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerFailedQuery,
            );
            // --- КОНЕЦ МОКОВ ---

            // updateOne не будет вызван

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Проверяем, что была выброшена DatabaseError с сообщением нашей исходной ошибки
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка при привязке реферала: ${dbError.message}`,
            );

            // Проверяем вызовы findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2); // Были вызваны оба findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });

            // Проверяем вызовы select
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1); // Успешный select для пользователя
            expect(mockReferrerFailedQuery.select).toHaveBeenCalledTimes(1); // Неудачный select для реферера
            expect(mockReferrerFailedQuery.select).toHaveBeenCalledWith(
                '_id id',
            ); // Проверяем аргументы для select реферера

            // Проверяем, что updateOne не был вызван
            expect(mockTelegramUserModel.updateOne).not.toHaveBeenCalled();

            // Проверяем логи
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Лог о начале
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Лог ошибки
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: ${dbError.message}`,
                // Проверяем, что ОРИГИНАЛЬНАЯ ошибка dbError была передана в логгер
                expect.objectContaining({ error: dbError }),
            );
            expect(mockLogger.warn).not.toHaveBeenCalled(); // Предупреждений быть не должно
        });

        it('should throw DatabaseError if updating user fails', async () => {
            // Arrange
            const dbError = new Error('Cannot update user'); // Ошибка, которую имитируем при обновлении пользователя

            // --- MOCK ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ (УСПЕХ) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK ДЛЯ ПОИСКА РЕФЕРЕРА (УСПЕХ) ---
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser),
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );
            // --- КОНЕЦ МОКОВ findOne().select() ---

            // --- MOCK ДЛЯ ОБНОВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ (НЕУДАЧА) ---
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockRejectedValueOnce(dbError); // <-- Здесь происходит ошибка

            // --- MOCK ДЛЯ ОБНОВЛЕНИЯ РЕФЕРЕРА (НЕ ВЫЗЫВАЕТСЯ) ---
            // Второй вызов updateOne не должен произойти, т.к. первый упал.
            // Можно добавить mockResolvedValueOnce на всякий случай, если цепочка somehow продолжится,
            // но лучше полагаться на проверку `toHaveBeenCalledTimes(1)` ниже.

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Проверяем, что сервис выбросил DatabaseError с сообщением НАШЕЙ ОШИБКИ dbError
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка при привязке реферала: ${dbError.message}`,
            );

            // Проверяем вызовы findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);

            // Проверяем вызовы updateOne
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(1); // Был вызван только ОДИН раз (для пользователя)
            // Проверяем аргументы этого первого (и единственного) вызова updateOne
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledWith(
                { _id: mockUserToLink._id, referred_by: null },
                { $set: { referred_by: mockReferrerUser._id } },
            );

            // Проверяем логи
            expect(mockLogger.info).toHaveBeenCalledWith(
                // Лог о начале
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            expect(mockLogger.error).toHaveBeenCalledTimes(1); // Лог ошибки
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: ${dbError.message}`,
                // Проверяем, что ОРИГИНАЛЬНАЯ ошибка dbError была передана в логгер
                expect.objectContaining({ error: dbError }),
            );
            expect(mockLogger.warn).not.toHaveBeenCalled(); // Предупреждений быть не должно
        });

        it('should throw DatabaseError if updating referrer fails', async () => {
            // Arrange
            const dbError = new Error('Cannot update referrer'); // Ошибка, которую имитируем

            // --- MOCK ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ (успех) ---
            const mockUserQuery = {
                select: jest.fn().mockResolvedValueOnce(mockUserToLink), // select() успешно вернет пользователя
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockUserQuery,
            );

            // --- MOCK ДЛЯ ПОИСКА РЕФЕРЕРА (успех) ---
            const mockReferrerQuery = {
                select: jest.fn().mockResolvedValueOnce(mockReferrerUser), // select() успешно вернет реферера
            };
            (mockTelegramUserModel.findOne as jest.Mock).mockReturnValueOnce(
                mockReferrerQuery,
            );

            // --- MOCK ДЛЯ ОБНОВЛЕНИЯ ПОЛЬЗОВАТЕЛЯ (успех) ---
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockResolvedValueOnce({
                acknowledged: true,
                matchedCount: 1,
                modifiedCount: 1, // Пользователь успешно обновлен
            });

            // --- MOCK ДЛЯ ОБНОВЛЕНИЯ РЕФЕРЕРА (НЕУДАЧА) ---
            (
                mockTelegramUserModel.updateOne as jest.Mock
            ).mockRejectedValueOnce(dbError); // Эта операция упадет

            // Act
            const action = service.linkReferral(
                userToLinkId,
                validReferralCode,
            );

            // Assert
            // Проверяем, что сервис выбросил DatabaseError с правильным сообщением
            await expect(action).rejects.toThrow(DatabaseError);
            await expect(action).rejects.toThrow(
                `Ошибка при привязке реферала: ${dbError.message}`, // Сообщение из catch блока сервиса
            );

            // Проверяем вызовы findOne
            expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(1, {
                id: userToLinkId,
            });
            expect(mockTelegramUserModel.findOne).toHaveBeenNthCalledWith(2, {
                referral_code: validReferralCode,
            });

            // Проверяем вызовы select
            expect(mockUserQuery.select).toHaveBeenCalledTimes(1);
            expect(mockUserQuery.select).toHaveBeenCalledWith(
                '_id id referred_by',
            );
            expect(mockReferrerQuery.select).toHaveBeenCalledTimes(1);
            expect(mockReferrerQuery.select).toHaveBeenCalledWith('_id id');

            // Проверяем вызовы updateOne (были вызваны оба)
            expect(mockTelegramUserModel.updateOne).toHaveBeenCalledTimes(2);
            // Проверяем первый вызов (обновление пользователя)
            expect(mockTelegramUserModel.updateOne).toHaveBeenNthCalledWith(
                1,
                { _id: mockUserToLink._id, referred_by: null },
                { $set: { referred_by: mockReferrerUser._id } },
            );
            // Проверяем второй вызов (обновление реферера - который упал)
            expect(mockTelegramUserModel.updateOne).toHaveBeenNthCalledWith(
                2,
                { _id: mockReferrerUser._id },
                { $addToSet: { referrals: mockUserToLink._id } },
            );

            // Проверяем логи
            // Должен быть лог о попытке и лог об успешной привязке *пользователя* (перед падением реферера)
            expect(mockLogger.info).toHaveBeenCalledWith(
                `Attempting to link user ${userToLinkId} via referral code ${validReferralCode}`,
            );
            // Важно: Этот лог вызывается ПОСЛЕ обоих updateOne в try блоке,
            // но так как второй updateOne упал, до этого лога дело не дойдет.
            // expect(mockLogger.info).toHaveBeenCalledWith(
            //     `User ${userToLinkId} successfully linked to referrer ${mockReferrerUser.id} (referrer update acknowledged: ...)`,
            // );
            // Вместо этого будет лог ошибки из catch блока
            expect(mockLogger.error).toHaveBeenCalledTimes(1);
            expect(mockLogger.error).toHaveBeenCalledWith(
                // Полное сообщение из catch блока сервиса
                `Error linking referral for user ${userToLinkId} with code ${validReferralCode}: ${dbError.message}`,
                expect.objectContaining({ error: dbError }), // Проверяем, что оригинальная ошибка dbError была залогирована
            );
            expect(mockLogger.warn).not.toHaveBeenCalled(); // Предупреждений не ожидается
        });
    }); // --- КОНЕЦ describe('linkReferral') ---
}); // --- КОНЕЦ describe('TelegramUserService') ---
