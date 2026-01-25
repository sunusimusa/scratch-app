import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: String,
  sessionId: String,

  // 🔐 LOGIN
  email: { type: String, unique: true },
  password: String,

  // 🎮 GAME DATA
  energy: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  level:  { type: Number, default: 1 },

  streak: { type: Number, default: 0 },
  lastStreakAt: { type: Number, default: 0 },

  luck: { type: Number, default: 0 },

  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 },

  achievements: { type: [String], default: [] },

  gold: { type: Number, default: 0 },
  diamond: { type: Number, default: 0 },

  dailyEnergyDate: String,
  lastAdsDate: String,
  adsWatchedToday: { type: Number, default: 0 }

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
