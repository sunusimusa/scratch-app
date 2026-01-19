import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  userId: String,
  sessionId: String,

  energy: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  level:  { type: Number, default: 1 },

  // 🍀 Luck
  luck: { type: Number, default: 0 },

  // 🎁 Referral
  referralCode: { type: String, unique: true },
  referredBy: { type: String, default: null },
  referralsCount: { type: Number, default: 0 },

  // 🏆 Achievements
  achievements: { type: [String], default: [] },

  // ⏰ Bonus / Daily
  dailyEnergyDate: String,
  lastAdsDate: String,
  adsWatchedToday: { type: Number, default: 0 },

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
