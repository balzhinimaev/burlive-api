import { Types } from 'mongoose';
import { IAddRatingHandler } from '../../interfaces/userRating.interface';
import { RATING_POINTS } from '../../../config/constants';
import { DatabaseError, NotFoundError } from '../../../errors/customErrors'; // Добавлен NotFoundError
import { SuggestWordsHandler } from '../handlers/suggestWordsHandler';
import {
    ISuggestWordsHandler,
    // LeanAcceptedBuryat, // Импортируем типы, если они используются в тестах напрямую
    LeanAcceptedRussian,
    // LeanSuggestedBuryat,
    LeanSuggestedRussian,
} from '../interfaces/suggestWords.interface';
import { SuggestionInput } from '../../../types/vocabulary.types'; // Добавлен SuggestWordResultItem
import { TelegramUserDocument } from '../../../models/TelegramUsers';
// import { LeanWordResultType } from '../handlers/interfaces'; // Переименован интерфейс

// --- МОКИРУЕМ ЗАВИСИМОСТИ С ФАБРИКАМИ ---

// --- Определяем общие mock-функции ВНЕ фабрик ---
const mockFindOne = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockSave = jest.fn();
// Передаем тип this для корректной работы с `toObject`
const mockToObject = jest.fn().mockImplementation(function (this: any) {
    // Возвращаем копию объекта, чтобы избежать мутаций между вызовами/тестами
    // Используем spread для поверхностного копирования, что обычно достаточно
    return { ...this };
});
const mockLean = jest.fn();
const mockSelect = jest.fn(() => ({ lean: mockLean }));

// Дефолтная цепочка: findOne -> select -> lean
mockFindOne.mockReturnValue({ select: mockSelect });

// --- Мокируем модели Mongoose ---

// Mock TelegramUsers
jest.mock('../../../models/TelegramUsers', () => ({
    __esModule: true,
    default: {
        findOne: mockFindOne,
    },
}));

// Mock Dialect
jest.mock('../../../models/Dialect', () => ({
    __esModule: true,
    default: {
        findOne: mockFindOne,
    },
}));

// Mock AcceptedWordRussian
jest.mock('../../../models/Vocabulary/AcceptedWordRussian', () => ({
    __esModule: true,
    default: {
        findOne: mockFindOne,
        findByIdAndUpdate: mockFindByIdAndUpdate,
    },
}));

// Mock AcceptedWordBuryat
jest.mock('../../../models/Vocabulary/AcceptedWordBuryat', () => ({
    __esModule: true,
    default: {
        findOne: mockFindOne,
        findByIdAndUpdate: mockFindByIdAndUpdate,
    },
}));

// Mock SuggestedWordModelRussian
// Важно: Мок конструктора должен возвращать объект с МЕТОДАМИ экземпляра (`save`, `toObject`).
// Статические методы (`findOne`, `findByIdAndUpdate`) добавляются к самому моку конструктора.
const MockSuggestedRussianConstructor = jest
    .fn()
    .mockImplementation((data) => ({
        ...data, // Копируем переданные данные
        _id: new Types.ObjectId(), // Генерируем фейковый ID для реалистичности
        createdAt: new Date(), // Добавляем дату создания
        save: mockSave,
        toObject: mockToObject,
    }));
Object.defineProperty(MockSuggestedRussianConstructor, 'findOne', {
    value: mockFindOne,
});
Object.defineProperty(MockSuggestedRussianConstructor, 'findByIdAndUpdate', {
    value: mockFindByIdAndUpdate,
});
jest.mock('../../../models/Vocabulary/SuggestedWordModelRussian', () => ({
    __esModule: true,
    default: MockSuggestedRussianConstructor,
}));

// Mock SuggestedWordModelBuryat
const MockSuggestedBuryatConstructor = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    save: mockSave,
    toObject: mockToObject,
}));
Object.defineProperty(MockSuggestedBuryatConstructor, 'findOne', {
    value: mockFindOne,
});
Object.defineProperty(MockSuggestedBuryatConstructor, 'findByIdAndUpdate', {
    value: mockFindByIdAndUpdate,
});
jest.mock('../../../models/Vocabulary/SuggestedWordModelBuryat', () => ({
    __esModule: true,
    default: MockSuggestedBuryatConstructor,
}));

// --- Импортируем МОКИРОВАННЫЕ модели ПОСЛЕ мокирования ---
// Убедимся, что импорты идут после jest.mock
import TelegramUserModel from '../../../models/TelegramUsers';
import AcceptedWordRussianModel from '../../../models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryatModel from '../../../models/Vocabulary/AcceptedWordBuryat';
// Импортируем моки конструкторов напрямую, как и раньше
// (Названия переменных уже содержат "Mock")
import MockSuggestedRussianModel from '../../../models/Vocabulary/SuggestedWordModelRussian'; // Имя импорта может быть любым
import MockSuggestedBuryatModel from '../../../models/Vocabulary/SuggestedWordModelBuryat'; // Имя импорта может быть любым
import DialectModel from '../../../models/Dialect';
// import { LeanWordResultType } from '../handlers/interfaces'; // Убедитесь, что этот тип существует и корректен

// --- Моки других зависимостей ---
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
};

const mockAddRatingHandler: jest.Mocked<IAddRatingHandler> = {
    execute: jest.fn(),
};

// --- МОКОВЫЕ ДАННЫЕ ---
const testUserIdMongo = new Types.ObjectId();
// Используем Partial<TelegramUserDocument> для мока пользователя, так как нам не нужны все поля
const mockUser: Partial<TelegramUserDocument> & { _id: Types.ObjectId } = {
    _id: testUserIdMongo,
    id: 12345, // Telegram ID
};
const mockNewUserIdMongo = new Types.ObjectId();
const mockNewUser: Partial<TelegramUserDocument> & { _id: Types.ObjectId } = {
    _id: mockNewUserIdMongo,
    id: 54321,
};

const existingAcceptedRuId = new Types.ObjectId();
// Определим тип для Lean-результата существующих слов. Используем интерфейс, если он есть,
// или создадим урезанный тип здесь. LeanWordResultType кажется подходящим.
// Убедимся, что он соответствует тому, что возвращает .lean() в коде.
const mockExistingAcceptedRu: LeanAcceptedRussian = {
    // Используем конкретный Lean тип
    _id: existingAcceptedRuId,
    text: 'Привет',
    normalized_text: 'привет',
    author: testUserIdMongo,
    contributors: [testUserIdMongo],
    translations: [], // Пример обязательного поля из IAcceptedWordRussian
    translations_u: [], // Пример обязательного поля из IAcceptedWordRussian
    themes: [],
    createdAt: new Date(),
};

