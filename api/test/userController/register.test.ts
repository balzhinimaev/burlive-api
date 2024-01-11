// register.test.ts
import request from 'supertest';
import app from '../../app'; // Предполагаем, что ваш файл app.ts находится в корне проекта
// setup.ts
import User from '../../models/User';

describe('User Registration Tests', () => {

    // Перед каждым тестом, давайте очищать данные в базе данных
    beforeAll(async () => {
        await User.deleteMany({});
    });

    // Тест для успешной регистрации нового пользователя
    it('should authenticate a user with valid credentials', async () => {
        const userData = {
            password: 'testpassword',
            email: 'testuser@example.com',
        };

        // Регистрация пользователя
        await request(app)
            .post('/api/users/register')
            .send(userData);

        // Аутентификация пользователя
        const response = await request(app)
            .post('/api/users/login')
            .send(userData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('userId');
    });

    it('should not authenticate a user with an incorrect password', async () => {
        const userData = {
            password: 'testpassword',
            email: 'testuser@example.com',
        };

        // Регистрация пользователя
        await request(app)
            .post('/api/users/register')
            .send(userData);

        // Попытка аутентификации с неверным паролем
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: userData.email,
                password: 'incorrectpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Неверное имя пользователя или пароль');
    });

    it('should not authenticate a user with an incorrect email', async () => {
        const userData = {
            password: 'testpassword',
            email: 'testuser@example.com',
        };

        // Регистрация пользователя
        await request(app)
            .post('/api/users/register')
            .send(userData);

        // Попытка аутентификации с неверным email
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'incorrectemail@example.com',
                password: userData.password,
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Неверное имя пользователя или пароль');
    });

    // Тест для регистрации пользователя с различными email
    it('should not register a user with invalid emails', async () => {
        const invalidEmails = ['invalidemail1', '@jdqw', 'test@example', "gmail.com"];

        for (const email of invalidEmails) {
            const response = await request(app)
                .post('/api/users/register')
                .send({
                    password: 'testpassword',
                    email,
                });

            // Ожидаем, что статус будет 400 для каждого неверного email
            expect(response.status).toBe(400);

            // Ожидаем, что сообщение об ошибке соответствует ожиданиям
            expect(response.body.message).toBe('Некорректный формат email');

            // Другие дополнительные проверки, если необходимо
        }
    });

    // Тест для авторизации пользователя с большим количеством данных
    it('should not register a user with a lot params', async () => {
        const invalidEmails = ['invalidemail1', '@jdqw', 'test@example', "gmail.com"];

        for (const email of invalidEmails) {
            const response = await request(app)
                .post('/api/users/login')
                .send({
                    password: 'testpassword',
                    email: invalidEmails,
                    username: '12312'
                });

            // Ожидаем, что статус будет 400 для каждого неверного email
            expect(response.status).toBe(400);

            // Ожидаем, что сообщение об ошибке соответствует ожиданиям
            expect(response.body.message).toBe('Укажите username или email');

            // Другие дополнительные проверки, если необходимо
        }
    });


    it('should not authenticate a non-existent user by email', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'nonexistentpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Неверное имя пользователя или пароль');
    });

    it('should not authenticate a non-existent user by username', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                username: 'nonexistentusername',
                password: 'nonexistentpassword',
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Неверное имя пользователя или пароль');
    });

    it('should not authenticate a user with missing credentials', async () => {
        const response = await request(app)
            .post('/api/users/login')
            .send({
                // Отсутствие email и password
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Укажите username или email');
    });

    // После выполнения всех тестов, давайте закроем соединение с базой данных
    afterAll(async () => {
        // Реализуйте код для закрытия соединения с базой данных
        // Подключение к базе данных

    });
});
