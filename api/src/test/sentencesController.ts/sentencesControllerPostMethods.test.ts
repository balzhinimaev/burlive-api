// sentenceController.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app'; // Укажите путь к вашему основному файлу приложения
import Sentence from '../../models/SuggestedSentence';
import User from '../../models/User';
import { ObjectId } from 'mongodb';
import Translation from '../../models/Translation';

describe('Sentence Controller Post methods Tests', () => {

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

    it('should create sentence with authentication, and update user document (rating, suggestedSentences)', async () => {

        // Проверка, что токен и userId установлены
        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        // Создание тестового предложения
        const response = await request(app)
            .post('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                text: 'Test sentence',
                language: 'en',
                author: userId,
            });

        // Проверки
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Предложение успешно создано");

        // Получение обновленной информации о пользователе
        const updatedUser = await User.findById({ _id: new ObjectId(userId) });
        
        if (!updatedUser || typeof (updatedUser.suggestedSentences) === 'undefined') {
            return false
        }

        // Проверка, что у пользователя теперь есть одно предложение
        expect(updatedUser.suggestedSentences).toHaveLength(1);
        expect(updatedUser.suggestedSentences[0].toString()).toBe(response.body.sentenceId);
        expect(updatedUser.rating).toBe(200);

        return true

    });

    it('should return 400 if required data is missing', async () => {
        // Make a request to create a new sentence with missing data
        const response = await request(app)
            .post('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                // Omitting required fields
            });

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Пожалуйста, предоставьте текст, язык и автора');
    });

});
