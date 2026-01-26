/* =====================================================
   INDEX.JS – SCRATCH GAME CORE (CLEAN / NO SOUNDS)
   MATCHES SERVER LOGIC 100%
   ANDROID + RENDER + PLAY STORE SAFE
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

let SCRATCHING = false;

function initGuestUser() {
  USER = {
    balance: 0,
    energy: 0,
    level: 1,
    luck: 0,
    gold: 0,
    diamond: 0
  };

  updateUI();
  showStatus("🎮 Playing as Guest");
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
  initUser();
  bindUI();
  loadAchievements(); // 👈 nan
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
    luck:    Number(data.luck)   || 0,
    gold:    Number(data.gold)   || 0,
    diamond: Number(data.diamond)|| 0
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
    // ✅ maimakon error → Guest mode
    initGuestUser();
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
  const pointsText = document.getElementById("pointsText");
  const levelText  = document.getElementById("levelText");

  const energyFill = document.getElementById("energyFill");
  const luckFill   = document.getElementById("luckFill");
  const luckText   = document.getElementById("luckText");

  /* ===== BASIC STATS ===== */
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

  /* ===== INVENTORY ===== */
  const invEnergy  = document.getElementById("invEnergy");
  const invPoints  = document.getElementById("invPoints");
  const invGold    = document.getElementById("invGold");
  const invDiamond = document.getElementById("invDiamond");

  if (invEnergy)  invEnergy.innerText  = USER.energy ?? 0;
  if (invPoints)  invPoints.innerText  = USER.balance ?? 0;
  if (invGold)    invGold.innerText    = USER.gold ?? 0;
  if (invDiamond) invDiamond.innerText = USER.diamond ?? 0;
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

    // 🔎 tambayi server
    const res = await fetch("/api/bonus/check", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.bonusAvailable) return;

    // 🎥 nuna promo OPTIONAL kafin bonus
    showPromoThenBonus(() => {
      // 🎁 bayan skip ko video ya kare
      showBonusPopup(data.reward);

      USER.energy = data.energy;
      updateUI();

      // 🔒 kulle bonus a client
      localStorage.setItem("lastBonusTime", Date.now());
    });

  } catch (err) {
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

    /* ===== ERROR HANDLING ===== */
    if (data.error === "NO_ENERGY") {
      showStatus("⚡ Not enough energy");
      return;
    }

    if (data.error) {
      showStatus("❌ " + data.error);
      return;
    }

    /* ===== SYNC USER ===== */
    USER.balance = data.balance;
    USER.energy  = data.energy;
    USER.level   = data.level;
    USER.luck    = data.luck;
    USER.gold    = data.gold ?? USER.gold;
    USER.diamond = data.diamond ?? USER.diamond;

    updateUI();

    /* ===== SHOW REWARD ===== */
    const rewardBox = document.getElementById("scratchReward");
    if (rewardBox && data.reward) {
      const parts = [];

      if (data.reward.points > 0) {
        parts.push(`🎉 +${data.reward.points} POINTS`);
      }

      if (data.reward.energy > 0) {
        parts.push(`⚡ +${data.reward.energy} ENERGY`);
      }

      if (data.reward.gold > 0) {
        parts.push(`🥇 +${data.reward.gold} GOLD`);
      }

      if (data.reward.diamond > 0) {
        parts.push(`💎 +${data.reward.diamond} DIAMOND`);
      }

      rewardBox.innerText =
        parts.length > 0 ? parts.join(" • ") : "🙂 NO REWARD";
    }

    /* ===== ACHIEVEMENTS ===== */
    if (Array.isArray(data.achievementsUnlocked)) {
      data.achievementsUnlocked.forEach(showAchievement);
    }

    showStatus("🎟️ Scratch complete!");

  } catch (err) {
    console.error(err);
    showStatus("❌ Network error");
  } finally {
    SCRATCHING = false;
    updateUI();
  }
}

/* expose */
window.claimScratchReward = claimScratchReward;

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

/* =====================================================
   ACHIEVEMENTS (CLIENT)
===================================================== */

let ALL_ACHIEVEMENTS = [];

