import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import mongoose from "mongoose";
import { routerAuth } from "./routers/auth_routes.ts";
import path from "path";
import fs from "fs";
import { GameRoom } from "./wsRoom/GameRoom.ts";

const __dirname = import.meta.dirname;

const port = Number(process.env.PORT || 8080);
const DB_HOST = process.env.DB_HOST || "mongodb://localhost:27017/mydatabase";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- НАСТРОЙКА CORS ---
const getAllowedOrigins = (): (string | RegExp)[] => {
  if (process.env.NODE_ENV === "production") {
    const origins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [];

    return [...origins, process.env.FRONTEND_URL, /\.vercel\.app$/].filter(
      (origin): origin is string | RegExp => Boolean(origin),
    );
  }

  return [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "ws://localhost:8080",
  ];
};

const corsOptions: cors.CorsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  exposedHeaders: ["Authorization"],
};

app.use(cors(corsOptions));

// Обработка корневого маршрута
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  const frontendUrl =
    process.env.FRONTEND_URL || "https://lost-space.vercel.app/";
  html = html.replace("window.FRONTEND_URL", `"${frontendUrl}"`);

  res.send(html);
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-csrf-token",
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// --- СЕРВЕРНЫЙ КЛИЕНТ И ТРАНСПОРТ COLYSEUS v0.16 ---
const server = http.createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server,
  }),
});

// API routes
app.use("/auth", routerAuth);

// ✅ ИСПРАВЛЕНО ДЛЯ v0.16: Официальный middleware из пакета интеграции
// Забираем внутренний обработчик запросов из транспорта Colyseus
app.use("/matchmake", (req, res, next) => {
  return (gameServer.transport as any).app(req, res, next);
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

/* Ловушка для SPA (всегда в самом низу).
  ✅ ИСПРАВЛЕНО: Добавлено исключение для /matchmake, чтобы роутер не перехватывал запросы сокетов
*/
app.get(/^(?!\/auth|\/matchmake).*$/, (req, res) => {
  res.redirect("/");
});

// Запуск сервера
start();

async function start() {
  await mongConnect();

  // Регистрируем комнаты Colyseus
  gameServer.define("GameRoom", GameRoom);
  console.log("✅ Комната GameRoom зарегистрирована");

  // Запускаем HTTP-сервер, который держит на одном порту и Express, и веб-сокеты транспорта
  server.listen(port, () => {
    console.log(
      `🎮 Игровой сервер Colyseus (v0.16) успешно запущен на порту ${port}`,
    );
  });
}

async function mongConnect() {
  try {
    await mongoose.connect(DB_HOST);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return mongConnect();
  }
}
