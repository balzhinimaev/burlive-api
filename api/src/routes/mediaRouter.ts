import express from 'express';
import multer from 'multer';
import mediaController from '../controllers/mediaController';
import authenticateToken from '../middleware/authenticateToken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Получаем путь для загрузки из переменной окружения
const uploadsDir = process.env.UPLOAD_DIR || '/var/www/burlive/uploads';

// Проверяем, существует ли директория, и если нет — создаем её
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Настройка multer для сохранения файлов на диск
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// Эндпоинт для загрузки медиа. Ожидается поле "file" в форме.
router.post(
    '/upload',
    authenticateToken,
    upload.single('file'),
    mediaController.uploadMedia,
);

export default router;
