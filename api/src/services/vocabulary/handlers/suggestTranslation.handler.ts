// src/services/vocabulary/handlers/suggestTranslation.handler.ts
import mongoose, {
    ClientSession,
    Types,
    UpdateWriteOpResult,
    HydratedDocument,
    Model, // Import Model type
} from 'mongoose';
import logger from '../../../utils/logger'; // Adjust path if needed
import {
    DatabaseError,
    NotFoundError,
    ValidationError,
    AppError, // Import base AppError for catch block
} from '../../../errors/customErrors'; // Adjust path if needed
import {
    SuggestTranslationInput,
    SuggestTranslationResult,
    AcceptedWordType, // POJO union: IAcceptedWordRussian | IAcceptedWordBuryat
    SuggestedWordType, // POJO union: ISuggestedWordRussian | ISuggestedWordBuryat
    ISuggestedWordRussian, // Specific interface for Russian suggestion data
    ISuggestedWordBuryat, // Specific interface for Buryat suggestion data
} from '../../../types/vocabulary.types'; // Adjust path if needed
import { ISuggestTranslationHandler } from '../interfaces/suggestTranslation.interface'; // Adjust path if needed
import { isError } from '../../../utils/typeGuards'; // Adjust path if needed
import TelegramUserModel from '../../../models/TelegramUsers'; // Adjust path if needed
import AcceptedWordBuryat from '../../../models/Vocabulary/AcceptedWordBuryat'; // Adjust path if needed
import AcceptedWordRussian from '../../../models/Vocabulary/AcceptedWordRussian'; // Adjust path if needed
// Import BOTH specific suggestion models
import SuggestedWordModelBuryat from '../../../models/Vocabulary/SuggestedWordModelBuryat'; // Adjust path if needed
import SuggestedWordModelRussian from '../../../models/Vocabulary/SuggestedWordModelRussian'; // Adjust path if needed
// DO NOT import the generic SuggestedWordModel

import { IAddRatingHandler } from '../../interfaces/userRating.interface';

// --- End Placeholder ---

const RATING_POINTS = {
    ACCEPTED_CONTRIBUTION: 5,
    SUGGESTION_CONTRIBUTION: 2,
    NEW_SUGGESTION: 3,
};

// Define types for Mongoose documents and models
type SuggestedWordBuryatDocument = HydratedDocument<ISuggestedWordBuryat>;
type SuggestedWordRussianDocument = HydratedDocument<ISuggestedWordRussian>;
type SuggestedWordBuryatMongooseModel = Model<ISuggestedWordBuryat>;
type SuggestedWordRussianMongooseModel = Model<ISuggestedWordRussian>;

// Define types for the DATA needed to CREATE a new suggestion (excluding generated fields)
type NewSuggestedWordBuryatInput = Omit<
    ISuggestedWordBuryat,
    '_id' | 'createdAt'
>;
type NewSuggestedWordRussianInput = Omit<
    ISuggestedWordRussian,
    '_id' | 'createdAt' | 'updatedAt'
>;

export class SuggestTranslationHandler implements ISuggestTranslationHandler {
    // Inject dependencies like logger, rating handler, etc. if needed
    constructor(
        private readonly log: typeof logger,
        private readonly addRatingHandler: IAddRatingHandler,
    ) {
        this.log.info('SuggestTranslationHandler instance created.');
    }