/* ================= LOAD ACHIEVEMENTS ================= */
async function loadAchievements() {
  try {
    const res = await fetch("/api/achievements", {
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    ALL_ACHIEVEMENTS = data.achievements;
    renderAchievements(data.achievements, data.unlocked || []);

  } catch (err) {
    console.warn("Achievements load failed");
  }
}

/* ================= RENDER ================= */
function renderAchievements(list, unlockedKeys) {
  const box = document.getElementById("achievementsList");
  if (!box) return;

  box.innerHTML = "";

  list.forEach(ach => {
    const unlocked = unlockedKeys.includes(ach.key);

    const div = document.createElement("div");
    div.className = "achievement-item " + (unlocked ? "unlocked" : "locked");

    div.innerHTML = `
      <div class="ach-icon">${unlocked ? "🏆" : "🔒"}</div>
      <div class="ach-info">
        <div class="ach-title">${ach.title}</div>
        <div class="ach-desc">${ach.desc}</div>
        <div class="ach-reward">${ach.reward}</div>
      </div>
    `;

    box.appendChild(div);
  });
}

async function buyItem(item) {
  showStatus("🛒 Processing purchase...");

  try {
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ item })
    });

    const data = await res.json();

    if (data.error) {
      if (data.error === "NOT_ENOUGH_POINTS") showStatus("❌ Not enough Points");
      else if (data.error === "NOT_ENOUGH_GOLD") showStatus("❌ Not enough Gold");
      else if (data.error === "NOT_ENOUGH_DIAMOND") showStatus("❌ Not enough Diamond");
      else showStatus("❌ Purchase failed");
      return;
    }

    USER.energy  = data.energy;
    USER.balance = data.points;
    USER.gold    = data.gold;
    USER.diamond = data.diamond;

    updateUI();
    showStatus(`✅ +${data.rewardEnergy} Energy added!`);

  } catch {
    showStatus("❌ Network error");
  }
}

window.buyItem = buyItem; // 🔥 MUHIMMI

/* =====================================================
   PROMO VIDEO → BONUS (CLEAN & SAFE)
===================================================== */
function showPromoThenBonus(claimBonusCallback) {
  const modal   = document.getElementById("promoModal");
  const video   = document.getElementById("promoVideo");
  const skipBtn = document.getElementById("skipPromoBtn");
  const skipTxt = document.getElementById("skipText");

  if (!modal || !video || !skipBtn || !skipTxt) {
    claimBonusCallback();
    return;
  }

  let seconds = 5;
  skipBtn.disabled = true;
  skipTxt.innerText = `Skip in ${seconds}s`;

  modal.classList.remove("hidden");

  video.currentTime = 0;
  video.play().catch(() => {});

  const timer = setInterval(() => {
    seconds--;
    skipTxt.innerText = `Skip in ${seconds}s`;

    if (seconds <= 0) {
      clearInterval(timer);
      skipBtn.disabled = false;
      skipTxt.innerText = "You can skip";
    }
  }, 1000);

  function closePromo() {
    clearInterval(timer);
    video.pause();
    modal.classList.add("hidden");
    claimBonusCallback(); // 🎁 BONUS
  }

  skipBtn.onclick = closePromo;
  video.onended = closePromo;
}

/* =====================================================
   MYSTERY AD BOX (SIMULATED AD)
===================================================== */
document
  .getElementById("openMysteryBtn")
  ?.addEventListener("click", () => {
    showStatus("📺 Watching Ad...");
    setTimeout(openMysteryBox, 5000); // 5s ad
  });

async function openMysteryBox() {
  try {
    const res = await fetch("/api/mystery/open", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();

    if (data.error === "COOLDOWN") {
      showStatus("⏳ Come back later for another box");
      return;
    }

    if (data.error) {
      showStatus("❌ Unable to open box");
      return;
    }

    // ✅ sync user
    USER.energy   = data.energy;
    USER.balance  = data.points;
    USER.gold     = data.gold;
    USER.diamond  = data.diamond;
    updateUI();

    // 🎁 show reward
    if (data.reward?.energy)
      showStatus(`⚡ +${data.reward.energy} Energy`);
    else if (data.reward?.points)
      showStatus(`⭐ +${data.reward.points} Points`);
    else if (data.reward?.gold)
      showStatus(`🥇 +${data.reward.gold} Gold`);
    else if (data.reward?.diamond)
      showStatus(`💎 +${data.reward.diamond} Diamond`);

  } catch {
    showStatus("❌ Network error");
  }
}
