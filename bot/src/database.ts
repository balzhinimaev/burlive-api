import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config()

const url = process.env.database

;(async () => {
  // Подключение к базе данных
  mongoose
    .connect(<string>process.env.DB_CONNECTION_STRING, {
      dbName: "burlive",
    })
    .then(() => {
      console.log("Подключено к базе данных");
    })
    .catch((error) => {
      console.error("Ошибка при подключении к базе данных:", error);
    });
})();