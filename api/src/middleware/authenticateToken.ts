// src/middleware/authenticateToken.ts

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import JwtTokenModel from "../models/Token";
import UserModel from "../models/User"; // Убедитесь, что путь корректен
import logger from "../utils/logger";

const authenticateToken = async (
  req: Request, // Используем глобально расширенный Request
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string | undefined;

  if (!authHeader) {
    res.status(401).json({ error: "Access denied", message: "Access denied" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied", message: "Access denied" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      sessionId: string;
    };

    const existingToken = await JwtTokenModel.findOne({
      userId: decoded.userId,
      token,
    });

    if (!existingToken) {
      logger.warn(`Token not found in the database: ${token}`);
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    // Получаем пользователя из базы данных для получения роли
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Устанавливаем свойство user в Request
    req.user = { _id: user._id.toString(), role: user.role };

    next();
  } catch (error: any) {
    console.error(error);
    logger.error(`Error verifying token: ${error.message}`);
    res.status(401).json({ message: "Invalid authentication token" });
    return;
  }
};

export default authenticateToken;
