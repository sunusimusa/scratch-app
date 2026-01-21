/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (CLEAN / NO SOUNDS)
   MATCHES SERVER LOGIC 100%
   ANDROID + RENDER + PLAY STORE SAFE
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

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

    /* ================= USER STATE ================= */
    USER = {
      balance: Number(data.points) || 0,
      energy:  Number(data.energy) || 0,
      level:   Number(data.level)  || 1,
      luck:    Number(data.luck)   || 0
    };

    /* ================= REFERRAL CODE ================= */
    const refEl = document.getElementById("referralCode");
    if (refEl) {
      refEl.innerText = data.referralCode || "----";
    }

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

/* ================= COPY REFERRAL ================= */
function copyReferral() {
  const refEl = document.getElementById("referralCode");
  if (!refEl) return;

  const code = refEl.innerText.trim();
  if (!code || code === "----") {
    showStatus("❌ Referral code not ready");
    return;
  }

  navigator.clipboard.writeText(code);
  showStatus("📋 Referral code copied!");
}

/* ================= CLAIM REFERRAL ================= */
async function claimReferralCode() {
  const input = document.getElementById("refInput");
  if (!input) return;

  const code = input.value.trim();
  if (!code) {
    showStatus("❌ Enter referral code");
    return;
  }

  // ❌ hana user ya saka nasa code
  const myCode = document.getElementById("referralCode")?.innerText;
  if (myCode && code === myCode) {
    showStatus("❌ You cannot use your own code");
    return;
  }

  showStatus("🎁 Claiming referral...");

  try {
    const res = await fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    // ✅ sync from server
    if (typeof data.energy === "number") USER.energy = data.energy;
    if (typeof data.points === "number") USER.balance = data.points;

    updateUI();
    input.value = "";

    showStatus("🎉 Referral bonus received!");

  } catch {
    showStatus("❌ Network error");
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

  const luckFill   = document.getElementById("luckFill");
  const luckText   = document.getElementById("luckText");

  if (energyText) energyText.innerText = `Energy: ${USER.energy}`;
  if (pointsText) pointsText.innerText = `Points: ${USER.balance}`;
  if (levelText)  levelText.innerText  = `Level: ${USER.level}`;

  if (energyFill) {
    energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
  }

  if (luckFill) luckFill.style.width = `${USER.luck}%`;
  if (luckText) luckText.innerText = `${USER.luck}%`;

  if (scratchBtn) {
    scratchBtn.disabled = USER.energy <= 0 || SCRATCHING;
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
const SCRATCH_COST = 3; // ⚠️ dole ya zama iri daya da na server

function startScratch() {
  if (SCRATCHING) return;

  if (!USER) {
    showStatus("⏳ Loading...");
    return;
  }

  // ❌ Energy bai isa ba
  if (USER.energy < SCRATCH_COST) {
    showStatus("⚡ Not enough energy — watch ad or invite friends");
    updateUI();
    return;
  }

  SCRATCHING = true;
  showStatus("🎟️ Scratch now!");

  if (window.initScratchCard) {
    window.initScratchCard();
  }
}

/* ================= ACHIEVEMENT POPUP ================= */
function showAchievement(ach) {
  const box = document.getElementById("achievementPopup");
  const title = document.getElementById("achTitle");
  const reward = document.getElementById("achReward");

  if (!box) return;

  title.innerText = `🏆 ${ach.key}`;
  reward.innerText = ach.reward;

  box.classList.remove("hidden");

  setTimeout(() => {
    box.classList.add("hidden");
  }, 3000);
}

/* =====================================================
   SERVER BONUS POPUP (30 MIN)
===================================================== */
async function checkBonusFromServer() {
  try {
    const lastBonus = localStorage.getItem("lastBonusTime");
    const now = Date.now();

    // ⛔ kariya ta client (30 min)
    if (lastBonus && now - Number(lastBonus) < 30 * 60 * 1000) {
      return;
    }

    const res = await fetch("/api/bonus/check", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.bonusAvailable) return;

    showBonusPopup(data.reward);
    USER.energy = data.energy;
    updateUI();

    // 🔒 lock locally
    localStorage.setItem("lastBonusTime", now);

  } catch {
    console.log("Bonus skipped");
  }
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

    if (data.error === "NO_ENERGY") {
      showStatus("⚡ Energy finished");
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    // ✅ SYNC FROM SERVER
    USER.balance = data.balance;
    USER.energy  = data.energy;
    USER.level   = data.level;
    USER.luck    = data.luck;

    updateUI();

    // 🎁 reward text
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

    // 🏆 achievements
    if (Array.isArray(data.achievementsUnlocked)) {
      data.achievementsUnlocked.forEach(showAchievement);
    }

    showStatus("🎟️ Scratch complete!");

  } catch {
    showStatus("❌ Network error");
  } finally {
    SCRATCHING = false;
    updateUI();
  }
}

/* expose to script.js */
window.claimScratchReward = claimScratchReward;

async function claimReferral(code) {
  showStatus("🎁 Claiming referral...");

  try {
    const res = await fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (data.error) {
      showStatus("❌ Invalid or used code");
      return;
    }

    USER.energy = data.userEnergy;
    updateUI();

    showStatus("🎉 Referral bonus claimed!");

  } catch {
    showStatus("❌ Network error");
  }
}

async function checkDailyStreak() {
  try {
    const res = await fetch("/api/streak/check", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    USER.energy = data.energy;
    updateUI();

    if (data.reward) {
      showPopup(
        "🔥 Daily Streak!",
        data.reward.message
      );
    }

  } catch (err) {
    console.log("Streak check skipped");
  }
}

window.addEventListener("load", () => {
  checkDailyStreak();
});