    async execute(
        input: SuggestTranslationInput,
    ): Promise<SuggestTranslationResult> {
        const {
            wordId,
            sourceLanguage,
            translationText,
            telegramUserId,
            dialect,
        } = input;
        this.log.info(
            `SuggestTranslationHandler: Starting suggestion process. WordID: ${wordId}, Lang: ${sourceLanguage}, User: ${telegramUserId}, Translation: "${translationText}"`,
            { input }, // Log input for debugging
        );

        const normalizedTranslation = translationText.toLowerCase().trim();
        if (!normalizedTranslation) {
            throw new ValidationError('Текст перевода не может быть пустым.');
        }

        // Input validation for dialect ObjectId string if provided
        if (dialect && !Types.ObjectId.isValid(dialect)) {
            throw new ValidationError(
                `Неверный формат идентификатора диалекта: ${dialect}`,
            );
        }

        const session = await mongoose.startSession();
        this.log.debug('MongoDB session started.');

        try {
            const sessionResult = await session.withTransaction(
                async (
                    currentSession: ClientSession,
                ): Promise<SuggestTranslationResult> => {
                    this.log.debug('Transaction started.');

                    // 1. Find User
                    this.log.debug(
                        `Finding user with Telegram ID: ${telegramUserId}`,
                    );
                    const user = await TelegramUserModel.findOne(
                        { id: telegramUserId },
                        '_id',
                        { session: currentSession },
                    );
                    if (!user) {
                        throw new NotFoundError(
                            `Пользователь с Telegram ID ${telegramUserId} не найден.`,
                        );
                    }
                    const authorId = user._id;
                    this.log.debug(`User found: ${authorId}`);

                    // 2. Find Source Word (using .lean() to get POJO)
                    let sourceWord: AcceptedWordType | null = null;
                    this.log.debug(
                        `Finding source word ${wordId} in ${sourceLanguage} collection.`,
                    );
                    if (sourceLanguage === 'buryat') {
                        sourceWord = await AcceptedWordBuryat.findById(
                            wordId,
                            null,
                            { session: currentSession },
                        ).lean();
                    } else {
                        sourceWord = await AcceptedWordRussian.findById(
                            wordId,
                            null,
                            { session: currentSession },
                        ).lean();
                    }
                    if (!sourceWord) {
                        throw new NotFoundError(
                            `Исходное слово (${sourceLanguage}) с ID ${wordId} не найдено.`,
                        );
                    }
                    this.log.debug(`Source word found: ${sourceWord._id}`);

                    // 3. Determine Target Language
                    const targetLanguage =
                        sourceLanguage === 'buryat' ? 'russian' : 'buryat';
                    this.log.debug(
                        `Target language determined: ${targetLanguage}`,
                    );

                    // 4. Check if Translation Already Accepted (using .lean() for POJO)
                    this.log.debug(
                        `Checking if translation "${normalizedTranslation}" exists as accepted ${targetLanguage} word.`,
                    );
                    let existingAccepted: AcceptedWordType | null = null;
                    if (targetLanguage === 'buryat') {
                        existingAccepted = await AcceptedWordBuryat.findOne(
                            { normalized_text: normalizedTranslation },
                            null,
                            { session: currentSession },
                        ).lean();
                    } else {
                        existingAccepted = await AcceptedWordRussian.findOne(
                            { normalized_text: normalizedTranslation },
                            null,
                            { session: currentSession },
                        ).lean();
                    }

                    // --- Scenario: Translation Already Accepted ---
                    if (existingAccepted) {
                        this.log.info(
                            `Translation "${normalizedTranslation}" already accepted as word ${existingAccepted._id}. Linking and adding contributor.`,
                        );
                        let sourceUpdateResult: UpdateWriteOpResult;
                        let acceptedUpdateResult: UpdateWriteOpResult;

                        // Link Source -> Target Accepted
                        if (sourceLanguage === 'buryat') {
                            // Source: Buryat, Target: Russian
                            this.log.debug(
                                `Linking AcceptedWordBuryat (${sourceWord._id}) to AcceptedWordRussian (${existingAccepted._id})`,
                            );
                            sourceUpdateResult =
                                await AcceptedWordBuryat.updateOne(
                                    {
                                        _id: sourceWord._id,
                                        translations: {
                                            $ne: existingAccepted._id,
                                        },
                                    },
                                    {
                                        $addToSet: {
                                            translations: existingAccepted._id,
                                        },
                                    },
                                    { session: currentSession },
                                );
                            acceptedUpdateResult =
                                await AcceptedWordRussian.updateOne(
                                    {
                                        _id: existingAccepted._id,
                                        contributors: { $ne: authorId },
                                    },
                                    { $addToSet: { contributors: authorId } },
                                    { session: currentSession },
                                );
                        } else {
                            // Source: Russian, Target: Buryat
                            this.log.debug(
                                `Linking AcceptedWordRussian (${sourceWord._id}) to AcceptedWordBuryat (${existingAccepted._id})`,
                            );
                            sourceUpdateResult =
                                await AcceptedWordRussian.updateOne(
                                    {
                                        _id: sourceWord._id,
                                        translations: {
                                            $ne: existingAccepted._id,
                                        },
                                    },
                                    {
                                        $addToSet: {
                                            translations: existingAccepted._id,
                                        },
                                    },
                                    { session: currentSession },
                                );
                            acceptedUpdateResult =
                                await AcceptedWordBuryat.updateOne(
                                    {
                                        _id: existingAccepted._id,
                                        contributors: { $ne: authorId },
                                    },
                                    { $addToSet: { contributors: authorId } },
                                    { session: currentSession },
                                );
                        }
                        this.log.debug(
                            `Source update result: modified=${sourceUpdateResult.modifiedCount}. Target accepted update result: modified=${acceptedUpdateResult.modifiedCount}`,
                        );

                        // Award points only if something was actually modified
                        if (
                            sourceUpdateResult.modifiedCount > 0 ||
                            acceptedUpdateResult.modifiedCount > 0
                        ) {
                            this.log.info(
                                `Link/contributor added for accepted translation ${existingAccepted._id}. Awarding points.`,
                            );
                            // --- ИСПОЛЬЗОВАНИЕ AddRatingHandler ---
                            try {
                                await this.addRatingHandler.execute({
                                    userObjectId: authorId,
                                    amount: RATING_POINTS.ACCEPTED_CONTRIBUTION,
                                    session: currentSession, // Передаем сессию
                                });
                                this.log.info(
                                    `Successfully requested rating update for user ${authorId} (+${RATING_POINTS.ACCEPTED_CONTRIBUTION})`,
                                );
                            } catch (ratingError /*: unknown */) {
                                // <-- ratingError is unknown
                                // *** Исправлено: Использование isError ***
                                const errorMessage = isError(ratingError)
                                    ? ratingError.message
                                    : 'Неизвестная ошибка при обновлении рейтинга (accepted contribution)';
                                this.log.error(
                                    `Failed to update rating for user ${authorId} (accepted contribution): ${errorMessage}`,
                                    { error: ratingError }, // Log original error object
                                );
                                // Не прерываем транзакцию, если рейтинг не обновился
                            }
                            // --- КОНЕЦ ИСПОЛЬЗОВАНИЯ --
                        } else {
                            this.log.info(
                                `Link/contribution already existed for accepted word ${existingAccepted._id}. No points awarded.`,
                            );
                        }

                        this.log.debug(`Returning 'already_accepted' status.`);
                        return {
                            status: 'already_accepted',
                            word: existingAccepted, // Return POJO
                        };
                    } // End if (existingAccepted)

                    // --- Scenario: Translation Not Accepted, Check/Manage Suggestions ---
                    this.log.info(
                        `Translation "${normalizedTranslation}" not accepted. Checking suggestions for ${targetLanguage}.`,
                    );

                    let status: SuggestTranslationResult['status'];
                    let resultingSuggestionDoc:
                        | SuggestedWordBuryatDocument
                        | SuggestedWordRussianDocument;
                    let returnWord: SuggestedWordType;

                    // --- Branch based on TARGET language ---
                    if (targetLanguage === 'buryat') {
                        const TargetModel =
                            SuggestedWordModelBuryat as SuggestedWordBuryatMongooseModel;
                        this.log.debug(`Using Buryat suggestion model.`);
                        let suggestedDoc: SuggestedWordBuryatDocument | null =
                            await TargetModel.findOne(
                                { normalized_text: normalizedTranslation },
                                null,
                                { session: currentSession },
                            );

                        if (suggestedDoc) {
                            // Buryat Suggestion exists
                            this.log.info(
                                `Buryat suggestion found (ID: ${suggestedDoc._id}). Checking for updates.`,
                            );
                            const contributorAdded =
                                !suggestedDoc.contributors.some((c) =>
                                    c.equals(authorId),
                                );
                            const preTranslationAdded =
                                !suggestedDoc.pre_translations?.some((p) =>
                                    p.equals(sourceWord._id as Types.ObjectId),
                                );

                            if (contributorAdded || preTranslationAdded) {
                                this.log.info(
                                    `Updating existing Buryat suggestion ${suggestedDoc._id}. Adding contributor: ${contributorAdded}, pre-translation: ${preTranslationAdded}`,
                                );
                                await TargetModel.updateOne(
                                    { _id: suggestedDoc._id },
                                    {
                                        $addToSet: {
                                            contributors: authorId,
                                            pre_translations: sourceWord._id,
                                        },
                                    },
                                    { session: currentSession },
                                );
                                const reloadedDoc = await TargetModel.findById(
                                    suggestedDoc._id,
                                    null,
                                    { session: currentSession },
                                );
                                if (!reloadedDoc)
                                    throw new DatabaseError(
                                        'Не удалось перезагрузить обновленное бурятское предложение.',
                                    );
                                resultingSuggestionDoc = reloadedDoc;
                                this.log.info(
                                    `Buryat suggestion ${resultingSuggestionDoc._id} updated successfully.`,
                                );
                                // --- ИСПОЛЬЗОВАНИЕ AddRatingHandler ---
                                try {
                                    await this.addRatingHandler.execute({
                                        userObjectId: authorId,
                                        amount: RATING_POINTS.SUGGESTION_CONTRIBUTION,
                                        session: currentSession,
                                    });
                                    this.log.info(
                                        `Successfully requested rating update for user ${authorId} (+${RATING_POINTS.SUGGESTION_CONTRIBUTION})`,
                                    );
                                } catch (ratingError /*: unknown */) {
                                    // <-- ratingError is unknown
                                    // *** Исправлено: Использование isError ***
                                    const errorMessage = isError(ratingError)
                                        ? ratingError.message
                                        : 'Неизвестная ошибка при обновлении рейтинга (suggestion contribution)';
                                    this.log.error(
                                        `Failed to update rating for user ${authorId} (suggestion contribution): ${errorMessage}`,
                                        { error: ratingError },
                                    );
                                    // Не прерываем транзакцию
                                }
                                // --- КОНЕЦ ИСПОЛЬЗОВАНИЯ --
                                status = 'suggestion_updated';
                            } else {
                                this.log.info(
                                    `Buryat suggestion ${suggestedDoc._id} already up-to-date regarding this user/source word.`,
                                );
                                resultingSuggestionDoc = suggestedDoc;
                                status = 'suggestion_updated'; // Still return updated status even if no points awarded
                            }
                        } else {
                            // Buryat Suggestion does not exist
                            this.log.info(
                                `No existing Buryat suggestion found. Creating new one.`,
                            );
                            const newSuggestionData: NewSuggestedWordBuryatInput =
                                {
                                    text: translationText,
                                    normalized_text: normalizedTranslation,
                                    author: authorId,
                                    contributors: [authorId],
                                    status: 'new',
                                    // Convert valid string dialect ID to ObjectId, otherwise null
                                    dialect:
                                        dialect &&
                                        Types.ObjectId.isValid(dialect)
                                            ? new Types.ObjectId(dialect)
                                            : null,
                                    pre_translations: [sourceWord._id],
                                    themes: [],
                                };
                            this.log.debug(
                                'Data for new Buryat suggestion:',
                                newSuggestionData,
                            );

                            const newSuggestion = new TargetModel(
                                newSuggestionData,
                            );
                            // Result of save might need casting if TS inference is weak
                            resultingSuggestionDoc = (await newSuggestion.save({
                                session: currentSession,
                            })) as SuggestedWordBuryatDocument;
                            status = 'newly_suggested';
                            this.log.info(
                                `Created new Buryat suggestion with ID: ${resultingSuggestionDoc._id}.`,
                            );
                            // --- ИСПОЛЬЗОВАНИЕ AddRatingHandler ---
                            try {
                                await this.addRatingHandler.execute({
                                    userObjectId: authorId,
                                    amount: RATING_POINTS.NEW_SUGGESTION,
                                    session: currentSession,
                                });
                                this.log.info(
                                    `Successfully requested rating update for user ${authorId} (+${RATING_POINTS.NEW_SUGGESTION})`,
                                );
                            } catch (ratingError /*: unknown */) {
                                // <-- ratingError is unknown
                                // *** Исправлено: Использование isError ***
                                const errorMessage = isError(ratingError)
                                    ? ratingError.message
                                    : 'Неизвестная ошибка при обновлении рейтинга (new suggestion)';
                                this.log.error(
                                    `Failed to update rating for user ${authorId} (new suggestion): ${errorMessage}`,
                                    { error: ratingError },
                                );
                                // Не прерываем транзакцию
                            }
                            // --- КОНЕЦ ИСПОЛЬЗОВАНИЯ --
                        }
                        // Convert the specific Buryat document to the generic POJO type
                        returnWord =
                            resultingSuggestionDoc.toObject() as SuggestedWordType;
                    } else {
                        // targetLanguage === 'russian'
                        const TargetModel =
                            SuggestedWordModelRussian as SuggestedWordRussianMongooseModel;
                        this.log.debug(`Using Russian suggestion model.`);
                        let suggestedDoc: SuggestedWordRussianDocument | null =
                            await TargetModel.findOne(
                                { normalized_text: normalizedTranslation },
                                null,
                                { session: currentSession },
                            );

                        if (suggestedDoc) {
                            // Russian Suggestion exists
                            this.log.info(
                                `Russian suggestion found (ID: ${suggestedDoc._id}). Checking for updates.`,
                            );
                            const contributorAdded =
                                !suggestedDoc.contributors.some((c) =>
                                    c.equals(authorId),
                                );
                            const preTranslationAdded =
                                !suggestedDoc.pre_translations?.some((p) =>
                                    p.equals(sourceWord._id as Types.ObjectId),
                                );

                            if (contributorAdded || preTranslationAdded) {
                                this.log.info(
                                    `Updating existing Russian suggestion ${suggestedDoc._id}. Adding contributor: ${contributorAdded}, pre-translation: ${preTranslationAdded}`,
                                );
                                await TargetModel.updateOne(
                                    { _id: suggestedDoc._id },
                                    {
                                        $addToSet: {
                                            contributors: authorId,
                                            pre_translations: sourceWord._id,
                                        },
                                    },
                                    { session: currentSession },
                                );
                                const reloadedDoc = await TargetModel.findById(
                                    suggestedDoc._id,
                                    null,
                                    { session: currentSession },
                                );
                                if (!reloadedDoc)
                                    throw new DatabaseError(
                                        'Не удалось перезагрузить обновленное русское предложение.',
                                    );
                                resultingSuggestionDoc = reloadedDoc;
                                this.log.info(
                                    `Russian suggestion ${resultingSuggestionDoc._id} updated successfully.`,
                                );
                                // *** Исправлено: Замена updateRating на addRatingHandler с try/catch ***
                                // await updateRating(
                                //     authorId,
                                //     RATING_POINTS.SUGGESTION_CONTRIBUTION,
                                // );
                                // --- ИСПОЛЬЗОВАНИЕ AddRatingHandler ---
                                try {
                                    await this.addRatingHandler.execute({
                                        userObjectId: authorId,
                                        amount: RATING_POINTS.SUGGESTION_CONTRIBUTION,
                                        session: currentSession,
                                    });
                                    this.log.info(
                                        `Successfully requested rating update for user ${authorId} (+${RATING_POINTS.SUGGESTION_CONTRIBUTION}) (russian)`,
                                    );
                                } catch (ratingError /*: unknown */) {
                                    // <-- ratingError is unknown
                                    const errorMessage = isError(ratingError)
                                        ? ratingError.message
                                        : 'Неизвестная ошибка при обновлении рейтинга (suggestion contribution - russian)';
                                    this.log.error(
                                        `Failed to update rating for user ${authorId} (suggestion contribution - russian): ${errorMessage}`,
                                        { error: ratingError },
                                    );
                                    // Не прерываем транзакцию
                                }
                                // --- КОНЕЦ ИСПОЛЬЗОВАНИЯ --
                                status = 'suggestion_updated';
                            } else {
                                this.log.info(
                                    `Russian suggestion ${suggestedDoc._id} already up-to-date regarding this user/source word.`,
                                );
                                resultingSuggestionDoc = suggestedDoc;
                                status = 'suggestion_updated'; // Still return updated status even if no points awarded
                            }
                        } else {
                            // Russian Suggestion does not exist
                            this.log.info(
                                `No existing Russian suggestion found. Creating new one.`,
                            );
                            const newSuggestionData: NewSuggestedWordRussianInput =
                                {
                                    text: translationText,
                                    normalized_text: normalizedTranslation,
                                    author: authorId,
                                    contributors: [authorId],
                                    status: 'new',
                                    pre_translations: [sourceWord._id],
                                    themes: [],
                                };
                            this.log.debug(
                                'Data for new Russian suggestion:',
                                newSuggestionData,
                            );

                            const newSuggestion = new TargetModel(
                                newSuggestionData,
                            );
                            // Result of save might need casting
                            resultingSuggestionDoc = (await newSuggestion.save({
                                session: currentSession,
                            })) as SuggestedWordRussianDocument;
                            status = 'newly_suggested';
                            this.log.info(
                                `Created new Russian suggestion with ID: ${resultingSuggestionDoc._id}.`,
                            );
                            // *** Исправлено: Замена updateRating на addRatingHandler с try/catch ***
                            // await updateRating(
                            //     authorId,
                            //     RATING_POINTS.NEW_SUGGESTION,
                            // );
                            // --- ИСПОЛЬЗОВАНИЕ AddRatingHandler ---
                            try {
                                await this.addRatingHandler.execute({
                                    userObjectId: authorId,
                                    amount: RATING_POINTS.NEW_SUGGESTION,
                                    session: currentSession,
                                });
                                this.log.info(
                                    `Successfully requested rating update for user ${authorId} (+${RATING_POINTS.NEW_SUGGESTION}) (russian)`,
                                );
                            } catch (ratingError /*: unknown */) {
                                // <-- ratingError is unknown
                                const errorMessage = isError(ratingError)
                                    ? ratingError.message
                                    : 'Неизвестная ошибка при обновлении рейтинга (new suggestion - russian)';
                                this.log.error(
                                    `Failed to update rating for user ${authorId} (new suggestion - russian): ${errorMessage}`,
                                    { error: ratingError },
                                );
                                // Не прерываем транзакцию
                            }
                            // --- КОНЕЦ ИСПОЛЬЗОВАНИЯ --
                        }
                        // Convert the specific Russian document to the generic POJO type
                        returnWord =
                            resultingSuggestionDoc.toObject() as SuggestedWordType;
                    } // End else (targetLanguage === 'russian')

                    // 6. Link Source Accepted Word to the new/updated Suggestion (translations_u)
                    this.log.info(
                        `Linking source word ${sourceWord._id} to suggestion ${resultingSuggestionDoc._id} (translations_u).`,
                    );
                    const sourceUpdateData = {
                        $addToSet: {
                            translations_u: resultingSuggestionDoc._id,
                        },
                    };
                    // Use $ne check to avoid adding duplicates in case of concurrent requests or retries,
                    // although the transaction should normally prevent this specific issue.
                    // It also prevents logging success if the link already exists.
                    let sourceLinkUpdateResult: UpdateWriteOpResult;
                    if (sourceLanguage === 'buryat') {
                        sourceLinkUpdateResult =
                            await AcceptedWordBuryat.updateOne(
                                {
                                    _id: sourceWord._id,
                                    translations_u: {
                                        $ne: resultingSuggestionDoc._id,
                                    },
                                },
                                sourceUpdateData,
                                { session: currentSession },
                            );
                    } else {
                        // sourceLanguage === 'russian'
                        sourceLinkUpdateResult =
                            await AcceptedWordRussian.updateOne(
                                {
                                    _id: sourceWord._id,
                                    translations_u: {
                                        $ne: resultingSuggestionDoc._id,
                                    },
                                },
                                sourceUpdateData,
                                { session: currentSession },
                            );
                    }
                    this.log.debug(
                        `Source word link to suggestion update result: modified=${sourceLinkUpdateResult.modifiedCount}`,
                    );

                    // Final check before returning POJO
                    if (
                        !returnWord ||
                        typeof returnWord !== 'object' ||
                        !('_id' in returnWord)
                    ) {
                        this.log.error(
                            'Failed to prepare final returnWord POJO from resulting document.',
                            { docId: resultingSuggestionDoc?._id },
                        );
                        // Throw within transaction to ensure rollback
                        throw new Error(
                            'Внутренняя ошибка: Не удалось подготовить объект результата предложения.',
                        );
                    }
                    this.log.debug(
                        `Prepared result word object for return:`,
                        returnWord,
                    );

                    this.log.debug('Transaction successful. Committing...'); // withTransaction handles commit implicitly
                    return { status, word: returnWord }; // Return POJO
                }, // End async callback for withTransaction
            ); // End session.withTransaction

            // If transaction was successful, sessionResult contains the returned value
            if (!sessionResult) {
                // This should ideally be caught by errors within the transaction scope
                this.log.error(
                    'Transaction finished but sessionResult is unexpectedly undefined or null.',
                );
                throw new DatabaseError(
                    'Транзакция завершилась без ожидаемого результата.',
                );
            }

            this.log.info(
                `SuggestTranslationHandler finished successfully. Status: ${sessionResult.status}`,
            );
            return sessionResult as SuggestTranslationResult; // Ensure final return type
        } catch (error: unknown) {
            // Transaction is automatically aborted by withTransaction on error
            const message = isError(error)
                ? error.message
                : 'Неизвестная ошибка во время предложения перевода.';
            // Log the error with context
            this.log.error(
                `SuggestTranslationHandler: Error during suggestion for word ${wordId}. Message: ${message}`,
                {
                    error:
                        error instanceof Error
                            ? {
                                  name: error.name,
                                  message: error.message,
                                  stack: error.stack,
                                  cause: (error as DatabaseError).cause,
                              }
                            : error,
                    input: {
                        wordId,
                        sourceLanguage,
                        translationTextLength: translationText.length,
                        telegramUserId,
                        dialect,
                    }, // Avoid logging full text potentially
                },
            );

            // Re-throw specific known AppErrors or wrap others in DatabaseError
            if (error instanceof AppError) {
                // Catches ValidationError, NotFoundError, DatabaseError etc.
                throw error; // Re-throw custom errors as is
            }

            // Wrap unexpected errors (e.g., network issues, non-AppError Mongoose errors)
            throw new DatabaseError(
                `Не удалось предложить перевод: ${message}`,
                error instanceof Error ? error : undefined,
            );
        } finally {
            // Session is automatically ended by withTransaction
            await session.endSession(); // Explicitly end session for clarity and good practice
            this.log.debug('MongoDB session ended.');
            this.log.info(
                `SuggestTranslationHandler: Finished execution for word ${wordId}.`,
            );
        }
    }
}
