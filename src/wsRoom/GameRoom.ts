import { Room, Client } from "colyseus";

import { GameRoomState, Player } from "./GameRoomState.ts";

export class GameRoom extends Room {
  // 1. Явно указываем тип для state
  state!: GameRoomState;

  maxClients = 200;

  onCreate(options: any) {
    // Инициализация состояния
    this.state = new GameRoomState();
    // ОТКЛЮЧАЕМ автоматическое удаление комнаты при 0 игроков:
    this.autoDispose = false;
    console.log("🚀 Игровая комната Colyseus создана!");

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
  onJoin(client: Client, options: any) {
    console.log(`👤 Игрок зашел в комнату. ID: ${client.sessionId}`);

    const newPlayer = new Player();
    newPlayer.id = client.sessionId;

    // Присваиваем стартовую локацию
    // newPlayer.currentLocation = "001";

    // newPlayer.x = 0;
    // newPlayer.y = 0;
    // newPlayer.z = 0;

    // Сохраняем игрока в стейт. Клиент автоматически получит этот слепок данных!
    this.state.players.set(client.sessionId, newPlayer);

    // Явно отправляем клиенту приветственное сообщение (подтверждение успешного входа)
    client.send("welcome_package", {
      status: "success",
      message: "Добро пожаловать в игровой мир!",
      yourSessionId: client.sessionId,
    });
  }

  onLeave(client: Client, consented?: boolean) {
    console.log(
      `❌ Игрок покинул комнату. ID: ${client.sessionId}`,
      "Ушел намеренно (consented):",
      consented,
    );
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("🧹 Комната пуста и была удалена из памяти.");
  }
}
