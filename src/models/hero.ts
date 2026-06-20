import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
    unique: true, // 1 герой на пользователя
  },
  inBattle: {
    battleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battle",
      required: false,
      index: true,
    },
    opponent: {
      nickName: { type: String, default: "" },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    startedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: false },
  },
  nickName: {
    type: String,
    required: true,
    default: "",
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 100 },
    z: { type: Number, default: 0 },
  },
  rotation: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
    w: { type: Number, default: 0 },
  },
  planet: {
    type: String,
    default: "001",
  },
  oxygen: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  crystals: {
    type: Number,
    default: 0,
  },
  energy: {
    type: Number,
    default: 0,
  },
  bonuses: {
    type: [String],
    default: [""],
  },
  disBonuses: {
    type: [String],
    default: [""],
  },
  quests: {
    type: [String],
    default: [""],
  },
  items: {
    type: [String],
    default: [""],
  },
  technologies: {
    type: [String],
    default: [""],
  },
  robots: {
    type: [
      {
        name: { type: String, default: "robot1" },
        health: { type: Number, default: 5 },
        defense: { type: Number, default: 4 },
        damage: { type: Number, default: 3 },
        status: {
          type: String,
          enum: ["active", "ofset", "destroyed"],
          default: "active",
        },
        damagePercent: { type: Number, default: 0 },
        healthPercent: { type: Number, default: 0 },
        defensePercent: { type: Number, default: 0 },
        repairEndTime: { type: Date, default: null },
        technologies: {
          type: Object,
          default: {
            damage: { type: Number, default: 0 },
            health: { type: Number, default: 0 },
            defense: { type: Number, default: 0 },
          },
          required: true,
        },
      },
    ],
    default: [
      {
        isActive: true,
        name: "robot1",
        health: 5,
        defense: 4,
        damage: 3,
        status: "active",
        damagePercent: 100,
        healthPercent: 100,
        defensePercent: 100,
        repairEndTime: null,
        technologies: { damage: 0, health: 0, defense: 0 },
      },
      {
        isActive: true,
        name: "robot1",
        health: 5,
        defense: 4,
        damage: 3,
        status: "active",
        damagePercent: 100,
        healthPercent: 100,
        defensePercent: 100,
        repairEndTime: null,
        technologies: [],
      },
      {
        isActive: true,
        name: "robot1",
        health: 5,
        defense: 4,
        damage: 3,
        status: "active",
        damagePercent: 0,
        healthPercent: 0,
        defensePercent: 0,
        repairEndTime: null,
        technologies: [],
      },
    ],
  },
  specialization: {
    type: String,
    default: "",
  },
  online: {
    type: Boolean,
    default: false,
    index: true,
  },
  statistics: {
    battles: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const HeroModel = mongoose.model("Hero", heroSchema);
export default HeroModel;
