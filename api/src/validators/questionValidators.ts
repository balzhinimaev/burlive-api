// validators/questionValidators.ts
import { body, ValidationChain } from 'express-validator';

// Base validators for common fields
const baseQuestionValidators: ValidationChain[] = [
    body('question')
        .notEmpty()
        .withMessage('Текст вопроса обязателен')
        .isString(),
    body('explanation')
        .notEmpty()
        .withMessage('Объяснение ответа обязательно')
        .isString(),
];

// Type-specific validators
const singleChoiceValidators: ValidationChain[] = [
    body('options')
        .if((_value, { req }) => req.body.type === 'single-choice')
        .isArray({ min: 2 })
        .withMessage('single-choice требует минимум 2 вариантов ответа'),
    body('correct')
        .if((_value, { req }) => req.body.type === 'single-choice')
        .isInt()
        .withMessage('single-choice требует поле correct'),
];

const multipleChoiceValidators: ValidationChain[] = [
    body('options')
        .if((_value, { req }) => req.body.type === 'multiple-choice')
        .isArray({ min: 2 })
        .withMessage('multiple-choice требует минимум 2 вариантов ответа'),
    body('correctAnswers')
        .if((_value, { req }) => req.body.type === 'multiple-choice')
        .isArray({ min: 1 })
        .withMessage('multiple-choice требует массив correctAnswers'),
];

const fillBlanksValidators: ValidationChain[] = [
    body('blanks')
        .if((_value, { req }) => req.body.type === 'fill-blanks')
        .isArray({ min: 1 })
        .withMessage('fill-blanks требует массив blanks'),
    body('blanks.*.textBefore')
        .if((_value, { req }) => req.body.type === 'fill-blanks')
        .isString(),
    body('blanks.*.textAfter')
        .if((_value, { req }) => req.body.type === 'fill-blanks')
        .isString(),
    body('blanks.*.options')
        .if((_value, { req }) => req.body.type === 'fill-blanks')
        .isArray({ min: 1 })
        .withMessage('В каждом пропуске должны быть варианты ответов'),
    body('blanks.*.correctIndex')
        .if((_value, { req }) => req.body.type === 'fill-blanks')
        .isInt()
        .withMessage('В каждом пропуске должен быть индекс правильного ответа'),
];

const imageChoiceValidators: ValidationChain[] = [
    body('imageOptions')
        .if((_value, { req }) => req.body.type === 'image-choice')
        .isArray({ min: 2 })
        .withMessage('image-choice требует минимум 2 картинки в imageOptions'),
    body('correctImageIndex')
        .if((_value, { req }) => req.body.type === 'image-choice')
        .isInt()
        .withMessage('image-choice требует поле correctImageIndex'),
];

const audioChoiceValidators: ValidationChain[] = [
    body('options')
        .if((_value, { req }) => req.body.type === 'audio-choice')
        .isArray({ min: 2 })
        .withMessage('audio-choice требует минимум 2 вариантов ответа'),
    body('correct')
        .if((_value, { req }) => req.body.type === 'audio-choice')
        .isInt()
        .withMessage('audio-choice требует поле correct'),
    body('audioUrl')
        .if((_value, { req }) => req.body.type === 'audio-choice')
        .isURL()
        .withMessage('audio-choice требует поле audioUrl с валидным URL'),
];

// Conditional validation based on question type
const typeValidator = body('type')
    .notEmpty()
    .withMessage('Поле type обязательно')
    .isString()
    .withMessage('type должно быть строкой')
    .isIn([
        'single-choice',
        'multiple-choice',
        'fill-blanks',
        'image-choice',
        'audio-choice',
    ])
    .withMessage('Некорректный type вопроса');

// Custom validator that applies the appropriate validators based on the question type
const conditionalValidator = body().custom((_body, { req }) => {
    const type = req.body.type;

    switch (type) {
        case 'single-choice':
            if (
                !Array.isArray(req.body.options) ||
                req.body.options.length < 2
            ) {
                throw new Error(
                    'single-choice требует минимум 2 вариантов ответа',
                );
            }
            if (typeof req.body.correct !== 'number') {
                throw new Error('single-choice требует поле correct');
            }
            break;
        case 'multiple-choice':
            if (
                !Array.isArray(req.body.options) ||
                req.body.options.length < 2
            ) {
                throw new Error(
                    'multiple-choice требует минимум 2 вариантов ответа',
                );
            }
            if (
                !Array.isArray(req.body.correctAnswers) ||
                req.body.correctAnswers.length < 1
            ) {
                throw new Error(
                    'multiple-choice требует массив correctAnswers',
                );
            }
            break;
        case 'fill-blanks':
            if (!Array.isArray(req.body.blanks) || req.body.blanks.length < 1) {
                throw new Error('fill-blanks требует массив blanks');
            }
            break;
        case 'image-choice':
            if (
                !Array.isArray(req.body.imageOptions) ||
                req.body.imageOptions.length < 2
            ) {
                throw new Error(
                    'image-choice требует минимум 2 картинки в imageOptions',
                );
            }
            if (typeof req.body.correctImageIndex !== 'number') {
                throw new Error('image-choice требует поле correctImageIndex');
            }
            break;
        case 'audio-choice':
            if (
                !Array.isArray(req.body.options) ||
                req.body.options.length < 2
            ) {
                throw new Error(
                    'audio-choice требует минимум 2 вариантов ответа',
                );
            }
            if (typeof req.body.correct !== 'number') {
                throw new Error('audio-choice требует поле correct');
            }
            if (typeof req.body.audioUrl !== 'string' || !req.body.audioUrl) {
                throw new Error('audio-choice требует поле audioUrl');
            }
            break;
        default:
            throw new Error('Неизвестный тип вопроса');
    }

    return true;
});

// Common validators for all create/update operations
const commonValidators = [
    body('lessonId')
        .optional()
        .isMongoId()
        .withMessage('ID урока должен быть валидным MongoID'),
];

// Export combined validators for different operations
export const createQuestionValidators = [
    typeValidator,
    ...baseQuestionValidators,
    ...singleChoiceValidators,
    ...multipleChoiceValidators,
    ...fillBlanksValidators,
    ...imageChoiceValidators,
    ...audioChoiceValidators,
    // Условный валидатор можно оставить для дополнительных проверок,
    // либо убрать, если он дублирует уже описанные проверки.
    ...commonValidators,
];

export const updateQuestionValidators = [
    body('type')
        .optional()
        .isIn([
            'single-choice',
            'multiple-choice',
            'fill-blanks',
            'image-choice',
            'audio-choice',
        ])
        .withMessage('Некорректный type вопроса'),
    body('question').optional().isString(),
    body('explanation').optional().isString(),
    conditionalValidator,
    ...commonValidators,
];
