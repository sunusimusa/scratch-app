let USER = null;
let SCRATCHING = false;
let ADS_COOLDOWN = false;

document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  initUser();
  loadAchievements();
});

function bindUI() {
  scratchBtn?.addEventListener("click", startScratch);
  dailyBtn?.addEventListener("click", claimDailyEnergy);
  adsBtn?.addEventListener("click", watchAd);
  openMysteryBtn?.addEventListener("click", watchMysteryAd);
  spinBtn?.addEventListener("click", spinDaily);
}

async function initUser() {
  try {
    const res = await fetch("/api/user", { method: "POST", credentials: "include" });
    const data = await res.json();
    if (!data.success) throw 1;

    USER = {
      balance: data.points,
      energy: data.energy,
      level: data.level,
      luck: data.luck
    };

    referralCode.innerText = data.referralCode || "----";
    updateUI();
    showStatus("✅ Ready");
  } catch {
    showStatus("❌ Failed to load user");
  }
}

function updateUI() {
  if (!USER) return;
  energyText.innerText = `Energy: ${USER.energy}`;
  pointsText.innerText = `Points: ${USER.balance}`;
  levelText.innerText = `Level: ${USER.level}`;
  energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
  luckFill.style.width = USER.luck + "%";
  luckText.innerText = USER.luck + "%";
}

function showStatus(msg) {
  statusMsg.innerText = msg;
  statusMsg.classList.remove("hidden");
}

/* ================= SCRATCH ================= */
async function startScratch() {
  if (SCRATCHING || USER.energy < 3) return showStatus("⚡ Not enough energy");

  SCRATCHING = true;
  scratchSection.classList.remove("hidden");

  const res = await fetch("/api/scratch", { method: "POST", credentials: "include" });
  const data = await res.json();

  if (data.error) {
    showStatus("❌ " + data.error);
  } else {
    USER.energy = data.energy;
    USER.balance = data.balance;
    USER.level = data.level;
    USER.luck = data.luck;
    scratchReward.innerText = "🎉 Reward received!";
    updateUI();
  }

  SCRATCHING = false;
}

/* ================= DAILY ================= */
async function claimDailyEnergy() {
  const res = await fetch("/api/daily-energy", { method: "POST", credentials: "include" });
  const data = await res.json();
  if (!data.error) {
    USER.energy = data.energy;
    updateUI();
    showStatus("⚡ +5 Energy");
  }
}