const sargaagDialectId = new Types.ObjectId();
const mockSargaagDialect = {
    _id: sargaagDialectId,
    name: 'Сарааг диалект',
};

const existingSuggestedRuId = new Types.ObjectId();
const mockExistingSuggestedRu: LeanSuggestedRussian = {
    // Используем конкретный Lean тип
    _id: existingSuggestedRuId,
    text: 'Пока',
    normalized_text: 'пока',
    author: testUserIdMongo,
    contributors: [testUserIdMongo],
    pre_translations: [], // Пример обязательного поля из ISuggestedWordRussian
    themes: [],
    status: 'new', // Добавлено поле status
    createdAt: new Date(),
    updatedAt: new Date(),
};

// --- Настройка тестовой среды ---

describe('SuggestWordsHandler', () => {
    let handler: ISuggestWordsHandler;

    beforeEach(() => {
        // Очищаем все вызовы и экземпляры моков перед каждым тестом
        jest.clearAllMocks();

        // --- Сброс и настройка моков по умолчанию ---

        // 1. Настройка цепочки Mongoose Query (findOne -> select -> lean И findOne -> lean)
        mockLean.mockReset().mockResolvedValue(null); // По умолчанию lean() ничего не находит
        mockSelect.mockReset().mockReturnValue({ lean: mockLean }); // select() возвращает объект с методом lean

        // mockFindOne должен возвращать объект, у которого есть И .select(), И .lean()
        const mockQueryResult = {
            select: mockSelect, // Метод для цепочки findOne -> select -> lean
            lean: mockLean, // Метод для цепочки findOne -> lean
        };
        mockFindOne.mockReset().mockReturnValue(mockQueryResult);

        // 2. Сброс и настройка других методов моделей
        mockFindByIdAndUpdate.mockReset().mockResolvedValue(null); // По умолчанию обновление не находит/возвращает документ
        // Глобальный mockSave - его можно настроить на успех по умолчанию,
        // но тесты создания слова все равно должны его переопределять
        // специфичными моками (mockInstanceSave). Оставим так для простоты.
        mockSave.mockReset().mockResolvedValue({});

        // 3. Сброс моков конструкторов
        // Используем mockClear() чтобы сбросить счетчики вызовов, но сохранить
        // возможность настройки mockReturnValueOnce в тестах без переопределения
        // базовой реализации (которой у нас нет).
        (MockSuggestedRussianConstructor as jest.Mock).mockClear();
        (MockSuggestedBuryatConstructor as jest.Mock).mockClear();

        // 4. Сброс моков внешних зависимостей (логгер, обработчик рейтинга)
        mockAddRatingHandler.execute
            .mockReset()
            .mockResolvedValue(mockNewUser as any); // По умолчанию рейтинг обновляется успешно
        mockLogger.info.mockClear();
        mockLogger.error.mockClear();
        mockLogger.warn.mockClear();
        mockLogger.debug.mockClear();

        // mockToObject уже настроен глобально и не требует сброса/перенастройки здесь.

        // --- Создание экземпляра тестируемого класса ---
        handler = new SuggestWordsHandler(
            // Передаем моки моделей и зависимостей, как они импортированы/определены
            TelegramUserModel as any, // Модель пользователя
            AcceptedWordRussianModel as any, // Модель принятых русских
            AcceptedWordBuryatModel as any, // Модель принятых бурятских
            MockSuggestedRussianModel as any, // Мок конструктора предложенных русских
            MockSuggestedBuryatModel as any, // Мок конструктора предложенных бурятских
            mockAddRatingHandler, // Мок обработчика рейтинга
            mockLogger as any, // Мок логгера
            RATING_POINTS, // Константы рейтинга
            DialectModel as any, // Модель диалектов
        );
    });

    // ---- ТЕСТЫ ----

    it('should throw NotFoundError if user does not exist', async () => {
        const input: SuggestionInput = {
            text: 'word',
            language: 'russian',
            telegramUserId: 999,
        };
        mockLean.mockResolvedValueOnce(null); // Настраиваем мок только один раз

        let caughtError: any; // Переменная для хранения пойманной ошибки

        try {
            // Вызываем handler.execute ОДИН раз
            await handler.execute(input);
            // Если сюда дошло, значит ошибка не была выброшена - тест должен упасть
            fail('Expected handler.execute to throw an error, but it did not.');
        } catch (error) {
            // Ловим ошибку
            caughtError = error;
        }

        // Проверяем пойманную ошибку
        expect(caughtError).toBeDefined(); // Убедимся, что ошибка была поймана
        expect(caughtError).toBeInstanceOf(NotFoundError); // Проверяем тип ошибки
        expect(caughtError.message).toBe(
            // Проверяем сообщение
            `User with Telegram ID ${input.telegramUserId} not found.`,
        );

        // Проверяем вызовы моков (теперь они вызывались только один раз)
        expect(mockFindOne).toHaveBeenCalledTimes(1); // findOne вызывался один раз
        expect(mockFindOne).toHaveBeenCalledWith({ id: 999 });
        expect(mockSelect).toHaveBeenCalledTimes(1); // select вызывался один раз
        expect(mockSelect).toHaveBeenCalledWith('_id');
        expect(mockLean).toHaveBeenCalledTimes(1); // lean вызывался один раз
    });

    // ---- ТЕСТ, КОТОРЫЙ ПАДАЛ ----
    it('[RU] should suggest a new russian word', async () => {
        const input: SuggestionInput = {
            text: 'НовоеСлово',
            language: 'russian',
            telegramUserId: 12345,
        };

        const expectedLeanResult = {
            _id: expect.any(Types.ObjectId),
            text: 'НовоеСлово',
            normalized_text: 'новоеслово',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            pre_translations: [],
            themes: [],
            createdAt: expect.any(Date),
        };

        // Настройка mockLean для этого теста ОСТАЕТСЯ ПРЕЖНЕЙ,
        // так как она определяет РЕЗУЛЬТАТЫ вызовов lean(),
        // а не саму цепочку вызовов.
        mockLean
            .mockResolvedValueOnce(mockUser) // 1. Результат lean() для поиска пользователя
            .mockResolvedValueOnce(null) // 2. Результат lean() для accepted Russian
            .mockResolvedValueOnce(null); // 3. Результат lean() для suggested Russian

        // Настройка моков конструктора, save и toObject (используем последнюю "упрощенную" версию)
        const mockDocInstance = { save: mockSave };
        MockSuggestedRussianConstructor.mockReturnValueOnce(mockDocInstance);

        const mockSavedDocInstance = {
            _id: new Types.ObjectId(),
            text: 'НовоеСлово',
            normalized_text: 'новоеслово',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockToObject,
        };
        mockSave.mockResolvedValueOnce(mockSavedDocInstance);
        // mockToObject - глобальная реализация

        // --- Выполнение и проверки ---
        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        const result = results[0];

        expect(result.status).toBe('newly_suggested'); // <--- Теперь должно работать!
        expect(result.message).toContain('успешно предложено');
        expect(result.word).toBeDefined();
        expect(result.word).toEqual(
            expect.objectContaining(expectedLeanResult),
        );
        expect(result.word?._id).toEqual(mockSavedDocInstance._id);
        expect(result.word?.createdAt).toEqual(mockSavedDocInstance.createdAt);
        expect(result.originalWord).toBe('НовоеСлово');

        // Проверки вызовов моков (остаются как были)
        expect(MockSuggestedRussianConstructor).toHaveBeenCalledTimes(1);
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(mockToObject).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockFindOne).toHaveBeenCalledTimes(3); // user, acceptedRu, suggestedRu
        expect(mockSelect).toHaveBeenCalledTimes(1); // Вызван ТОЛЬКО для поиска пользователя
        expect(mockLean).toHaveBeenCalledTimes(3); // Вызван для user, acceptedRu, suggestedRu
    });

    // --- Тесты для существующих слов (принятых и предложенных) ---
    // (Оставляем как есть, но убедимся, что моки findByIdAndUpdate возвращают lean-объекты)

    it('[RU] should add contributor to existing accepted russian word', async () => {
        const input: SuggestionInput = {
            text: 'Привет ', // С пробелом для проверки trim/normalize
            language: 'russian',
            telegramUserId: 54321, // ID нового пользователя
        };
        // Ожидаемый результат после обновления (новый контрибьютор добавлен)
        const mockUpdatedWordData: LeanAcceptedRussian = {
            ...mockExistingAcceptedRu,
            contributors: [
                ...(mockExistingAcceptedRu.contributors ?? []),
                mockNewUserIdMongo, // Добавляем нового пользователя
            ],
        };

        // Настройка моков для этого сценария:
        mockLean
            .mockResolvedValueOnce(mockNewUser) // 1. Найти пользователя (новый)
            .mockResolvedValueOnce(mockExistingAcceptedRu); // 2. Найти слово в accepted Russian

        // Мокируем findByIdAndUpdate, чтобы он возвращал обновленный lean-объект
        mockFindByIdAndUpdate.mockResolvedValueOnce(mockUpdatedWordData);

        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.status).toBe('accepted_exists');
        expect(result.message).toContain(
            'уже принято. Вы добавлены в соавторы', // Ожидаем сообщение об успешном добавлении
        );
        expect(result.word).toBeDefined();
        expect(result.word).toEqual(mockUpdatedWordData); // Сравниваем с ожидаемым обновленным объектом
        expect(result.originalWord).toBe('Привет'); // Без пробела

        // Проверки вызовов моков
        expect(mockFindOne).toHaveBeenCalledTimes(2); // user, acceptedRu
        expect(mockLean).toHaveBeenCalledTimes(2);
        expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
            existingAcceptedRuId, // ID найденного слова
            { $addToSet: { contributors: mockNewUserIdMongo } }, // Операция обновления
            { new: true, lean: true }, // Опции: вернуть новый документ, как lean-объект
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1); // Рейтинг должен быть добавлен
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: mockNewUserIdMongo,
            amount: RATING_POINTS.ACCEPTED_CONTRIBUTION,
        });
        expect(MockSuggestedRussianConstructor).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
    });

    it('[RU] should add contributor to existing suggested russian word', async () => {
        const input: SuggestionInput = {
            text: ' Пока', // С пробелом
            language: 'russian',
            telegramUserId: 54321, // Новый пользователь
        };
        const mockUpdatedWordData: LeanSuggestedRussian = {
            ...mockExistingSuggestedRu,
            contributors: [
                ...(mockExistingSuggestedRu.contributors ?? []),
                mockNewUserIdMongo,
            ],
        };

        // Настройка моков:
        mockLean
            .mockResolvedValueOnce(mockNewUser) // 1. Найти пользователя
            .mockResolvedValueOnce(null) // 2. Не найти в accepted Russian
            .mockResolvedValueOnce(mockExistingSuggestedRu); // 3. Найти в suggested Russian

        // Мокируем findByIdAndUpdate для предложенных слов
        mockFindByIdAndUpdate.mockResolvedValueOnce(mockUpdatedWordData);

        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.status).toBe('suggested_exists');
        expect(result.message).toContain(
            'уже предложено. Вы добавлены в контрибьюторы',
        );
        expect(result.word).toEqual(mockUpdatedWordData);
        expect(result.originalWord).toBe('Пока');

        // Проверки вызовов моков
        expect(mockFindOne).toHaveBeenCalledTimes(3); // user, acceptedRu, suggestedRu
        expect(mockLean).toHaveBeenCalledTimes(3);
        expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(1);
        // Проверяем, что findByIdAndUpdate вызывался для модели SuggestedWord
        // (мы не можем проверить саму модель напрямую легко, но можем проверить аргументы)
        expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
            existingSuggestedRuId,
            { $addToSet: { contributors: mockNewUserIdMongo } },
            { new: true, lean: true },
        );
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockAddRatingHandler.execute).toHaveBeenCalledWith({
            userObjectId: mockNewUserIdMongo,
            amount: RATING_POINTS.SUGGESTION_CONTRIBUTION, // Правильный рейтинг
        });
        expect(MockSuggestedRussianConstructor).not.toHaveBeenCalled();
        expect(mockSave).not.toHaveBeenCalled();
    });

    // --- Тесты для случаев, когда пользователь уже контрибьютор ---
    // (Оставляем без изменений, они проверяют отсутствие вызовов)

    it('[RU] should not add contributor or rating if already contributing to accepted word', async () => {
        const input: SuggestionInput = {
            text: 'привет', // Нормализованный текст совпадает с mockExistingAcceptedRu
            language: 'russian',
            telegramUserId: 12345, // ID пользователя, который УЖЕ в contributors
        };
        // Настройка моков:
        mockLean
            .mockResolvedValueOnce(mockUser) // 1. Найти пользователя (существующий)
            .mockResolvedValueOnce(mockExistingAcceptedRu); // 2. Найти слово в accepted

        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.status).toBe('accepted_exists');
        expect(result.message).toContain(
            'уже принято. Вы уже являетесь соавтором', // Ожидаем это сообщение
        );
        expect(result.word).toEqual(mockExistingAcceptedRu); // Слово не должно измениться
        expect(result.originalWord).toBe('привет');

        // Проверки отсутствия вызовов
        expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockAddRatingHandler.execute).not.toHaveBeenCalled();
        expect(mockFindOne).toHaveBeenCalledTimes(2); // user, acceptedRu
        expect(mockLean).toHaveBeenCalledTimes(2);
        expect(mockSave).not.toHaveBeenCalled();
    });

    it('[RU] should not add contributor or rating if already contributing to suggested word', async () => {
        const input: SuggestionInput = {
            text: 'пока', // Нормализованный текст совпадает с mockExistingSuggestedRu
            language: 'russian',
            telegramUserId: 12345, // Пользователь уже в contributors
        };
        // Настройка моков:
        mockLean
            .mockResolvedValueOnce(mockUser) // 1. Найти пользователя
            .mockResolvedValueOnce(null) // 2. Не найти в accepted
            .mockResolvedValueOnce(mockExistingSuggestedRu); // 3. Найти в suggested

        const results = await handler.execute(input);

        expect(results).toHaveLength(1);
        const result = results[0];
        expect(result.status).toBe('suggested_exists');
        expect(result.message).toContain(
            'уже предложено. Вы уже являетесь контрибьютором',
        );
        expect(result.word).toEqual(mockExistingSuggestedRu);
        expect(result.originalWord).toBe('пока');

        // Проверки отсутствия вызовов
        expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
        expect(mockAddRatingHandler.execute).not.toHaveBeenCalled();
        expect(mockFindOne).toHaveBeenCalledTimes(3); // user, acceptedRu, suggestedRu
        expect(mockLean).toHaveBeenCalledTimes(3);
        expect(mockSave).not.toHaveBeenCalled();
    });

    // --- Buryat Tests ---
    // (Аналогично русским, проверяем вызовы правильных моков и конструкторов)

    it('[BU] should suggest a new buryat word without dialect', async () => {
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
        };
        // Ожидаемый lean-объект в результате (используем для сравнения)
        const expectedLeanResult = {
            _id: expect.any(Types.ObjectId), // ID будет сгенерирован ниже
            text: 'Шэнэ Yгэ',
            normalized_text: 'шэнэ yгэ',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            dialect: null,
            pre_translations: [],
            themes: [],
            status: 'new',
            createdAt: expect.any(Date), // Дата будет сгенерирована ниже
        };

        // Мокируем поиск пользователя и слов (как и раньше)
        mockLean
            .mockResolvedValueOnce(mockUser) // User
            .mockResolvedValueOnce(null) // Accepted Bu
            .mockResolvedValueOnce(null); // Suggested Bu

        // --- ЯВНОЕ МОКИРОВАНИЕ ДЛЯ ЭТОГО ТЕСТА ---

        // 1. Создаем объект, который будет "возвращен" конструктором.
        //    Он должен иметь метод .save(), который будет специфичным для этого теста.
        const mockInstanceSave = jest.fn(); // <-- Специфичный мок save для этого экземпляра
        const mockDocInstance = {
            // Можно добавить поля, если они нужны для save, но метод важнее
            save: mockInstanceSave,
        };
        MockSuggestedBuryatConstructor.mockReturnValueOnce(mockDocInstance);

        // 2. Создаем объект, которым ДОЛЖЕН разрешиться промис от mockInstanceSave.
        //    Он представляет "сохраненный" документ и должен иметь метод .toObject().
        const mockInstanceToObject = jest.fn(); // <-- Специфичный мок toObject для этого экземпляра
        const mockSavedDocInstance = {
            _id: new Types.ObjectId(), // Генерируем ID здесь
            text: 'Шэнэ Yгэ',
            normalized_text: 'шэнэ yгэ',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            dialect: null,
            pre_translations: [],
            themes: [],
            createdAt: new Date(), // Генерируем дату здесь
            toObject: mockInstanceToObject, // Используем специфичный мок
        };
        // Настраиваем специфичный mockInstanceSave, чтобы он резолвился этим объектом
        mockInstanceSave.mockResolvedValueOnce(mockSavedDocInstance);

        // 3. Настраиваем специфичный mockInstanceToObject, чтобы он возвращал lean-версию
        //    (копируем данные из mockSavedDocInstance)
        const actualLeanResult = {
            _id: mockSavedDocInstance._id,
            text: mockSavedDocInstance.text,
            normalized_text: mockSavedDocInstance.normalized_text,
            author: mockSavedDocInstance.author,
            contributors: mockSavedDocInstance.contributors,
            status: mockSavedDocInstance.status,
            dialect: mockSavedDocInstance.dialect,
            pre_translations: mockSavedDocInstance.pre_translations,
            themes: mockSavedDocInstance.themes,
            createdAt: mockSavedDocInstance.createdAt,
        };
        mockInstanceToObject.mockReturnValueOnce(actualLeanResult);

        // 4. mockAddRatingHandler настроен в beforeEach на успех

        // --- КОНЕЦ ЯВНОГО МОКИРОВАНИЯ ---

        const results = await handler.execute(input);

        // --- Проверки ---
        expect(results).toHaveLength(1);
        const result = results[0];

        expect(result.status).toBe('newly_suggested'); // ПРОВЕРКА СТАТУСА
        expect(result.message).toContain('успешно предложено');
        expect(result.word).toBeDefined();
        // Сравниваем результат с тем, что вернул mockInstanceToObject
        expect(result.word).toEqual(actualLeanResult);
        // Можно также сравнить с expectedLeanResult (они должны быть идентичны по структуре)
        expect(result.word).toEqual(
            expect.objectContaining(expectedLeanResult),
        );
        expect(result.originalWord).toBe('Шэнэ Yгэ');

        // Проверяем вызовы СПЕЦИФИЧНЫХ моков
        expect(MockSuggestedBuryatConstructor).toHaveBeenCalledTimes(1);
        expect(mockInstanceSave).toHaveBeenCalledTimes(1);
        expect(mockInstanceToObject).toHaveBeenCalledTimes(1);

        // Проверяем вызовы других моков
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
        expect(mockLean).toHaveBeenCalledTimes(3); // User, AccBu, SugBu
        expect(mockFindOne).toHaveBeenCalledTimes(3); // User, AccBu, SugBu
        // Глобальные mockSave и mockToObject НЕ должны были вызываться в этом сценарии
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockToObject).not.toHaveBeenCalled();
    });

    it('[BU] should suggest a new buryat word with found dialect', async () => {
        // --- DETAILED LOGGING ADDED ---
        console.log('\n--- Test: [BU] suggest new with dialect START ---');
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
            dialect: ' Сарааг диалект ', // With spaces
        };
        // Expected lean result structure
        // const expectedLeanResult = {
        //     _id: expect.any(Types.ObjectId),
        //     text: 'Шэнэ Yгэ',
        //     normalized_text: 'шэнэ yгэ',
        //     author: testUserIdMongo,
        //     contributors: [testUserIdMongo],
        //     dialect: sargaagDialectId, // Expecting the dialect ID
        //     pre_translations: [],
        //     themes: [],
        //     status: 'new',
        //     createdAt: expect.any(Date),
        // };

        // Mocking the find chain for this specific test's sequence
        mockLean
            .mockResolvedValueOnce(mockUser) // 1. User lookup result
            .mockResolvedValueOnce(mockSargaagDialect) // 2. Dialect lookup result
            .mockResolvedValueOnce(null) // 3. Accepted Buryat lookup result
            .mockResolvedValueOnce(null); // 4. Suggested Buryat lookup result
        console.log(
            'mockLean configured for User, Dialect, AccBu, SugBu results',
        );

        // Explicit mocking for constructor, save, toObject
        const mockInstanceSave = jest.fn().mockImplementation(async () => {
            console.log('--> mockInstanceSave CALLED');
            console.log(
                '--> mockInstanceSave RESOLVING with mockSavedDocInstance',
            );
            return mockSavedDocInstance; // Defined below
        });
        const mockDocInstance = {
            // Include fields that might be accessed before save, if any
            text: 'Шэнэ Yгэ', // Example
            save: mockInstanceSave,
        };
        (MockSuggestedBuryatConstructor as jest.Mock).mockImplementationOnce(
            (data) => {
                console.log(
                    '--> MockSuggestedBuryatConstructor CALLED with data:',
                    data,
                );
                // Basic check on data passed to constructor
                expect(data.text).toBe('Шэнэ Yгэ');
                expect(data.normalized_text).toBe('шэнэ yгэ');
                expect(data.dialect).toEqual(sargaagDialectId); // Verify correct dialect ID
                expect(data.author).toEqual(testUserIdMongo);
                expect(data.status).toBe('new');
                return mockDocInstance;
            },
        );

        const mockInstanceToObject = jest.fn().mockImplementation(function () {
            console.log('--> mockInstanceToObject CALLED');
            // console.log('--> mockInstanceToObject context keys:', Object.keys(this)); // Optional: Check 'this' context
            console.log('--> mockInstanceToObject RETURNING actualLeanResult');
            return actualLeanResult; // Defined below
        });
        // Define the object that save() will resolve with
        const mockSavedDocInstance = {
            _id: new Types.ObjectId(),
            text: 'Шэнэ Yгэ',
            normalized_text: 'шэнэ yгэ',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            dialect: sargaagDialectId,
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockInstanceToObject, // Assign the specific mock function
        };
        // mockInstanceSave is already configured above

        // Define the object that toObject() will return
        const actualLeanResult = {
            _id: mockSavedDocInstance._id,
            text: mockSavedDocInstance.text,
            normalized_text: mockSavedDocInstance.normalized_text,
            author: mockSavedDocInstance.author,
            contributors: mockSavedDocInstance.contributors,
            status: mockSavedDocInstance.status,
            dialect: mockSavedDocInstance.dialect,
            pre_translations: mockSavedDocInstance.pre_translations,
            themes: mockSavedDocInstance.themes,
            createdAt: mockSavedDocInstance.createdAt,
        };
        // mockInstanceToObject is already configured above

        // Mock addRatingHandler explicitly for this test with logging
        mockAddRatingHandler.execute.mockImplementationOnce(async (args) => {
            console.log(
                '--> mockAddRatingHandler.execute CALLED with args:',
                args,
            );
            expect(args.userObjectId).toEqual(testUserIdMongo);
            expect(args.amount).toBe(RATING_POINTS.NEW_SUGGESTION);
            console.log('--> mockAddRatingHandler.execute RESOLVING');
            return mockNewUser as TelegramUserDocument; // <-- Cast the return value here
        });
        // --- END EXPLICIT MOCKING ---

        try {
            console.log('--> Calling handler.execute...');
            const results = await handler.execute(input);
            console.log(
                '--> handler.execute FINISHED. Results:',
                JSON.stringify(results, null, 2),
            ); // Log results nicely

            expect(results).toHaveLength(1);
            const result = results[0];
            console.log('--> Single result:', JSON.stringify(result, null, 2));

            // Assertions
            console.log(
                `--> Asserting: status (${result.status}) toBe 'newly_suggested'`,
            );
            expect(result.status).toBe('newly_suggested'); // <<< The failing check

            console.log('--> Asserting: message contains "успешно предложено"');
            expect(result.message).toContain('успешно предложено');

            console.log('--> Asserting: word is defined');
            expect(result.word).toBeDefined();

            console.log('--> Asserting: word matches lean result');
            expect(result.word).toEqual(actualLeanResult); // Compare with what toObject returned

            console.log('--> Asserting: originalWord is correct');
            expect(result.originalWord).toBe('Шэнэ Yгэ');

            // Verify mock calls
            console.log('--> Verifying mock calls...');
            expect(MockSuggestedBuryatConstructor).toHaveBeenCalledTimes(1);
            expect(mockInstanceSave).toHaveBeenCalledTimes(1);
            expect(mockInstanceToObject).toHaveBeenCalledTimes(1);
            expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);
            expect(mockLean).toHaveBeenCalledTimes(4); // User, Dialect, AccBu, SugBu
            expect(mockFindOne).toHaveBeenCalledTimes(4); // User, Dialect, AccBu, SugBu
            // Global mocks should NOT have been called for save/toObject in this test
            expect(mockSave).not.toHaveBeenCalled();
            expect(mockToObject).not.toHaveBeenCalled();
            console.log('--> Mock calls verified.');
        } catch (e) {
            console.error('\n--- Test FAILED with unexpected error: ---', e);
            throw e; // Rethrow
        } finally {
            console.log('--- Test: [BU] suggest new with dialect END ---\n');
        }
    });

    it('[BU] should suggest a new buryat word when dialect name not found', async () => {
        const input: SuggestionInput = {
            text: 'Шэнэ Yгэ',
            language: 'buryat',
            telegramUserId: 12345,
            dialect: 'Неизвестный Диалект',
        };
        // Ожидаемый lean-объект
        const expectedLeanResult = {
            _id: expect.any(Types.ObjectId),
            text: 'Шэнэ Yгэ',
            normalized_text: 'шэнэ yгэ',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            dialect: null, // <-- Ожидаем null
            pre_translations: [],
            themes: [],
            status: 'new',
            createdAt: expect.any(Date),
        };

        // Мокируем поиск пользователя, диалекта (не найден) и слов (не найдены)
        mockLean
            .mockResolvedValueOnce(mockUser) // 1. User
            .mockResolvedValueOnce(null) // 2. Dialect NOT FOUND
            .mockResolvedValueOnce(null) // 3. Accepted Buryat
            .mockResolvedValueOnce(null); // 4. Suggested Buryat

        // --- Явное мокирование для создания слова ---
        const mockInstanceSave = jest.fn();
        const mockInstanceToObject = jest.fn();
        const mockDocInstance = { save: mockInstanceSave };
        const mockSavedDocInstance = {
            _id: new Types.ObjectId(),
            text: 'Шэнэ Yгэ',
            normalized_text: 'шэнэ yгэ',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            dialect: null, // <-- Диалект null в "сохраненном" объекте
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockInstanceToObject,
        };
        const actualLeanResult = { ...mockSavedDocInstance };
        delete (actualLeanResult as any).toObject;
        mockInstanceSave.mockResolvedValueOnce(mockSavedDocInstance);
        mockInstanceToObject.mockReturnValueOnce(actualLeanResult);

        // Настраиваем мок конструктора
        (MockSuggestedBuryatConstructor as jest.Mock).mockImplementationOnce(
            (data) => {
                expect(data.text).toBe('Шэнэ Yгэ');
                expect(data.dialect).toBeNull(); // <-- Проверяем, что конструктор вызван с null диалектом
                return mockDocInstance;
            },
        );

        // --- КОНЕЦ ЯВНОГО МОКИРОВАНИЯ ---

        const results = await handler.execute(input);

        // --- ПРОВЕРКА РЕЗУЛЬТАТОВ ---
        expect(results).toHaveLength(1);
        const result = results[0];

        expect(result.status).toBe('newly_suggested'); // <--- Проверка статуса
        expect(result.message).toContain('успешно предложено');
        expect(result.word).toBeDefined();
        // Сравниваем с тем, что вернул toObject
        expect(result.word).toEqual(actualLeanResult);
        // Сравниваем с ожидаемой структурой
        expect(result.word).toEqual(
            expect.objectContaining(expectedLeanResult),
        );
        expect(result.originalWord).toBe('Шэнэ Yгэ');

        // --- ПРОВЕРКА ВЫЗОВОВ МОКОВ ---
        expect(MockSuggestedBuryatConstructor).toHaveBeenCalledTimes(1);
        // Проверяем аргументы конструктора более детально
        expect(MockSuggestedBuryatConstructor).toHaveBeenCalledWith(
            expect.objectContaining({
                text: 'Шэнэ Yгэ',
                normalized_text: 'шэнэ yгэ',
                author: testUserIdMongo,
                contributors: [testUserIdMongo],
                status: 'new',
                dialect: null, // Убеждаемся, что передан null
            }),
        );

        // Проверяем специфичные моки
        expect(mockInstanceSave).toHaveBeenCalledTimes(1);
        expect(mockInstanceToObject).toHaveBeenCalledTimes(1);

        // Глобальные не вызывались
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockToObject).not.toHaveBeenCalled();

        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(1);

        // Поиски: user, dialect, acceptedBu, suggestedBu
        expect(mockFindOne).toHaveBeenCalledTimes(4);
        expect(mockLean).toHaveBeenCalledTimes(4);

        // Проверяем, что был поиск диалекта по имени
        expect(mockFindOne).toHaveBeenCalledWith({
            name: 'Неизвестный Диалект',
        });

        // Проверяем лог предупреждения о ненайденном диалекте
        expect(mockLogger.warn).toHaveBeenCalledTimes(1); // Убедимся, что вызван ровно один раз
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                'Dialect with name "Неизвестный Диалект" not found',
            ),
        );
    });

    // --- Multiple words / Error Tests ---

    it('should process multiple words in one request (language: russian)', async () => {
        const input: SuggestionInput = {
            text: ' НовоеRU , ШэнэBU , привет , новоеслово2 ', // 4 слова
            language: 'russian',
            telegramUserId: 12345, // Пользователь, который ЯВЛЯЕТСЯ контрибьютором 'привет'
        };

        // Мокируем поиск пользователя и проверки для всех слов
        mockLean
            // User
            .mockResolvedValueOnce(mockUser)
            // Word 1: "НовоеRU" -> new
            .mockResolvedValueOnce(null) // accepted? No
            .mockResolvedValueOnce(null) // suggested? No
            // Word 2: "ШэнэBU" -> new
            .mockResolvedValueOnce(null) // accepted? No
            .mockResolvedValueOnce(null) // suggested? No
            // Word 3: "привет" -> accepted_exists (found)
            .mockResolvedValueOnce(mockExistingAcceptedRu)
            // Word 4: "новоеслово2" -> new
            .mockResolvedValueOnce(null) // accepted? No
            .mockResolvedValueOnce(null); // suggested? No

        // --- Явное мокирование для КАЖДОГО создаваемого слова ---

        // --- Слово 1: "НовоеRU" ---
        const mockInstanceSave1 = jest.fn();
        const mockInstanceToObject1 = jest.fn();
        const mockDocInstance1 = { save: mockInstanceSave1 };
        const mockSavedDocInstance1 = {
            _id: new Types.ObjectId(),
            text: 'НовоеRU',
            normalized_text: 'новоеru',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockInstanceToObject1,
        };
        const actualLeanResult1 = { ...mockSavedDocInstance1 };
        delete (actualLeanResult1 as any).toObject;
        mockInstanceSave1.mockResolvedValueOnce(mockSavedDocInstance1);
        mockInstanceToObject1.mockReturnValueOnce(actualLeanResult1);

        // --- Слово 2: "ШэнэBU" ---
        const mockInstanceSave2 = jest.fn();
        const mockInstanceToObject2 = jest.fn();
        const mockDocInstance2 = { save: mockInstanceSave2 };
        const mockSavedDocInstance2 = {
            _id: new Types.ObjectId(),
            text: 'ШэнэBU',
            normalized_text: 'шэнэbu',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockInstanceToObject2,
        };
        const actualLeanResult2 = { ...mockSavedDocInstance2 };
        delete (actualLeanResult2 as any).toObject;
        mockInstanceSave2.mockResolvedValueOnce(mockSavedDocInstance2);
        mockInstanceToObject2.mockReturnValueOnce(actualLeanResult2);

        // --- Слово 3: "привет" ---
        // Ничего не создается. findByIdAndUpdate не будет вызван, т.к. user 12345 уже контрибьютор.

        // --- Слово 4: "новоеслово2" ---
        const mockInstanceSave3 = jest.fn();
        const mockInstanceToObject3 = jest.fn();
        const mockDocInstance3 = { save: mockInstanceSave3 };
        const mockSavedDocInstance3 = {
            _id: new Types.ObjectId(),
            text: 'новоеслово2',
            normalized_text: 'новоеслово2',
            author: testUserIdMongo,
            contributors: [testUserIdMongo],
            status: 'new',
            pre_translations: [],
            themes: [],
            createdAt: new Date(),
            toObject: mockInstanceToObject3,
        };
        const actualLeanResult3 = { ...mockSavedDocInstance3 };
        delete (actualLeanResult3 as any).toObject;
        mockInstanceSave3.mockResolvedValueOnce(mockSavedDocInstance3);
        mockInstanceToObject3.mockReturnValueOnce(actualLeanResult3);

        // Настраиваем мок конструктора, чтобы он возвращал нужные экземпляры ПОСЛЕДОВАТЕЛЬНО
        (MockSuggestedRussianConstructor as jest.Mock)
            .mockImplementationOnce((data) => {
                // Для "НовоеRU"
                expect(data.text).toBe('НовоеRU');
                return mockDocInstance1;
            })
            .mockImplementationOnce((data) => {
                // Для "ШэнэBU"
                expect(data.text).toBe('ШэнэBU');
                return mockDocInstance2;
            })
            .mockImplementationOnce((data) => {
                // Для "новоеслово2"
                expect(data.text).toBe('новоеслово2');
                return mockDocInstance3;
            });

        // mockAddRatingHandler настроен в beforeEach на успех

        // --- КОНЕЦ ЯВНОГО МОКИРОВАНИЯ ---

        const results = await handler.execute(input);

        // --- ПРОВЕРКА РЕЗУЛЬТАТОВ ---
        expect(results).toHaveLength(4);

        // Проверяем статусы
        expect(results.map((r) => r.status)).toEqual([
            'newly_suggested', // НовоеRU
            'newly_suggested', // ШэнэBU
            'accepted_exists', // привет
            'newly_suggested', // новоеслово2
        ]);

        // Проверяем ID слов
        expect(results[0].word?._id).toEqual(mockSavedDocInstance1._id);
        expect(results[1].word?._id).toEqual(mockSavedDocInstance2._id);
        expect(results[2].word?._id).toEqual(existingAcceptedRuId); // ID существующего слова
        expect(results[3].word?._id).toEqual(mockSavedDocInstance3._id);

        // Проверяем сами объекты слов (опционально, но полезно)
        expect(results[0].word).toEqual(actualLeanResult1);
        expect(results[1].word).toEqual(actualLeanResult2);
        expect(results[2].word).toEqual(mockExistingAcceptedRu); // Существующее слово не менялось
        expect(results[3].word).toEqual(actualLeanResult3);

        // Проверяем оригинальные слова
        expect(results.map((r) => r.originalWord)).toEqual([
            'НовоеRU',
            'ШэнэBU',
            'привет',
            'новоеслово2',
        ]);

        // --- ПРОВЕРКА ВЫЗОВОВ МОКОВ ---
        expect(MockSuggestedRussianConstructor).toHaveBeenCalledTimes(3); // 3 создания

        // Проверяем вызовы специфичных моков save
        expect(mockInstanceSave1).toHaveBeenCalledTimes(1);
        expect(mockInstanceSave2).toHaveBeenCalledTimes(1);
        expect(mockInstanceSave3).toHaveBeenCalledTimes(1);

        // Проверяем вызовы специфичных моков toObject
        expect(mockInstanceToObject1).toHaveBeenCalledTimes(1);
        expect(mockInstanceToObject2).toHaveBeenCalledTimes(1);
        expect(mockInstanceToObject3).toHaveBeenCalledTimes(1);

        // Глобальные save/toObject не должны были вызываться
        expect(mockSave).not.toHaveBeenCalled();
        expect(mockToObject).not.toHaveBeenCalled();

        // AddRating: 3 раза для новых слов.
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(3);

        // findByIdAndUpdate не вызывался
        expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();

        // findOne/lean: 1 (user) + 2 (W1) + 2 (W2) + 1 (W3) + 2 (W4) = 8
        expect(mockFindOne).toHaveBeenCalledTimes(8);
        expect(mockLean).toHaveBeenCalledTimes(8);
    });

    // ---- ТЕСТ С ОШИБКОЙ БАЗЫ ДАННЫХ ---
    it('should return error status for words causing database errors during creation', async () => {
        const input: SuggestionInput = {
            text: 'Слово1,Слово2Err,Слово3', // 3 слова
            language: 'russian',
            telegramUserId: 12345,
        };
        // Создаем исходную ошибку, которую будет имитировать сбой save()
        const originalDbError = new Error('Simulated DB save error'); // Можно использовать базовый Error
        // Или, если важно проверить передачу cause, оставим DatabaseError:
        // const originalDbError = new DatabaseError('Simulated DB save error');

        // Мокируем поиск пользователя и проверку существующих слов для всех трех
        mockLean
            .mockResolvedValueOnce(mockUser) // User
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null) // Word 1 check
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null) // Word 2 check
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null); // Word 3 check

        // --- Явное мокирование для КАЖДОГО слова ---

        // --- Слово 1: Успех ---
        const mockInstanceSave1 = jest.fn();
        const mockInstanceToObject1 = jest.fn();
        const mockDocInstance1 = { save: mockInstanceSave1 };
        const mockSavedDocInstance1 = {
            /* ... данные ... */ toObject: mockInstanceToObject1,
        };
        const actualLeanResult1 = { ...mockSavedDocInstance1 };
        delete (actualLeanResult1 as any).toObject;
        mockInstanceSave1.mockResolvedValueOnce(mockSavedDocInstance1);
        mockInstanceToObject1.mockReturnValueOnce(actualLeanResult1);

        // --- Слово 2: Ошибка Save ---
        const mockInstanceSave2 = jest.fn();
        const mockDocInstance2 = { save: mockInstanceSave2 };
        // Настраиваем специфичный save на ошибку (используем originalDbError)
        mockInstanceSave2.mockRejectedValueOnce(originalDbError);

        // --- Слово 3: Успех ---
        const mockInstanceSave3 = jest.fn();
        const mockInstanceToObject3 = jest.fn();
        const mockDocInstance3 = { save: mockInstanceSave3 };
        const mockSavedDocInstance3 = {
            /* ... данные ... */ toObject: mockInstanceToObject3,
        };
        const actualLeanResult3 = { ...mockSavedDocInstance3 };
        delete (actualLeanResult3 as any).toObject;
        mockInstanceSave3.mockResolvedValueOnce(mockSavedDocInstance3);
        mockInstanceToObject3.mockReturnValueOnce(actualLeanResult3);

        // Настраиваем мок конструктора
        (MockSuggestedRussianConstructor as jest.Mock)
            .mockImplementationOnce(() => mockDocInstance1)
            .mockImplementationOnce(() => mockDocInstance2)
            .mockImplementationOnce(() => mockDocInstance3);

        // --- КОНЕЦ ЯВНОГО МОКИРОВАНИЯ ---

        const results = await handler.execute(input);

        // --- ПРОВЕРКА РЕЗУЛЬТАТОВ ---
        expect(results).toHaveLength(3);

        // Слово 1: Успех
        expect(results[0].status).toBe('newly_suggested');
        expect(results[0].word).toEqual(actualLeanResult1);
        expect(results[0].originalWord).toBe('Слово1');

        // Слово 2: Ошибка
        expect(results[1].status).toBe('error');
        expect(results[1].originalWord).toBe('Слово2Err');
        expect(results[1].word).toBeUndefined();
        // Проверяем ФИНАЛЬНОЕ сообщение, которое формируется в execute()
        expect(results[1].message).toBe(
            // Точное совпадение строки
            `Ошибка при обработке слова "Слово2Err": Failed to create new Russian suggestion: Simulated DB save error`,
        );
        // Можно также проверить его части, если нужно
        expect(results[1].message).toContain(
            'Ошибка при обработке слова "Слово2Err"',
        );
        expect(results[1].message).toContain(
            'Failed to create new Russian suggestion: Simulated DB save error',
        );

        // Слово 3: Успех
        expect(results[2].status).toBe('newly_suggested');
        expect(results[2].word).toEqual(actualLeanResult3);
        expect(results[2].originalWord).toBe('Слово3');

        // --- ПРОВЕРКА ВЫЗОВОВ МОКОВ ---
        expect(MockSuggestedRussianConstructor).toHaveBeenCalledTimes(3);
        expect(mockInstanceSave1).toHaveBeenCalledTimes(1);
        expect(mockInstanceSave2).toHaveBeenCalledTimes(1); // Вызван, но упал
        expect(mockInstanceSave3).toHaveBeenCalledTimes(1);
        expect(mockInstanceToObject1).toHaveBeenCalledTimes(1);
        // mockInstanceToObject2 не должен был быть вызван
        expect(mockInstanceToObject3).toHaveBeenCalledTimes(1);
        expect(mockSave).not.toHaveBeenCalled(); // Глобальный не вызывался
        expect(mockToObject).not.toHaveBeenCalled(); // Глобальный не вызывался
        expect(mockAddRatingHandler.execute).toHaveBeenCalledTimes(2); // Только для успеха

        // --- ПРОВЕРКА ЛОГИРОВАНИЯ ---
        // 1. Лог из catch блока _createNewSuggestedRussian
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                'Error creating new Russian suggestion for "Слово2Err"',
            ),
            originalDbError, // Логируется ИСХОДНАЯ ошибка
        );
        // 2. Лог из catch блока execute
        const executeErrorLogCall = mockLogger.error.mock.calls.find(
            (call) =>
                typeof call[0] === 'string' &&
                call[0].includes('Failed to process suggestion "Слово2Err"'),
        );
        expect(executeErrorLogCall).toBeDefined();
        // Проверяем ошибку, пойманную в execute: это ДОЛЖНА быть та DatabaseError,
        // которую сгенерировал catch в _createNewSuggestedRussian
        expect(executeErrorLogCall?.[1]?.originalError).toBeInstanceOf(
            DatabaseError,
        );
        expect(executeErrorLogCall?.[1]?.originalError?.message).toBe(
            `Failed to create new Russian suggestion: Simulated DB save error`, // Сообщение созданной DatabaseError
        );
        // Проверяем, что cause этой ошибки - наша исходная originalDbError
        expect(executeErrorLogCall?.[1]?.originalError?.cause).toBe(
            originalDbError,
        );

        // Проверки поиска
        expect(mockFindOne).toHaveBeenCalledTimes(7);
        expect(mockLean).toHaveBeenCalledTimes(7);
    });
});
