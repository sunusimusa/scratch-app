import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= BASIC ================= */
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.static(path.join(__dirname, "public")));

/* ================= DB ================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ Mongo error", err));

/* ================= MODEL ================= */
const UserSchema = new mongoose.Schema({
  sessionId: String,
  energy: { type: Number, default: 5 },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  luck: { type: Number, default: 0 },
  referralCode: String,
  lastDaily: String
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

/* ================= HELPERS ================= */
const today = () => new Date().toISOString().slice(0, 10);
const calcLevel = p => Math.floor(p / 100) + 1;

/* ================= USER INIT ================= */
app.post("/api/user", async (req, res) => {
  try {
    let sid = req.cookies.sid;
    let user = sid ? await User.findOne({ sessionId: sid }) : null;

    if (!user) {
      sid = crypto.randomUUID();
      user = await User.create({
        sessionId: sid,
        referralCode: "REF" + Math.random().toString(36).slice(2, 8).toUpperCase()
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
      level: user.level,
      luck: user.luck,
      referralCode: user.referralCode
    });

  } catch {
    res.status(500).json({ success: false });
  }
});

/* ================= DAILY ENERGY ================= */
app.post("/api/daily-energy", async (req, res) => {
  const user = await User.findOne({ sessionId: req.cookies.sid });
  if (!user) return res.json({ error: true });

  if (user.lastDaily === today())
    return res.json({ error: true });

  user.energy += 5;
  user.lastDaily = today();
  await user.save();

  res.json({ energy: user.energy });
});

/* ================= WATCH AD ================= */
app.post("/api/ads/watch", async (req, res) => {
  const user = await User.findOne({ sessionId: req.cookies.sid });
  if (!user) return res.json({ error: true });

  user.energy += 2;
  await user.save();

  res.json({ energy: user.energy });
});

/* ================= SCRATCH ================= */
app.post("/api/scratch", async (req, res) => {
  const user = await User.findOne({ sessionId: req.cookies.sid });
  if (!user || user.energy < 3)
    return res.json({ error: "NO_ENERGY" });

  user.energy -= 3;

  const roll = Math.random();
  if (roll < 0.6) user.points += 5;
  else user.energy += 2;

  user.level = calcLevel(user.points);
  await user.save();

  res.json({
    balance: user.points,
    energy: user.energy,
    level: user.level,
    luck: user.luck
  });
});

/* ================= ROOT ================= */
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running on", PORT));
