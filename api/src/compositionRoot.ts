// src/compositionRoot.ts
import { VocabularyService } from './services/vocabulary/vocabularyService';
import { SuggestWordsHandler } from './services/vocabulary/handlers/suggestWordsHandler';
import { AcceptanceService } from './services/AcceptanceService';

// --- Импортируем все КОНКРЕТНЫЕ зависимости ---
// Модели
import TelegramUserModel from './models/TelegramUsers';
import AcceptedWordRussianModel from './models/Vocabulary/AcceptedWordRussian';
import AcceptedWordBuryatModel from './models/Vocabulary/AcceptedWordBuryat';
import SuggestedWordRussianModel from './models/Vocabulary/SuggestedWordModelRussian';
import SuggestedWordBuryatModel from './models/Vocabulary/SuggestedWordModelBuryat';
// Убираем импорт DeclinedWordModel, если он больше нигде не нужен
// import DeclinedWordModel from './models/Vocabulary/DeclinedWordModel';
import { TelegramUserService } from './services/telegram/telegramUserService';
// import { ReferralService } from './services/telegram/referralService';
// import { SubscriptionService } from './services/telegram/subscriptionService';
// import { LeaderboardService } from './services/telegram/leaderboardService';
// import { UserStateService } from './services/telegram/userStateService';
// import { UserActionService } from './services/telegram/userActionService';
import PartOfSpeechClassifierModel from './models/Classifiers/PartOfSpeechClassifierModel';
import { GetWordsForApprovalHandler } from './services/vocabulary/handlers/GetWordsForApprovalHandler';
import { SearchPartialWordsHandler } from './services/vocabulary/handlers/searchPartialWordsHandler';
import { ClassifierService } from './services/classifiers/ClassifierService';
// Утилиты и Константы
// import updateRating from './utils/updateRatingTelegram'; // Убедись, что импорт правильный (default)
import logger from './utils/logger';
import { RATING_POINTS } from './config/constants';
import LevelModel from './models/Level';
import { AddRatingHandler } from './services/user/AddRatingHandler';
import DialectModel from './models/Dialect';
import { DeclineSuggestionHandler } from './services/vocabulary/handlers/declineSuggestionHandler';
import DeclinedWordModel from './models/Vocabulary/DeclinedWordModel';
import mongoose from 'mongoose';
import { FindTranslationHandler } from './services/vocabulary/handlers/findTranslationHandler';
import SearchedWordRussianModel from './models/Vocabulary/SearchedWordRussianModel';
import SearchedWordBuryatModel from './models/Vocabulary/SearchedWordBuryatModel';
import SearchedWordHistoryModel from './models/Vocabulary/SearchedWordHistoryModel';
import { SuggestTranslationHandler } from './services/vocabulary/handlers/suggestTranslation.handler';
import { GetConfirmedWordHandler } from './services/vocabulary/handlers/getConfirmedWord.handler';
import { GetConfirmedWordsPaginatedHandler } from './services/vocabulary/handlers/getConfirmedWordsPaginatedHandler';
import { GetSuggestedWordByIdHandler } from './services/vocabulary/handlers/getSuggestedWordByIdHandler';

// --- Создание Экземпляров ---

const loggerInstance = logger;
const ratingPointsInstance = RATING_POINTS;
const mongooseInstance = mongoose; // Экземпляр mongoose
const getWordsForApprovalHandlerInstance = new GetWordsForApprovalHandler();

// Сервис Пользователей Telegram
const telegramUserServiceInstance = new TelegramUserService(
    TelegramUserModel, // Передаем саму модель Mongoose
    LevelModel, // Передаем саму модель Mongoose
    loggerInstance, // Передаем экземпляр логгера
);

// Создаем хендлер для рейтинга
const addRatingHandlerInstance = new AddRatingHandler(
    TelegramUserModel,
    loggerInstance,
);

const suggestTranslationHandlerInstance = new SuggestTranslationHandler(
    loggerInstance, // Зависимость: логгер
    addRatingHandlerInstance, // Зависимость: обработчик рейтинга
);

