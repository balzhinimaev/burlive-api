// src/services/AcceptanceService.ts
import mongoose, { Types, Document, ClientSession } from 'mongoose';
import logger from '../utils/logger';
import TelegramUserModel from '../models/TelegramUsers';
import {
    IAcceptanceService,
    AcceptSuggestionInput,
} from './interfaces/acceptanceService.interface';

// import { IAcceptanceService } from './interfaces/acceptanceService.interface';
import {
    AcceptedWordType, // Assuming this is LeanDocument<IAcceptedWordRussian | IAcceptedWordBuryat>
    ISuggestedWordBuryat,
    ISuggestedWordRussian,
} from '../types/vocabulary.types';
// Ensure these interfaces DO NOT contain the 'language' field if you don't want it in the DB model
import { IAcceptedWordRussian } from '../models/Vocabulary/AcceptedWordRussian';
import { IAcceptedWordBuryat } from '../models/Vocabulary/AcceptedWordBuryat';

import SuggestedWordBuryatModel from '../models/Vocabulary/SuggestedWordModelBuryat';
import SuggestedWordRussianModel from '../models/Vocabulary/SuggestedWordModelRussian';
import AcceptedWordBuryatModel from '../models/Vocabulary/AcceptedWordBuryat';
import AcceptedWordRussianModel from '../models/Vocabulary/AcceptedWordRussian';
// import DeclinedWordModel from '../models/Vocabulary/DeclinedWordModel';

import { RATING_POINTS } from '../config/constants';
import {
    NotFoundError,
    DatabaseError,
    ConflictError,
} from '../errors/customErrors';
import { isError } from '../utils/typeGuards';
import { IAddRatingHandler } from './interfaces/userRating.interface';

// Corrected Lean type definition
type SuggestedWordLeanType = (ISuggestedWordRussian | ISuggestedWordBuryat) & {
    _id: Types.ObjectId;
    __v?: number;
    dialect: Types.ObjectId | null
    // Add other potential Mongoose fields added by lean() if necessary
};

// Mongoose Document types
type AcceptedRussianDocument = Document<
    Types.ObjectId,
    {},
    IAcceptedWordRussian
> &
    IAcceptedWordRussian & { _id: Types.ObjectId };

type AcceptedBuryatDocument = Document<
    Types.ObjectId,
    {},
    IAcceptedWordBuryat
> &
    IAcceptedWordBuryat & { _id: Types.ObjectId };

class AcceptanceService implements IAcceptanceService {
    constructor(
        private readonly suggestedWordRussian: typeof SuggestedWordRussianModel,
        private readonly suggestedWordBuryat: typeof SuggestedWordBuryatModel,
        private readonly acceptedWordRussian: typeof AcceptedWordRussianModel,
        private readonly acceptedWordBuryat: typeof AcceptedWordBuryatModel,
        private readonly telegramUserModel: typeof TelegramUserModel,
        // This dependency is declared but not used. Consider removing if not needed.
        // private readonly declinedWordModel: typeof DeclinedWordModel,
        private readonly addRatingHandler: IAddRatingHandler,
        private readonly log: typeof logger,
        private readonly ratingPoints: typeof RATING_POINTS & {
            MODERATION_ACCEPTED?: number;
            ACCEPTED_CONTRIBUTION?: number;
            SUGGESTION_ACCEPTED?: number;
        },
    ) {}

    // async execute(input: AcceptSuggestionInput): Promise<AcceptedWordType> {}

