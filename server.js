// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

dotenv.config();

const app = express();

/* ===== PATH FIX ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

/* ===== STATIC FRONTEND ===== */
app.use(express.static(path.join(__dirname, "public")));

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===== DATABASE ===== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* ===== HELPERS ===== */
function todayString() {
  return new Date().toISOString().slice(0, 10);
}

/* =====================================================
   API: USER INIT (AUTO CREATE)
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
        sessionId: sid
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
      level: user.level,
      points: user.points,
      energy: user.energy
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
      return res.json({ error: "ALREADY_CLAIMED" });
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
   API: WATCH AD → ENERGY ONLY
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

    const ENERGY_REWARD = 10;

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

app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    if (!sid) {
      return res.json({ error: "NO_SESSION" });
    }

    const user = await User.findOne({ sessionId: sid });
    if (!user) {
      return res.json({ error: "USER_NOT_FOUND" });
    }

    // ⛔ energy check (server side)
    if (user.energy <= 0) {
      return res.json({ error: "NO_ENERGY" });
    }

    // 🔋 rage energy 1 (SERVER ONLY)
    user.energy -= 1;

    // 🎁 reward (kanana – kamar yadda kace)
    const rewards = [0, 5, 10, 20];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];

    user.balance += reward;

    // ⬆️ level (1 → 1000)
    user.level = Math.min(1000, Math.floor(user.balance / 100) + 1);

    await user.save();

    return res.json({
      success: true,
      reward,
      energy: user.energy,
      balance: user.balance,
      level: user.level
    });

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
    return res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);
