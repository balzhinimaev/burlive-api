// src/services/vocabulary/handlers/findTranslationHandler.test.ts

// ... (imports and mocks remain the same) ...
import { Types } from 'mongoose';
import { FindTranslationHandler } from '../handlers/findTranslationHandler';
import { FindTranslationInput } from '../interfaces/findTranslation.interface';
import { NotFoundError } from '../../../errors/customErrors';
import { AcceptedWordType } from '../../../types/vocabulary.types';
import { BURLANG_API_BASE_URL } from '../../../config/constants'; // Import for clarity

// --- Моки зависимостей ---

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockLean = jest.fn();
const mockPopulate = jest.fn(() => ({ lean: mockLean }));
const mockSelect = jest.fn();

const mockTelegramUserModel = {
    findOne: jest.fn(() => ({ select: mockSelect })),
};
const mockAcceptedWordRussianModel = {
    findOne: jest.fn(() => ({ populate: mockPopulate })),
};
const mockAcceptedWordBuryatModel = {
    findOne: jest.fn(() => ({ populate: mockPopulate })),
};
const mockSearchedWordRussianModel = {
    findOneAndUpdate: jest.fn(),
};
const mockSearchedWordBuryatModel = {
    findOneAndUpdate: jest.fn(),
};
const mockSearchedWordHistorySave = jest.fn();
const mockSearchedWordHistoryModel = jest.fn().mockImplementation(() => ({
    save: mockSearchedWordHistorySave,
}));

// Cast mocks to any to simplify typing in tests
const typedMockTelegramUserModel = mockTelegramUserModel as any;
const typedMockAcceptedWordRussianModel = mockAcceptedWordRussianModel as any;
const typedMockAcceptedWordBuryatModel = mockAcceptedWordBuryatModel as any;
const typedMockSearchedWordRussianModel = mockSearchedWordRussianModel as any;
const typedMockSearchedWordBuryatModel = mockSearchedWordBuryatModel as any;
const typedMockSearchedWordHistoryModel = mockSearchedWordHistoryModel as any;
const typedMockLogger = mockLogger as any;

// --- Тестовый набор ---

