/* =====================================================
   INDEX.JS – SCRATCH GAME CORE LOGIC (STEP B)
   SIMPLE • STABLE • PLAY STORE SAFE
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

  if (scratchBtn) scratchBtn.onclick = onScratch;
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
    if (!data.success) throw "NO_USER";

    USER = data;
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
  const scratchBtn = document.getElementById("scratchBtn");

  if (energyText) {
    energyText.innerText = `Energy: ${USER.energy}`;
  }

  if (energyFill) {
    const percent = Math.min(USER.energy * 10, 100);
    energyFill.style.width = percent + "%";
  }

  if (levelText) {
    levelText.innerText = `Level: ${USER.level || 1}`;
  }

  // 🔒 Scratch availability
  if (scratchBtn) {
    scratchBtn.disabled = USER.energy <= 0;
    scratchBtn.innerText =
      USER.energy > 0 ? "🎟️ SCRATCH" : "⚡ Get Energy First";
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

  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= SCRATCH (LOGIC ONLY) ================= */
async function onScratch() {
  if (!USER || USER.energy <= 0) {
    showStatus("⚡ Not enough energy");
    return;
  }

  showStatus("🎟️ Scratching...");

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

    // 🔄 update state
    USER.energy  = data.energy;
    USER.balance = data.balance;
    USER.level   = data.level || USER.level;

    updateUI();
    showStatus("🎉 You won!");

  } catch {
    showStatus("❌ Network error");
  }
      }
