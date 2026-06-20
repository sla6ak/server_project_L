import { Schema, MapSchema, type } from "@colyseus/schema";

// 1. Описываем структуру данных одного игрока
export class Player extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
}

// 2. Описываем состояние комнаты
export class GameRoomState extends Schema {
  // Явно указываем тип поля и инициализируем его
  @type({ map: Player })
  players: MapSchema<Player> = new MapSchema<Player>();
}