    async execute(input: AcceptSuggestionInput): Promise<AcceptedWordType> {
        const { suggestedWordId, moderatorTelegramId, language } = input; // Деструктурируем input
        this.log.info(
            `AcceptanceService: Starting acceptance for suggestion ${suggestedWordId} (${language}) by moderator ${moderatorTelegramId}`,
        );
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const moderator = await this.telegramUserModel
                .findOne({ id: moderatorTelegramId }, '_id')
                .session(session)
                .lean();
            if (!moderator) {
                this.log.warn(
                    `Moderator ${moderatorTelegramId} not found. Proceeding without moderator ID for rating updates.`,
                );
            }
            const moderatorId = moderator?._id;

            let finalAcceptedWord: AcceptedWordType;
            let suggestedWordLean: SuggestedWordLeanType | null = null;

            // --- Main logic branch based on language ---
            if (language === 'russian') {
                // --- 2. Find suggested word (lean) ---
                suggestedWordLean = (await this.suggestedWordRussian
                    .findById(suggestedWordId)
                    .session(session)
                    .lean()) as SuggestedWordLeanType | null;
                if (!suggestedWordLean)
                    throw new NotFoundError(
                        `Suggested word ${suggestedWordId} (russian) not found.`,
                    );
                // Check status
                if (
                    suggestedWordLean.status === 'accepted' ||
                    suggestedWordLean.status === 'rejected'
                ) {
                    this.log.warn(
                        `Suggestion ${suggestedWordId} (russian) already processed. Status: ${suggestedWordLean.status}`,
                    );
                    // Optionally throw ConflictError
                }

                // --- 4. Find existing accepted word (NOT lean) ---
                const existingRussianDoc = (await this.acceptedWordRussian
                    .findOne({
                        normalized_text: suggestedWordLean.normalized_text,
                    })
                    .session(session)) as AcceptedRussianDocument | null; // Type assertion

                // --- 5. Update or Create ---
                if (existingRussianDoc) {
                    finalAcceptedWord =
                        await this._updateExistingAcceptedRussianWord(
                            existingRussianDoc,
                            suggestedWordLean,
                            moderatorId,
                            session,
                        );
                } else {
                    finalAcceptedWord =
                        await this._createNewAcceptedRussianWord(
                            suggestedWordLean,
                            moderatorId,
                            session,
                        );
                    await this._updateRatingsForNewWord(
                        suggestedWordLean,
                        moderatorId,
                    );
                }

                // --- 6. Link pre-translations and reload ---
                if (
                    suggestedWordLean.pre_translations &&
                    suggestedWordLean.pre_translations.length > 0
                ) {
                    await this._linkAcceptedWithPreTranslations(
                        finalAcceptedWord,
                        suggestedWordLean,
                        language,
                        session,
                    );

                    const populateOptions = [
                        {
                            path: 'translations',
                            select: 'text language normalized_text',
                        },
                        {
                            path: 'translations_u',
                            select: 'text language normalized_text',
                        },
                        { path: 'author', select: '_id id firstName username' },
                        {
                            path: 'contributors',
                            select: '_id id firstName username',
                        },
                    ];
                    // Reload Russian word
                    const reloadedWord = await this.acceptedWordRussian
                        .findById(finalAcceptedWord._id)
                        .populate(populateOptions)
                        .session(session)
                        .lean();
                    if (!reloadedWord)
                        throw new DatabaseError(
                            'Failed to reload final accepted russian word after linking.',
                        );
                    finalAcceptedWord = reloadedWord as AcceptedWordType; // Type assertion
                }

                // --- 7. Delete original suggested word (Russian) ---
                this.log.info(
                    `Deleting original russian suggestion ${suggestedWordId}`,
                );
                await this.suggestedWordRussian.findByIdAndDelete(
                    suggestedWordId,
                    { session },
                );
            } else {
                // language === 'buryat'
                // --- 2. Find suggested word (lean) ---
                suggestedWordLean = (await this.suggestedWordBuryat
                    .findById(suggestedWordId)
                    .session(session)
                    .lean()) as SuggestedWordLeanType | null;
                if (!suggestedWordLean)
                    throw new NotFoundError(
                        `Suggested word ${suggestedWordId} (buryat) not found.`,
                    );
                // Check status
                if (
                    suggestedWordLean.status === 'accepted' ||
                    suggestedWordLean.status === 'rejected'
                ) {
                    this.log.warn(
                        `Suggestion ${suggestedWordId} (buryat) already processed. Status: ${suggestedWordLean.status}`,
                    );
                    // Optionally throw ConflictError
                }

                // --- 4. Find existing accepted word (NOT lean) ---
                const existingBuryatDoc = (await this.acceptedWordBuryat
                    .findOne({
                        normalized_text: suggestedWordLean.normalized_text,
                    })
                    .session(session)) as AcceptedBuryatDocument | null; // Type assertion

                // --- 5. Update or Create ---
                if (existingBuryatDoc) {
                    finalAcceptedWord =
                        await this._updateExistingAcceptedBuryatWord(
                            existingBuryatDoc,
                            suggestedWordLean,
                            moderatorId,
                            session,
                        );
                } else {
                    finalAcceptedWord = await this._createNewAcceptedBuryatWord(
                        suggestedWordLean,
                        moderatorId,
                        session,
                    );
                    await this._updateRatingsForNewWord(
                        suggestedWordLean,
                        moderatorId,
                    );
                }

                // --- 6. Link pre-translations and reload ---
                if (
                    suggestedWordLean.pre_translations &&
                    suggestedWordLean.pre_translations.length > 0
                ) {
                    await this._linkAcceptedWithPreTranslations(
                        finalAcceptedWord,
                        suggestedWordLean,
                        language,
                        session,
                    );

                    const populateOptions = [
                        {
                            path: 'translations',
                            select: 'text language normalized_text',
                        },
                        {
                            path: 'translations_u',
                            select: 'text language normalized_text',
                        },
                        { path: 'author', select: '_id id firstName username' },
                        {
                            path: 'contributors',
                            select: '_id id firstName username',
                        },
                    ];
                    const buryatPopulateOptions = [...populateOptions];
                    // TODO: Add dialect population if it's a ref and needed
                    // if (isDialectRef) buryatPopulateOptions.push({ path: 'dialect', select: 'name' });

                    // Reload Buryat word
                    const reloadedWord = await this.acceptedWordBuryat
                        .findById(finalAcceptedWord._id)
                        .populate(buryatPopulateOptions)
                        .session(session)
                        .lean();
                    if (!reloadedWord)
                        throw new DatabaseError(
                            'Failed to reload final accepted buryat word after linking.',
                        );
                    finalAcceptedWord = reloadedWord as AcceptedWordType; // Type assertion
                }

                // --- 7. Delete original suggested word (Buryat) ---
                this.log.info(
                    `Deleting original buryat suggestion ${suggestedWordId}`,
                );
                await this.suggestedWordBuryat.findByIdAndDelete(
                    suggestedWordId,
                    { session },
                );
            }
            // --- End of main logic branch ---

            // --- 8. Commit transaction ---
            await session.commitTransaction();
            this.log.info(
                `Successfully accepted suggestion ${suggestedWordId}. Final accepted word ID: ${finalAcceptedWord._id}`,
            );

            // Added check to ensure finalAcceptedWord is defined before returning
            if (!finalAcceptedWord) {
                // This should ideally not happen if logic is correct, but acts as a safeguard
                throw new DatabaseError(
                    `Operation completed but finalAcceptedWord was unexpectedly undefined for suggestion ${suggestedWordId}`,
                );
            }
            return finalAcceptedWord; // Return the lean object
        } catch (error: unknown) {
            // Rollback transaction on error
            await session.abortTransaction();
            this.log.error(
                `Error accepting suggestion ${suggestedWordId}:`,
                error,
            );
            // Re-throw specific errors or a generic DatabaseError
            if (
                error instanceof NotFoundError ||
                error instanceof DatabaseError ||
                error instanceof ConflictError
            ) {
                throw error;
            }
            const message = isError(error)
                ? error.message
                : 'Unknown error during acceptance.';
            throw new DatabaseError(`Failed to accept suggestion: ${message}`);
        } finally {
            // End session regardless of outcome
            if (session.inTransaction()) {
                // Log if aborting in finally (shouldn't happen often)
                this.log.warn(
                    `Transaction for accepting ${suggestedWordId} was still in progress in finally block, aborting.`,
                );
                try {
                    await session.abortTransaction();
                } catch (abortErr) {
                    this.log.error('Error aborting tx in finally', abortErr);
                }
            }
            await session.endSession();
        }
    }

    // --- Private Helper Methods ---

    private async _updateExistingAcceptedRussianWord(
        existingAcceptedWordDoc: AcceptedRussianDocument,
        suggestedWord: SuggestedWordLeanType,
        moderatorId: Types.ObjectId | undefined,
        session: ClientSession,
    ): Promise<AcceptedWordType> {
        this.log.warn(
            `Accepted Russian word "${suggestedWord.normalized_text}" (${existingAcceptedWordDoc._id}) exists. Merging suggestion ${suggestedWord._id}.`,
        );
        const { newContributors, wasModeratorAdded } =
            this._calculateNewContributors(
                existingAcceptedWordDoc.toObject(),
                suggestedWord,
                moderatorId,
            );

        let modified = false;
        if (newContributors.length > 0) {
            const updateResult = await this.acceptedWordRussian.updateOne(
                { _id: existingAcceptedWordDoc._id },
                { $addToSet: { contributors: { $each: newContributors } } },
                { session },
            );
            modified = updateResult.modifiedCount > 0;

            if (modified) {
                this.log.info(
                    `Added contributors ${newContributors.map((c) => c.toString()).join(', ')} to existing Russian word ${existingAcceptedWordDoc._id}`,
                );
                // Update ratings
                const newProposerContributors = newContributors.filter(
                    (id) => !moderatorId || !id.equals(moderatorId),
                );
                for (const contributorId of newProposerContributors) {
                    await this.addRatingHandler
                        .execute({
                            userObjectId: contributorId,
                            amount: this.ratingPoints.SUGGESTION_CONTRIBUTION,
                        })
                        .catch((err) => {
                            this.log.error(
                                // Обновляем лог ошибки
                                `Rating update failed for contributor ObjectId ${contributorId}:`, // <-- ИЗМЕНЕНО
                                err,
                            );
                        });
                }
                if (wasModeratorAdded && moderatorId) {
                    const moderationPoints =
                        this.ratingPoints.MODERATION_ACCEPTED ?? 5;
                    await this.addRatingHandler
                        .execute({
                            userObjectId: moderatorId,
                            amount: moderationPoints,
                        })
                        .catch((err) => {
                            this.log.error(
                                // Обновляем лог ошибки
                                `Rating update failed for moderator ${moderatorId}:`, // <-- ИЗМЕНЕНО
                                err,
                            );
                        });
                }
            }
        }

        // Reload with populate if modified, otherwise return lean object of original
        const finalDoc = modified
            ? await this.acceptedWordRussian
                  .findById(existingAcceptedWordDoc._id)
                  .populate([
                      { path: 'author', select: '_id id firstName username' },
                      {
                          path: 'contributors',
                          select: '_id id firstName username',
                      },
                      {
                          path: 'translations',
                          select: 'text language normalized_text',
                      },
                  ])
                  .session(session)
                  .lean()
            : existingAcceptedWordDoc.toObject({
                  virtuals: true,
                  getters: true,
              }); // Use toObject if not reloading

        if (!finalDoc)
            throw new DatabaseError(
                `Failed to reload Russian word ${existingAcceptedWordDoc._id} after merge.`,
            );
        return finalDoc as AcceptedWordType;
    }

    private async _updateExistingAcceptedBuryatWord(
        existingAcceptedWordDoc: AcceptedBuryatDocument,
        suggestedWord: SuggestedWordLeanType,
        moderatorId: Types.ObjectId | undefined,
        session: ClientSession,
    ): Promise<AcceptedWordType> {
        this.log.warn(
            `Accepted Buryat word "${suggestedWord.normalized_text}" (${existingAcceptedWordDoc._id}) exists. Merging suggestion ${suggestedWord._id}.`,
        );
        const { newContributors, wasModeratorAdded } =
            this._calculateNewContributors(
                existingAcceptedWordDoc.toObject(),
                suggestedWord,
                moderatorId,
            );

        let modified = false;
        if (newContributors.length > 0) {
            const updateResult = await this.acceptedWordBuryat.updateOne(
                { _id: existingAcceptedWordDoc._id },
                { $addToSet: { contributors: { $each: newContributors } } },
                { session },
            );
            modified = updateResult.modifiedCount > 0;

            if (modified) {
                this.log.info(
                    `Added contributors ${newContributors.map((c) => c.toString()).join(', ')} to existing Buryat word ${existingAcceptedWordDoc._id}`,
                );
                // Update ratings
                const newProposerContributors = newContributors.filter(
                    (id) => !moderatorId || !id.equals(moderatorId),
                );
                for (const contributorId of newProposerContributors) {
                    await this.addRatingHandler
                        .execute({
                            userObjectId: contributorId,
                            amount:
                                this.ratingPoints.ACCEPTED_CONTRIBUTION ?? 15,
                        })
                        .catch((err) =>
                            this.log.error(
                                `Rating update failed for contributor ${contributorId}:`,
                                err,
                            ),
                        );
                }
                if (wasModeratorAdded && moderatorId) {
                    const moderationPoints =
                        this.ratingPoints.MODERATION_ACCEPTED ?? 5;
                    await this.addRatingHandler
                        .execute({
                            userObjectId: moderatorId,
                            amount: moderationPoints,
                        })
                        .catch((err) =>
                            this.log.error(
                                `Rating update failed for moderator ${moderatorId}:`,
                                err,
                            ),
                        );
                }
            }
            // TODO: Add logic to update dialect if needed
        }

        const finalDoc = modified
            ? await this.acceptedWordBuryat
                  .findById(existingAcceptedWordDoc._id)
                  .populate([
                      { path: 'author', select: '_id id firstName username' },
                      {
                          path: 'contributors',
                          select: '_id id firstName username',
                      },
                      {
                          path: 'translations',
                          select: 'text language normalized_text',
                      },
                      // { path: 'dialect', select: 'name' } // Populate dialect if it's a ref
                  ])
                  .session(session)
                  .lean()
            : existingAcceptedWordDoc.toObject({
                  virtuals: true,
                  getters: true,
              });

        if (!finalDoc)
            throw new DatabaseError(
                `Failed to reload Buryat word ${existingAcceptedWordDoc._id} after merge.`,
            );
        return finalDoc as AcceptedWordType;
    }

    private async _createNewAcceptedRussianWord(
        suggestedWord: SuggestedWordLeanType,
        moderatorId: Types.ObjectId | undefined,
        session: ClientSession,
    ): Promise<AcceptedWordType> {
        this.log.info(
            `Creating new accepted Russian word from suggestion ${suggestedWord._id}.`,
        );
        const uniqueContributorIds = this._getUniqueContributorIds(
            suggestedWord,
            moderatorId,
        );

        if (
            !suggestedWord.author ||
            !Types.ObjectId.isValid(suggestedWord.author)
        ) {
            throw new DatabaseError(
                `Suggested word ${suggestedWord._id} missing/invalid author.`,
            );
        }

        // Removed 'language' field
        const newAcceptedData: Omit<
            IAcceptedWordRussian,
            '_id' | 'createdAt' | 'updatedAt'
        > = {
            text: suggestedWord.text,
            normalized_text: suggestedWord.normalized_text,
            author: suggestedWord.author,
            contributors: uniqueContributorIds,
            translations: [],
            translations_u: [],
            themes: [],
        };

        const [createdWordDoc] = await this.acceptedWordRussian.create(
            [newAcceptedData],
            { session },
        );
        if (!createdWordDoc)
            throw new DatabaseError(
                'Failed to create new accepted Russian word.',
            );
        this.log.info(
            `Suggestion ${suggestedWord._id} accepted as NEW Russian word ${createdWordDoc._id}.`,
        );

        // Reload with populate
        const createdWordLean = await this.acceptedWordRussian
            .findById(createdWordDoc._id)
            .populate([
                { path: 'author', select: '_id id firstName username' },
                { path: 'contributors', select: '_id id firstName username' },
            ])
            .session(session)
            .lean();
        if (!createdWordLean)
            throw new DatabaseError(
                'Failed to reload newly created Russian word.',
            );
        return createdWordLean as AcceptedWordType;
    }

    private async _createNewAcceptedBuryatWord(
        suggestedWord: SuggestedWordLeanType,
        moderatorId: Types.ObjectId | undefined,
        session: ClientSession,
    ): Promise<AcceptedWordType> {
        this.log.info(
            `Creating new accepted Buryat word from suggestion ${suggestedWord._id}.`,
        );
        const uniqueContributorIds = this._getUniqueContributorIds(
            suggestedWord,
            moderatorId,
        );

        if (
            !suggestedWord.author ||
            !Types.ObjectId.isValid(suggestedWord.author)
        ) {
            throw new DatabaseError(
                `Suggested word ${suggestedWord._id} missing/invalid author.`,
            );
        }

        // Removed 'language' field, set dialect to undefined (placeholder)
        const newAcceptedData: Omit<
            IAcceptedWordBuryat,
            '_id' | 'createdAt' | 'updatedAt'
        > = {
            text: suggestedWord.text,
            normalized_text: suggestedWord.normalized_text,
            author: suggestedWord.author,
            contributors: uniqueContributorIds,
            translations: [],
            translations_u: [],
            themes: [],
            dialect: suggestedWord.dialect, // <-- Corrected dialect type mismatch (temporary)
            // TODO: Implement dialect ObjectId lookup based on suggestedWord.dialect string if needed
        };

        const [createdWordDoc] = await this.acceptedWordBuryat.create(
            [newAcceptedData],
            { session },
        );
        if (!createdWordDoc)
            throw new DatabaseError(
                'Failed to create new accepted Buryat word.',
            );
        this.log.info(
            `Suggestion ${suggestedWord._id} accepted as NEW Buryat word ${createdWordDoc._id}.`,
        );

        // Reload with populate
        const createdWordLean = await this.acceptedWordBuryat
            .findById(createdWordDoc._id)
            .populate([
                { path: 'author', select: '_id id firstName username' },
                { path: 'contributors', select: '_id id firstName username' },
                // { path: 'dialect', select: 'name' } // Populate dialect if it's a ref
            ])
            .session(session)
            .lean();
        if (!createdWordLean)
            throw new DatabaseError(
                'Failed to reload newly created Buryat word.',
            );
        return createdWordLean as AcceptedWordType;
    }

    private async _updateRatingsForNewWord(
        suggestedWord: SuggestedWordLeanType,
        moderatorId: Types.ObjectId | undefined,
    ): Promise<void> {
        const uniqueProposers = this._getUniqueContributorIds(
            suggestedWord,
            undefined,
        ); // Exclude moderator for proposer rating
        const suggestionAcceptedPoints =
            this.ratingPoints.SUGGESTION_ACCEPTED ?? 20;

        for (const proposerId of uniqueProposers) {
            if (moderatorId && proposerId.equals(moderatorId)) continue; // Double check not rating moderator as proposer
            await this.addRatingHandler
                .execute({
                    userObjectId: proposerId,
                    amount: suggestionAcceptedPoints,
                })
                .catch((err) =>
                    this.log.error(
                        `Rating update failed for proposer ${proposerId}:`,
                        err,
                    ),
                );
        }
        if (moderatorId) {
            const moderationPoints = this.ratingPoints.MODERATION_ACCEPTED ?? 5;
            await this.addRatingHandler.execute({ userObjectId: moderatorId, amount: moderationPoints }).catch(
                (err) =>
                    this.log.error(
                        `Rating update failed for moderator ${moderatorId}:`,
                        err,
                    ),
            );
        }
    }

    private _calculateNewContributors(
        existingAcceptedWord: AcceptedWordType,
        suggestedWord: SuggestedWordLeanType,
        moderatorId?: Types.ObjectId,
    ): { newContributors: Types.ObjectId[]; wasModeratorAdded: boolean } {
        const authorId = suggestedWord.author;
        const contributorsFromSuggestion = [
            ...(authorId && Types.ObjectId.isValid(authorId) ? [authorId] : []),
            ...(suggestedWord.contributors || []),
        ].filter(
            (id): id is Types.ObjectId => !!id && Types.ObjectId.isValid(id),
        );

        const existingContributorIds = new Set(
            (Array.isArray(existingAcceptedWord.contributors)
                ? existingAcceptedWord.contributors
                : []
            )
                .map((c: any) => c?._id?.toString() ?? c?.toString())
                .filter(Boolean),
        );

        const newContributors: Types.ObjectId[] = [];
        let wasModeratorAdded = false;

        for (const suggestedC of contributorsFromSuggestion) {
            if (!existingContributorIds.has(suggestedC.toString())) {
                newContributors.push(suggestedC);
                existingContributorIds.add(suggestedC.toString());
            }
        }
        if (
            moderatorId &&
            !existingContributorIds.has(moderatorId.toString())
        ) {
            newContributors.push(moderatorId);
            wasModeratorAdded = true;
        }
        return { newContributors, wasModeratorAdded };
    }

    private _getUniqueContributorIds(
        suggestedWord: SuggestedWordLeanType,
        moderatorId?: Types.ObjectId,
    ): Types.ObjectId[] {
        const authorId = suggestedWord.author;
        const validAuthorId =
            authorId && Types.ObjectId.isValid(authorId) ? authorId : undefined;

        return (
            [
                ...new Set(
                    [
                        validAuthorId,
                        ...(suggestedWord.contributors || []),
                        moderatorId,
                    ]
                        .filter(
                            (id): id is Types.ObjectId =>
                                !!id && Types.ObjectId.isValid(id),
                        )
                        .map((id) => id.toString()),
                ),
            ]
                // Corrected type assertion for ObjectId constructor
                .map((id) => new Types.ObjectId(id as string))
        );
    }

    // Refactored to avoid calling methods on union types
    private async _linkAcceptedWithPreTranslations(
        finalAcceptedWord: AcceptedWordType,
        suggestedWord: SuggestedWordLeanType,
        language: 'russian' | 'buryat',
        session: ClientSession,
    ): Promise<void> {
        this.log.info(
            `Linking accepted word ${finalAcceptedWord._id} to pre-translations...`,
        );
        if (
            !suggestedWord.pre_translations ||
            suggestedWord.pre_translations.length === 0
        )
            return;

        const validPreTranslationIds = suggestedWord.pre_translations.filter(
            (id) => Types.ObjectId.isValid(id),
        );
        const validSuggestedWordId = Types.ObjectId.isValid(suggestedWord._id)
            ? suggestedWord._id
            : undefined;
        const validFinalAcceptedWordId = Types.ObjectId.isValid(
            finalAcceptedWord._id,
        )
            ? finalAcceptedWord._id
            : undefined;

        if (
            validPreTranslationIds.length === 0 ||
            !validSuggestedWordId ||
            !validFinalAcceptedWordId
        ) {
            this.log.error('Invalid IDs during pre-translation linking.', {
                suggestedId: suggestedWord._id?.toString(),
                finalId: finalAcceptedWord._id?.toString(),
                preIds: suggestedWord.pre_translations?.map((p) =>
                    p?.toString(),
                ),
            });
            throw new DatabaseError(
                'Invalid ObjectIds found during pre-translation linking.',
            );
        }

        // Perform updates based on the language context
        if (language === 'russian') {
            // finalAcceptedWord is Russian, pre_translations are Buryat IDs
            await this.acceptedWordBuryat.updateMany(
                // Update OppositeModel (Buryat)
                { _id: { $in: validPreTranslationIds } },
                {
                    $pull: {
                        translations_u: validSuggestedWordId as Types.ObjectId,
                    },
                    $addToSet: {
                        translations:
                            validFinalAcceptedWordId as Types.ObjectId,
                    },
                },
                { session },
            );
            await this.acceptedWordRussian.updateOne(
                // Update TargetModel (Russian)
                { _id: validFinalAcceptedWordId },
                {
                    $addToSet: {
                        translations: { $each: validPreTranslationIds },
                    },
                },
                { session },
            );
        } else {
            // language === 'buryat'
            // finalAcceptedWord is Buryat, pre_translations are Russian IDs
            await this.acceptedWordRussian.updateMany(
                // Update OppositeModel (Russian)
                { _id: { $in: validPreTranslationIds } },
                {
                    $pull: {
                        translations_u: validSuggestedWordId as Types.ObjectId,
                    },
                    $addToSet: {
                        translations:
                            validFinalAcceptedWordId as Types.ObjectId,
                    },
                },
                { session },
            );
            await this.acceptedWordBuryat.updateOne(
                // Update TargetModel (Buryat)
                { _id: validFinalAcceptedWordId },
                {
                    $addToSet: {
                        translations: { $each: validPreTranslationIds },
                    },
                },
                { session },
            );
        }
        this.log.info(
            `Linking complete for accepted word ${finalAcceptedWord._id}.`,
        );
    }
}

export { AcceptanceService };