describe('FindTranslationHandler', () => {
    let handler: FindTranslationHandler;
    let mockInput: FindTranslationInput;
    let mockUser: any;
    let mockFoundWordBuryat: AcceptedWordType;
    let mockFoundWordRussian: AcceptedWordType;

    const USER_INPUT_RUS = 'Привет';
    const NORMALIZED_INPUT_RUS = 'привет';
    const USER_INPUT_BUR = 'Мэндэ';
    const NORMALIZED_INPUT_BUR = 'мэндэ';
    const TELEGRAM_USER_ID = 12345;
    const BURLANG_TRANSLATION = 'Сайн байна';

    beforeEach(() => {
        jest.clearAllMocks();
        // No need to clear mockFetch here if global.fetch is reassigned
        // mockFetch.mockClear(); // Redundant if using global.fetch = mockFetch

        handler = new FindTranslationHandler(
            typedMockTelegramUserModel,
            typedMockAcceptedWordRussianModel,
            typedMockAcceptedWordBuryatModel,
            typedMockSearchedWordRussianModel,
            typedMockSearchedWordBuryatModel,
            typedMockSearchedWordHistoryModel,
            typedMockLogger,
            // fetch // If fetch were injected, pass mockFetch here
        );

        mockInput = {
            userInput: USER_INPUT_RUS,
            targetLanguage: 'buryat',
            sourceLanguage: 'russian',
            telegramUserId: TELEGRAM_USER_ID,
        };

        mockUser = { _id: new Types.ObjectId() };
        // Ensure the mock chain resolves the user
        // Resetting the mock function implementation for findOne -> select
        typedMockTelegramUserModel.findOne.mockImplementation(() => ({
            select: mockSelect.mockResolvedValue(mockUser),
        }));

        // Simplified mock word creation using 'as any'
        mockFoundWordRussian = {
            _id: new Types.ObjectId(),
            text: USER_INPUT_RUS,
            normalized_text: NORMALIZED_INPUT_RUS,
            language: 'russian',
            translations: [
                {
                    _id: new Types.ObjectId(),
                    text: 'Мэндэ',
                    normalized_text: 'мэндэ',
                    language: 'buryat',
                } as any,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        mockFoundWordBuryat = {
            _id: new Types.ObjectId(),
            text: USER_INPUT_BUR,
            normalized_text: NORMALIZED_INPUT_BUR,
            language: 'buryat',
            translations: [
                {
                    _id: new Types.ObjectId(),
                    text: 'Привет',
                    normalized_text: 'привет',
                    language: 'russian',
                } as any,
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        // Reset mock implementations for models used in loops/multiple tests
        typedMockAcceptedWordRussianModel.findOne.mockImplementation(() => ({
            populate: mockPopulate,
        }));
        typedMockAcceptedWordBuryatModel.findOne.mockImplementation(() => ({
            populate: mockPopulate,
        }));
        mockPopulate.mockImplementation(() => ({
            // Reset populate -> lean chain
            lean: mockLean,
        }));

        mockSearchedWordRussianModel.findOneAndUpdate.mockResolvedValue({
            _id: new Types.ObjectId(),
            text: USER_INPUT_RUS,
        });
        mockSearchedWordBuryatModel.findOneAndUpdate.mockResolvedValue({
            _id: new Types.ObjectId(),
            text: USER_INPUT_BUR,
        });
        mockSearchedWordHistorySave.mockResolvedValue({});
        // Reset fetch mock implementation for each test
        mockFetch.mockReset();
    });

    // --- Тесты (с исправлениями) ---

    it('should return nulls for empty user input and log warning', async () => {
        const input: FindTranslationInput = { ...mockInput, userInput: '  ' };
        const result = await handler.execute(input);

        expect(result).toEqual({ burlangdb: null, burlivedb: null });
        expect(mockLogger.warn).toHaveBeenCalledWith(
            'FindTranslationHandler: Received empty user input.',
        );
        expect(mockTelegramUserModel.findOne).not.toHaveBeenCalled();
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user is not found', async () => {
        // Arrange: Make findOne -> select resolve to null
        typedMockTelegramUserModel.findOne.mockImplementation(() => ({
            select: mockSelect.mockResolvedValue(null),
        }));

        // Act & Assert
        await expect(handler.execute(mockInput)).rejects.toThrow(NotFoundError);
        // Optionally check the error message again if needed, but checking the type is often sufficient
        await expect(handler.execute(mockInput)).rejects.toThrow(
            `User with Telegram ID ${TELEGRAM_USER_ID} not found.`,
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `User with Telegram ID ${TELEGRAM_USER_ID} not found.`,
            ),
        );
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
            id: TELEGRAM_USER_ID,
        });
        expect(mockSelect).toHaveBeenCalledWith('_id');
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockAcceptedWordRussianModel.findOne).not.toHaveBeenCalled();
    });

    it('should return results from both own DB (Russian) and Burlang API', async () => {
        // Arrange
        mockLean.mockResolvedValue(mockFoundWordRussian); // Word found in our DB
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest
                .fn()
                .mockResolvedValueOnce({
                    translations: [{ value: BURLANG_TRANSLATION }],
                }),
            status: 200,
            statusText: 'OK', // Added for completeness if needed elsewhere
        }); // Word found in Burlang

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        expect(result).toEqual({
            burlangdb: BURLANG_TRANSLATION,
            burlivedb: mockFoundWordRussian,
        });

        // Check calls
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith({
            id: TELEGRAM_USER_ID,
        });
        expect(mockAcceptedWordRussianModel.findOne).toHaveBeenCalledWith({
            normalized_text: NORMALIZED_INPUT_RUS,
        });
        expect(mockPopulate).toHaveBeenCalled();
        expect(mockLean).toHaveBeenCalled();
        expect(mockAcceptedWordBuryatModel.findOne).not.toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        // FIX 1: Check for the encoded URL
        expect(mockFetch).toHaveBeenCalledWith(
            `${BURLANG_API_BASE_URL}/russian-word/translate?q=${encodeURIComponent(NORMALIZED_INPUT_RUS)}`, // Use encoded string
            expect.objectContaining({
                // Check essential options
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal: expect.any(AbortSignal), // Check that a signal was passed
            }),
        );
        // Check history update
        expect(
            mockSearchedWordRussianModel.findOneAndUpdate,
        ).toHaveBeenCalledWith(
            { normalized_text: NORMALIZED_INPUT_RUS },
            expect.objectContaining({ $addToSet: { users: mockUser._id } }),
            expect.objectContaining({ upsert: true, new: true }),
        );
        expect(mockSearchedWordHistoryModel).toHaveBeenCalledWith(
            expect.objectContaining({
                user: mockUser._id,
                target_language: 'buryat',
            }),
        );
        expect(mockSearchedWordHistorySave).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('successful for "Привет"'),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInOwnDB: Found'),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInBurlang: Found translation'),
        );
    });

    it('should return results from own DB (Buryat) and null from Burlang API if not found there', async () => {
        // Arrange
        const input: FindTranslationInput = {
            userInput: USER_INPUT_BUR,
            targetLanguage: 'russian',
            sourceLanguage: 'buryat',
            telegramUserId: TELEGRAM_USER_ID,
        };
        mockLean.mockResolvedValue(mockFoundWordBuryat); // Found in own DB
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ translations: [] }), // Not found in Burlang
        });

        // Act
        const result = await handler.execute(input);

        // Assert
        expect(result).toEqual({
            burlangdb: null,
            burlivedb: mockFoundWordBuryat,
        });
        expect(mockAcceptedWordBuryatModel.findOne).toHaveBeenCalledWith({
            normalized_text: NORMALIZED_INPUT_BUR,
        });
        expect(mockPopulate).toHaveBeenCalled();
        expect(mockLean).toHaveBeenCalled();
        expect(mockAcceptedWordRussianModel.findOne).not.toHaveBeenCalled();
        expect(mockFetch).toHaveBeenCalledTimes(1);
        // FIX 2: Check for the encoded URL
        expect(mockFetch).toHaveBeenCalledWith(
            `${BURLANG_API_BASE_URL}/buryat-word/translate?q=${encodeURIComponent(NORMALIZED_INPUT_BUR)}`, // Use encoded string
            expect.objectContaining({ method: 'GET' }),
        );
        expect(
            mockSearchedWordBuryatModel.findOneAndUpdate,
        ).toHaveBeenCalledWith(
            { normalized_text: NORMALIZED_INPUT_BUR },
            expect.objectContaining({ $addToSet: { users: mockUser._id } }),
            expect.any(Object),
        );
        expect(mockSearchedWordHistoryModel).toHaveBeenCalled();
        expect(mockSearchedWordHistorySave).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('successful for "Мэндэ"'),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInBurlang: No translation found'),
        );
    });

    it('should return result from Burlang and null from own DB if not found there', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Not found in own DB
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest
                .fn()
                .mockResolvedValueOnce({
                    translations: [{ value: BURLANG_TRANSLATION }],
                }), // Found in Burlang
        });

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        expect(result).toEqual({
            burlangdb: BURLANG_TRANSLATION,
            burlivedb: null,
        });
        expect(mockAcceptedWordRussianModel.findOne).toHaveBeenCalledWith({
            normalized_text: NORMALIZED_INPUT_RUS,
        });
        expect(mockFetch).toHaveBeenCalledTimes(1);
        // FIX 1 (repeated): Check encoded URL
        expect(mockFetch).toHaveBeenCalledWith(
            `${BURLANG_API_BASE_URL}/russian-word/translate?q=${encodeURIComponent(NORMALIZED_INPUT_RUS)}`,
            expect.any(Object),
        );
        expect(mockSearchedWordHistorySave).toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInOwnDB: Did not find'),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInBurlang: Found translation'),
        );
    });

    it('should return nulls if word not found anywhere', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Not in own DB
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ translations: [] }), // Not in Burlang
        });

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        expect(result).toEqual({ burlangdb: null, burlivedb: null });
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInOwnDB: Did not find'),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('_findInBurlang: No translation found'),
        );
    });

    it('should handle Burlang API fetch network error gracefully', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Own DB search resolves (finds nothing)
        const networkError = new Error('Network connection failed');
        mockFetch.mockRejectedValueOnce(networkError); // Burlang fetch fails

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        // _findInBurlang catches the error and returns the network error string
        // Promise.all resolves because the error was handled internally
        expect(result).toEqual({
            burlangdb: 'Ошибка сети при запросе к Burlang',
            burlivedb: null,
        });
        // Check that _findInBurlang logged the error
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `_findInBurlang: Fetch error for "${NORMALIZED_INPUT_RUS}": ${networkError.message}`,
            ),
            networkError,
        );
        // Ensure the main execute catch block was NOT triggered
        expect(mockLogger.error).not.toHaveBeenCalledWith(
            expect.stringContaining(
                `FindTranslationHandler: Error for "${USER_INPUT_RUS}"`,
            ),
            expect.any(Error),
        );
    });

    it('should handle Burlang API timeout error gracefully', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Own DB search resolves
        // FIX 3: Create error with name 'AbortError'
        const abortError = new Error('The operation was aborted.'); // Use standard Error
        abortError.name = 'AbortError'; // Manually set the name
        mockFetch.mockRejectedValueOnce(abortError); // Burlang fetch rejects with this error

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        // _findInBurlang catches the error, identifies it as AbortError, returns timeout string
        // Promise.all resolves
        expect(result).toEqual({
            burlangdb: 'Тайм-аут при запросе к Burlang', // Expect the specific timeout message
            burlivedb: null,
        });
        // Check that _findInBurlang logged the specific timeout error
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `_findInBurlang: Request timed out for "${NORMALIZED_INPUT_RUS}".`,
            ),
            abortError, // Check that the correct error object was logged
        );
        // Ensure the generic network error message wasn't logged by _findInBurlang
        expect(mockLogger.error).not.toHaveBeenCalledWith(
            expect.stringContaining(`_findInBurlang: Fetch error for`),
            expect.any(Error),
        );
        // Ensure the main execute catch block was NOT triggered
        expect(mockLogger.error).not.toHaveBeenCalledWith(
            expect.stringContaining(`FindTranslationHandler: Error for`),
            expect.any(Error),
        );
    });

    it('should handle Burlang API non-ok response gracefully', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Own DB search resolves
        mockFetch.mockResolvedValueOnce({
            ok: false, // Burlang request fails (e.g., 404)
            status: 404,
            statusText: 'Not Found',
            json: jest.fn(), // Mock json even if not used in this path
        });

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        // _findInBurlang handles non-ok response and returns null
        // Promise.all resolves
        expect(result).toEqual({
            burlangdb: null, // Expect null because the request wasn't ok
            burlivedb: null,
        });
        // Check for the warning log
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                `_findInBurlang: API request failed for "${NORMALIZED_INPUT_RUS}" with status: 404 Not Found`,
            ),
        );
    });

    it('should handle error during own DB search gracefully', async () => {
        // Arrange
        const dbError = new Error('Database connection error');
        mockLean.mockRejectedValue(dbError); // Simulate DB error during .lean()
        // Burlang search succeeds
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest
                .fn()
                .mockResolvedValueOnce({
                    translations: [{ value: BURLANG_TRANSLATION }],
                }),
        });

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        // FIX 4: _findInOwnDB catches the error and returns null. Promise.all resolves.
        expect(result).toEqual({
            burlangdb: BURLANG_TRANSLATION, // Burlang succeeded
            burlivedb: null, // _findInOwnDB caught its error and returned null
        });
        // Check that the error was logged within _findInOwnDB's catch block
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `_findInOwnDB: Error for "${NORMALIZED_INPUT_RUS}" (russian): ${dbError.message}`,
            ),
            dbError,
        );
        // Ensure the main execute catch block was NOT triggered for this specific DB error
        expect(mockLogger.error).not.toHaveBeenCalledWith(
            expect.stringContaining(
                `FindTranslationHandler: Error for "${USER_INPUT_RUS}"`,
            ),
            dbError, // Check specifically for dbError if possible
        );
    });

    it('should not fail execution if search history update fails', async () => {
        // Arrange
        mockLean.mockResolvedValue(mockFoundWordRussian); // Own DB succeeds
        mockFetch.mockResolvedValueOnce({
            // Burlang succeeds
            ok: true,
            json: jest
                .fn()
                .mockResolvedValueOnce({
                    translations: [{ value: BURLANG_TRANSLATION }],
                }),
        });
        const mockSearchDocId = new Types.ObjectId();
        mockSearchedWordRussianModel.findOneAndUpdate.mockResolvedValue({
            _id: mockSearchDocId,
        }); // findOneAndUpdate succeeds
        const historyError = new Error('Failed to save history');
        mockSearchedWordHistorySave.mockRejectedValue(historyError); // Saving history fails

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        // The error in _updateSearchHistory is caught internally and logged, Promise.all resolves
        expect(result).toEqual({
            burlangdb: BURLANG_TRANSLATION,
            burlivedb: mockFoundWordRussian,
        });
        // Check that the history update error was logged
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `_updateSearchHistory: Failed for "${NORMALIZED_INPUT_RUS}": ${historyError.message}`,
            ),
            historyError,
        );
        // Ensure the main handler error log wasn't called for *this* error
        // Note: If other errors occurred, this might be too strict. We rely on checking the specific historyError log message.
        expect(mockLogger.error).toHaveBeenCalledTimes(1); // Only the history error should be logged as error
    });

    it('should handle case where findOneAndUpdate returns null during history update', async () => {
        // Arrange
        mockLean.mockResolvedValue(null); // Own DB: not found
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({}),
        }); // Burlang: not found
        mockSearchedWordRussianModel.findOneAndUpdate.mockResolvedValue(null); // History upsert returns null (shouldn't normally happen with upsert: true, but test the case)

        // Act
        const result = await handler.execute(mockInput);

        // Assert
        expect(result).toEqual({ burlangdb: null, burlivedb: null }); // Expect normal "not found" result
        // Check for the specific warning log
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                `Search document was not created or found after findOneAndUpdate for "${NORMALIZED_INPUT_RUS}"`,
            ),
        );
        // Ensure history save wasn't attempted
        expect(mockSearchedWordHistoryModel).not.toHaveBeenCalled();
        expect(mockSearchedWordHistorySave).not.toHaveBeenCalled();
    });
});
