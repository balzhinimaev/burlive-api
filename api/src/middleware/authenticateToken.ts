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
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Отсутствует токен аутентификации" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };

    const existingToken = await JwtTokenModel.findOne({
      userId: decoded.userId,
      token,
    });

    if (!existingToken) {
      return res.status(401).json({ message: "Неверный токен аутентификации" });
    }

    req.user = { userId: decoded.userId };
    
    logger.info(`Токен верифицирован для ${existingToken.userId}`);
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: "Неверный токен аутентификации" });
  }
};

export default authenticateToken;
