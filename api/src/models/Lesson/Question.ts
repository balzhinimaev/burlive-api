import mongoose, { Schema, Types, Document } from 'mongoose';

// Base interface for all question types
interface BaseQuestion {
    _id: Types.ObjectId;
    type: string;
    question: string;
    explanation: string;
}

// Specific question type interfaces
interface SingleChoiceQuestion extends BaseQuestion {
    type: 'single-choice';
    options: string[];
    correct: number;
}

interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'multiple-choice';
    options: string[];
    correctAnswers: number[];
}

interface FillBlanksQuestion extends BaseQuestion {
    type: 'fill-blanks';
    blanks: {
        textBefore: string;
        textAfter: string;
        options: string[];
        correctIndex: number;
    }[];
}

interface ImageChoiceQuestion extends BaseQuestion {
    type: 'image-choice';
    imageOptions: string[];
    correctImageIndex: number;
}

interface AudioChoiceQuestion extends BaseQuestion {
    type: 'audio-choice';
    options: string[];
    correct: number;
    audioUrl: string;
}

// Union type of all question types
export type IQuestion =
    | SingleChoiceQuestion
    | MultipleChoiceQuestion
    | FillBlanksQuestion
    | ImageChoiceQuestion
    | AudioChoiceQuestion;

// Define the schema
const QuestionSchema = new Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                'single-choice',
                'multiple-choice',
                'fill-blanks',
                'image-choice',
                'audio-choice',
            ],
        },
        question: { type: String, required: true },
        explanation: { type: String, required: true },

        // Fields for different question types
        options: [{ type: String }],
        correct: { type: Number },
        correctAnswers: [{ type: Number }],
        blanks: [
            {
                textBefore: { type: String, default: '' },
                textAfter: { type: String, default: '' },
                options: [{ type: String }],
                correctIndex: { type: Number },
            },
        ],
        imageOptions: [{ type: String }],
        correctImageIndex: { type: Number },
        audioUrl: { type: String },
    },
    { timestamps: true },
);

// Add a schema validation middleware to ensure required fields are present based on type
QuestionSchema.pre('validate', function (next) {
    const question = this as any;

    switch (question.type) {
        case 'single-choice':
            if (
                !Array.isArray(question.options) ||
                question.options.length < 2
            ) {
                return next(
                    new Error(
                        'Single choice questions require at least 2 options',
                    ),
                );
            }
            if (typeof question.correct !== 'number') {
                return next(
                    new Error(
                        'Single choice questions require a correct option index',
                    ),
                );
            }
            break;

        case 'multiple-choice':
            if (
                !Array.isArray(question.options) ||
                question.options.length < 2
            ) {
                return next(
                    new Error(
                        'Multiple choice questions require at least 2 options',
                    ),
                );
            }
            if (
                !Array.isArray(question.correctAnswers) ||
                question.correctAnswers.length < 1
            ) {
                return next(
                    new Error(
                        'Multiple choice questions require at least one correct answer index',
                    ),
                );
            }
            break;

        // Add validations for other question types...
    }

    next();
});

// Create a type guard function to check question types in your code
export function isSingleChoiceQuestion(
    question: IQuestion,
): question is SingleChoiceQuestion {
    return question.type === 'single-choice';
}

export function isMultipleChoiceQuestion(
    question: IQuestion,
): question is MultipleChoiceQuestion {
    return question.type === 'multiple-choice';
}

// Similar type guards for other question types...

// Export the model
export default mongoose.model<IQuestion & Document>('Question', QuestionSchema);