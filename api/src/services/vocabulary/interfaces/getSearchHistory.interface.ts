// src/services/vocabulary/interfaces/getSearchHistory.interface.ts
import { PaginatedResult } from '../../../types/common.types';
import {
    GetSearchHistoryInput,
    SearchHistoryItem,
} from '../../../types/vocabulary.types';

export interface IGetSearchHistoryHandler {
    execute(
        input: GetSearchHistoryInput,
    ): Promise<PaginatedResult<SearchHistoryItem>>;
}
