import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lesson from "./models/Lesson"
dotenv.config();

// Проверка наличия переменной окружения MONGO_URL
if (!process.env.MONGO_URL) {
  console.error('Ошибка: Переменная окружения MONGO_URL не установлена.');
  process.exit(1);
}

// Маппинг заголовков и сложности
const titleToComplexity: Record<string, number> = {
  "Таблица гласных": 1,
  "Сингармонизм": 1.5,
  "Слоги": 2,
  "Ударения": 2.5,
  "Морфологический строй": 3,
  "Словообразование": 2.5,
  "Основа слова": 2,
  "Суффиксы бурятского": 1.5,
  "Части речи": 1,
  "Склонение": 3,
  "Дифтонги": 2.5,
  "Краткие гласные": 1,
  "Долгие гласные": 2,
  "Йотированные гласные": 1.5,
  "Характеристика звуков": 2,
};

// Функция для обновления уровня сложности
async function updateComplexityByTitle() {
  try {
      // Подключение к базе данных
      await mongoose
          .connect(<string>process.env.MONGO_URL, {
              dbName: 'burlive',
          })
          .then(() => {
              console.log('Подключено к базе данных');
          })
          .catch((error) => {
              console.error('Ошибка при подключении к базе данных:', error);
          });
      console.log('Подключено к базе данных.');

      // Получаем все уроки
      const lessons = await Lesson.find();
      console.log(`Найдено ${lessons.length} уроков.`);

      if (lessons.length === 0) {
          console.log('Нет уроков для обновления.');
          return;
      }

      // Обновление уровня сложности по заголовкам
      for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const complexity = titleToComplexity[lesson.title];
          if (complexity) {
              await Lesson.updateOne(
                  { _id: lesson._id },
                  { $set: { complexity: complexity } },
              );
              console.log(
                  `Урок '${lesson.title}' обновлен с уровнем сложности ${complexity}.`,
              );
          } else {
              console.log(
                  `Урок '${lesson.title}' не обновлен (сложность не задана для этого заголовка).`,
              );
          }
      }

      console.log('Обновление завершено.');
  } catch (error) {
    console.error('Произошла ошибка:', error);
  } finally {
    // Закрытие соединения с базой данных
    await mongoose.disconnect();
    console.log('Соединение с базой данных закрыто.');
  }
}

// Запуск функции
updateComplexityByTitle();
