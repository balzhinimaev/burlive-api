// src/services/vocabulary/tests/DeclineSuggestionHandler.spec.ts
import mongoose, { Types, Model, ClientSession } from 'mongoose';
import { Logger } from 'winston'; // Assuming standard Winston Logger type
import { DeclineSuggestionHandler } from '../handlers/declineSuggestionHandler';
import { DatabaseError, NotFoundError } from '../../../errors/customErrors';
import { DeclineSuggestionInput } from '../interfaces/declineSuggestion.interface';
// Import interfaces for models
import {
    ISuggestedWordRussian,
    ISuggestedWordBuryat,
    IAcceptedWordRussian,
    IAcceptedWordBuryat,
} from '../interfaces/suggestWords.interface';
import { TelegramUserDocument } from '../../../models/TelegramUsers';
import {
    DeclinedWordDocument,
    // IDeclinedWord, // Used for checking constructor data
} from '../../../models/Vocabulary/DeclinedWordModel';

// --- Mock Helper Types ---
// Generic type for a mocked Mongoose Model
type MockModel<TDoc> = jest.Mocked<Model<TDoc>>;

// --- Helper Types for Populated/Lean Mock Data ---
// Matches the interfaces defined in the handler for lean results
interface MockPopulatedAuthor {
    _id: Types.ObjectId;
    id?: number;
}

interface MockPopulatedSuggestedWordBase {
    _id: Types.ObjectId;
    text: string;
    normalized_text: string;
    contributors?: Types.ObjectId[];
    status?: 'new' | 'processing' | 'accepted' | 'rejected';
    pre_translations?: Types.ObjectId[];
    createdAt: Date;
    updatedAt?: Date;
    author: MockPopulatedAuthor | null;
}

interface MockPopulatedSuggestedWordRussian
    extends MockPopulatedSuggestedWordBase {}

interface MockPopulatedSuggestedWordBuryat
    extends MockPopulatedSuggestedWordBase {
    dialect?: Types.ObjectId | null;
}
// --- End Helper Types ---

// --- Mock Data ---
const mockSuggestedWordId = new Types.ObjectId();
const mockModeratorTelegramId = 98765;
const mockAuthorId = new Types.ObjectId();
const mockModeratorObjectId = new Types.ObjectId();
const mockPreTranslationId = new Types.ObjectId();
const mockDeclinedWordId = new Types.ObjectId();
const mockDialectId = new Types.ObjectId();
const reason = 'Incorrect spelling';
const mockDate = new Date('2024-01-01T12:00:00.000Z');

const mockAuthor: MockPopulatedAuthor = { _id: mockAuthorId, id: 12345 };

// Mock Data matching the lean/populated structure
const mockRussianSuggestion: MockPopulatedSuggestedWordRussian = {
    _id: mockSuggestedWordId,
    text: 'Привет мир',
    normalized_text: 'привет мир',
    author: mockAuthor,
    contributors: [],
    // themes: [],
    status: 'new',
    pre_translations: [mockPreTranslationId],
    createdAt: mockDate,
    updatedAt: mockDate,
};

const mockBuryatSuggestion: MockPopulatedSuggestedWordBuryat = {
    _id: mockSuggestedWordId,
    text: 'Сайн байна',
    normalized_text: 'сайн байна',
    dialect: mockDialectId,
    author: mockAuthor,
    contributors: [],
    // themes: [],
    status: 'new',
    pre_translations: [], // No pre-translations for this case
    createdAt: mockDate,
    updatedAt: mockDate,
};

const mockModerator = {
    // Structure matches lean result for findOne moderator
    _id: mockModeratorObjectId,
    id: mockModeratorTelegramId,
    first_name: 'Mod',
};

// --- Mock Mongoose Session ---
const mockSession: jest.Mocked<ClientSession> = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    abortTransaction: jest.fn().mockResolvedValue(undefined),
    endSession: jest.fn().mockResolvedValue(undefined), // Changed to async mock
    inTransaction: jest.fn().mockReturnValue(true), // Assume true after start
} as unknown as jest.Mocked<ClientSession>;

// --- Mock Models ---
// Use MockModel<InterfaceDocument>
const mockSuggestedWordRussianModel: MockModel<ISuggestedWordRussian> = {
    findById: jest.fn(),
    deleteOne: jest.fn(),
} as any;
const mockSuggestedWordBuryatModel: MockModel<ISuggestedWordBuryat> = {
    findById: jest.fn(),
    deleteOne: jest.fn(),
} as any;
const mockAcceptedWordRussianModel: MockModel<IAcceptedWordRussian> = {
    updateMany: jest.fn(),
} as any;
const mockAcceptedWordBuryatModel: MockModel<IAcceptedWordBuryat> = {
    updateMany: jest.fn(),
} as any;

