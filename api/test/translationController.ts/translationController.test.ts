// sentenceController.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app'; // Укажите путь к вашему основному файлу приложения
import Sentence from '../../models/Sentence';
import User from '../../models/User';
import { ObjectId } from 'mongodb';
import Translation from '../../models/Translation';

describe('Sentence Controller Tests', () => {

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

    it('should create sentence with authentication, and update user document (rating, suggestedSentences)', async () => {

        // Проверка, что токен и userId установлены
        expect(authToken).toBeDefined();
        expect(userId).toBeDefined();

        // Создание тестового предложения
        const createSentence = await request(app)
            .post('/api/sentences')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                text: 'Test sentence',
                language: 'en',
                author: userId,
            });

        // Проверки
        expect(createSentence.status).toBe(201);
        expect(createSentence.body.message).toBe("Предложение успешно создано");

        // Получение обновленной информации о пользователе
        const updatedUser = await User.findById({ _id: new ObjectId(userId) });

        // Проверка, что у пользователя теперь есть одно предложение
        expect(updatedUser.suggestedSentences).toHaveLength(1);
        expect(updatedUser.suggestedSentences[0].toString()).toBe(createSentence.body.sentenceId);
        expect(updatedUser.rating).toBe(200);

        const getSentence = await request(app)
            .get(`/api/sentences/get-new-sentence`)
            .set('Authorization', `Bearer ${authToken}`)
        
        expect(getSentence.status).toBe(200)
        expect(getSentence.body.sentence._id).toBe(createSentence.body.sentenceId)

    });

    it('should create one translation', async () => {

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

        // Проверка, что у пользователя теперь есть одно предложение
        expect(updatedUser.suggestedSentences).toHaveLength(1);
        expect(updatedUser.suggestedSentences[0].toString()).toBe(response.body[0]._id);
        expect(updatedUser.rating).toBe(200);

        const translationData = {
            text: 'Translation Text',
            language: 'bur',
            sentenceId: response.body[0]._id
        }

        const createTranslation = await request(app)
            .post(`/api/translations`)
            .send(translationData)
            .set('Authorization', `Bearer ${authToken}`)

        expect(createTranslation.status).toBe(201)

        const voteData = {
            isUpvote: true
        }

        const voteForTranslation = await request(app)
            .post(`/api/translations/${createTranslation.body.translationId}/vote`)
            .send(voteData)
            .set('Authorization', `Bearer ${authToken}`)
        
        expect(voteForTranslation.status).toBe(201)

    });

    it('should get one translation', async () => {

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
        const createdSentence = await request(app)
            .get('/api/sentences/get-new-sentence')
            .set('Authorization', `Bearer ${authToken}`);

        const translationData = {
            text: 'Translation Text',
            language: 'bur',
            sentenceId: createdSentence.body.sentence._id
        }

        const createdTranslation = await request(app)
            .post(`/api/translations`)
            .send(translationData)
            .set('Authorization', `Bearer ${authToken}`)

        const voteData = {
            isUpvote: true
        }

        const voteForTranslation = await request(app)
            .post(`/api/translations/${createdTranslation.body.translationId}/vote`)
            .send(voteData)
            .set('Authorization', `Bearer ${authToken}`)

        expect(voteForTranslation.status).toBe(201)

        // Запрос на получение предложенного перевода
        const response = await request(app)
            .get('/api/translations/get-suggested-translation')
            .set('Authorization', `Bearer ${authToken}`)

        // Проверки
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Перевод получен');

    });

});
