// src/models/Dialect.ts
import { Document, Schema, Model, model, Types } from 'mongoose'; // Добавляем Types

// Интерфейс для документа диалекта (описывает ОДИН документ)
// Наследование от Document добавит стандартные поля и методы Mongoose
export interface IDialect extends Document {
    // Явно указываем _id для лучшей читаемости и type hinting
    _id: Types.ObjectId;
    name: string;
    description?: string;
    regions?: string[]; // Сделаем опциональным, если не всегда есть
    // Добавляем поля из timestamps для ясности
    createdAt: Date;
    updatedAt: Date;
    // Добавьте сюда другие поля вашей схемы
}

// Интерфейс для Модели диалекта (описывает статические методы и свойства самой Модели)
// Наследование от Model<IDialect> дает доступ к стандартным статическим методам (find, findOne и т.д.)
// Сюда можно добавить кастомные статические методы, если они нужны
export interface IDialectModel extends Model<IDialect> {
    // Пример кастомного статического метода (если нужен):
    // findByName(name: string): Promise<IDialect | null>;
}

// Определение схемы Mongoose
// Указываем оба типа: тип Документа и тип Модели
const dialectSchema = new Schema<IDialect, IDialectModel>(
    {
        name: {
            type: String,
            required: true,
            unique: true, // Имена диалектов обычно уникальны
            trim: true,
            index: true, // Добавляем индекс для быстрого поиска по имени
        },
        description: {
            type: String,
            trim: true,
            required: false, // Явно указываем необязательность
        },
        regions: {
            type: [String],
            required: false, // Явно указываем необязательность
            default: [], // Хорошая практика - задать пустой массив по умолчанию
        },
        // Другие поля, если необходимо
    },
    {
        timestamps: true, // Автоматически добавляет createdAt и updatedAt
    },
);

/* // Пример добавления кастомного статического метода (если нужен)
dialectSchema.statics.findByName = function(name: string): Promise<IDialect | null> {
    return this.findOne({ name: name });
};
*/

// Создание и экспорт модели
// Mongoose создаст модель, тип которой будет соответствовать IDialectModel
// Явно указывать тип константы DialectModel необязательно, TypeScript выведет его сам
const DialectModel = model<IDialect, IDialectModel>('Dialect', dialectSchema);

export default DialectModel;

// Также можно экспортировать интерфейсы, если они нужны в других частях приложения
// export { IDialect, IDialectModel };
