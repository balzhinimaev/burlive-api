import { Request, Response, NextFunction } from 'express';
import Test from '../models/Test';
// import Progress from '../models/Progress';
// import Question from '../models/Lesson/Question';

export const getTestByLesson = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const { lessonId } = req.params;
        const test = await Test.findOne({ lessonId }).populate('questions');
        if (!test) {
            res.status(404).json({ message: 'Тест не найден для этого урока' });
            return;
        }
        res.status(200).json(test);
    } catch (error) {
        console.error(error);
        next(error);
    }
};

// export const submitAnswers = async (
//     req: Request,
//     res: Response,
//     next: NextFunction,
// ): Promise<void> => {
//     try {
//         const { userId, testId, answers } = req.body;

//         // Получаем тест
//         const test = await Test.findById(testId).populate('questions');
//         if (!test) {
//             res.status(404).json({ message: 'Тест не найден' });
//             return;
//         }

//         // Проверка ответов
//         let score = 0;
//         for (let i = 0; i < answers.length; i++) {
//             const question = await Question.findById(answers[i].questionId);
//             if (!question) continue;

//             const correct = question.correct;
//             if (
//                 correct !== undefined &&
//                 correct === answers[i].selectedOption
//             ) {
//                 score++;
//             }
//         }

//         // Создание или обновление прогресса
//         let progress = await Progress.findOne({ userId, testId });
//         if (!progress) {
//             progress = new Progress({
//                 userId,
//                 testId,
//                 answers,
//                 score,
//                 completed: score >= test.passingScore,
//             });
//             await progress.save();
//         } else {
//             progress.answers = answers;
//             progress.score = score;
//             progress.completed = score >= test.passingScore;
//             await progress.save();
//         }

//         res.status(200).json(progress);
//     } catch (error) {
//         console.error(error);
//         next(error);
//     }
// };