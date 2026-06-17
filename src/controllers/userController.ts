import UserModel from "../models/user.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library"; // Импортируем клиент Google
import { Request, Response, NextFunction } from "express";

class UserController {
  async userLogin(req: Request, res: Response, next: NextFunction) {}
  async userGoogle(req: Request, res: Response, next: NextFunction) {
    // Инициализируем Google клиент (передавать CLIENT_ID сюда необязательно, но можно)
    const googleClient = new OAuth2Client();
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: "Токен Google отсутствует" });
      }

      // Верифицируем полученный от фронтенда JWT-токен в Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID, // Твой Google Client ID из .env
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res
          .status(400)
          .json({ error: "Не удалось прочитать данные токена" });
      }

      // Извлекаем данные пользователя, которые подтвердил Google
      const { email, name, picture, sub: googleId } = payload;

      // TODO: Здесь должна быть твоя логика работы с базой данных:
      // 1. Ищем пользователя по email или googleId.
      // 2. Если не нашли — создаем нового (регистрируем).
      // 3. Генерируем свой внутренний JWT-токен приложения для игрока.

      // Заглушка для теста (имитируем успешный ответ базы данных)
      const mockUser = {
        id: googleId,
        username: name || "Player_" + Math.floor(Math.random() * 1000),
        email: email,
        avatar: picture,
      };

      // Возвращаем структуру, которую ожидает твой RTK Query на фронтенде
      return res.status(200).json({
        user: mockUser,
        token: "твой_внутренний_jwt_токен_игры", // Отправь токен, если используешь JWT
      });
    } catch (error) {
      console.error("Ошибка верификации Google токена:", error);
      return res.status(401).json({ error: "Неверный токен авторизации" });
    }
  }
  async addNewUser(req: Request, res: Response, next: NextFunction) {}
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {}
  async logOutUser(req: Request, res: Response, next: NextFunction) {}
  async delete(req: Request, res: Response, next: NextFunction) {}
  async updateUserStatus(userId: string, online: boolean) {}
}

export default new UserController();
