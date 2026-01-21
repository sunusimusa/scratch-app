import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import User from "./models/User.js";

import helmet from "helmet";
import compression from "compression";

dotenv.config();

const app = express();

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(compression());

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

/* ================= STATIC ================= */
app.use(express.static(path.join(__dirname, "public")));

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

/* ================= HELPERS ================= */
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function calcLevel(points) {
  return Math.min(1000, Math.floor(points / 100) + 1);
}

function canClaimBonus(user) {
  if (!user.lastBonusTime) return true;
  return Date.now() - user.lastBonusTime >= 30 * 60 * 1000;
}

function generateReferralCode() {
  return "REF" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/* ================= ACHIEVEMENTS ================= */
const ACHIEVEMENTS = [
  {
    key: "FIRST_SCRATCH",
    title: "First Scratch",
    desc: "Complete your first scratch",
    reward: "+3 Energy"
  },
  {
    key: "BIG_WIN",
    title: "Big Win",
    desc: "Win 20 points in one scratch",
    reward: "+5 Energy"
  },
  {
    key: "LUCK_MASTER",
    title: "Luck Master",
    desc: "Fill Luck Meter to 100%",
    reward: "+20 Points"
  },
  {
    key: "STREAK_7",
    title: "7 Days Streak",
    desc: "Play 7 days in a row",
    reward: "+50 Energy ⭐"
  }
];

/* =====================================================
   API: USER INIT
===================================================== */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = null;

    if (sid) {
      user = await User.findOne({ sessionId: sid });
    }

    if (!user) {
      sid = crypto.randomUUID();

      user = await User.create({
        userId: "USER_" + Date.now(),
        sessionId: sid,
        energy: 0,
        points: 0,
        level: 1,
        luck: 0,
        referralCode: generateReferralCode(),
        achievements: []
      });

      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      });
    }
    
 res.json({
    success: true,
    userId: user.userId,
    energy: user.energy,
    points: user.points,
    level: user.level,
    luck: user.luck,
    referralCode: user.referralCode,   // ✅ MUHIMMI
    referralsCount: user.referralsCount || 0,
    dailyClaimed: user.dailyEnergyDate === todayString()
  });  

  } catch (err) {
    console.error("USER INIT ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: DAILY ENERGY
===================================================== */
app.post("/api/daily-energy", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const today = todayString();
    if (user.dailyEnergyDate === today) {
      return res.json({ error: "DAILY_ALREADY_CLAIMED" });
    }

    user.energy += 5;
    user.dailyEnergyDate = today;
    await user.save();

    res.json({ success: true, energy: user.energy });

  } catch (err) {
    console.error("DAILY ENERGY ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: WATCH AD
===================================================== */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const today = todayString();

    if (user.lastAdsDate !== today) {
      user.adsWatchedToday = 0;
      user.lastAdsDate = today;
    }

    if (user.adsWatchedToday >= 20) {
      return res.json({ error: "ADS_LIMIT_REACHED" });
    }

    user.energy += 2;
    user.adsWatchedToday += 1;
    await user.save();

    res.json({ success: true, energy: user.energy });

  } catch (err) {
    console.error("ADS ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: SCRATCH (LUCK + ACHIEVEMENTS)
===================================================== */
app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    /* ===== CONFIG ===== */
    const SCRATCH_COST = 3; // 🔥 canza zuwa 5 idan kana so

    if (user.energy < SCRATCH_COST) {
      return res.json({
        error: "NO_ENERGY",
        needAds: true,
        energy: user.energy
      });
    }

    /* ===== SAFE INIT ===== */
    if (typeof user.luck !== "number") user.luck = 0;
    if (!Array.isArray(user.achievements)) user.achievements = [];

    const MAX_LUCK = 100;
    let reward = { points: 0, energy: 0 };
    let unlocked = [];

    /* ===== PAY ENERGY COST ===== */
    user.energy -= SCRATCH_COST;

    const guaranteedWin = user.luck >= MAX_LUCK;

    if (guaranteedWin) {
      reward.points = 20;
      user.points += 20;
      user.luck = 0;
    } else {
      const roll = Math.random() * 100;

      if (roll < 40) {
        reward.points = 5;
        user.points += 5;
        user.luck = 0;
      } else if (roll < 65) {
        reward.points = 10;
        user.points += 10;
        user.luck = 0;
      } else if (roll < 80) {
        reward.energy = 2;
        user.energy += 2;
        user.luck = 0;
      } else {
        user.luck += 25;
      }
    }

    /* ===== ACHIEVEMENTS ===== */
    if (unlockAchievement(user, "FIRST_SCRATCH")) {
      user.energy += 3;
      unlocked.push({ key: "FIRST_SCRATCH", reward: "+3 Energy" });
    }

    if (user.luck >= MAX_LUCK) {
      if (unlockAchievement(user, "LUCK_MASTER")) {
        user.points += 20;
        unlocked.push({ key: "LUCK_MASTER", reward: "+20 Points" });
      }
    }

    if (reward.points >= 20) {
      if (unlockAchievement(user, "BIG_WIN")) {
        user.energy += 5;
        unlocked.push({ key: "BIG_WIN", reward: "+5 Energy" });
      }
    }

    user.luck = Math.max(0, Math.min(MAX_LUCK, user.luck));
    user.level = calcLevel(user.points);

    await user.save();

    res.json({
      success: true,
      reward,
      balance: user.points,
      energy: user.energy,
      level: user.level,
      luck: user.luck,
      achievementsUnlocked: unlocked,
      referralCode: user.referralCode,
      referralsCount: user.referralsCount
    });

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: 30 MIN BONUS ENERGY
===================================================== */
app.post("/api/bonus/check", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ bonusAvailable: false });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ bonusAvailable: false });

    const NOW = Date.now();
    const BONUS_INTERVAL = 30 * 60 * 1000; // 30 minutes

    // 🛡️ idan bai taba samun bonus ba
    if (!user.lastBonusAt) {
      user.lastBonusAt = 0;
    }

    if (NOW - user.lastBonusAt < BONUS_INTERVAL) {
      return res.json({
        bonusAvailable: false,
        nextIn: BONUS_INTERVAL - (NOW - user.lastBonusAt)
      });
    }

    // 🎲 RANDOM ENERGY 1–5
    const reward = Math.floor(Math.random() * 5) + 1;

    user.energy += reward;
    user.lastBonusAt = NOW;
    await user.save();

    res.json({
      bonusAvailable: true,
      reward,
      energy: user.energy
    });

  } catch (err) {
    console.error("BONUS ERROR:", err);
    res.status(500).json({ bonusAvailable: false });
  }
});

