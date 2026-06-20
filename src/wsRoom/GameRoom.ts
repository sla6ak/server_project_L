import { Room, Client } from "colyseus";
import HeroModel from "../models/hero.ts"; // Импортируем модель героя
import mongoose from "mongoose"; // Импортируем mongoose для работы с ObjectId
import { GameRoomState, Player } from "./GameRoomState.ts";

export class GameRoom extends Room {
  // 1. Явно указываем тип для state
  state!: GameRoomState;

  maxClients = 200;

  async onCreate(options: any) {
    // Инициализация состояния
    this.state = new GameRoomState();
    // ОТКЛЮЧАЕМ автоматическое удаление комнаты при 0 игроков:
    this.autoDispose = false;
    console.log("🚀 Игровая комната Colyseus создана!");

    // Опции могут содержать userId для инициализации комнаты
    const userId = options.userId;

    if (userId) {
      // Получаем данные героя из MongoDB
      const hero = await HeroModel.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (hero) {
        // Создаем нового игрока для State Schema
        const player = new Player();
        player.id = hero.userId.toString(); // Используем ID пользователя как ID игрока
        player.x = (hero.position?.x as number) || 0;
        player.y = (hero.position?.y as number) || 0;
        player.z = (hero.position?.z as number) || 0;

        // Добавляем игрока в состояние комнаты
        this.state.players.set(player.id, player);
      } else {
        console.error(`Герой для пользователя ${userId} не найден.`);
      }
    }

    this.onMessage("move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.z = data.z;
      }
    });
  }

  // На сервере (GameRoom.ts)
  async onJoin(client: Client, options: any) {
    console.log(`👤 Игрок зашел в комнату. ID: ${client.sessionId}`);

    const newPlayer = new Player();
    newPlayer.id = client.sessionId;

    // Сохраняем игрока в стейт. Клиент автоматически получит этот слепок данных!
    this.state.players.set(client.sessionId, newPlayer);

    // Явно отправляем клиенту приветственное сообщение (подтверждение успешного входа)
    client.send("welcome_package", {
      status: "success",
      message: "Добро пожаловать в игровой мир!",
      yourSessionId: client.sessionId,
    });
  }

  async onLeave(client: Client, consented?: boolean) {
    console.log(
      `❌ Игрок покинул комнату. ID: ${client.sessionId}`,
      "Ушел намеренно (consented):",
      consented,
    );
    this.state.players.delete(client.sessionId);
  }

  async onDispose() {
    console.log("🧹 Комната пуста и была удалена из памяти.");
  }
}
