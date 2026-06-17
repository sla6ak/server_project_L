import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

declare global {
  namespace Express {
    interface Request {
      id?: string; // Теперь TypeScript знает, что у req есть id
    }
  }
}

interface MyJwtPayload extends jwt.JwtPayload {
  id: string; // или number, смотря какой тип у user.id
}

dotenv.config();
const GetPublicKeyOrSecret =
  process.env.GetPublicKeyOrSecret || "your_jwt_secret_key_here";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.method === "OPTIONS") {
    next();
  }
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No authorization header" });
  }
  try {
    const token = req.headers.authorization?.split(" ")[1]; // "Bearer TOKEN" это строка поэтому распарсим ее в массив на 2 слова - и вытянем елемент 1
    if (!token) {
      throw new Error("No token provided");
    }
    const tokenDecoder = jwt.verify(
      token,
      GetPublicKeyOrSecret,
    ) as MyJwtPayload; // что шифровали то и вытянем ({ id: user.id })
    req.id = tokenDecoder.id;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
