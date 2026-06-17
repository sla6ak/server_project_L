import http from "http";
import express from "express";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MyRoom } from "./MyRoom";

const port = Number(process.env.PORT || 8080);
const app = express();

app.use(express.json());

// Создаем стандартный сервер Node.js на базе Express
const server = http.createServer(app);

// Инициализируем сервер Colyseus поверх нашего HTTP-сервера
const gameServer = new Server({
  transport: new WebSocketTransport({
    server, // сюда передаём http.Server
  }),
});

// Регистрируем нашу игровую комнату
gameServer.define("space_room", MyRoom);

// Запуск сервера
server.listen(port, () => {
  console.log(`🎮 Игровой сервер Colyseus успешно запущен на порту ${port}`);
});
