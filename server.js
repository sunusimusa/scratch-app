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
    const SCRATCH_COST = 3;
    const MAX_LUCK = 100;

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
    if (typeof user.gold !== "number") user.gold = 0;
    if (typeof user.diamond !== "number") user.diamond = 0;

    let reward = { points: 0, energy: 0, gold: 0, diamond: 0 };
    let unlocked = [];

    /* ===== PAY ENERGY ===== */
    user.energy -= SCRATCH_COST;

    /* ===== LUCK SYSTEM ===== */
    const guaranteedWin = user.luck >= MAX_LUCK;
    const roll = Math.random() * 100;

    if (guaranteedWin) {
      reward.points = 20;
      user.points += 20;
      user.luck = 0;

    } else if (roll < 40) {
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

    } else if (roll < 83) {
      reward.gold = 1;
      user.gold += 1;
      user.luck = 0;

    } else if (roll < 85) {
      reward.diamond = 1;
      user.diamond += 1;
      user.luck = 0;

    } else {
      // ❌ NO REWARD
      user.luck += 25;
    }

    /* ===== ACHIEVEMENTS ===== */

    if (unlockAchievement(user, "FIRST_SCRATCH")) {
      user.energy += 3;
      unlocked.push({ key: "FIRST_SCRATCH", reward: "+3 Energy" });
    }

    if (reward.points >= 20) {
      if (unlockAchievement(user, "BIG_WIN")) {
        user.energy += 5;
        user.gold += 2;
        unlocked.push({
          key: "BIG_WIN",
          reward: "+5 Energy, +2 Gold"
        });
      }
    }

    if (user.luck >= MAX_LUCK) {
      if (unlockAchievement(user, "LUCK_MASTER")) {
        user.points += 20;
        unlocked.push({
          key: "LUCK_MASTER",
          reward: "+20 Points"
        });
      }
    }

    /* ===== FINALIZE ===== */
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
      gold: user.gold,
      diamond: user.diamond,
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
      success: true,
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
    if (typeof inviter.referralsCount !== "number") inviter.referralsCount = 0;
    if (typeof inviter.energy !== "number") inviter.energy = 0;
    if (typeof inviter.points !== "number") inviter.points = 0;
    if (typeof inviter.gold !== "number") inviter.gold = 0;
    if (typeof inviter.diamond !== "number") inviter.diamond = 0;

    if (typeof user.energy !== "number") user.energy = 0;

    /* ===== APPLY BASE REWARDS ===== */
    const INVITER_ENERGY = 25;
    const INVITER_POINTS = 125;
    const USER_ENERGY = 10;

    inviter.energy += INVITER_ENERGY;
    inviter.points += INVITER_POINTS;

    inviter.referralsCount += 1; // 🔥 increment FIRST

    /* ===== MILESTONE REWARDS (ONCE) ===== */
    let milestoneReward = null;

    if (inviter.referralsCount === 5) {
      inviter.gold += 5;
      milestoneReward = { gold: 5, message: "🥇 5 referrals! +5 Gold" };
    }

    if (inviter.referralsCount === 20) {
      inviter.diamond += 1;
      milestoneReward = { diamond: 1, message: "💎 20 referrals! +1 Diamond" };
    }

    /* ===== UPDATE USER ===== */
    user.referredBy = inviter.referralCode;
    user.energy += USER_ENERGY;

    await inviter.save();
    await user.save();

    res.json({
      success: true,

      // 🔄 FULL SYNC
      userEnergy: user.energy,

      inviter: {
        energy: inviter.energy,
        points: inviter.points,
        gold: inviter.gold,
        diamond: inviter.diamond,
        referralsCount: inviter.referralsCount
      },

      baseReward: {
        energy: INVITER_ENERGY,
        points: INVITER_POINTS
      },

      milestoneReward
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

    // ===== SAFE INIT =====
    if (typeof user.streak !== "number") user.streak = 0;
    if (typeof user.gold !== "number") user.gold = 0;

    let reward = null;

    // ===== FIRST TIME =====
    if (!user.lastStreakAt) {
      user.streak = 1;
      user.energy += 5;
      reward = {
        energy: 5,
        message: "🔥 Day 1 streak! +5 Energy"
      };
    } else {
      const diff = now - user.lastStreakAt;

      // ===== CONTINUED STREAK =====
      if (diff >= ONE_DAY && diff < ONE_DAY * 2) {
        user.streak += 1;

        // 🎉 7 DAYS – BIG REWARD
        if (user.streak === 7) {
          user.energy += 50;
          user.gold += 3;
          reward = {
            energy: 50,
            gold: 3,
            message: "🏆 7-day streak! +50 Energy +3 Gold"
          };

          // 🔁 reset streak after reward
          user.streak = 0;

        } else if (user.streak === 3) {
          user.energy += 15;
          reward = {
            energy: 15,
            message: "🔥 3-day streak! +15 Energy"
          };

        } else {
          user.energy += 5;
          reward = {
            energy: 5,
            message: `Day ${user.streak} streak! +5 Energy`
          };
        }

      }
      // ===== MISSED A DAY =====
      else if (diff >= ONE_DAY * 2) {
        user.streak = 1;
        user.energy += 5;
        reward = {
          energy: 5,
          message: "⏳ Streak restarted! +5 Energy"
        };
      }
      // ===== ALREADY CLAIMED TODAY =====
      else {
        return res.json({ success: false });
      }
    }

    user.lastStreakAt = now;
    await user.save();

    res.json({
      success: true,
      streak: user.streak,
      reward,
      energy: user.energy,
      gold: user.gold
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

/* =====================================================
   API: SHOP BUY
===================================================== */
app.post("/api/shop/buy", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const { item } = req.body;

    if (!sid || !item) return res.json({ error: "INVALID_REQUEST" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    let rewardEnergy = 0;

    if (item === "ENERGY_POINTS") {
      if (user.points < 150) return res.json({ error: "NOT_ENOUGH_POINTS" });
      user.points -= 150;
      rewardEnergy = 50;
    }

    else if (item === "ENERGY_GOLD") {
      if (user.gold < 75) return res.json({ error: "NOT_ENOUGH_GOLD" });
      user.gold -= 75;
      rewardEnergy = 50;
    }

    else if (item === "ENERGY_DIAMOND") {
      if (user.diamond < 1000) return res.json({ error: "NOT_ENOUGH_DIAMOND" });
      user.diamond -= 1000;
      rewardEnergy = 100;
    }

    else {
      return res.json({ error: "INVALID_ITEM" });
    }

    user.energy += rewardEnergy;
    await user.save();

    res.json({
      success: true,
      energy: user.energy,
      points: user.points,
      gold: user.gold,
      diamond: user.diamond,
      rewardEnergy
    });

  } catch (err) {
    console.error("SHOP ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

app.post("/api/mystery/open", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const NOW = Date.now();
    const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

    if (user.lastMysteryAt && NOW - user.lastMysteryAt < COOLDOWN) {
      return res.json({
        error: "COOLDOWN",
        nextIn: COOLDOWN - (NOW - user.lastMysteryAt)
      });
    }

    // 🎲 RANDOM REWARD
    const roll = Math.random() * 100;
    let reward = { energy: 0, points: 0, gold: 0, diamond: 0 };

    if (roll < 60) {
      reward.energy = 10;
      user.energy += 10;
    } else if (roll < 85) {
      reward.points = 20;
      user.points += 20;
    } else if (roll < 97) {
      reward.gold = 1;
      user.gold = (user.gold || 0) + 1;
    } else {
      reward.diamond = 1;
      user.diamond = (user.diamond || 0) + 1;
    }

    user.lastMysteryAt = NOW;
    await user.save();

    res.json({
      success: true,
      reward,
      energy: user.energy,
      points: user.points,
      gold: user.gold,
      diamond: user.diamond
    });

  } catch (err) {
    console.error("MYSTERY ERROR:", err);
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
