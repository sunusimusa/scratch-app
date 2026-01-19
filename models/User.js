import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: String,
  sessionId: String,

  energy: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  level:  { type: Number, default: 1 },

  // 🆕 BONUS SYSTEM
  lastBonusAt: { type: Number, default: 0 },

  // existing
  dailyEnergyDate: { type: String, default: "" },
  adsWatchedToday: { type: Number, default: 0 },
  lastAdsDate: { type: String, default: "" },

  // 🆕 LUCK + ACHIEVEMENTS
  luck: { type: Number, default: 0 },
  achievements: { type: [String], default: [] }

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
