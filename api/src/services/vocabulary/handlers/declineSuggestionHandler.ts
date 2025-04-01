// src/services/vocabulary/handlers/declineSuggestionHandler.ts
import mongoose, { Types, Model, ClientSession } from 'mongoose';
import logger from '../../../utils/logger'; // Assuming logger path is correct
import { DatabaseError, NotFoundError } from '../../../errors/customErrors';
import { isError } from '../../../utils/typeGuards'; // Assuming typeGuards path is correct

// Input/Output Interfaces for this handler
import {
    IDeclineSuggestionHandler,
    DeclineSuggestionInput,
} from '../interfaces/declineSuggestion.interface';

// Interfaces for Mongoose Models used
import {
    ISuggestedWordRussian,
    ISuggestedWordBuryat,
    IAcceptedWordRussian,
    IAcceptedWordBuryat,
} from '../interfaces/suggestWords.interface'; // Assuming paths are correct
import { TelegramUserDocument } from '../../../models/TelegramUsers'; // Assuming path is correct
import {
    DeclinedWordDocument,
    IDeclinedWord, // Keep this interface for DeclinedWordData structure
} from '../../../models/Vocabulary/DeclinedWordModel'; // Assuming path is correct

// --- Explicit Types for Populated/Lean Query Results ---
interface PopulatedAuthor {
    _id: Types.ObjectId;
    id?: number;
}

interface PopulatedSuggestedWordBase {
    _id: Types.ObjectId;
    text: string;
    normalized_text: string;
    contributors?: Types.ObjectId[];
    status?: 'new' | 'processing' | 'accepted' | 'rejected';
    pre_translations?: Types.ObjectId[];
    createdAt: Date; // Expecting createdAt to be present
    updatedAt?: Date; // Optional
    themes?: Types.ObjectId[];
    author: PopulatedAuthor | null; // Populated author object or null
}

interface PopulatedSuggestedWordRussian extends PopulatedSuggestedWordBase {
    // No dialect field
}

interface PopulatedSuggestedWordBuryat extends PopulatedSuggestedWordBase {
    dialect?: Types.ObjectId | null; // Buryat-specific field
}

// Combined type for the result of the initial findById query
type FoundSuggestedWordType =
    | PopulatedSuggestedWordRussian
    | PopulatedSuggestedWordBuryat
    | null;

// --- Handler Implementation ---

export class DeclineSuggestionHandler implements IDeclineSuggestionHandler {
    constructor(
        private readonly suggestedWordRussianModel: Model<ISuggestedWordRussian>,
        private readonly suggestedWordBuryatModel: Model<ISuggestedWordBuryat>,
        private readonly acceptedWordRussianModel: Model<IAcceptedWordRussian>,
        private readonly acceptedWordBuryatModel: Model<IAcceptedWordBuryat>,
        private readonly declinedWordModel: Model<DeclinedWordDocument>,
        private readonly telegramUserModel: Model<TelegramUserDocument>,
        private readonly log: typeof logger, // Use the imported logger
        private readonly mongooseInstance: typeof mongoose, // Use the imported mongoose
    ) {}

