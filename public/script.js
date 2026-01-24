/* =====================================================
   SCRATCH CARD – REAL RUB / SWIPE (NO SOUNDS)
   ANDROID + WEBVIEW + PLAY STORE SAFE
===================================================== */

const canvas  = document.getElementById("scratchCanvas");
const section = document.getElementById("scratchSection");

let ctx, W, H;
let scratching = false;
let scratched  = false;
let ready      = false;

/* ================= INIT ================= */
function initScratchCard() {
  if (!canvas) return;

  ctx = canvas.getContext("2d", { willReadFrequently: true });
  W = canvas.width;
  H = canvas.height;

  scratching = false;
  scratched  = false;
  ready      = true;

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "destination-out";

  section.classList.remove("hidden");
  canvas.style.display = "block";
}

window.initScratchCard = initScratchCard;

/* =====================================================
   BONUS CHECK (30 MIN – SERVER SAFE)
===================================================== */
let bonusTimerStarted = false;

function startBonusTimer() {
  if (bonusTimerStarted) return;
  bonusTimerStarted = true;

  checkBonusFromServer();
  setInterval(checkBonusFromServer, 30 * 60 * 1000);
}

window.addEventListener("load", startBonusTimer);

/* ================= DRAW ================= */
function draw(x, y) {
  if (!ready || scratched) return;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= PERCENT ================= */
function percent() {
  const d = ctx.getImageData(0, 0, W, H).data;
  let c = 0;
  for (let i = 3; i < d.length; i += 4) {
    if (d[i] === 0) c++;
  }
  return (c / (W * H)) * 100;
}

/* ================= CHECK ================= */
function check() {
  if (!ready || scratched) return;
  if (percent() >= 60) {
    scratched = true;
    ready = false;
    finish();
  }
}

/* ================= FINISH ================= */
async function finish() {
  canvas.style.display = "none";
  section.classList.add("hidden");

  if (window.claimScratchReward) {
    await window.claimScratchReward();
  }

  // 🔄 reset for next scratch
  scratched = false;
  ready = false;
}

/* ================= MOUSE ================= */
canvas.addEventListener("mousedown", () => ready && (scratching = true));
canvas.addEventListener("mouseup",   () => scratching = false);
canvas.addEventListener("mouseleave",() => scratching = false);

canvas.addEventListener("mousemove", e => {
  if (!scratching) return;
  draw(e.offsetX, e.offsetY);
  check();
});

/* ================= TOUCH ================= */
canvas.addEventListener("touchstart", e => {
  if (!ready) return;
  e.preventDefault();
  scratching = true;
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  scratching = false;
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  if (!scratching) return;
  e.preventDefault();

  const r = canvas.getBoundingClientRect();
  const t = e.touches[0];
  draw(t.clientX - r.left, t.clientY - r.top);
  check();
}, { passive: false });

/* =====================================================
   BONUS POPUP (DISPLAY ONLY)
===================================================== */
const bonusPopup  = document.getElementById("bonusPopup");
const bonusReward = document.getElementById("bonusReward");
const bonusBtn    = document.getElementById("bonusBtn");

function showBonusPopup(reward) {
  if (!bonusPopup) return;
  bonusReward.innerText = `⚡ +${reward} Energy`;
  bonusPopup.classList.remove("hidden");
}

if (bonusBtn) {
  bonusBtn.onclick = () => {
    bonusPopup.classList.add("hidden");
  };
                        }
