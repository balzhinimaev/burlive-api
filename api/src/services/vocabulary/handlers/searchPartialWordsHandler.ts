// src/services/vocabulary/handlers/searchPartialWordsHandler.ts
import {
    ISearchPartialWordsHandler,
    SearchPartialInput,
} from '../interfaces/searchPartialWords.interface';
import AcceptedWordBuryatModel from '../../../models/Vocabulary/AcceptedWordBuryat'; // Импортируем модель и интерфейс
import AcceptedWordRussianModel from '../../../models/Vocabulary/AcceptedWordRussian'; // Импортируем модель и интерфейс
import logger from '../../../utils/logger';
import { AcceptedWordType } from '../../../types/vocabulary.types'; // Общий тип для результата
import { isError } from '../../../utils/typeGuards';

export class SearchPartialWordsHandler implements ISearchPartialWordsHandler {
    // Зависимости остаются те же
    constructor(
        private readonly acceptedWordBuryatModel: typeof AcceptedWordBuryatModel,
        private readonly acceptedWordRussianModel: typeof AcceptedWordRussianModel,
        private readonly log: typeof logger,
    ) {
        this.log.info('SearchPartialWordsHandler instance created.');
    }

    async execute(input: SearchPartialInput): Promise<AcceptedWordType[]> {
        const { query, language, limit } = input;

        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            this.log.warn('SearchPartialWordsHandler: Received empty query.');
            return [];
        }

        const escapeRegex = (string: string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        };
        const escapedQuery = escapeRegex(normalizedQuery);
        const regex = new RegExp('^' + escapedQuery);

        // Объявляем переменную для результата заранее
        // Указываем тип явно, используя общий тип AcceptedWordType или более конкретный, если нужно
        let words: AcceptedWordType[] = [];
        // Или можно использовать тип Mongoose с lean(), если он известен:
        // let words: (mongoose.LeanDocument<IAcceptedWordBuryat | IAcceptedWordRussian> & { _id: mongoose.Types.ObjectId })[] = [];

        try {
            this.log.debug(
                `Handler: Executing partial search with regex: ${regex} for lang ${language} with limit ${limit}`,
            );

            // --- Разделяем логику через if ---
            if (language === 'buryat') {
                // Внутри этого блока TypeScript знает, что мы работаем с AcceptedWordBuryatModel
                words = await this.acceptedWordBuryatModel
                    .find({ normalized_text: regex })
                    .limit(limit)
                    .select('text normalized_text _id')
                    .lean(); // lean() возвращает POJO (Plain Old JavaScript Objects)
                // Явное приведение типа здесь может быть не нужно, если words объявлена как AcceptedWordType[]
                // или если AcceptedWordType совместим с результатом lean() для IAcceptedWordBuryat
            } else {
                // language === 'russian'
                // Внутри этого блока TypeScript знает, что мы работаем с AcceptedWordRussianModel
                words = await this.acceptedWordRussianModel
                    .find({ normalized_text: regex })
                    .limit(limit)
                    .select('text normalized_text _id')
                    .lean();
                // Явное приведение типа здесь может быть не нужно, если words объявлена как AcceptedWordType[]
                // или если AcceptedWordType совместим с результатом lean() для IAcceptedWordRussian
            }
            // --- Конец разделения логики ---

            this.log.info(
                `Handler: Partial search found ${words.length} words for query "${query}" (${language}).`,
            );

            // Возвращаем результат. Приведение типа может потребоваться в зависимости от того,
            // как объявлен AcceptedWordType и как он соотносится с результатом lean() + select()
            // Если AcceptedWordType это просто { text: string; normalized_text: string; _id: string | ObjectId; }, то приведение не нужно.
            return words as AcceptedWordType[]; // Оставляем приведение на всякий случай, если типы не идеально совпали
        } catch (error: unknown) {
            const message = isError(error)
                ? error.message
                : 'Unknown DB error during partial search.';
            // Логгер теперь знает язык, так как он вызывается до/после блока if/else
            this.log.error(
                `Handler: Database error during partial search for query "${query}" (${language}): ${message}`,
                error,
            );
            throw new Error(`Database error during partial search: ${message}`);
        }
    }
}
