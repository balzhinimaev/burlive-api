// src/scripts/initializeThemes.ts

import mongoose from 'mongoose';
import ThemeModel from '../models/Vocabulary/ThemeModel';
import logger from '../utils/logger';
import dotenv from "dotenv";
dotenv.config()
// Список тем для инициализации с указанием сложности
const themesData = [
    {
        name: "Алфавит и фонетика",
        description: "Буквы, звуки, произношение",
        complexity: 1,
    },
    {
        name: "Приветствия и прощания",
        description: "Основные фразы для общения",
        complexity: 1,
    },
    {
        name: "Личные местоимения",
        description: "Я, ты, он, она, мы, вы, они",
        complexity: 1,
    },
    {
        name: "Семья и родственники",
        description: "Мать, отец, брат, сестра и т.д.",
        complexity: 1.5,
    },
    {
        name: "Числа и счёт",
        description: "Цифры от 0 до 100 и далее",
        complexity: 1.5,
    },
    {
        name: "Дни недели и месяцы",
        description: "Понедельник, январь и т.д.",
        complexity: 1.5,
    },
    {
        name: "Времена года и погода",
        description: "Весна, лето, дождь, снег",
        complexity: 2,
    },
    {
        name: "Цвета и формы",
        description: "Красный, круглый и т.д.",
        complexity: 2,
    },
    {
        name: "Еда и напитки",
        description: "Фрукты, овощи, блюда",
        complexity: 2,
    },
    {
        name: "Животные и растения",
        description: "Домашние и дикие животные, деревья",
        complexity: 2,
    },
    {
        name: "Тело человека и здоровье",
        description: "Части тела, болезни",
        complexity: 2.5,
    },
    {
        name: "Одежда и аксессуары",
        description: "Рубашка, обувь, шапка",
        complexity: 2.5,
    },
    {
        name: "Дом и быт",
        description: "Комнаты, мебель, бытовая техника",
        complexity: 2.5,
    },
    {
        name: "Транспорт и путешествия",
        description: "Машина, автобус, дорога",
        complexity: 2.5,
    },
    {
        name: "Профессии и занятия",
        description: "Учитель, врач, фермер",
        complexity: 2.5,
    },
    {
        name: "Глаголы действий",
        description: "Идти, бегать, говорить",
        complexity: 3,
    },
    {
        name: "Прилагательные",
        description: "Большой, маленький, красивый",
        complexity: 3,
    },
    {
        name: "Вопросительные слова",
        description: "Кто, что, где, когда, почему",
        complexity: 3,
    },
    {
        name: "Время и даты",
        description: "Часы, минуты, календарь",
        complexity: 3,
    },
    {
        name: "Эмоции и чувства",
        description: "Радость, грусть, удивление",
        complexity: 3,
    },
    {
        name: "Спорт и хобби",
        description: "Футбол, музыка, чтение",
        complexity: 3,
    },
    {
        name: "Технологии и коммуникации",
        description: "Телефон, компьютер, интернет",
        complexity: 3,
    },
    {
        name: "Природа и окружающая среда",
        description: "Гора, река, погода",
        complexity: 3,
    },
    {
        name: "Культура и традиции",
        description: "Праздники, обычаи, музыка",
        complexity: 3,
    },
    {
        name: "Сленг и разговорные выражения",
        description: "Повседневные фразы, идиомы",
        complexity: 3,
    },
];

// Функция для подключения к базе данных
async function connectToDatabase() {
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
}

// Функция для инициализации тем
async function initializeThemes() {
    try {
        for (const themeData of themesData) {
            const existingTheme = await ThemeModel.findOne({ name: themeData.name });
            if (existingTheme) {
                logger.info(`Тема "${themeData.name}" уже существует, обновляем данные`);

                // Обновляем существующую тему
                existingTheme.description = themeData.description;
                existingTheme.complexity = themeData.complexity;
                existingTheme.viewCounter = existingTheme.viewCounter || 0;
                existingTheme.views = existingTheme.views || [];
                await existingTheme.save();
            } else {
                const newTheme = new ThemeModel({
                    name: themeData.name,
                    description: themeData.description,
                    complexity: themeData.complexity,
                    viewCounter: 0,
                    views: [],
                    words: [], // Если у вас есть слова для добавления, добавьте их здесь
                });

                await newTheme.save();
                logger.info(`Тема "${themeData.name}" успешно создана`);
            }
        }
        logger.info('Инициализация тем завершена');
    } catch (error) {
        logger.error(`Ошибка при инициализации тем: ${error}`);
    } finally {
        mongoose.disconnect();
    }
}

// Запуск скрипта
(async () => {
    await connectToDatabase();
    await initializeThemes();
})();
