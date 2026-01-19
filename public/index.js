/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (CLEAN / NO SOUNDS)
   ANDROID + RENDER + PLAY STORE SAFE
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;
let LUCK = 0;          // 0 – 100
const MAX_LUCK = 100;
let SCRATCHING = false;
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
      balance: Number(data.points ?? data.balance) || 0,
      energy:  Number(data.energy) || 0,
      level:   Number(data.level)  || 1
    };

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

  const scratchBtn = document.getElementById("scratchBtn");
  const energyText = document.getElementById("energyText");
  const energyFill = document.getElementById("energyFill");
  const levelText  = document.getElementById("levelText");
  const pointsText = document.getElementById("pointsText");

  if (energyText) energyText.innerText = `Energy: ${USER.energy}`;
  if (pointsText) pointsText.innerText = `Points: ${USER.balance}`;
  if (levelText)  levelText.innerText  = `Level: ${USER.level}`;

  if (energyFill) {
    energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
  }

  if (scratchBtn) {
    scratchBtn.disabled = USER.energy <= 0 || SCRATCHING;
    scratchBtn.innerText =
      USER.energy > 0 ? "🎟️ SCRATCH" : "⚡ Get Energy";
  }
}

const luckFill = document.getElementById("luckFill");
  const luckText = document.getElementById("luckText");

  if (luckFill) luckFill.style.width = LUCK + "%";
  if (luckText) luckText.innerText = `${LUCK}%`;

/* ================= STATUS ================= */
function showStatus(text) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.innerText = text;
  el.classList.remove("hidden");
}

/* ================= DAILY ENERGY ================= */
async function claimDailyEnergy() {
  showStatus("🎁 Claiming daily energy...");

  try {
    const res = await fetch("/api/daily-energy", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("⏳ Come back tomorrow");
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
let ADS_COOLDOWN = false;

async function watchAd() {
  if (ADS_COOLDOWN) return;

  const btn = document.getElementById("adsBtn");
  ADS_COOLDOWN = true;
  btn.disabled = true;

  let left = 15;
  btn.innerText = `⏳ Watching Ad (${left}s)`;

  const timer = setInterval(() => {
    left--;
    btn.innerText = `⏳ Watching Ad (${left}s)`;
    if (left <= 0) {
      clearInterval(timer);
      finishAd();
    }
  }, 1000);
}

async function finishAd() {
  const btn = document.getElementById("adsBtn");

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
  } finally {
    ADS_COOLDOWN = false;
    btn.disabled = false;
    btn.innerText = "📺 Watch Ad → +Energy";
  }
}

/* ================= START SCRATCH ================= */
function startScratch() {
  // ❌ idan yana scratching
  if (SCRATCHING) return;

  // ❌ idan babu user
  if (!USER) {
    showStatus("⏳ Loading...");
    return;
  }

  // ❌ idan babu energy
  if (USER.energy <= 0) {
    showStatus("⚡ No energy left");
    updateUI();
    return;
  }

  // 🔒 lock scratch
  SCRATCHING = true;

  showStatus("🎟️ Scratch now!");

  // rage energy nan take (UI ONLY)
  USER.energy -= 1;
  updateUI();

  if (window.initScratchCard) {
    window.initScratchCard();
  }
}

function showAchievement(ach) {
  const box = document.getElementById("achievementPopup");
  const title = document.getElementById("achTitle");
  const reward = document.getElementById("achReward");

  if (!box) return;

  title.innerText = `🏆 ${ach.title}`;
  reward.innerText = `Reward: ${ach.reward}`;

  box.classList.remove("hidden");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 3000);
}

/* ================= CLAIM SCRATCH ================= */
async function claimScratchReward() {
  showStatus("🎁 Checking reward...");

  try {
    const res = await fetch("/api/scratch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    // ❌ idan server yace babu energy
     if (Array.isArray(data.achievementsUnlocked)) {
     data.achievementsUnlocked.forEach(showAchievement);
     }
     
    if (data.error === "NO_ENERGY") {
      showStatus("⚡ Energy finished");
      SCRATCHING = false;
      updateUI();
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      SCRATCHING = false;
      return;
    }

    // ✅ sync daga server
    USER.balance = data.balance;
    USER.energy  = data.energy;
    USER.level   = data.level;

    updateUI();

    const rewardBox = document.getElementById("scratchReward");
    if (rewardBox) {
      if (data.reward?.points > 0) {
        rewardBox.innerText = `🎉 +${data.reward.points} POINTS`;
      } else if (data.reward?.energy > 0) {
        rewardBox.innerText = `⚡ +${data.reward.energy} ENERGY`;
      } else {
        rewardBox.innerText = "🙂 NO REWARD";
      }
    }

    showStatus("🎟️ Scratch complete!");

  } catch {
    showStatus("❌ Network error");
  } finally {
    // 🔓 UNLOCK SCRATCH
    SCRATCHING = false;
    updateUI();
  }
}

window.claimScratchReward = claimScratchReward;
