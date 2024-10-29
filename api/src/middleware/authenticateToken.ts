import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import JwtTokenModel from "../models/Token";
import logger from "../utils/logger";

export interface AuthRequest extends Request {
  user?: {
    userId?: string;
  };
}

const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers["authorization"] as string | undefined;

  if (!authHeader) {
    res
      .status(401)
      .json({ error: "Access denied", message: "Access denied" });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res
      .status(401)
      .json({ error: "Access denied", message: "Access denied" });
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
      logger.warn(`Токен не найден в базе данных: ${token}`);
      res.status(401).json({ message: "Неверный токен аутентификации" });
      return;
    }

    req.user = { userId: decoded.userId };

    next();
  } catch (error: any) {
    console.error(error);
    logger.error(`Ошибка при проверке токена: ${error.message}`);
    res.status(401).json({ message: "Неверный токен аутентификации" });
    return;
  }
};

export default authenticateToken;