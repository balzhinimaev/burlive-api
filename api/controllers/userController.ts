import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import User from '../models/User';
import logger from '../utils/logger';
import Token from '../models/Token';

interface RegisterRequestBody {
    password: string;
    email: string;
    username: string
}

interface RegisterRequest extends Request {
    body: RegisterRequestBody;
}

const saltRounds = 10;

const userController = {
    register: async (req: RegisterRequest, res: Response) => {
        try {

            const { password, email } = req.body;

            let { username } = req.body

            const maxEmailLength = 255;
            const minPasswordLength = 8;

            // Валидация длины email и пароля
            if (email.length > maxEmailLength) {
                logger.error(`Длина email превышает максимально допустимую: ${ email }`);
                return res.status(400).json({ message: 'Длина email превышает максимально допустимую' });
            }

            if (password.length < minPasswordLength) {
                logger.error(`Длина пароля меньше минимально допустимой: ${ password }`);
                return res.status(400).json({ message: 'Длина пароля меньше минимально допустимой' });
            }

            // Валидация почты
            if (!validator.isEmail(email)) {
                logger.error(`Некорректный формат email: ${ email }`);
                return res.status(400).json({ message: 'Некорректный формат email' });
            }

            // Проверка наличия пользователя с таким email
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                logger.error(`Пользователь с таким email уже существует: ${ email }`);
                return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
            }


            if (username) {
                
                const existingUserByUsername = await User.findOne({ username })
                
                if (existingUserByUsername) {
                    logger.error(`Пользователь с таким username уже существует: ${username}`);
                    return res.status(400).json({ message: `Пользователь с таким username уже существует` })
                }
                
            }

            // Хеширование пароля и создание нового пользователя
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            const newUser = new User({ password: hashedPassword, email, username });
            await newUser.save();

            res.status(201).json({ message: 'Пользователь успешно зарегистрирован' });
            logger.info(`Успешная регистрация пользователя: ${newUser._id}`);

        } catch (error) {
            console.error(error);
            logger.error(`Ошибка при регистрации пользователя: ${error.message}`);
            res.status(500).json({ message: 'Ошибка при регистрации пользователя' });
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, username, password } = req.body;

            // if ((username && email) || (!username && !email)) {
            //     return res.status(400).json({ message: 'Укажите username или email' });
            // }

            // Формируем запрос на основе указанного email или username
            const query = username ? { $or: [{ email }, { username }] } : { email };

            const user = await User.findOne(query);

            // Проверка наличия пользователя и сравнение пароля
            if (user && (await bcrypt.compare(password, user.password))) {
                // Создание JWT токена
                const token = jwt.sign({ userId: user._id.toString() }, process.env.jwt_secret, { expiresIn: '1h' });

                // Сохранение токена в MongoDB
                const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 час
                await Token.create({ userId: user._id, token, expiresAt });
                logger.info(`Токен создан для пользователя: ${ user._id }`);

                return res.status(200).json({ token, userId: user._id.toString() });
            }

            res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
        } catch (error) {
            console.error(error);
            logger.error(`Ошибка при входе пользователя: ${error.message}`);
            res.status(500).json({ message: 'Ошибка при входе пользователя' });
        }
    },
};

async function usernameChecker (username: string, index: number) {
    try {
        
        
        
        if (index == 0) {
            
            const user = await User.findOne({ username: username })

            if (user) {

                return usernameChecker(username, index++)

            } else {

                return username

            }

        } else {

            const user = await User.findOne({ username: username + index })

            if (user) {

                return usernameChecker(username, index++)

            } else {

                return `${username}${index}`

            }

        }


    } catch (error) {
        console.log(error)
        logger.error("Ошибка в функции usernameChecker")
    }
}

async function generateUniqueUsername(email, suffix = 0) {
    let username = email.split('@', 1)[0];
    if (suffix > 0) {
        username += suffix;
    }
    const existingUser = await User.findOne({ username });

    if (existingUser) {
        return generateUniqueUsername(email, suffix + 1);
    } else {
        return username;
    }
}

export default userController;
