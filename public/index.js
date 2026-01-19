/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (FINAL FULL)
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
    if (!data || !data.success) throw 1;

    USER = {
      balance: Number(data.balance) || 0,
      energy: Number(data.energy) || 0
    };

    USER.level = getLevel(USER.balance);

    updateUI();
    showStatus("✅ Ready");

  } catch {
    INIT_TRIES++;
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
  const pointsText = document.getElementById("pointsText");
  const scratchBtn = document.getElementById("scratchBtn");

  if (energyText) energyText.innerText = `Energy: ${USER.energy}`;
  if (levelText)  levelText.innerText  = `Level: ${USER.level}`;
  if (pointsText) pointsText.innerText = `Points: ${USER.balance}`;

  if (energyFill) {
    energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
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
      showStatus("⏳ Come back tomorrow");
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

  showStatus("🎟️ Scratch now!");

  if (window.playSound) playSound("clickSound");

  if (window.initScratchCard) {
    window.initScratchCard();
  }
}

/* ================= CLAIM SCRATCH RESULT ================= */
async function claimScratchReward() {
  try {
    const res = await fetch("/api/scratch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ " + data.error);
      return null;
    }

    const oldBalance = USER.balance;

    // 🔄 UPDATE USER STATE (SAFE)
    USER.balance = Number(data.balance) || USER.balance;
    USER.energy  = Number(data.energy)  || USER.energy;
    USER.level   = getLevel(USER.balance);

    updateUI();

    /* ================= RESULT UI ================= */
    const resultBox  = document.getElementById("resultBox");
    const resultText = document.getElementById("resultText");

    if (resultBox && resultText && data.reward) {
      if (data.reward.points > 0) {
        resultText.innerText = `🎉 +${data.reward.points} Points`;
        if (window.spawnCoins) spawnCoins(12);

      } else if (data.reward.energy > 0) {
        resultText.innerText = `⚡ +${data.reward.energy} Energy`;

      } else {
        resultText.innerText = "🙂 No reward, try again!";
      }

      resultBox.classList.remove("hidden");
    }

    // 📈 LEVEL UP CHECK
    checkLevelUp(oldBalance, USER.balance);

    return data.reward;

  } catch (err) {
    console.error("SCRATCH ERROR:", err);
    showStatus("❌ Network error");
    return null;
  }
}

/* ================= LEVEL SYSTEM ================= */
function getLevel(balance) {
  const b = Number(balance) || 0;
  return Math.min(1000, Math.floor(b / 100) + 1);
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
