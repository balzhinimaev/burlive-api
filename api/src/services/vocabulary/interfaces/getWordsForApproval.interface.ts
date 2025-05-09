// src/services/interfaces/getWordsForApproval.interface.ts
// import { PaginatedResult } from '../../types/common.types';
// Убедитесь, что ApprovalWordType определен и экспортирован из ваших типов
// Вероятно, он выглядит примерно так:
// import { ISuggestedWordBuryat } from '../../models/Vocabulary/SuggestedWordModelBuryat';
// import { ISuggestedWordRussian } from '../../models/Vocabulary/SuggestedWordModelRussian';
// type ApprovalWordType = (ISuggestedWordRussian | ISuggestedWordBuryat) & { /* поля из populate */ };
// import { ApprovalWordType } from '../../types/vocabulary.types'; // Замените на ваш реальный путь

import { PaginatedResult } from "../../../types/common.types";
import { ApprovalWordType } from "../../../types/vocabulary.types";

// Входные данные для операции получения слов на утверждение
export interface GetWordsForApprovalInput {
    page?: number; // Страница пагинации
    limit?: number; // Количество элементов на странице
    language: 'russian' | 'buryat'; // Обязательный язык для выборки
    // Можно добавить другие параметры фильтрации в будущем, например, status
    // status?: 'new' | 'processing';
}

// Интерфейс обработчика
export interface IGetWordsForApprovalHandler {
    /**
     * Получает список предложенных слов (на утверждение) для указанного языка с пагинацией.
     * @param input - Параметры запроса (язык, страница, лимит).
     * @returns Пагинированный результат со списком слов.
     * @throws DatabaseError при ошибках базы данных.
     */
    execute(
        input: GetWordsForApprovalInput,
    ): Promise<PaginatedResult<ApprovalWordType>>;
}
