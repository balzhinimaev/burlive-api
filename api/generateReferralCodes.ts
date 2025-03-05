// scripts/generateReferralCodes.ts
import dotenv from 'dotenv';
dotenv.config(); // Загружаем переменные окружения из файла .env
import mongoose from 'mongoose';
import TelegramUserModel from './src/models/TelegramUsers';

// Функция для генерации случайного реферального кода
function generateReferralCode(): string {
    // Генерируем 6-символьный код (например, 'A1B2C3')
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function updateReferralCodes(): Promise<void> {
    try {
        // Подключаемся к MongoDB (убедитесь, что MONGO_URI задан в переменных окружения или замените строку на свою)
        await mongoose.connect(<string>process.env.MONGO_URL, {
            dbName: 'burlive',
        });
        console.log('Подключение к MongoDB установлено.');

        // Находим пользователей, у которых отсутствует реферальный код
        const usersWithoutReferral = await TelegramUserModel.find({
            $or: [
                { referral_code: { $exists: false } },
                { referral_code: null },
                { referral_code: '' },
            ],
        });

        console.log(
            `Найдено пользователей без реферального кода: ${usersWithoutReferral.length}`,
        );

        // Для каждого пользователя генерируем код и сохраняем
        for (const user of usersWithoutReferral) {
            const newCode = generateReferralCode();
            user.referral_code = newCode;
            await user.save();
            console.log(
                `Пользователь ${user.id} обновлен, реферальный код: ${newCode}`,
            );
        }

        console.log('Обновление реферальных кодов завершено.');
        process.exit(0);
    } catch (error) {
        console.error('Ошибка при обновлении реферальных кодов:', error);
        process.exit(1);
    }
}

updateReferralCodes();