// Mock constructor and save method for DeclinedWord
const mockDeclinedWordSave = jest
    .fn()
    .mockResolvedValue({ _id: mockDeclinedWordId });
// Mock the constructor to return an object with the mocked save method
const mockDeclinedWordModel = jest.fn().mockImplementation(() => ({
    save: mockDeclinedWordSave,
}));
// Cast the constructor mock to the Model type expected by the handler
const mockDeclinedWordModelConstructor =
    mockDeclinedWordModel as unknown as MockModel<DeclinedWordDocument>;

const mockTelegramUserModel: MockModel<TelegramUserDocument> = {
    findOne: jest.fn(),
} as any;

// --- Mock Logger ---
const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
} as any; // Use 'as any' for brevity

// --- Mock Mongoose Instance ---
const mockMongooseInstance: jest.Mocked<typeof mongoose> = {
    startSession: jest.fn().mockResolvedValue(mockSession),
    Types: { ObjectId: Types.ObjectId }, // Include if needed, might not be necessary if ObjectIds created directly
} as any; // Use 'as any' as we don't mock the entire mongoose object

// --- Mongoose Query Mock Helper ---
// Helper to mock the chainable .exec() method returning a promise
const mockExec = (resolveValue: any) => ({
    exec: jest.fn().mockResolvedValue(resolveValue),
});
const mockExecReject = (rejectValue: any) => ({
    exec: jest.fn().mockRejectedValue(rejectValue),
});

