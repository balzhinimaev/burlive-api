import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import User from "../models/User";
import logger from "../utils/logger";
import Token from "../models/Token";
import { isValidObjectId } from "mongoose";
import { ObjectId } from "mongodb";
import isValidObjectIdString from "../utils/isValidObjectIdString";
import { AuthRequest } from "../middleware/authenticateToken";
import { v4 as uuidv4 } from "uuid";
interface RegisterRequestBody {
  password: string;
  email: string;
  username: string;
}

interface RegisterRequest extends Request {
  body: RegisterRequestBody;
}

const saltRounds = 10;

const userController = {
  register: async (req: RegisterRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password, email } = req.body;

      let { username } = req.body;

      const maxEmailLength = 255;
      const minPasswordLength = 8;

      // Валидация длины email и пароля
      if (email.length > maxEmailLength) {
        logger.error(`Длина email превышает максимально допустимую: ${email}`);
        res
          .status(400)
          .json({ message: "Длина email превышает максимально допустимую" }); return
      }

      if (password.length < minPasswordLength) {
        logger.error(`Длина пароля меньше минимально допустимой: ${password}`);
        res
          .status(400)
          .json({ message: "Длина пароля меньше минимально допустимой" }); return
      }

      // Валидация почты
      if (!validator.isEmail(email)) {
        logger.error(`Некорректный формат email: ${email}`);
        res.status(400).json({ message: "Некорректный формат email" }); return
      }

      // Проверка наличия пользователя с таким email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.error(`Пользователь с таким email уже существует: ${email}`);
        res
          .status(400)
          .json({ message: "Пользователь с таким email уже существует" }); return
      }

      if (username) {
        const existingUserByUsername = await User.findOne({ username });

        if (existingUserByUsername) {
          logger.error(
            `Пользователь с таким username уже существует: ${username}`
          );
          res
            .status(400)
            .json({ message: `Пользователь с таким username уже существует` }); return
        }
      } else {
        username = await generateUniqueUsername(email);
      }

      // Хеширование пароля и создание нового пользователя
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({ password: hashedPassword, email, username });
      await newUser.save();

      res.status(201).json({ message: "Пользователь успешно зарегистрирован" });
      logger.info(`Успешная регистрация пользователя: ${newUser._id}`);
    } catch (error) {
      console.error(error);
      logger.error(`Ошибка при регистрации пользователя`);
      res.status(500).json({ message: "Ошибка при регистрации пользователя" });
      next(error)
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

      const { email, username, password } = req.body;

      // проверка суеществования почты и логина
      if (!email && !username) {
        res.status(400).json({ message: "Укажите username и email" }); return
      }

      const query = email ? { email } : { username };
      const user = await User.findOne(query);

      if (user && (await bcrypt.compare(password, user.password))) {

        if (!user._id) {
          return
        }

        const sessionId = uuidv4(); // Генерация уникального идентификатора сессии
        const token = jwt.sign(
          { userId: user._id.toString(), sessionId },
          process.env.JWT_SECRET as string,
          { expiresIn: "3d" }
        );
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 дня

        await Token.deleteMany({ userId: user._id }); // Удаление старых токенов
        const createdToken = await Token.create({ userId: user._id, token, expiresAt });

        logger.info(`Токен создан: ${createdToken}`)
        logger.info(`Токен создан для пользователя: ${user._id}`);

        res.status(200).json({ token, userId: user._id.toString() });
        return
      }

      res.status(401).json({ message: "Неверное имя пользователя или пароль" });
    } catch (error) {
      logger.error(`Ошибка при входе пользователя: ${error}`);
      res.status(500).json({ message: "Ошибка при входе пользователя" });
      next(error)
    }
  },

  getUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        // Проверяем, является ли id ObjectId

        if (!isValidObjectIdString(id)) {
          // Может ли преобразоваться в ObjectId
          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            }); return
        }
      }

      if (!id || isValidObjectId(new ObjectId(id))) {
        const user = await User.findById(new ObjectId(id));

        if (!user) {
          res
            .status(404)
            .json({ message: "Пользователь не найден", user }); return
        }

        const publicProfile = user.getPublicProfile();
        res
          .status(200)
          .json({ message: "Пользователь получен!", user: publicProfile }); return
      }
    } catch (error) {
      logger.error(`Ошибка при получении пользователя`);
      res.status(500).json({ message: "Ошибка при получении пользователя" });
      next(error)
    }
  },

  getAllPublicUsers: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await User.find();

      const publicProfiles = users.map((user) => user.getPublicProfile());

      res
        .status(200)
        .json({
          message: "Публичные данные всех пользователей получены!",
          users: publicProfiles,
        }); return
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: "Ошибка при получении пользователей" });
      next(error)
    }
  },

  getPublicUserByUsername: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const user = await User.findOne({
        username,
      });

      if (typeof username !== "string") {
        res
          .status(404)
          .json({ message: "Неправильный параметр username" }); return
      }

      if (!user) {
        res.status(404).json({ message: "Пользователь не найден" }); return
      }

      const publicProfile = user.getPublicProfile();

      res
        .status(200)
        .json({ message: "Публичные данные получены!", publicProfile }); return
    } catch (error) {
      logger.error(`Ошибка при получении пользователя`);
      res.status(500).json({ message: "Ошибка при получении пользователя" });
      next(error)
    }
  },

  setProfilePhoto: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        false; return
      }

      if (!isValidObjectId(req.user.userId)) {
        // Проверяем, является ли id ObjectId

        if (!isValidObjectIdString(req.user.userId)) {
          // Может ли преобразоваться в ObjectId

          console.log(123);
          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            }); return
        }
      }

      const user = await User.findById(new ObjectId(req.user.userId));

      if (!user) {
        res
          .status(400)
          .json({ message: "Пользователь не найден", user }); return
      }

      await User.findByIdAndUpdate(new ObjectId(req.user.userId), {
        $set: {
          avatar: req.body.userProfilePhoto,
        },
      }).then(() => {
        return res
          .status(200)
          .json({
            message: "Аватарка успешно сохранена!",
            avatar: req.body.userProfilePhoto,
          });
      });
    } catch (error) {
      logger.error(`Ошибка при обновлении фотографии профиля: ${error}`);
      res.status(500).json({ message: "Ошибка при обновлении данных" });
      next(error)
    }
  },

  updateName: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName } = req.body;

      if (!req.user || !req.user.userId) {
        false; return
      }

      if (!isValidObjectId(req.user.userId)) {
        // Проверяем, является ли id ObjectId

        if (!isValidObjectIdString(req.user.userId)) {
          // Может ли преобразоваться в ObjectId

          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            }); return
        }
      }

      const user = await User.findById(new ObjectId(req.user.userId));

      if (!user) {
        res
          .status(400)
          .json({ message: "Пользователь не найден", user }); return
      }

      await User.findByIdAndUpdate(new ObjectId(req.user.userId), {
        $set: {
          firstName,
          lastName,
        },
      });

      logger.info("Данные пользователя обновлены!");
      res
        .status(200)
        .json({ message: `Данные пользователя обновлены!` }); return
    } catch (error) {
      logger.error(`Ошибка при обновлении данных пользователя: ${error}`);
      res.status(500).json({ message: "Ошибка при обнлвении данных" }); next(error)
    }
  },

  getMe: async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        res.status(400)
        return
      }

      if (!isValidObjectId(req.user.userId)) {
        // Проверяем, является ли id ObjectId

        if (!isValidObjectIdString(req.user.userId)) {
          // Может ли преобразоваться в ObjectId

          console.log(req.user.userId);

          res
            .status(400)
            .json({
              message: `Неверный параметр id, не является ObjectId или невозможно преобразить в ObjectId`,
            });
          return
        }
      }

      const user = await User.findById(new ObjectId(req.user.userId));

      if (!user) {
        res
          .status(400)
          .json({ message: "Пользователь не найден", user }); return
      }

      logger.info(`Пользователь получен`);
      res.status(200).json({ message: "Пользователь найден!", user }); return
    } catch (error) {
      logger.error(`Ошибка при обновлении фотографии профиля: ${error}`);
      res.status(500).json({ message: "Ошибка при обновлении данных" });
      next(error)
    }
  },
};

// async function usernameChecker(username: string, index: number,) {
//   try {
//     if (index == 0) {
//       const user = await User.findOne({ username: username });

//       if (user) {
//         return usernameChecker(username, index++);
//       } else {
//         return username;
//       }
//     } else {
//       const user = await User.findOne({ username: username + index });

//       if (user) {
//         return usernameChecker(username, index++);
//       } else {
//         return `${username}${index}`;
//       }
//     }
//   } catch (error) {
//     console.log(error);
//     logger.error("Ошибка в функции usernameChecker");
//   }
// }

async function generateUniqueUsername(email: string, suffix = 0) {
  let username = email.split("@", 1)[0];
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
