import UserModel from "../models/user.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { OAuth2Client } from "google-auth-library"; // Импортируем клиент Google
import { Request, Response, NextFunction } from "express";

const GetPublicKeyOrSecret = process.env.GetPublicKeyOrSecret;
class UserController {
  async userLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findOneAndUpdate(
        { email },
        { online: true },
      );

      if (!user) {
        throw new Error(`User with nickName ${email} not found`);
      }

      const isPassword = await bcrypt.compare(password, user.password);

      if (!isPassword) {
        throw new Error(`Email or password is wrong`);
      }

      if (!GetPublicKeyOrSecret) {
        throw new Error(
          "JWT secret key is not defined in environment variables",
        );
      }
      const token = jwt.sign({ id: user.id }, GetPublicKeyOrSecret, {
        expiresIn: "30d",
      });

      return res.status(201).json({
        token,
        user: { ...user, id: user.id },
      });
    } catch (error) {
      next(error);
    }
  }

  async userGoogle(req: Request, res: Response, next: NextFunction) {
    const googleClient = new OAuth2Client();
    try {
      const { credential } = req.body;

      if (!credential) {
        return res.status(400).json({ error: "Токен Google отсутствует" });
      }

      // 1. Верифицируем токен в Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res
          .status(400)
          .json({ error: "Не удалось прочитать данные токена" });
      }

      // Извлекаем email и имя пользователя из Google токена
      const { email, name } = payload;

      if (!email) {
        return res
          .status(400)
          .json({ error: "Google аккаунт не предоставляет email" });
      }

      // 2. Ищем игрока в нашей базе данных по этому email
      let user = await UserModel.findOne({ email });

      // Флаг для логирования в консоли бэкенда (опционально)
      let isNewUser = false;

      // 3. Если игрока нет — РЕГИСТРИРУЕМ его автоматически
      if (!user) {
        isNewUser = true;

        // Генерация уникального никнейма из имени Google
        // Убираем пробелы и спецсимволы, добавляем случайный хэш для уникальности
        const baseNickname = name ? name.replace(/\s+/g, "_") : "Player";
        const randomHex = Math.floor(Math.random() * 10000).toString(16);
        const generatedNickname = `${baseNickname}_${randomHex}`;

        // Генерация случайного сложного пароля
        const randomPassword =
          Math.random().toString(36).substring(2) +
          Math.random().toString(36).substring(2);
        // Хэшируем его, чтобы удовлетворить требования безопасности и схемы
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Создаем запись в базе данных
        user = await UserModel.create({
          nickName: generatedNickname,
          email: email,
          password: hashedPassword,
          online: true, // Сразу ставим в онлайн при успешной регистрации
        });

        console.log(
          `[Google Auth] Зарегистрирован новый игровой аккаунт: ${generatedNickname}`,
        );
      } else {
        // Если игрок уже существовал, просто обновляем его статус на онлайн
        user.online = true;
        await user.save();
        console.log(`[Google Auth] Игрок ${user.nickName} вошел в систему`);
      }

      // 4. Проверяем наличие нашего секретного ключа для подписи
      if (!GetPublicKeyOrSecret) {
        throw new Error(
          "JWT secret key is not defined in environment variables",
        );
      }

      // 5. Генерируем НАШ внутренний токен для CyberSphere Online
      const token = jwt.sign({ id: user.id }, GetPublicKeyOrSecret, {
        expiresIn: "30d",
      });

      // 6. Возвращаем структуру данных, которую ждет фронтенд (RTK Query)
      // Возвращаем статус 201 для новых, 200 для уже существующих
      return res.status(isNewUser ? 201 : 200).json({
        token,
        user: { ...user },
      });
    } catch (error) {
      console.error("Ошибка авторизации через Google:", error);
      next(error);
    }
  }
  async addNewUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { nickName, email, password } = req.body;
      console.log("nickName:", nickName);
      // 1. Валидация входных данных на бэкенде
      if (!nickName || !email || !password) {
        return res.status(400).json({
          error:
            "Все поля (nickName, email, password) обязательны для заполнения",
        });
      }

      // 2. Хэшируем пароль перед сохранением в базу данных
      // Использовать bcrypt.hash — это стандарт безопасности, 10 раундов соли оптимально
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Создаем пользователя в MongoDB с привязкой к вашей схеме
      // Обратите внимание: с фронтенда летит поле 'username', а в схеме оно называется 'nickName'
      const newUser = await UserModel.create({
        nickName: nickName,
        email: email,
        password: hashedPassword,
        online: true, // По умолчанию true согласно вашей схеме
      });

      // 4. Проверяем наличие секретного ключа для генерации JWT игроку
      if (!GetPublicKeyOrSecret) {
        throw new Error(
          "JWT secret key is not defined in environment variables",
        );
      }

      // 5. Генерируем внутренний токен игры, чтобы после регистрации юзер сразу авторизовался
      const token = jwt.sign({ id: newUser.id }, GetPublicKeyOrSecret, {
        expiresIn: "30d",
      });

      // 6. Возвращаем структуру данных, которую ожидает ваш RTK Query на фронтенде
      return res.status(201).json({
        token,
        user: { ...newUser, id: newUser.id },
      });
    } catch (error: any) {
      // Перехватываем ошибку уникальности MongoDB (E11000 duplicate key error)
      if (error.code === 11000) {
        const duplicateField = Object.keys(error.keyValue)[0];

        if (duplicateField === "nickName") {
          return res
            .status(409)
            .json({ error: "Этот никнейм уже занят другим игроком" });
        }
        if (duplicateField === "email") {
          return res.status(409).json({
            error:
              "Пользователь с такой электронной почтой уже зарегистрирован",
          });
        }
      }

      // Все остальные системные ошибки отправляем в глобальный обработчик Express
      console.error("Ошибка при регистрации пользователя:", error);
      next(error);
    }
  }
  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UserModel.findByIdAndUpdate(
        { _id: req.id },
        { online: true },
      );
      if (!user) {
        throw new Error(`User with id ${req.id} not found`);
      }
      // Преобразуем _id в id и создаем новый объект с нужными полями
      return res.status(201).json({ ...user, id: user._id });
    } catch (error) {
      next(error);
    }
  }
  async logOutUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.id;
      const user = await UserModel.findByIdAndUpdate(
        { _id: id },
        { online: false, lastLoginDate: new Date() },
      );
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      return res.status(200).json({ message: "Logout success" });
    } catch (error) {
      next(error);
    }
  }
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.id;
      const user = await UserModel.findOneAndDelete({ _id: id });
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      return res.json({ user });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
