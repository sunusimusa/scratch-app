import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import User from "./models/User.js";

dotenv.config();

const app = express();

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

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

/* =====================================================
   API: USER INIT (SOURCE OF TRUTH)
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
        level: 1
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
      dailyClaimed: user.dailyEnergyDate === todayString()
    });

  } catch (err) {
    console.error("USER INIT ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: DAILY FREE ENERGY (5 / DAY)
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

    const DAILY_ENERGY = 5;

    user.energy += DAILY_ENERGY;
    user.dailyEnergyDate = today;

    await user.save();

    res.json({
      success: true,
      added: DAILY_ENERGY,
      energy: user.energy
    });

  } catch (err) {
    console.error("DAILY ENERGY ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: WATCH AD → ENERGY
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

    const MAX_ADS = 20;
    if (user.adsWatchedToday >= MAX_ADS) {
      return res.json({ error: "ADS_LIMIT_REACHED" });
    }

    const ENERGY_REWARD = 2;

    user.energy += ENERGY_REWARD;
    user.adsWatchedToday += 1;

    await user.save();

    res.json({
      success: true,
      added: ENERGY_REWARD,
      energy: user.energy,
      adsWatchedToday: user.adsWatchedToday
    });

  } catch (err) {
    console.error("ADS ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =====================================================
   API: SCRATCH (ENERGY → POINTS)
===================================================== */
app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) return res.json({ error: "NO_SESSION" });

    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    if (user.energy <= 0) {
      return res.json({ error: "NO_ENERGY" });
    }

    // ⚡ rage energy 1
    user.energy -= 1;

    // 🎁 REWARD LOGIC (BA ZERO KULLUM BA)
    const roll = Math.random() * 100;

    let reward = { points: 0, energy: 0 };

    if (roll < 50) {
      reward.points = 5;        // 50%
      user.points += 5;
    } else if (roll < 80) {
      reward.points = 10;       // 30%
      user.points += 10;
    } else if (roll < 95) {
      reward.energy = 2;        // 15%
      user.energy += 2;
    } else {
      reward.points = 25;       // 5% jackpot
      user.points += 25;
    }

    // 🔼 level daga points
    user.level = Math.min(1000, Math.floor(user.points / 100) + 1);

    await user.save();

    res.json({
      success: true,
      reward,                 // 🔥 MUHIMMI
      balance: user.points,
      energy: user.energy,
      level: user.level
    });

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Scratch Game server running on port", PORT);
});