    async execute(input: DeclineSuggestionInput): Promise<void> {
        const { suggestedWordId, language, moderatorTelegramId, reason } =
            input;
        this.log.info(
            `DeclineSuggestionHandler: Starting decline process for suggestion ID ${suggestedWordId} (lang: ${language}) by moderator ${moderatorTelegramId}. Reason: ${reason ?? 'N/A'}`,
        );

        const session: ClientSession =
            await this.mongooseInstance.startSession();
        session.startTransaction();

        // Use the specific type for the query result
        let suggestedWord: FoundSuggestedWordType = null;

        try {
            // Select fields needed, including required ones like createdAt
            const fieldsToSelect =
                'text normalized_text author contributors dialect themes pre_translations createdAt';

            // --- ШАГ 1 & 2: Find word, populate author, use lean ---
            if (language === 'russian') {
                this.log.debug(
                    `Finding suggested word ${suggestedWordId} in Russian collection...`,
                );
                suggestedWord = await this.suggestedWordRussianModel
                    .findById(suggestedWordId, fieldsToSelect, { session })
                    .populate<{ author: PopulatedAuthor | null }>(
                        'author',
                        '_id id',
                    ) // Type hint for populate
                    .lean() // Use lean() to get plain JS object
                    .exec(); // Explicitly execute
            } else {
                this.log.debug(
                    `Finding suggested word ${suggestedWordId} in Buryat collection...`,
                );
                suggestedWord = await this.suggestedWordBuryatModel
                    .findById(suggestedWordId, fieldsToSelect, { session })
                    .populate<{
                        author: PopulatedAuthor | null;
                    }>('author', '_id id')
                    .lean()
                    .exec();
            }

            // Check if word was found
            if (!suggestedWord) {
                this.log.warn(
                    `Suggested word ${suggestedWordId} (${language}) not found.`,
                );
                throw new NotFoundError(
                    `Suggested word ${suggestedWordId} (${language}) not found.`,
                );
            }
            // Now suggestedWord is guaranteed to be non-null
            const foundWordId = suggestedWord._id; // Safe access to _id
            this.log.debug(
                `Found suggested word: "${suggestedWord.text}" (ID: ${foundWordId})`,
            );

            // --- ШАГ 3: Find moderator ---
            this.log.debug(`Finding moderator ${moderatorTelegramId}...`);
            const moderator = await this.telegramUserModel
                .findOne(
                    { id: moderatorTelegramId },
                    '_id id first_name', // Select only necessary fields
                    { session },
                )
                .lean()
                .exec(); // Use lean and exec

            if (!moderator) {
                this.log.error(`Moderator ${moderatorTelegramId} not found.`);
                throw new NotFoundError(
                    `Moderator ${moderatorTelegramId} not found.`,
                );
            }
            const moderatorObjectId = moderator._id; // Safe access to _id
            this.log.debug(
                `Found moderator: ${moderator.first_name ?? moderator.id} (ID: ${moderatorObjectId})`,
            );

            // --- ШАГ 4: Update related accepted words ---
            if (
                suggestedWord.pre_translations &&
                suggestedWord.pre_translations.length > 0
            ) {
                this.log.debug(
                    `Updating ${suggestedWord.pre_translations.length} original accepted words linked to ${foundWordId}...`,
                );
                const originalLanguage =
                    language === 'buryat' ? 'russian' : 'buryat';
                const OriginalAcceptedModel =
                    originalLanguage === 'russian'
                        ? this.acceptedWordRussianModel
                        : this.acceptedWordBuryatModel;

                const updateResult = await OriginalAcceptedModel.updateMany(
                    { _id: { $in: suggestedWord.pre_translations } },
                    { $pull: { translations_u: foundWordId } }, // Use the ObjectId
                    { session },
                ).exec(); // Use exec

                this.log.info(
                    `Pulled suggestion link (${foundWordId}) from ${updateResult.modifiedCount} accepted words.`,
                );
            } else {
                this.log.debug(
                    `Suggested word ${foundWordId} has no pre-translations to update.`,
                );
            }

            // --- ШАГ 5: Create declined word entry ---
            this.log.debug(
                `Preparing data for declined word entry for ${foundWordId}...`,
            );

            // Safely access author ID after populate and null check
            const authorId = suggestedWord.author?._id;
            if (!authorId) {
                this.log.error(
                    `Author _id missing for suggested word ${foundWordId}. Cannot create declined entry.`,
                );
                throw new DatabaseError(
                    `Author reference missing for suggested word ${foundWordId}.`,
                );
            }

            // createdAt should exist based on fieldsToSelect and FoundSuggestedWordType
            const originalCreatedAt = suggestedWord.createdAt;

            // Construct the data using the IDeclinedWord interface structure
            const declinedWordData: Partial<IDeclinedWord> = {
                text: suggestedWord.text,
                normalized_text: suggestedWord.normalized_text,
                language: language,
                author: authorId,
                contributors: suggestedWord.contributors ?? [],
                themes: suggestedWord.themes ?? [],
                pre_translations: suggestedWord.pre_translations ?? [],
                // Safely access dialect using type assertion after checking language
                dialect:
                    language === 'buryat'
                        ? (suggestedWord as PopulatedSuggestedWordBuryat)
                              .dialect
                        : undefined,
                originalSuggestedWordId: foundWordId,
                declinedBy: moderatorObjectId,
                declineReason: reason, // Can be null or undefined
                declinedAt: new Date(),
                originalCreatedAt: originalCreatedAt, // Use the date from the original word
            };

            this.log.debug(`Creating declined word entry...`, declinedWordData);
            const declinedWordInstance = new this.declinedWordModel(
                declinedWordData,
            );
            // ****** FIX: Capture the result of save ******
            const savedDeclinedWord = await declinedWordInstance.save({
                session,
            });
            // ****** FIX: Use the _id from the SAVED document in the log ******
            this.log.info(
                `Declined word entry created: ${savedDeclinedWord._id} for original ID ${foundWordId}`,
            );

            // --- ШАГ 6: Delete original suggested word ---
            this.log.debug(
                `Deleting original suggested word ${foundWordId} from ${language} collection...`,
            );
            let deleteResult: { deletedCount?: number }; // Mongoose delete result type

            if (language === 'russian') {
                deleteResult = await this.suggestedWordRussianModel
                    .deleteOne({ _id: foundWordId }, { session })
                    .exec(); // Use exec
            } else {
                deleteResult = await this.suggestedWordBuryatModel
                    .deleteOne({ _id: foundWordId }, { session })
                    .exec(); // Use exec
            }

            // Check result safely
            if (deleteResult.deletedCount !== 1) {
                // Check for exactly 1 deletion
                this.log.error(
                    `Failed to delete original suggested word ${foundWordId}. Expected 1 deleted, got ${deleteResult.deletedCount ?? 0}.`,
                );
                // Throw error to trigger transaction abort
                throw new DatabaseError(
                    `Failed to delete original suggested word ${foundWordId} after creating declined entry. Rollback required.`,
                );
            }
            this.log.info(
                `Original suggested word ${foundWordId} deleted successfully.`,
            );

            // --- ШАГ 7: Commit transaction ---
            await session.commitTransaction();
            this.log.info(
                `Transaction committed successfully for suggestion ${suggestedWordId}.`,
            );
        } catch (error: unknown) {
            // --- ШАГ 8: Abort transaction on any error ---
            const originalError = error; // Store the original error
            this.log.error(
                `Error during transaction for suggestion ${suggestedWordId}. Aborting.`,
                originalError, // Log the actual error encountered
            );

            if (session.inTransaction()) {
                try {
                    await session.abortTransaction();
                    this.log.info(
                        `Transaction aborted for suggestion ${suggestedWordId}.`,
                    );
                } catch (abortError) {
                    // Log the error during abort, but prioritize throwing the original error
                    this.log.error(
                        `CRITICAL: Error aborting transaction for ${suggestedWordId} after initial error:`,
                        abortError,
                    );
                }
            } else {
                this.log.warn(
                    `Transaction for ${suggestedWordId} was not in progress when abort was attempted.`,
                );
            }

            // Re-throw the original specific error if known, otherwise wrap unknown errors
            if (
                originalError instanceof NotFoundError ||
                originalError instanceof DatabaseError
            ) {
                throw originalError; // Re-throw specific custom errors
            } else {
                // Wrap other types of errors in a DatabaseError
                const message = isError(originalError)
                    ? originalError.message
                    : 'Unknown error during decline process.';
                throw new DatabaseError(
                    `Failed to decline suggestion ${suggestedWordId}: ${message}`,
                    isError(originalError) ? originalError : undefined, // Preserve cause if it's an Error
                );
            }
        } finally {
            // --- ШАГ 9: Always end the session ---
            await session.endSession();
            this.log.debug(
                `Mongoose session ended for suggestion ${suggestedWordId}.`,
            );
        }
    }
}
