// src/controllers/userController.ts

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
import { v4 as uuidv4 } from "uuid";

const saltRounds = 10;

const userController = {
  register: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password, email } = req.body;
      let { username } = req.body;

      const maxEmailLength = 255;
      const minPasswordLength = 8;

      // Валидация длины email и пароля
      if (email.length > maxEmailLength) {
        logger.error(`Email length exceeds the maximum allowed: ${email}`);
        res.status(400).json({ message: "Email length exceeds the maximum allowed" });
        return;
      }

      if (password.length < minPasswordLength) {
        logger.error(`Password length is below the minimum allowed: ${password}`);
        res.status(400).json({ message: "Password length is below the minimum allowed" });
        return;
      }

      // Валидация формата email
      if (!validator.isEmail(email)) {
        logger.error(`Invalid email format: ${email}`);
        res.status(400).json({ message: "Invalid email format" });
        return;
      }

      // Проверка наличия пользователя с таким email
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.error(`User with this email already exists: ${email}`);
        res.status(400).json({ message: "User with this email already exists" });
        return;
      }

      if (username) {
        const existingUserByUsername = await User.findOne({ username });

        if (existingUserByUsername) {
          logger.error(`User with this username already exists: ${username}`);
          res.status(400).json({ message: `User with this username already exists` });
          return;
        }
      } else {
        username = await generateUniqueUsername(email);
      }

      // Хеширование пароля и создание нового пользователя
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = new User({ password: hashedPassword, email, username });
      await newUser.save();

      res.status(201).json({ message: "User successfully registered" });
      logger.info(`User successfully registered: ${newUser._id}`);
    } catch (error) {
      console.error(error);
      logger.error(`Error during user registration`);
      res.status(500).json({ message: "Error during user registration" });
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username, password } = req.body;

      // Проверка существования email или username
      if (!email && !username) {
        res.status(400).json({ message: "Please provide username or email" });
        return;
      }

      const query = email ? { email } : { username };
      const user = await User.findOne(query);

      if (user && (await bcrypt.compare(password, user.password))) {
        if (!user._id) {
          res.status(500).json({ message: "User ID not found" });
          return;
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

        logger.info(`Token created: ${createdToken}`);
        logger.info(`Token created for user: ${user._id}`);

        res.status(200).json({ token, userId: user._id.toString() });
        return;
      }

      res.status(401).json({ message: "Invalid username or password" });
    } catch (error) {
      logger.error(`Error during user login: ${error}`);
      res.status(500).json({ message: "Error during user login" });
      next(error);
    }
  },

  getUser: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        if (!isValidObjectIdString(id)) {
          res.status(400).json({
            message: `Invalid id parameter: Not a valid ObjectId or cannot be converted to ObjectId`,
          });
          return;
        }
      }

      if (id && isValidObjectId(new ObjectId(id))) {
        const user = await User.findById(new ObjectId(id));

        if (!user) {
          res.status(404).json({ message: "User not found" });
          return;
        }

        const publicProfile = user.getPublicProfile();
        res.status(200).json({ message: "User retrieved successfully!", user: publicProfile });
        return;
      }

      res.status(400).json({ message: "Invalid id parameter" });
    } catch (error) {
      logger.error(`Error retrieving user`);
      res.status(500).json({ message: "Error retrieving user" });
      next(error);
    }
  },

  getAllPublicUsers: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await User.find();

      const publicProfiles = users.map((user) => user.getPublicProfile());

      res.status(200).json({
        message: "Public data of all users retrieved successfully!",
        users: publicProfiles,
      });
      return;
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: "Error retrieving users" });
      next(error);
    }
  },

  getPublicUserByUsername: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params;
      const user = await User.findOne({ username });

      if (typeof username !== "string") {
        res.status(404).json({ message: "Invalid username parameter" });
        return;
      }

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const publicProfile = user.getPublicProfile();

      res.status(200).json({ message: "Public data retrieved successfully!", publicProfile });
      return;
    } catch (error) {
      logger.error(`Error retrieving user`);
      res.status(500).json({ message: "Error retrieving user" });
      next(error);
    }
  },

  setProfilePhoto: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!isValidObjectId(req.user._id)) {
        if (!isValidObjectIdString(req.user._id)) {
          res.status(400).json({
            message: `Invalid id parameter: Not a valid ObjectId or cannot be converted to ObjectId`,
          });
          return;
        }
      }

      const user = await User.findById(new ObjectId(req.user._id));

      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      await User.findByIdAndUpdate(new ObjectId(req.user._id), {
        $set: {
          avatar: req.body.userProfilePhoto,
        },
      });

      res.status(200).json({
        message: "Avatar successfully updated!",
        avatar: req.body.userProfilePhoto,
      });
      return;
    } catch (error) {
      logger.error(`Error updating profile photo: ${error}`);
      res.status(500).json({ message: "Error updating data" });
      next(error);
    }
  },

  updateName: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, lastName } = req.body;

      if (!req.user || !req.user._id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      if (!isValidObjectId(req.user._id)) {
        if (!isValidObjectIdString(req.user._id)) {
          res.status(400).json({
            message: `Invalid id parameter: Not a valid ObjectId or cannot be converted to ObjectId`,
          });
          return;
        }
      }

      const user = await User.findById(new ObjectId(req.user._id));

      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      await User.findByIdAndUpdate(new ObjectId(req.user._id), {
        $set: {
          firstName,
          lastName,
        },
      });

      logger.info("User data updated successfully!");
      res.status(200).json({ message: `User data updated successfully!` });
      return;
    } catch (error) {
      logger.error(`Error updating user data: ${error}`);
      res.status(500).json({ message: "Error updating data" });
      next(error);
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user._id) {
        res.status(400).json({ message: "User not authenticated" });
        return;
      }

      if (!isValidObjectId(req.user._id)) {
        if (!isValidObjectIdString(req.user._id)) {
          res.status(400).json({
            message: `Invalid id parameter: Not a valid ObjectId or cannot be converted to ObjectId`,
          });
          return;
        }
      }

      const user = await User.findById(new ObjectId(req.user._id));

      if (!user) {
        res.status(400).json({ message: "User not found" });
        return;
      }

      logger.info(`User retrieved successfully`);
      res.status(200).json({ message: "User found!", user });
      return;
    } catch (error) {
      logger.error(`Error retrieving user: ${error}`);
      res.status(500).json({ message: "Error retrieving data" });
      next(error);
    }
  },
};

// Функция для генерации уникального username на основе email
async function generateUniqueUsername(email: string, suffix = 0): Promise<string> {
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
