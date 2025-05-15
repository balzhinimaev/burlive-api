// src/services/vocabulary/interfaces/getSuggestedWordById.interface.ts
import {
    SuggestedWordDetailsType,
    GetSuggestedWordByIdInput,
} from '../../../types/vocabulary.types';

export interface IGetSuggestedWordByIdHandler {
    execute(
        input: GetSuggestedWordByIdInput,
    ): Promise<SuggestedWordDetailsType | null>;
}
