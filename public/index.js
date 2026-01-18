/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (FINAL CLEAN)
   SIMPLE • STABLE • ANDROID & RENDER SAFE
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initUser();
  bindUI();
});

/* ================= UI BIND ================= */
function bindUI() {
  const scratchBtn = document.getElementById("scratchBtn");
  const dailyBtn   = document.getElementById("dailyBtn");
  const adsBtn     = document.getElementById("adsBtn");

  if (scratchBtn) scratchBtn.onclick = startScratch;
  if (dailyBtn)   dailyBtn.onclick   = claimDailyEnergy;
  if (adsBtn)     adsBtn.onclick     = watchAd;
}

/* ================= USER INIT ================= */
async function initUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data || !data.success) throw new Error("NO_USER");

    USER = {
      ...data,
      balance: data.balance ?? 0,
      energy: data.energy ?? 0
    };

    USER.level = getLevel(USER.balance);

    updateUI();
    showStatus("✅ Ready");

  } catch (err) {
    INIT_TRIES++;
    console.warn("Init retry:", INIT_TRIES);

    if (INIT_TRIES < MAX_INIT_TRIES) {
      setTimeout(initUser, 1000);
    } else {
      showStatus("❌ Unable to initialize user");
    }
  }
}

/* ================= UI UPDATE ================= */
function updateUI() {
  if (!USER) return;

  const energyText = document.getElementById("energyText");
  const energyFill = document.getElementById("energyFill");
  const levelText  = document.getElementById("levelText");
  const scratchBtn = document.getElementById("scratchBtn");

  if (energyText) {
    energyText.innerText = `Energy: ${USER.energy}`;
  }

  if (energyFill) {
    energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
  }

  if (levelText) {
    levelText.innerText = `Level: ${USER.level}`;
  }

  if (scratchBtn) {
    scratchBtn.disabled = USER.energy <= 0;
    scratchBtn.innerText =
      USER.energy > 0 ? "🎟️ SCRATCH" : "⚡ Get Energy";
  }
}

/* ================= STATUS ================= */
function showStatus(text) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.innerText = text;
  el.classList.remove("hidden");
}

/* ================= DAILY FREE ENERGY ================= */
async function claimDailyEnergy() {
  showStatus("🎁 Claiming daily energy...");

  try {
    const res = await fetch("/api/daily-energy", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error === "DAILY_ALREADY_CLAIMED") {
      showStatus("⏳ Daily already claimed");
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ +5 Daily Energy");

    if (window.playSound) playSound("winSound");

  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= WATCH AD ================= */
async function watchAd() {
  showStatus("📺 Watching ad...");

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ Energy added!");

    if (window.playSound) playSound("winSound");

  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= START SCRATCH ================= */
function startScratch() {
  if (!USER || USER.energy <= 0) {
    showStatus("⚡ Get energy first");
    return;
  }

  // rage energy 1 (UI feedback kawai)
  USER.energy -= 1;
  updateUI();

  // bude scratch card (script.js)
  if (window.initScratchCard) {
    window.initScratchCard();
  }

  if (window.playSound) playSound("clickSound");

  showStatus("🎟️ Scratch now!");
}

/* ================= CLAIM SCRATCH RESULT ================= */
async function claimScratchReward() {
  showStatus("🎁 Checking reward...");

  try {
    const res = await fetch("/api/scratch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    const oldBalance = USER.balance;

    USER.balance = data.balance;
    USER.energy  = data.energy;
    USER.level   = getLevel(USER.balance);

    updateUI();
    showStatus("🎉 You won!");

    if (data.reward > 0 && window.spawnCoins) {
      spawnCoins(Math.min(20, data.reward * 2));
    }

    checkLevelUp(oldBalance, USER.balance);

  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= LEVEL SYSTEM ================= */
function getLevel(balance) {
  const safeBalance = Number(balance) || 0;
  return Math.min(1000, Math.floor(safeBalance / 100) + 1);
}

function checkLevelUp(oldBalance, newBalance) {
  const oldLevel = getLevel(oldBalance);
  const newLevel = getLevel(newBalance);

  if (newLevel > oldLevel) {
    showStatus(`⬆️ Level Up! Level ${newLevel}`);

    if (window.launchConfetti) launchConfetti(30);
    if (window.playSound) playSound("winSound");
  }
   }
