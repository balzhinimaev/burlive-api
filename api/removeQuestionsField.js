// removeQuestionsField.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Загрузка переменных окружения из .env файла
dotenv.config();

// Проверка наличия переменной окружения MONGO_URL
if (!process.env.MONGO_URL) {
  console.error('Ошибка: Переменная окружения MONGO_URL не установлена.');
  process.exit(1);
}

// Определение схемы Lesson
const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    description: { type: String },
    moduleId: { type: mongoose.Types.ObjectId, ref: 'Module', required: true },
    order: { type: Number, required: true },
    questions: [{ type: mongoose.Types.ObjectId, ref: 'Question' }],
    viewsCounter: { type: Number, default: 0 },
    views: [{ type: mongoose.Types.ObjectId, ref: 'View' }],
  },
  { timestamps: true },
);

// Создание модели Lesson
const Lesson = mongoose.model('Lesson', lessonSchema);

async function removeQuestionsField() {
  try {
    // Подключение к базе данных
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'burlive', // Убедитесь, что имя базы данных правильное
    });
    console.log('Подключено к базе данных.');

    // Подсчет количества документов с полем questions
    const count = await Lesson.countDocuments({ questions: { $exists: true } });
    console.log(`Найдено ${count} документов с полем 'questions'.`);

    if (count === 0) {
      console.log('Нет документов с полем questions. Завершение скрипта.');
      return;
    }

    // Обновление всех документов: удаление поля questions
    const result = await Lesson.updateMany(
      { questions: { $exists: true } },
      { $unset: { questions: '' } },
    );

    console.log(`Поле 'questions' удалено из ${result.nModified} документов.`);
  } catch (error) {
    console.error('Произошла ошибка:', error);
  } finally {
    // Закрытие соединения с базой данных
    await mongoose.disconnect();
    console.log('Соединение с базой данных закрыто.');
  }
}

// Запуск функции
removeQuestionsField();
