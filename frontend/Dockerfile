# Используем официальный образ Node.js
FROM node:18

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Экспонируем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
