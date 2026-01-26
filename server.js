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

/* ===== PATH FIX ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===== MIDDLEWARE ===== */
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

/* ===== STATIC ===== */
app.use(express.static(path.join(__dirname, "public")));

/* ===== DB ===== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

/* ===== HELPERS ===== */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/* =================================================
   USER INIT
================================================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = sid && await User.findOne({ sessionId: sid });

    if (!user) {
      sid = crypto.randomUUID();
      user = await User.create({
        sessionId: sid,
        energy: 5,
        points: 0,
        luck: 0
      });

      res.cookie("sid", sid, {
        httpOnly: true,
        sameSite: "lax",
        path: "/"
      });
    }

    res.json({
      success: true,
      energy: user.energy,
      points: user.points,
      luck: user.luck
    });
  } catch {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =================================================
   SCRATCH
================================================= */
app.post("/api/scratch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    if (user.energy < 3)
      return res.json({ error: "NO_ENERGY" });

    user.energy -= 3;

    const roll = Math.random() * 100;
    let reward = 0;

    if (roll < 50) reward = 5;
    else if (roll < 80) reward = 10;
    else reward = 20;

    user.points += reward;
    await user.save();

    res.json({
      success: true,
      reward,
      energy: user.energy,
      points: user.points
    });
  } catch {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =================================================
   WATCH AD
================================================= */
app.post("/api/ads/watch", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    const todayStr = today();
    if (user.adsDate !== todayStr) {
      user.adsDate = todayStr;
      user.adsCount = 0;
    }

    if (user.adsCount >= 20)
      return res.json({ error: "LIMIT" });

    user.adsCount++;
    user.energy += 2;
    await user.save();

    res.json({ success: true, energy: user.energy });
  } catch {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* =================================================
   DAILY SPIN (FAKE – SERVER SAFE)
================================================= */
app.post("/api/spin", async (req, res) => {
  try {
    const sid = req.cookies.sid;
    const user = await User.findOne({ sessionId: sid });
    if (!user) return res.json({ error: "NO_USER" });

    if (user.lastSpin === today())
      return res.json({ error: "ALREADY_SPUN" });

    const reward = Math.random() < 0.5 ? 5 : 10;
    user.energy += reward;
    user.lastSpin = today();
    await user.save();

    res.json({ success: true, reward, energy: user.energy });
  } catch {
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});

/* ===== ROOT ===== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () =>
  console.log("🚀 Server running on 3000")
);