app.post("/api/referral/claim", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const { code } = req.body;

    if (!sid || !code) {
      return res.json({ error: "INVALID_REQUEST" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.json({ error: "NO_USER" });
    }

    /* ❌ already referred */
    if (user.referredBy) {
      return res.json({ error: "ALREADY_REFERRED" });
    }

    /* ❌ self referral */
    if (user.referralCode === code) {
      return res.json({ error: "SELF_REFERRAL" });
    }

    const inviter = await User.findOne({ referralCode: code });
    if (!inviter) {
      return res.json({ error: "INVALID_CODE" });
    }

    /* ===== SAFE INIT ===== */
    if (typeof inviter.referralsCount !== "number") {
      inviter.referralsCount = 0;
    }

    /* ===== APPLY REWARDS ===== */
    const INVITER_ENERGY = 25;
    const INVITER_POINTS = 125;
    const USER_ENERGY = 10; // zaka iya canzawa

    inviter.energy += INVITER_ENERGY;
    inviter.points += INVITER_POINTS;
    inviter.referralsCount += 1;

    user.referredBy = inviter.referralCode;
    user.energy += USER_ENERGY;

    await inviter.save();
    await user.save();

    res.json({
      success: true,

      // 🔥 return FULL sync
      userEnergy: user.energy,
      userPoints: user.points,

      inviterReward: {
        energy: INVITER_ENERGY,
        points: INVITER_POINTS
      },

      referralsCount: inviter.referralsCount
    });

  } catch (err) {
    console.error("REFERRAL ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/streak/check", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let reward = null;

    // first time
    if (!user.lastStreakAt) {
      user.streak = 1;
      reward = { energy: 5, message: "Day 1 streak! +5 Energy" };
      user.energy += 5;
    } else {
      const diff = now - user.lastStreakAt;

      if (diff >= ONE_DAY && diff < ONE_DAY * 2) {
        // continued streak
        user.streak += 1;

        if (user.streak === 3) {
          user.energy += 15;
          reward = { energy: 15, message: "🔥 3-day streak! +15 Energy" };
        } else if (user.streak === 7) {
          user.energy += 50;
          reward = { energy: 50, message: "🏆 7-day streak! +50 Energy" };
        } else {
          user.energy += 5;
          reward = { energy: 5, message: `Day ${user.streak} streak! +5 Energy` };
        }
      } else if (diff >= ONE_DAY * 2) {
        // missed a day → reset
        user.streak = 1;
        user.energy += 5;
        reward = { energy: 5, message: "Streak restarted! +5 Energy" };
      } else {
        // already claimed today
        return res.json({ success: false });
      }
    }

    user.lastStreakAt = now;
    await user.save();

    res.json({
      success: true,
      streak: user.streak,
      reward,
      energy: user.energy
    });

  } catch (err) {
    console.error("STREAK ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.get("/api/achievements", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.status(401).json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.status(404).json({ error: "NO_USER" });

    if (!Array.isArray(user.achievements)) {
      user.achievements = [];
    }

    const list = ACHIEVEMENTS.map(a => ({
      key: a.key,
      title: a.title,
      desc: a.desc,
      reward: a.reward,
      unlocked: user.achievements.includes(a.key)
    }));

    res.json({
      success: true,
      achievements: list
    });

  } catch (err) {
    console.error("ACHIEVEMENTS API ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= ACHIEVEMENT HELPER ================= */
function unlockAchievement(user, key) {
  if (!user.achievements.includes(key)) {
    user.achievements.push(key);
    return true;
  }
  return false;
}

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Scratch Game server running on port", PORT);
});
