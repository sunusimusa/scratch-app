// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* ===== CORE ===== */
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    sessionId: {
      type: String,
      unique: true,
      sparse: true
    },

    /* ===== GAME PROGRESS ===== */
    level: {
      type: Number,
      default: 1
    },

    points: {
      type: Number,
      default: 0
    },

    energy: {
      type: Number,
      default: 0
    },

    /* ===== DAILY / ADS ===== */
    dailyEnergyDate: {
      type: String,
      default: ""
    },

    adsWatchedToday: {
      type: Number,
      default: 0
    },

    lastAdsDate: {
      type: String,
      default: ""
    },

    /* ===== META ===== */
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { versionKey: false }
);

export default mongoose.model("User", UserSchema);
