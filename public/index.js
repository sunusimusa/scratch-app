/* =====================================================
   INDEX.JS – SCRATCH GAME (FINAL WORKING VERSION)
   NO FEATURE REMOVED
   BUTTONS FIXED
===================================================== */

let USER = null;
let INIT_TRIES = 0;
const MAX_INIT_TRIES = 5;

let SCRATCHING = false;
let ADS_COOLDOWN = false;

/* ================= GUEST ================= */
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
  bindUI();
  initUser();
  loadAchievements();
});

/* ================= BIND UI ================= */
function bindUI() {
  document.getElementById("scratchBtn")?.addEventListener("click", startScratch);
  document.getElementById("dailyBtn")?.addEventListener("click", claimDailyEnergy);
  document.getElementById("adsBtn")?.addEventListener("click", watchAd);
  document.getElementById("openMysteryBtn")?.addEventListener("click", watchMysteryAd);
  document.getElementById("spinBtn")?.addEventListener("click", spinDaily);
}

/* ================= USER INIT ================= */
async function initUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data?.success) throw 1;

    USER = {
      balance: Number(data.points) || 0,
      energy: Number(data.energy) || 0,
      level: Number(data.level) || 1,
      luck: Number(data.luck) || 0,
      gold: Number(data.gold) || 0,
      diamond: Number(data.diamond) || 0
    };

    document.getElementById("referralCode") &&
      (referralCode.innerText = data.referralCode || "----");

    updateUI();
    showStatus("✅ Ready");

  } catch {
    INIT_TRIES++;
    if (INIT_TRIES < MAX_INIT_TRIES) {
      setTimeout(initUser, 1000);
    } else {
      initGuestUser();
    }
  }
}

/* ================= STATUS ================= */
function showStatus(text) {
  const el = document.getElementById("statusMsg");
  if (!el) return;
  el.innerText = text;
  el.classList.remove("hidden");
}

/* ================= UI UPDATE ================= */
function updateUI() {
  if (!USER) return;

  energyText.innerText = `Energy: ${USER.energy}`;
  pointsText.innerText = `Points: ${USER.balance}`;
  levelText.innerText  = `Level: ${USER.level}`;

  energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
  luckFill.style.width = `${USER.luck}%`;
  luckText.innerText = `${USER.luck}%`;

  scratchBtn.disabled = USER.energy <= 0 || SCRATCHING;
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
    if (data.error) return showStatus("⏳ Come back tomorrow");

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ +5 Energy");
  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= WATCH AD ================= */
function watchAd() {
  if (ADS_COOLDOWN) return;
  ADS_COOLDOWN = true;

  let left = 10;
  adsBtn.disabled = true;
  adsBtn.innerText = `⏳ Watching (${left}s)`;

  const timer = setInterval(() => {
    left--;
    adsBtn.innerText = `⏳ Watching (${left}s)`;
    if (left <= 0) {
      clearInterval(timer);
      finishAd();
    }
  }, 1000);
}

async function finishAd() {
  try {
    const res = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    if (data.error) return showStatus("❌ Ad failed");

    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ Energy added!");
  } catch {
    showStatus("❌ Network error");
  } finally {
    ADS_COOLDOWN = false;
    adsBtn.disabled = false;
    adsBtn.innerText = "📺 Watch Ad → +Energy";
  }
}

/* ================= SCRATCH ================= */
const SCRATCH_COST = 3;

function startScratch() {
  if (!USER) return showStatus("⏳ Loading...");
  if (USER.energy < SCRATCH_COST) return showStatus("⚡ Not enough energy");

  SCRATCHING = true;
  showStatus("🎟️ Scratch now!");
  document.getElementById("scratchSection")?.classList.remove("hidden");

  window.initScratchCard?.();
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
    if (data.error) return showStatus("❌ " + data.error);

    USER.balance = data.balance;
    USER.energy  = data.energy;
    USER.level   = data.level;
    USER.luck    = data.luck;

    updateUI();
    scratchReward.innerText = "🎉 Reward Received!";
    showStatus("✅ Scratch done!");
  } catch {
    showStatus("❌ Network error");
  } finally {
    SCRATCHING = false;
  }
}

window.claimScratchReward = claimScratchReward;

/* ================= MYSTERY BOX ================= */
function watchMysteryAd() {
  showStatus("📺 Watching Ad...");
  setTimeout(openMysteryBox, 5000);
}

async function openMysteryBox() {
  try {
    const res = await fetch("/api/mystery/open", {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    if (data.error) return showStatus("⏳ Try later");

    USER.energy = data.energy;
    USER.balance = data.points;
    updateUI();
    showStatus("🎁 Mystery reward received!");
  } catch {
    showStatus("❌ Network error");
  }
}

/* ================= DAILY SPIN ================= */
function spinDaily() {
  spinText.innerText = "🎡 Spinning...";
  spinWheel.classList.add("spin");

  setTimeout(() => {
    spinWheel.classList.remove("spin");
    showStatus("🎁 Spin reward!");
  }, 3000);
}

/* ================= ACHIEVEMENTS ================= */
async function loadAchievements() {
  try {
    const res = await fetch("/api/achievements", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    achievementsList.innerHTML = "";
    data.achievements.forEach(a => {
      const div = document.createElement("div");
      div.className = "achievement";
      div.innerHTML = `
        <div class="ach-title">${a.title}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-reward">${a.reward}</div>
      `;
      achievementsList.appendChild(div);
    });
  } catch {}
}

/* ================= REFERRAL ================= */
function copyReferral() {
  navigator.clipboard.writeText(referralCode.innerText);
  showStatus("📋 Copied!");
}

async function claimReferralCode() {
  if (!refInput.value) return showStatus("❌ Enter code");
  try {
    const res = await fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code: refInput.value })
    });
    const data = await res.json();
    if (data.error) return showStatus("❌ " + data.error);

    USER.energy = data.energy;
    USER.balance = data.points;
    updateUI();
    showStatus("🎉 Referral claimed!");
  } catch {
    showStatus("❌ Network error");
  }
}
