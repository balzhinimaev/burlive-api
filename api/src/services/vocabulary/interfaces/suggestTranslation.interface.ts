// src/services/vocabulary/handlers/interfaces/suggestTranslation.interface.ts
import {
    SuggestTranslationInput,
    SuggestTranslationResult,
} from '../../../types/vocabulary.types'; // Adjust path as needed

export interface ISuggestTranslationHandler {
    /**
     * Handles the logic for suggesting a translation for an existing accepted word.
     * Checks for existing accepted/suggested translations and manages database transactions.
     *
     * @param {SuggestTranslationInput} input - The input data for suggesting a translation.
     * @returns {Promise<SuggestTranslationResult>} A promise resolving to the result of the suggestion operation.
     * @throws {ValidationError} If input data is invalid (e.g., empty translation).
     * @throws {NotFoundError} If the source word or user is not found.
     * @throws {DatabaseError} If a database operation fails.
     * @throws {Error} Any other unexpected error during execution.
     */
    execute(input: SuggestTranslationInput): Promise<SuggestTranslationResult>;
}
