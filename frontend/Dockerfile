# базовый образ
FROM node:lts

# установка рабочей директории
WORKDIR /app

# копирование package.json и package-lock.json
COPY package*.json ./

# установка зависимостей
RUN npm install

# копирование исходного кода
COPY . .

# сборка проекта
RUN npm run build

EXPOSE 3000

# указание команды для запуска
CMD ["npm", "run", "start"]
