import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Состояние одного робота игрока
const RobotStateSchema = new Schema({
  robotId: { type: String, required: true }, // Уникальный ID робота (можно брать из инвентаря игрока)
  health: { type: Number, required: true }, // Текущее здоровье робота
  damage: { type: Number, required: true }, // Урон, который наносит робот
  technologies: [
    {
      damage: { type: Number, default: 0 },
      health: { type: Number, default: 0 },
      defense: { type: Number, default: 0 },
    },
  ], // Технологии, которые применяет робот (например, "shield", "boost")
  defense: { type: Number, required: true }, // Защита робота (снижает входящий урон)
});

// Состояние игрока на момент начала боя
const PlayerStateSchema = new Schema({
  playerId: { type: String, required: true }, // ID игрока (user ID из Users коллекции)
  robots: { type: [RobotStateSchema], required: true }, // Роботы, участвующие в бою (до 5 штук)
});

// Один ход боя (одна "фаза атаки")
const BattleTurnSchema = new Schema({
  turnNumber: Number, // Номер хода (по порядку)
  attackerId: String, // ID игрока, который ходил в этом раунде
  actions: [
    // Список атак в рамках этого хода
    {
      fromRobotId: String, // ID атакующего робота
      toRobotId: String, // ID цели (робота противника)
      damageDealt: Number, // Нанесённый урон после защиты
      blocked: Number, // Заблокированный урон (защита цели)
      robotDied: Boolean, // Умер ли целевой робот после удара
    },
  ],
  timestamp: { type: Date, default: Date.now }, // Время совершения хода
});

// Основная схема боя
const BattleSchema = new Schema({
  player1: PlayerStateSchema, // Первый игрок
  player2: PlayerStateSchema, // Второй игрок
  turns: [BattleTurnSchema], // История всех ходов
  winner: { type: String }, // ID победителя (если бой завершён)
  isFinished: { type: Boolean, default: false }, // Флаг окончания боя
  lastTurnTime: { type: Date, default: Date.now }, // ✅ новое поле
  createdAt: { type: Date, default: Date.now }, // Дата начала боя
});

// Экспорт модели
// module.exports = mongoose.models.Battle || mongoose.model('Battle', BattleSchema);
const BattleModel = model("Battle", BattleSchema);
export default BattleModel;
