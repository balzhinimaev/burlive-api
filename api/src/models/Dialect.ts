import { Document, Schema, Model, model } from 'mongoose';

// Интерфейс для документа диалекта
interface DialectDocument extends Document {
    name: string;
    description?: string;
    regions: string[];
}

// Интерфейс для модели диалекта
interface DialectModel extends Model<DialectDocument> { }

// Определение схемы
const dialectSchema = new Schema<DialectDocument, DialectModel>(
    {
        name: { type: String, required: true },
        description: { type: String },
        regions: { type: [ String ] },
        // Другие поля, если необходимо
    },
    { timestamps: true } // Добавляет поля createdAt и updatedAt
);

// Создание модели на основе схемы
const Dialect: DialectModel = model<DialectDocument, DialectModel>('Dialect', dialectSchema);

// Экспорт модели
export default Dialect;
