import { Room, Client } from "colyseus";
import { MyRoomState, Player } from "./MyRoomState";

export class MyRoom extends Room {
  // 1. Явно указываем тип для state
  state!: MyRoomState;

  maxClients = 20;

  onCreate(options: any) {
    // Инициализация состояния
    this.state = new MyRoomState();
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

  onJoin(client: Client, options: any) {
    console.log(`👤 Игрок зашел в комнату. ID: ${client.sessionId}`);

    const newPlayer = new Player();
    newPlayer.id = client.sessionId;
    newPlayer.x = Math.random() * 5 - 2.5;
    newPlayer.y = 0;
    newPlayer.z = Math.random() * 5 - 2.5;

    this.state.players.set(client.sessionId, newPlayer);
  }

  onLeave(client: Client, code?: number) {
    console.log(
      `❌ Игрок покинул комнату. ID: ${client.sessionId}`,
      "code:",
      code,
    );
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("🧹 Комната пуста и была удалена из памяти.");
  }
}
