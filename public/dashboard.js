let DASH = {
  energy: 0,
  points: 0,
  gold: 0,
  diamond: 0,
  level: 1,
  streak: 0,
  achievements: 0
};

const statusEl = document.getElementById("dashStatus");

function setStatus(msg) {
  if (statusEl) statusEl.innerText = msg;
}

/* ================= LOAD USER ================= */
async function loadDashboard() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) {
      setStatus("❌ Unable to load user");
      return;
    }

    DASH.energy = data.energy ?? 0;
    DASH.points = data.points ?? 0;
    DASH.level  = data.level  ?? 1;

    updateDashboard();
    loadAchievementsCount();

  } catch {
    setStatus("❌ Network error");
  }
}

/* ================= LOAD ACHIEVEMENTS ================= */
async function loadAchievementsCount() {
  try {
    const res = await fetch("/api/achievements", {
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    const unlocked = data.achievements.filter(a => a.unlocked);
    DASH.achievements = unlocked.length;

    updateDashboard();

  } catch {
    // silent
  }
}

/* ================= UPDATE UI ================= */
function updateDashboard() {
  document.getElementById("dEnergy").innerText       = DASH.energy;
  document.getElementById("dPoints").innerText       = DASH.points;
  document.getElementById("dGold").innerText         = DASH.gold;
  document.getElementById("dDiamond").innerText      = DASH.diamond;
  document.getElementById("dLevel").innerText        = DASH.level;
  document.getElementById("dStreak").innerText       = DASH.streak;
  document.getElementById("dAchievements").innerText = DASH.achievements;
}

/* ================= START ================= */
loadDashboard();
