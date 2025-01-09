// src/initLevels.ts
import mongoose from 'mongoose';
// import LevelModel from './models/Level';
import dotenv from 'dotenv';
import TelegramUserModel from './models/TelegramUsers';
import LevelModel from './models/Level';
dotenv.config(); // Загружаем переменные окружения из файла .env

async function initLevels() {
    // Подключение к базе данных
    // Подключение к базе данных
    mongoose.connect(<string>process.env.MONGO_URL, {
        dbName: 'burlive'
    })
        .then(() => {
            console.log("Подключено к базе данных");
        })
        .catch((error) => {
            console.error('Ошибка при подключении к базе данных:', error);
        });

    const levels = [
        { name: "Эхин", icon: "🌱", minRating: 0, maxRating: 800 },
        { name: "Багша", icon: "📖", minRating: 801, maxRating: 1500 },
        { name: "Гэрэл", icon: "🌞", minRating: 1501, maxRating: 2000 },
        { name: "Алтан", icon: "💰", minRating: 2001, maxRating: 2600 },
        { name: "Баатар", icon: "🛡", minRating: 2601, maxRating: 3200 },
        { name: "Эрдэмтэн", icon: "🌳", minRating: 3201, maxRating: 4000 },
        { name: "Хубисхал", icon: "🔔", minRating: 4001, maxRating: 5000 },
        { name: "Соёл", icon: "🌌", minRating: 5001, maxRating: null }, // null для последнего уровня
    ];

    for (const levelData of levels) {
        // Проверяем, существует ли уровень с таким именем
        const existingLevel = await LevelModel.findOne({ name: levelData.name });
        if (!existingLevel) {
            const level = new LevelModel(levelData);
            await level.save();
            console.log(`Уровень "${level.name}" создан.`);
        } else {
            console.log(`Уровень "${existingLevel.name}" уже существует.`);
        }
    }

    // Отключаемся от базы данных
    await mongoose.disconnect();
}
async function testUserLevelUpdate() {
    // Подключение к базе данных
    mongoose.connect(<string>process.env.MONGO_URL, {
        dbName: 'burlive'
    })
        .then(() => {
            console.log("Подключено к базе данных");
        })
        .catch((error) => {
            console.error('Ошибка при подключении к базе данных:', error);
        });

    const user = await TelegramUserModel.findOne({ username: 'frntdev' });
    if (user) {
        user.rating = 1200; // Устанавливаем рейтинг, соответствующий уровню "Баатар"
        await user.updateLevel()
        await user.save(); // Уровень обновится автоматически благодаря pre-save хуку

        // Популируем поле level для получения детальной информации
        await user.populate('level');

        //@ts-ignore
        console.log(`Пользователь теперь имеет уровень: ${user.level.name}`); // Должен вывести "Баатар"
    } else {
        console.log('Пользователь не найден.');
    }
}
testUserLevelUpdate().catch((error) => {
    console.error('Ошибка при обновлении уровня пользователя:', error);
});
// initLevels()
initLevels().catch((error) => {
    console.error('Ошибка при инициализации уровней:', error);
});
