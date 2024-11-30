// src/models/View.ts

import { Schema, model, Document, Types } from 'mongoose';

export interface IView extends Document {
    tu: Types.ObjectId;
    lesson?: Types.ObjectId;
    module?: Types.ObjectId;
    createdAt: Date;
    _id: Types.ObjectId;
}

const viewSchema = new Schema<IView>(
    {
        module: {
            type: Schema.Types.ObjectId,
            ref: 'Module',
        },
        lesson: {
            type: Schema.Types.ObjectId,
            ref: 'Lesson',
        },
        tu: {
            type: Schema.Types.ObjectId,
            ref: 'telegram_user',
        },
    },
    {
        timestamps: true, // Автоматически добавляет поля createdAt и updatedAt
    }
);

const View = model<IView>('View', viewSchema);

export default View;
