import { Schema, model, Document, Types } from 'mongoose';

// Интерфейс для урока в блоке с дополнительными данными
export interface IModuleBlockLesson {
    lessonId: Types.ObjectId; // Идентификатор урока (ref: Lesson)
    order: number; // Порядок урока внутри блока
    customData?: any; // Дополнительные данные (настройки, заметки и т.п.)
}

// Основной интерфейс блока модуля
export interface IModuleBlock extends Document {
    moduleId: Types.ObjectId; // Идентификатор модуля (ref: Module)
    title: string; // Заголовок блока
    description?: string; // Описание блока
    order: number; // Порядок блока внутри модуля
    lessons: IModuleBlockLesson[]; // Массив уроков с дополнительной информацией
    createdAt: Date;
    updatedAt: Date;
}

// Схема для вложенных данных урока блока
const moduleBlockLessonSchema = new Schema<IModuleBlockLesson>(
    {
        lessonId: {
            type: Schema.Types.ObjectId,
            ref: 'Lesson',
            required: true,
        },
        order: { type: Number, required: true },
        customData: { type: Schema.Types.Mixed, default: {} },
    },
    { _id: false }, // Отключаем создание _id для вложенного документа
);

// Основная схема для блока модуля
const moduleBlockSchema = new Schema<IModuleBlock>(
    {
        moduleId: {
            type: Schema.Types.ObjectId,
            ref: 'Module',
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Заголовок блока обязателен'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        order: {
            type: Number,
            required: true,
        },
        lessons: {
            type: [moduleBlockLessonSchema],
            default: [],
        },
    },
    {
        timestamps: true, // Автоматически создаёт поля createdAt и updatedAt
    },
);

const ModuleBlock = model<IModuleBlock>('ModuleBlock', moduleBlockSchema);

export default ModuleBlock;
