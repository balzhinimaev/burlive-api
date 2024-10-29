// sentenceController.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app'; // Укажите путь к вашему основному файлу приложения
import Sentence from '../../models/SuggestedSentence';
import User from '../../models/User';
import { ObjectId } from 'mongodb';
import Translation from '../../models/Translation';

describe('Sentence Controller Get methods Tests', () => {

    let authToken: string;
    let userId: mongoose.Types.ObjectId

    beforeEach(async () => {

        await mongoose.connect('mongodb://localhost:27017/burlang_test');

        // Очистка коллекции предложений и выполнение необходимой настройки

        await Sentence.deleteMany({});
        await User.deleteMany({});
        await Translation.deleteMany({});

        // По желанию, вы можете зарегистрировать пользователя и получить токен для тестирования
        const userCredentials = {
            password: 'testpassword',
            email: 'test@example.com',
            username: 'test'
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

    it('should get all sentences with authentication', async () => {

        // Проверка, что токен и userId установлены
        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        // Создание тестового предложения
        await request(app)
            .post('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                text: 'Test sentence',
                language: 'en',
                author: userId,
            });

        // Отправка запроса на получение всех предложений с использованием токена пользователя
        const response = await request(app)
            .get('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`);

        // Проверки
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].text).toBe('Test sentence');

        // Получение обновленной информации о пользователе
        const updatedUser = await User.findById({ _id: new ObjectId(userId) });

        if (!updatedUser || typeof (updatedUser.suggestedSentences) === 'undefined') {
            return false
        }

        // Проверка, что у пользователя теперь есть одно предложение
        expect(updatedUser.suggestedSentences).toHaveLength(1);
        expect(updatedUser.suggestedSentences[0].toString()).toBe(response.body[0]._id);
        expect(updatedUser.rating).toBe(200);

        return true
        
    });

    it('should return 404 if no sentences found', async () => {
        // Make a request to get all sentences with the user's token
        const response = await request(app)
            .get('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`);

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Предложения не найдены');
    });

    it('should get sentence with authentication', async () => {

        // Проверка, что токен и userId установлены
        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        // Создание тестового предложения
        const createdSentence = await request(app)
            .post('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                text: 'Test sentence',
                language: 'en',
                author: userId,
            });

        // Отправка запроса на получение всех предложений с использованием токена пользователя
        const response = await request(app)
            .get(`/api/sentences/${createdSentence.body.sentenceId}`)
            .set('Authorization', `Bearer ${authToken}`);

        // Проверки
        expect(response.status).toBe(200);
        expect(response.body._id).toBe(createdSentence.body.sentenceId);

        // Получение обновленной информации о пользователе
        // const updatedUser = await User.findById({ _id: new ObjectId(userId) });

        // Проверка, что у пользователя теперь есть одно предложение
        // expect(updatedUser.suggestedSentences).toHaveLength(1);
        // expect(updatedUser.suggestedSentences[0].toString()).toBe(response.body[0]._id);
        // expect(updatedUser.rating).toBe(200);
    });

});
