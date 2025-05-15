// src/services/vocabulary/handlers/getSuggestedWordByIdHandler.ts
import mongoose from 'mongoose';
import { IGetSuggestedWordByIdHandler } from '../interfaces/getSuggestedWordById.interface';
import {
    GetSuggestedWordByIdInput,
    SuggestedWordDetailsType,
} from '../../../types/vocabulary.types'; // Предполагаем, что SuggestedWordDetailsType обновлен
import SuggestedWordRussianModel, {
    ISuggestedWordRussian,
} from '../../../models/Vocabulary/SuggestedWordModelRussian';
import SuggestedWordBuryatModel, {
    ISuggestedWordBuryat,
} from '../../../models/Vocabulary/SuggestedWordModelBuryat';
import logger from '../../../utils/logger';
// import { NotFoundError, ValidationError } from '../../../errors/customErrors'; // Если используете

// Removed unused interface

export class GetSuggestedWordByIdHandler
    implements IGetSuggestedWordByIdHandler
{
    constructor(
        private readonly suggestedRusModel: typeof SuggestedWordRussianModel,
        private readonly suggestedBurModel: typeof SuggestedWordBuryatModel,
        private readonly log: typeof logger,
        private readonly mongooseInstance: typeof mongoose,
    ) {}

    async execute(
        input: GetSuggestedWordByIdInput,
    ): Promise<SuggestedWordDetailsType | null> {
        this.log.info(
            `GetSuggestedWordByIdHandler: Executing for ID ${input.id}, Language: ${input.language}`,
        );

        if (!this.mongooseInstance.Types.ObjectId.isValid(input.id)) {
            this.log.warn(
                `GetSuggestedWordByIdHandler: Invalid ObjectId format for ID: ${input.id}`,
            );
            // Можно бросить ValidationError, если такой есть, или просто вернуть null
            // throw new ValidationError('Invalid ID format');
            return null;
        }

        // Instead of using a single model variable with a union type,
        // we'll use separate code paths for each language
        let suggestedWord: ISuggestedWordRussian | ISuggestedWordBuryat | null = null;

        try {
            if (input.language === 'russian') {
                suggestedWord = await this.suggestedRusModel
                    .findById(input.id)
                    .populate('author')
                    .populate('pre_translations')
                    .populate('contributors')
                    .populate('themes')
                    .populate('partOfSpeech')
                    .lean<ISuggestedWordRussian>()
                    .exec();
            } else if (input.language === 'buryat') {
                suggestedWord = await this.suggestedBurModel
                    .findById(input.id)
                    .populate('author')
                    .populate('pre_translations')
                    .populate('contributors')
                    .populate('dialect')
                    .populate('themes')
                    .populate('partOfSpeech')
                    .lean<ISuggestedWordBuryat>()
                    .exec();
            } else {
                // Эта ветка не должна выполниться из-за валидации на уровне роутера/контроллера
                this.log.error(
                    `GetSuggestedWordByIdHandler: Invalid language provided: ${input.language}`,
                );
                return null;
            }

            if (!suggestedWord) {
                this.log.info(
                    `GetSuggestedWordByIdHandler: Suggested word with ID ${input.id} for language ${input.language} not found.`,
                );
                return null; // Сервис/контроллер решат, как обработать null (например, NotFoundError)
            }

            this.log.info(
                `GetSuggestedWordByIdHandler: Found and populated suggested word with ID ${input.id}`,
            );

            // After populating the fields, we cast the result to the expected return type
            return suggestedWord as unknown as SuggestedWordDetailsType;
        } catch (error) {
            this.log.error(
                `GetSuggestedWordByIdHandler: Database error fetching/populating suggested word ID ${input.id} for lang ${input.language}:`,
                error,
            );
            // Можно перебросить как DatabaseError или общую ошибку
            throw error;
        }
    }
}
