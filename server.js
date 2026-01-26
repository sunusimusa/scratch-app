import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import helmet from "helmet";
import compression from "compression";

import User from "./models/User.js";

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
app.use(cors({ origin: true, credentials: true }));

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
  { key: "FIRST_SCRATCH", title: "First Scratch", desc: "Complete your first scratch", reward: "+3 Energy" },
  { key: "BIG_WIN", title: "Big Win", desc: "Win 20 points in one scratch", reward: "+5 Energy" },
  { key: "LUCK_MASTER", title: "Luck Master", desc: "Fill Luck Meter to 100%", reward: "+20 Points" },
  { key: "STREAK_7", title: "7 Days Streak", desc: "Play 7 days in a row", reward: "+50 Energy ⭐" }
];

/* ================= USER INIT ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = sid ? await User.findOne({ sessionId: sid }) : null;

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
      referralCode: user.referralCode,
      referralsCount: user.referralsCount || 0,
      dailyClaimed: user.dailyEnergyDate === todayString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "SERVER_ERROR" });
  }
});
