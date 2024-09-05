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
) => {
  
  const authHeader = req.headers["authorization"] as string | undefined;

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: "Access denied", message: "Access denied" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied", message: "Access denied" });
  }

  try {
    console.log(token)
    console.log(process.env.JWT_SECRET)
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
      sessionId: string;
    };

    logger.info(`decoded \n${decoded}`)

    const existingToken = await JwtTokenModel.findOne({
      userId: decoded.userId,
      token,
    });

    if (!existingToken) {
      logger.warn(`Токен не найден в базе данных: ${token}`);
      return res.status(401).json({ message: "Неверный токен аутентификации" });
    }

    req.user = { userId: decoded.userId };
    logger.info(
      `Токен верифицирован для пользователя: ${existingToken.userId}`
    );
    next();
  } catch (error) {
    console.error(error);
    logger.error(`Ошибка при проверке токена: ${error.message}`);
    return res.status(401).json({ message: "Неверный токен аутентификации" });
  }
};

export default authenticateToken;