describe('DeclineSuggestionHandler', () => {
    let handler: DeclineSuggestionHandler;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset session mocks
        mockSession.startTransaction.mockClear();
        mockSession.commitTransaction.mockClear();
        mockSession.abortTransaction.mockClear();
        mockSession.endSession.mockClear();
        mockSession.inTransaction.mockReturnValue(true); // Default state

        // Reset mongoose.startSession mock
        mockMongooseInstance.startSession.mockResolvedValue(mockSession);

        // Reset DeclinedWord mocks
        mockDeclinedWordModel.mockClear();
        mockDeclinedWordSave.mockClear();
        mockDeclinedWordSave.mockResolvedValue({ _id: mockDeclinedWordId }); // Default success

        handler = new DeclineSuggestionHandler(
            mockSuggestedWordRussianModel,
            mockSuggestedWordBuryatModel,
            mockAcceptedWordRussianModel,
            mockAcceptedWordBuryatModel,
            mockDeclinedWordModelConstructor, // Pass the mocked constructor
            mockTelegramUserModel,
            mockLogger as Logger, // Cast if necessary
            mockMongooseInstance,
        );

        // --- Setup default mocks for successful scenario ---
        // Use the helper to mock the .exec() chain
        mockSuggestedWordRussianModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue(mockExec(mockRussianSuggestion)),
        } as any);
        mockSuggestedWordBuryatModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue(mockExec(mockBuryatSuggestion)),
        } as any);
        mockTelegramUserModel.findOne.mockReturnValue({
            lean: jest.fn().mockReturnValue(mockExec(mockModerator)),
        } as any);

        // updateMany success
        const updateResult = {
            modifiedCount: 1,
            acknowledged: true,
            matchedCount: 1,
        }; // Simplified result
        mockAcceptedWordRussianModel.updateMany.mockReturnValue(
            mockExec(updateResult) as any,
        );
        mockAcceptedWordBuryatModel.updateMany.mockReturnValue(
            mockExec(updateResult) as any,
        );

        // deleteOne success
        const deleteResult = { deletedCount: 1, acknowledged: true };
        mockSuggestedWordRussianModel.deleteOne.mockReturnValue(
            mockExec(deleteResult) as any,
        );
        mockSuggestedWordBuryatModel.deleteOne.mockReturnValue(
            mockExec(deleteResult) as any,
        );
    });

    // --- Test Cases ---

    it('should successfully decline a Russian suggestion with pre-translations', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
            reason: reason,
        };

        // ACT
        await expect(handler.execute(input)).resolves.toBeUndefined();

        // ASSERT
        // 1. Session and transaction
        expect(mockMongooseInstance.startSession).toHaveBeenCalledTimes(1);
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);

        // 2. Find Russian word
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledWith(
            mockSuggestedWordId,
            expect.any(String), // Fields selected
            { session: mockSession }, // Session passed
        );
        // Check if populate, lean, exec were called (using the mocks setup in beforeEach)
        const findByIdMockResult =
            mockSuggestedWordRussianModel.findById.mock.results[0].value;
        expect(findByIdMockResult.populate).toHaveBeenCalledWith(
            'author',
            '_id id',
        );
        expect(findByIdMockResult.lean).toHaveBeenCalledTimes(1);
        expect(findByIdMockResult.lean().exec).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordBuryatModel.findById).not.toHaveBeenCalled();

        // 3. Find moderator
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledWith(
            { id: mockModeratorTelegramId },
            '_id id first_name',
            { session: mockSession },
        );
        const findOneMockResult =
            mockTelegramUserModel.findOne.mock.results[0].value;
        expect(findOneMockResult.lean).toHaveBeenCalledTimes(1);
        expect(findOneMockResult.lean().exec).toHaveBeenCalledTimes(1);

        // 4. Update related accepted words (Buryat)
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(1);
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledWith(
            { _id: { $in: mockRussianSuggestion.pre_translations } },
            { $pull: { translations_u: mockSuggestedWordId } },
            { session: mockSession },
        );
        expect(
            mockAcceptedWordBuryatModel.updateMany.mock.results[0].value.exec,
        ).toHaveBeenCalledTimes(1);
        expect(mockAcceptedWordRussianModel.updateMany).not.toHaveBeenCalled();

        // 5. Create declined word entry
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledTimes(1);
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledWith(
            expect.objectContaining({
                text: mockRussianSuggestion.text,
                language: 'russian',
                author: mockAuthorId,
                originalSuggestedWordId: mockSuggestedWordId,
                declinedBy: mockModeratorObjectId,
                declineReason: reason,
                originalCreatedAt: mockRussianSuggestion.createdAt,
            }),
        );
        expect(mockDeclinedWordSave).toHaveBeenCalledTimes(1);
        expect(mockDeclinedWordSave).toHaveBeenCalledWith({
            session: mockSession,
        });

        // 6. Delete original suggested word
        expect(mockSuggestedWordRussianModel.deleteOne).toHaveBeenCalledTimes(
            1,
        );
        expect(mockSuggestedWordRussianModel.deleteOne).toHaveBeenCalledWith(
            { _id: mockSuggestedWordId },
            { session: mockSession },
        );
        expect(
            mockSuggestedWordRussianModel.deleteOne.mock.results[0].value.exec,
        ).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordBuryatModel.deleteOne).not.toHaveBeenCalled();

        // 7. Commit transaction and end session
        expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
        expect(mockSession.abortTransaction).not.toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalledTimes(1); // Should be called once

        // 8. Logs
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(`Starting decline process`),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(
                `Declined word entry created: ${mockDeclinedWordId}`,
            ),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(
                `Original suggested word ${mockSuggestedWordId} deleted successfully.`,
            ),
        );
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(`Transaction committed successfully`),
        );
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should successfully decline a Buryat suggestion without pre-translations and null reason', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'buryat',
            moderatorTelegramId: mockModeratorTelegramId,
            reason: undefined, // Test null/undefined reason
        };

        // ARRANGE: Override findById for Buryat word
        mockSuggestedWordBuryatModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue(mockExec(mockBuryatSuggestion)),
        } as any);

        // ACT
        await expect(handler.execute(input)).resolves.toBeUndefined();

        // ASSERT
        expect(mockMongooseInstance.startSession).toHaveBeenCalledTimes(1);
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);

        expect(mockSuggestedWordBuryatModel.findById).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordRussianModel.findById).not.toHaveBeenCalled();
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1);

        // No pre-translations, updateMany should NOT be called
        expect(mockAcceptedWordRussianModel.updateMany).not.toHaveBeenCalled();
        expect(mockAcceptedWordBuryatModel.updateMany).not.toHaveBeenCalled();

        // Check DeclinedWord creation
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledTimes(1);
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledWith(
            expect.objectContaining({
                language: 'buryat',
                dialect: mockBuryatSuggestion.dialect,
                author: mockAuthorId,
                originalSuggestedWordId: mockSuggestedWordId,
                declinedBy: mockModeratorObjectId,
                declineReason: undefined, // Handler stores undefined/null as is
                originalCreatedAt: mockBuryatSuggestion.createdAt,
            }),
        );
        expect(mockDeclinedWordSave).toHaveBeenCalledTimes(1);
        expect(mockDeclinedWordSave).toHaveBeenCalledWith({
            session: mockSession,
        });

        // Check deletion
        expect(mockSuggestedWordBuryatModel.deleteOne).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordBuryatModel.deleteOne).toHaveBeenCalledWith(
            { _id: mockSuggestedWordId },
            { session: mockSession },
        );
        expect(
            mockSuggestedWordBuryatModel.deleteOne.mock.results[0].value.exec,
        ).toHaveBeenCalledTimes(1);
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        expect(mockSession.commitTransaction).toHaveBeenCalledTimes(1);
        expect(mockSession.abortTransaction).not.toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalledTimes(1);
        expect(mockLogger.error).not.toHaveBeenCalled();
        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.stringContaining(`Reason: N/A`),
        ); // Check log for null reason
    });

    // --- Error Handling Tests ---

    it('should throw NotFoundError and abort if suggested word is not found', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        // ARRANGE: Mock findById to return null after exec
        mockSuggestedWordRussianModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue(mockExec(null)), // exec resolves to null
        } as any);
        const expectedError = new NotFoundError(
            `Suggested word ${mockSuggestedWordId} (russian) not found.`,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(NotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            expectedError.message,
        );

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2); // Called twice due to two expect checks
        expect(mockTelegramUserModel.findOne).not.toHaveBeenCalled();
        expect(mockAcceptedWordBuryatModel.updateMany).not.toHaveBeenCalled();
        expect(mockDeclinedWordSave).not.toHaveBeenCalled();
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs
        expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining(
                `Suggested word ${mockSuggestedWordId} (russian) not found.`,
            ),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            expectedError,
        ); // Log the specific error thrown
    });

    it('should throw NotFoundError and abort if moderator is not found', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        // ARRANGE: Mock findOne to return null after exec
        mockTelegramUserModel.findOne.mockReturnValue({
            lean: jest.fn().mockReturnValue(mockExec(null)), // exec resolves to null
        } as any);
        const expectedError = new NotFoundError(
            `Moderator ${mockModeratorTelegramId} not found.`,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(NotFoundError);
        await expect(handler.execute(input)).rejects.toThrow(
            expectedError.message,
        );

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockAcceptedWordBuryatModel.updateMany).not.toHaveBeenCalled(); // Does not reach this step
        expect(mockDeclinedWordSave).not.toHaveBeenCalled();
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `Moderator ${mockModeratorTelegramId} not found.`,
            ),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            expectedError,
        );
    });

    it('should throw DatabaseError and abort if author._id is missing', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        // ARRANGE: Mock findById to return word with author: null
        const suggestionWithoutAuthor = {
            ...mockRussianSuggestion,
            author: null,
        };
        mockSuggestedWordRussianModel.findById.mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnValue(mockExec(suggestionWithoutAuthor)),
        } as any);
        const expectedError = new DatabaseError(
            `Author reference missing for suggested word ${mockSuggestedWordId}.`,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toThrow(
            expectedError.message,
        );

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        // updateMany *should* be called if pre_translations exist, before the author check fails
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(2);
        expect(mockDeclinedWordModelConstructor).not.toHaveBeenCalled(); // Fails before constructor
        expect(mockDeclinedWordSave).not.toHaveBeenCalled();
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `Author _id missing for suggested word ${mockSuggestedWordId}.`,
            ),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            expectedError,
        );
    });

    it('should throw DatabaseError and abort if updateMany fails', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        const dbError = new Error('Update failed');
        // ARRANGE: Mock updateMany to reject
        mockAcceptedWordBuryatModel.updateMany.mockReturnValue(
            mockExecReject(dbError) as any,
        );
        // Handler wraps unknown errors
        const expectedWrappedError = new DatabaseError(
            `Failed to decline suggestion ${mockSuggestedWordId}: ${dbError.message}`,
            dbError,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toMatchObject({
            // Check wrapped error
            message: expectedWrappedError.message,
            cause: dbError,
        });

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(2); // Called and failed
        expect(mockDeclinedWordSave).not.toHaveBeenCalled();
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs - Logs the original error before wrapping
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            dbError,
        );
    });

    it('should throw DatabaseError and abort if declinedWord.save fails', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        const dbError = new Error('Save failed');
        // ARRANGE: Mock save to reject
        mockDeclinedWordSave.mockRejectedValue(dbError);
        const expectedWrappedError = new DatabaseError(
            `Failed to decline suggestion ${mockSuggestedWordId}: ${dbError.message}`,
            dbError,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toMatchObject({
            message: expectedWrappedError.message,
            cause: dbError,
        });

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(2); // Assumes pre_translations
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledTimes(2); // Constructor was called
        expect(mockDeclinedWordSave).toHaveBeenCalledTimes(2); // save was called (and failed)
        expect(mockSuggestedWordRussianModel.deleteOne).not.toHaveBeenCalled();

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs - Logs the original dbError
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            dbError,
        );
    });

    it('should throw DatabaseError and abort if deleteOne fails', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        const dbError = new Error('Delete failed');
        // ARRANGE: Mock deleteOne to reject
        mockSuggestedWordRussianModel.deleteOne.mockReturnValue(
            mockExecReject(dbError) as any,
        );
        const expectedWrappedError = new DatabaseError(
            `Failed to decline suggestion ${mockSuggestedWordId}: ${dbError.message}`,
            dbError,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toMatchObject({
            message: expectedWrappedError.message,
            cause: dbError,
        });

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(2);
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledTimes(2);
        expect(mockDeclinedWordSave).toHaveBeenCalledTimes(2); // Save succeeded
        expect(mockSuggestedWordRussianModel.deleteOne).toHaveBeenCalledTimes(
            2,
        ); // deleteOne called (and failed)

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs - Logs the original dbError
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            dbError,
        );
    });

    it('should throw DatabaseError and abort if deleteOne returns deletedCount 0', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        // ARRANGE: Mock deleteOne to resolve with deletedCount 0
        mockSuggestedWordRussianModel.deleteOne.mockReturnValue(
            mockExec({ deletedCount: 0 }) as any,
        );
        const expectedError = new DatabaseError(
            `Failed to delete original suggested word ${mockSuggestedWordId} after creating declined entry. Rollback required.`,
        );

        // ACT & ASSERT
        await expect(handler.execute(input)).rejects.toThrow(DatabaseError);
        await expect(handler.execute(input)).rejects.toThrow(
            expectedError.message,
        );

        // Verify calls
        expect(mockSuggestedWordRussianModel.findById).toHaveBeenCalledTimes(2);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockAcceptedWordBuryatModel.updateMany).toHaveBeenCalledTimes(2);
        expect(mockDeclinedWordModelConstructor).toHaveBeenCalledTimes(2);
        expect(mockDeclinedWordSave).toHaveBeenCalledTimes(2); // Save succeeded
        expect(mockSuggestedWordRussianModel.deleteOne).toHaveBeenCalledTimes(
            2,
        ); // deleteOne called (returned 0)

        // Verify transaction handling
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(2);
        expect(mockSession.endSession).toHaveBeenCalledTimes(2);

        // Verify logs - Logs the specific DatabaseError created in the handler
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(
                `Failed to delete original suggested word ${mockSuggestedWordId}.`,
            ),
        );
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            expectedError,
        );
    });

    it('should abort transaction and re-throw original error if abortTransaction itself fails', async () => {
        const input: DeclineSuggestionInput = {
            suggestedWordId: mockSuggestedWordId,
            language: 'russian',
            moderatorTelegramId: mockModeratorTelegramId,
        };
        // ARRANGE: Cause an initial error (e.g., moderator not found) and make abort fail
        const initialError = new NotFoundError(
            `Moderator ${mockModeratorTelegramId} not found.`,
        );
        const abortError = new Error('Failed to abort');
        mockTelegramUserModel.findOne.mockReturnValue({
            lean: jest.fn().mockReturnValue(mockExec(null)),
        } as any); // Trigger initial error
        mockSession.abortTransaction.mockRejectedValueOnce(abortError); // Make the *first* abort call fail

        // ACT & ASSERT
        // Expect the *initial* error to be thrown, despite the abort error
        await expect(handler.execute(input)).rejects.toThrow(initialError);

        // Verify calls
        expect(mockSession.startTransaction).toHaveBeenCalledTimes(1);
        expect(mockTelegramUserModel.findOne).toHaveBeenCalledTimes(1); // Find moderator fails
        expect(mockSession.commitTransaction).not.toHaveBeenCalled();
        expect(mockSession.abortTransaction).toHaveBeenCalledTimes(1); // Abort was attempted (and failed)
        expect(mockSession.endSession).toHaveBeenCalledTimes(1); // Finally block should still run

        // Verify logs
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`Error during transaction`),
            initialError,
        ); // Log initial error
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.stringContaining(`CRITICAL: Error aborting transaction`),
            abortError,
        ); // Log the abort error
    });
});
