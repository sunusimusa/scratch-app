// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    sessionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

    /* ===== GAME ===== */
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

    luck: {
  type: Number,
  default: 0
},

achievements: {
  type: [String],
  default: []
}

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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export default mongoose.model("User", UserSchema);
