import http from "http";
import express from "express";
import cors from "cors";
import colyseus from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { routerAuth } from "./routers/auth_routes.ts";
import path from "path";
import fs from "fs";
import { MyRoom } from "./wsRoom/MyRoom.ts";

const __dirname = import.meta.dirname;

const port = Number(process.env.PORT || 8080);
const app = express();

app.use(express.json());

// Настройка CORS
const getAllowedOrigins = (): (string | RegExp)[] => {
  if (process.env.NODE_ENV === "production") {
    const origins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : [];

    return [...origins, process.env.FRONTEND_URL, /\.vercel\.app$/].filter(
      (origin): origin is string | RegExp => Boolean(origin),
    ); // Защитник типа (Type Guard)
  }

  return [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
};

const corsOptions: cors.CorsOptions = {
  // Добавляем явную типизацию для опций
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  exposedHeaders: ["Authorization"],
};

// Применяем CORS middleware к Express до инициализации Colyseus маршрутов
app.use(cors(corsOptions));
// Обработка корневого маршрута - отдаем информативную страницу
app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  let html = fs.readFileSync(indexPath, "utf8");

  // Подставляем актуальный URL фронтенда
  const frontendUrl =
    process.env.FRONTEND_URL || "https://lost-space.vercel.app/";
  html = html.replace("window.FRONTEND_URL", `"${frontendUrl}"`);

  res.send(html);
});

// Обработка всех остальных маршрутов
app.all("/{*splat}", (req, res) => {
  res.redirect("/");
});
// Debug middleware
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/auth", routerAuth);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "public")));

// Создаем стандартный сервер Node.js на базе Express
const server = http.createServer(app);

// Инициализируем сервер Colyseus, передавая транспорт напрямую в конструктор

const gameServer = new colyseus.Server({
  transport: new WebSocketTransport({
    server: server, // привязываем наш http.Server
  }),
});

// Запуск сервера
server.listen(port, () => {
  console.log(
    `🎮 Игровой сервер Colyseus (v0.17+) успешно запущен на порту ${port}`,
  );
});
