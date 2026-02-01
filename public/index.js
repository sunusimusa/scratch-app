let USER = null;

/* ELEMENTS */
const energyText = document.getElementById("energyText");
const pointsText = document.getElementById("pointsText");
const energyFill = document.getElementById("energyFill");
const statusMsg  = document.getElementById("statusMsg");

const scratchBtn = document.getElementById("scratchBtn");
const adsBtn     = document.getElementById("adsBtn");
const spinBtn    = document.getElementById("spinBtn");
const wheel      = document.getElementById("wheel");

/* ================= INIT USER ================= */
fetch("/api/user", { method: "POST", credentials: "include" })
  .then(r => r.json())
  .then(d => {
    USER = {
      energy: Number(d.energy) || 0,
      points: Number(d.points) || 0
    };
    updateUI();
    showStatus("✅ Ready");
  });

/* ================= UI ================= */
function updateUI() {
  energyText.innerText = `Energy: ${USER.energy}`;
  pointsText.innerText = `Points: ${USER.points}`;
  energyFill.style.width = Math.min(USER.energy * 10, 100) + "%";
}

function showStatus(text) {
  statusMsg.innerText = text;
}

/* ================= SCRATCH ================= */
scratchBtn.onclick = () => {
  const sec = document.getElementById("scratchSection");
  if (sec) sec.classList.remove("hidden");
  initScratchCard();
  showStatus("✋ Scratch with your finger");
};

let SCRATCH_DONE = false;

async function claimScratchReward() {
  if (SCRATCH_DONE) return;
  SCRATCH_DONE = true;

  const r = await fetch("/api/scratch", {
    method: "POST",
    credentials: "include"
  });
  const d = await r.json();

  if (d.error) {
    showStatus("⚡ Not enough energy");
    SCRATCH_DONE = false;
    return;
  }

  USER.energy = d.energy;
  USER.points = d.points;

  updateUI();
  showStatus(`🎉 You won ${d.reward} points`);
}

/* SCRATCH CANVAS (SWIPE FIXED) */
function initScratchCard() {
  SCRATCH_DONE = false;

  const canvas = document.getElementById("scratchCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let scratching = false;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#aaa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function scratch(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas.ontouchstart = () => scratching = true;

  canvas.ontouchmove = e => {
    if (!scratching) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    scratch(t.clientX - r.left, t.clientY - r.top);
  };

  canvas.ontouchend = () => {
    scratching = false;
    claimScratchReward();
  };
}

/* ================= ADS ================= */
adsBtn.onclick = () => {
  showStatus("📺 Watching ad...");
  adsBtn.disabled = true;

  setTimeout(async () => {
    const r = await fetch("/api/ads/watch", {
      method: "POST",
      credentials: "include"
    });
    const d = await r.json();

    if (d.error) {
      showStatus("❌ Ad limit reached");
    } else {
      USER.energy = d.energy;
      updateUI();
      showStatus("⚡ +2 Energy");
    }

    adsBtn.disabled = false;
  }, 3000);
};

/* ================= SPIN ================= */
spinBtn.onclick = async () => {
  spinBtn.disabled = true;
  showStatus("🎡 Spinning...");

  const deg = 360 * 5 + Math.floor(Math.random() * 360);
  wheel.style.transform = `rotate(${deg}deg)`;

  setTimeout(async () => {
    const r = await fetch("/api/spin", {
      method: "POST",
      credentials: "include"
    });
    const d = await r.json();

    if (d.error) {
      showStatus("⏳ Come back tomorrow");
    } else {
      USER.energy = d.energy;
      updateUI();
      showStatus(`🎁 +${d.reward} Energy`);
    }

    spinBtn.disabled = false;
  }, 4000);
};
