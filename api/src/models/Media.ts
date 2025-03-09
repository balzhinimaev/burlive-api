import { Schema, model, Document } from 'mongoose';

export interface IMedia extends Document {
    fileType: 'image' | 'audio';
    filePath: string; // Путь к файлу на сервере
    contentType: string; // MIME-тип файла
    createdAt: Date;
    updatedAt: Date;
}

const MediaSchema: Schema = new Schema(
    {
        fileType: { type: String, enum: ['image', 'audio'], required: true },
        filePath: { type: String, required: true },
        contentType: { type: String, required: true },
    },
    { timestamps: true },
);

export default model<IMedia>('Media', MediaSchema);
