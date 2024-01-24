// sentenceController.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app'; // Укажите путь к вашему основному файлу приложения
import Sentence from '../models/Sentence';
import User from '../models/User';
import { ObjectId } from 'mongodb';
import Translation from '../models/Translation';
import Dialect from '../models/Dialect';

describe('Dialect Controller Tests', () => {

    let authToken: string;
    let userId: mongoose.Types.ObjectId

    beforeEach(async () => {

        await mongoose.connect('mongodb://localhost:27017/burlang_test');

        // Очистка коллекции предложений и выполнение необходимой настройки

        await Sentence.deleteMany({});
        await User.deleteMany({});
        await Translation.deleteMany({});
        await Dialect.deleteMany({});

        // По желанию, вы можете зарегистрировать пользователя и получить токен для тестирования
        const userCredentials = {
            password: 'testpassword',
            email: 'test@example.com',
            username: 'testusername'
        };

        const registrationResponse = await request(app)
            .post('/api/users/register')
            .send(userCredentials);

        expect(registrationResponse.status).toBe(201);

        const loginResponse = await request(app)
            .post('/api/users/login')
            .send(userCredentials);

        expect(loginResponse.status).toBe(200);

        authToken = loginResponse.body.token;
        userId = loginResponse.body.userId;

    });

    afterEach(async () => {

        // Отключение от базы данных после завершения всех тестов
        await mongoose.disconnect();

    });

    it('should create dialect with authentication', async () => {

        // Проверка, что токен и userId установлены
        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        const createDialectData = {
            name: 'Эхирит-Булагатский',
            description: 'хоринская группа говоров (хоринский диалект)'
        }

        // Создание тестового предложения
        const createDialect = await request(app)
            .post('/api/dialect/create')
            .set('Authorization', `Bearer ${authToken}`)
            .send(createDialectData);

        // Проверки
        expect(createDialect.status).toBe(201);
        expect(createDialect.body.message).toBe("Новый диалект сохранён");

    });

});
