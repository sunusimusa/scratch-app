let USER = null;
let BUSY = false;

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  initUser();
});

function bindUI() {
  scratchBtn.onclick = scratch;
  dailyBtn.onclick = daily;
  adsBtn.onclick = watchAd;
}

/* USER */
async function initUser() {
  try {
    const r = await fetch("/api/user", { method: "POST", credentials: "include" });
    USER = await r.json();
    updateUI();
    status("✅ Ready");
  } catch {
    status("❌ Offline");
  }
}

/* UI */
function updateUI() {
  energyText.innerText = `Energy: ${USER.energy}`;
  pointsText.innerText = `Points: ${USER.points}`;
  levelText.innerText = `Level: ${USER.level}`;
  energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
}

function status(t) {
  statusMsg.innerText = t;
  statusMsg.classList.remove("hidden");
}

/* DAILY */
async function daily() {
  const r = await fetch("/api/daily-energy", { method: "POST", credentials: "include" });
  const d = await r.json();
  if (d.energy) {
    USER.energy = d.energy;
    updateUI();
    status("⚡ +5 Energy");
  } else status("⏳ Come tomorrow");
}

/* ADS */
async function watchAd() {
  const r = await fetch("/api/ads/watch", { method: "POST", credentials: "include" });
  const d = await r.json();
  if (d.energy) {
    USER.energy = d.energy;
    updateUI();
    status("📺 +2 Energy");
  }
}

/* SCRATCH */
async function scratch() {
  if (BUSY || USER.energy < 3) return status("⚡ Need energy");
  BUSY = true;

  const r = await fetch("/api/scratch", { method: "POST", credentials: "include" });
  const d = await r.json();

  if (!d.error) {
    USER.energy = d.energy;
    USER.points = d.balance;
    USER.level = d.level;
    updateUI();
    status("🎉 You won!");
  }

  BUSY = false;
}

/* ================= DAILY SPIN ================= */
let SPINNING = false;

async function spinDaily() {
  if (SPINNING) return;
  SPINNING = true;

  spinText.innerText = "🎡 Spinning...";
  spinWheel.classList.add("spin");

  setTimeout(async () => {
    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        credentials: "include"
      });
      const data = await res.json();

      spinWheel.classList.remove("spin");

      if (data.error === "ALREADY_SPUN") {
        spinText.innerText = "⏳ Come back tomorrow";
        SPINNING = false;
        return;
      }

      if (data.error) {
        spinText.innerText = "❌ Spin failed";
        SPINNING = false;
        return;
      }

      // ✅ APPLY REWARD
      USER.energy = data.energy;
      USER.balance = data.points;
      USER.level = data.level;
      updateUI();

      if (data.reward.energy)
        spinText.innerText = `⚡ +${data.reward.energy} Energy`;
      else
        spinText.innerText = `⭐ +${data.reward.points} Points`;

    } catch {
      spinText.innerText = "❌ Network error";
    }

    SPINNING = false;
  }, 3500);
}

