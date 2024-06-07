// vocabularyRouter.ts
import express from "express";
import vocabularyController from "../controllers/vocabularyController";
import validateSuggestedWord from "../middleware/validateSuggestedWord";

const vocabularyRouter = express.Router();

// Маршрут для получения всех слов из словаря
vocabularyRouter.get("/", vocabularyController.getAllWords);

// Маршрут для получения слов на рассмотрении
vocabularyRouter.get("/get-words-on-approval", vocabularyController.getWordsOnApproval);

// Маршрут для предложения перевода слова
vocabularyRouter.post("/suggest-translate", vocabularyController.suggestWordTranslate);

// Маршрут для добавления слова в словарь для перевода
vocabularyRouter.post("/suggest-word", vocabularyController.suggestWords);

// Маршрут для принятия слова
vocabularyRouter.post("/accept-suggested-word", validateSuggestedWord,  vocabularyController.acceptSuggestedWord);

// Маршрут для отклонения слова
vocabularyRouter.post("/decline-suggested-word", validateSuggestedWord,  vocabularyController.declineSuggestedWord);

// // Маршрут для получения предложения
// vocabularyRouter.get('/:id', sentencesController.getSentence);

// // Маршрут для обновления статуса предложения
// vocabularyRouter.put('/:id/status', sentencesController.updateStatus);

// // Маршрут для принятия предложения для перевода
// vocabularyRouter.put('/:id/accept', sentencesController.acceptSentence);

// // Маршрут для отклонения предложения
// vocabularyRouter.put('/:id/reject', sentencesController.rejectSentence);

export default vocabularyRouter;