// Обработчик Предложения Слов
const suggestWordsHandlerInstance = new SuggestWordsHandler(
    TelegramUserModel, // 1
    AcceptedWordRussianModel, // 2
    AcceptedWordBuryatModel, // 3
    SuggestedWordRussianModel, // 4
    SuggestedWordBuryatModel, // 5
    addRatingHandlerInstance, // 6 <-- ПРАВИЛЬНО: Обработчик рейтинга
    loggerInstance, // 7 <-- ПРАВИЛЬНО: Логгер
    ratingPointsInstance, // 8 <-- ПРАВИЛЬНО: Очки рейтинга
    DialectModel, // 9 <-- ПРАВИЛЬНО: Модель диалектов
);

// 3. Создание экземпляра AcceptanceService (с 8 аргументами)
const acceptanceServiceInstance = new AcceptanceService( // <-- Теперь 8 аргументов
    SuggestedWordRussianModel, // 1
    SuggestedWordBuryatModel, // 2
    AcceptedWordRussianModel, // 3
    AcceptedWordBuryatModel, // 4
    TelegramUserModel, // 5
    // DeclinedWordModel,      // <-- УДАЛЕН 6-й аргумент
    addRatingHandlerInstance, // 6 (бывший 7)
    loggerInstance, // 7 (бывший 8)
    ratingPointsInstance, // 8 (бывший 9)
);

// 4. Создание экземпляров ДРУГИХ обработчиков (когда они будут)
// ...

const declineSuggestionHandlerInstance = new DeclineSuggestionHandler(
    SuggestedWordRussianModel, // 1
    SuggestedWordBuryatModel, // 2
    AcceptedWordRussianModel, // 3
    AcceptedWordBuryatModel, // 4
    DeclinedWordModel, // 5 <-- Модель отклоненных
    TelegramUserModel, // 6
    loggerInstance, // 7
    mongooseInstance, // 8 <-- Экземпляр mongoose
);

// Создаем экземпляр FindTranslationHandler
const findTranslationHandlerInstance = new FindTranslationHandler(
    TelegramUserModel,
    AcceptedWordRussianModel,
    AcceptedWordBuryatModel,
    SearchedWordRussianModel,
    SearchedWordBuryatModel,
    SearchedWordHistoryModel,
    loggerInstance,
    // fetch, // Если бы внедряли fetch
);

// НОВЫЙ ЭКЗЕМПЛЯР СЕРВИСА КЛАССИФИКАТОРОВ
const classifierServiceInstance = new ClassifierService(
    PartOfSpeechClassifierModel, // Передаем модель
    loggerInstance, // Передаем логгер
);

const getConfirmedWordHandlerInstance = new GetConfirmedWordHandler();
const getConfirmedWordsPaginatedHandler = new GetConfirmedWordsPaginatedHandler();

import { GetSearchHistoryHandler } from './services/vocabulary/handlers/getSearchHistoryHandler'; 
// Создаем экземпляр GetSearchHistoryHandler
const getSearchHistoryHandlerInstance = new GetSearchHistoryHandler(
    SearchedWordHistoryModel,
    SearchedWordRussianModel,
    SearchedWordBuryatModel,
    TelegramUserModel, // Передаем модель пользователя
    loggerInstance,
);

const getSuggestedWordByIdHandlerInstance = new GetSuggestedWordByIdHandler(
    SuggestedWordRussianModel,
    SuggestedWordBuryatModel,
    loggerInstance,
    mongooseInstance, // <-- Передаем mongoose для ObjectId.isValid
);

const searchPartialWordsHandler = new SearchPartialWordsHandler(
    AcceptedWordBuryatModel,
    AcceptedWordRussianModel,
    logger,
);

// Создание экземпляра VocabularyService
const vocabularyServiceInstance = new VocabularyService(
    getWordsForApprovalHandlerInstance,
    suggestWordsHandlerInstance,
    acceptanceServiceInstance,
    declineSuggestionHandlerInstance,
    findTranslationHandlerInstance,
    suggestTranslationHandlerInstance,
    getConfirmedWordHandlerInstance,
    getConfirmedWordsPaginatedHandler,
    getSearchHistoryHandlerInstance,
    searchPartialWordsHandler,
    getSuggestedWordByIdHandlerInstance,
    loggerInstance,
);

// --- Экспорт готовых экземпляров ---
export {
    vocabularyServiceInstance,
    acceptanceServiceInstance,
    suggestWordsHandlerInstance,
    telegramUserServiceInstance,
    addRatingHandlerInstance,
    classifierServiceInstance,
    // referralServiceInstance,
    // subscriptionServiceInstance,
    // leaderboardServiceInstance,
    // userStateServiceInstance,
    // userActionServiceInstance,
};
