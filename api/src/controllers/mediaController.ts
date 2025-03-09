import { Request, Response } from 'express';
import Media from '../models/Media';

class MediaController {
    /**
     * Загрузка медиа.
     * Ожидается multipart/form-data с полем "file".
     * Дополнительно, в теле запроса:
     * - fileType: "image" или "audio" (обязательное)
     */
    async uploadMedia(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                res.status(400).json({ message: 'Файл не загружен' });
                return;
            }
            const fileType = req.body.fileType;
            if (!fileType || (fileType !== 'image' && fileType !== 'audio')) {
                res.status(400).json({
                    message:
                        'Неверный тип файла. Должен быть "image" или "audio".',
                });
                return;
            }

            const filePath = req.file.path; // путь, куда сохранён файл

            const newMedia = new Media({
                fileType,
                filePath,
                contentType: req.file.mimetype,
            });

            await newMedia.save();
            res.status(201).json({
                message: 'Медиа успешно загружено',
                media: newMedia,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Ошибка при загрузке медиа' });
        }
    }
}

export default new MediaController();
