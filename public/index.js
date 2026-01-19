/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (FINAL • STABLE)
   ANDROID • WEBVIEW • RENDER SAFE
===================================================== */

/* ================= GLOBAL STATE ================= */
let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

let SCRATCH_COOLDOWN = false;
let ADS_COOLDOWN = false;

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  initUser();
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
      energy:  Number(data.energy)  || 0
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
      if (window.playSound) playSound("errorSound");
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
    scratchBtn.disabled = USER.energy <= 0 || SCRATCH_COOLDOWN;
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
      if (window.playSound) playSound("errorSound");
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      if (window.playSound) playSound("errorSound");
      return;
    }

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ +5 Daily Energy");
    if (window.playSound) playSound("winSound");

  } catch {
    showStatus("❌ Network error");
    if (window.playSound) playSound("errorSound");
  }
}

/* ================= START SCRATCH ================= */
function startScratch() {
  if (!USER || USER.energy <= 0) {
    playSound("errorSound");
    showStatus("⚡ Get energy first");
    return;
  }

  // 🔊 EXACT LIKE OPEN BOX
  playSound("clickSound");

  showStatus("🎟️ Scratch now!");

  if (window.initScratchCard) {
    window.initScratchCard();
  }
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
      if (window.playSound) playSound("errorSound");
      return;
    }

    const rewardBox = document.getElementById("scratchReward");
    const oldBalance = USER.balance;

    if (typeof data.balance === "number") USER.balance = data.balance;
    if (typeof data.energy === "number")  USER.energy  = data.energy;

    USER.level = getLevel(USER.balance);

    updateUI();

    /* 🎁 SHOW REWARD A CIKIN KATI */
     if (data.reward?.points > 0) {
  rewardBox.innerText = `🎉 +${data.reward.points} POINTS`;
  playSound("winSound");
  if (window.spawnCoins) spawnCoins(10);

} else if (data.reward?.energy > 0) {
  rewardBox.innerText = `⚡ +${data.reward.energy} ENERGY`;
  playSound("winSound");

} else {
  rewardBox.innerText = "🙂 NO REWARD";
  playSound("loseSound");
     }
    

    checkLevelUp(oldBalance, USER.balance);
    showStatus("🎟️ Scratch complete!");

    startCooldown(3);

  } catch (err) {
    console.error(err);
    showStatus("❌ Network error");
    if (window.playSound) playSound("errorSound");
  }
}

/* ================= SCRATCH COOLDOWN ================= */
function startCooldown(seconds = 3) {
  const btn = document.getElementById("scratchBtn");
  const text = document.getElementById("cooldownText");
  if (!btn || !text) return;

  SCRATCH_COOLDOWN = true;
  btn.disabled = true;

  let left = seconds;
  text.innerText = `⏳ Wait ${left}s`;
  text.classList.remove("hidden");

  const timer = setInterval(() => {
    left--;
    if (left <= 0) {
      clearInterval(timer);
      SCRATCH_COOLDOWN = false;
      btn.disabled = false;
      text.classList.add("hidden");
      updateUI();
    } else {
      text.innerText = `⏳ Wait ${left}s`;
    }
  }, 1000);
}

/* ================= WATCH AD (15s) ================= */
async function watchAd() {
  if (ADS_COOLDOWN) return;

  const btn = document.getElementById("adsBtn");
  ADS_COOLDOWN = true;
  btn.disabled = true;

  let timeLeft = 15;
  btn.innerText = `⏳ Watching Ad (${timeLeft}s)`;

  const timer = setInterval(() => {
    timeLeft--;
    btn.innerText = `⏳ Watching Ad (${timeLeft}s)`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      finishAdWatch();
    }
  }, 1000);
}

async function finishAdWatch() {
  const btn = document.getElementById("adsBtn");

  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (data.error) {
      showStatus("❌ " + data.error);
      if (window.playSound) playSound("errorSound");
      return;
    }

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ +Energy from Ad!");
    if (window.playSound) playSound("winSound");

  } catch {
    showStatus("❌ Network error");
    if (window.playSound) playSound("errorSound");
  } finally {
    ADS_COOLDOWN = false;
    btn.disabled = false;
    btn.innerText = "📺 Watch Ad → +Energy";
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
