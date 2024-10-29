// sentenceController.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app'; // Укажите путь к вашему основному файлу приложения
import Sentence from '../../models/SuggestedSentence';
import User from '../../models/User';
import Translation from '../../models/Translation';

describe('Sentence Controller Put methods Tests', () => {

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

    it('should update sentence status with valid data', async () => {
        // Create a test sentence
        const createdSentence = await Sentence.create({
            text: 'Test sentence',
            language: 'en',
            author: userId,
        });

        // Make a request to update the status of the created sentence
        const response = await request(app)
            .put(`/api/sentences/${createdSentence._id}/status`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'accepted',
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Статус предложения успешно обновлен');
        expect(response.body.sentence).toHaveProperty('status', 'accepted');
    });

    it('should return 400 if unset "author" value', async () => {

        const response = await request(app)
            .put('/api/sentences/invalidid/status') // Используем пустой author
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'accepted',
            });

        // Ensure a 400 status code is returned
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId');
    });

    it('should return 404 if sentence is not found', async () => {
        // Make a request to update the status of a non-existent sentence
        const response = await request(app)
            .put(`/api/sentences/${new mongoose.Types.ObjectId()}/status`) // Используем неверный формат id
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'accepted',
            });

        // Ensure sentence is not found
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Предложение не найдено');

        // Check that sentence is null
        expect(response.body.sentence).toBeNull();
    });

    it('should return 400 if invalid contributorId is provided', async () => {

        // Create a test sentence
        const createdSentence = await Sentence.create({
            text: 'Test sentence',
            language: 'en',
            author: userId,
        });

        // Make a request to update the status with an non-exists contributorId
        const response = await request(app)
            .put(`/api/sentences/${createdSentence._id}/status`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                status: 'accepted',
                contributorId: new mongoose.Types.ObjectId(),
            });

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('message', 'Контрибьютора не существует');
    });


});
