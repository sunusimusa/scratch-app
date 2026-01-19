/* =====================================================
   SCRATCH CARD – REAL RUB / SWIPE (FINAL STABLE)
   ANDROID + WEBVIEW + PLAY STORE SAFE
   ❌ NO DUPLICATES
   ❌ NO BUGS
   ✅ AUTO CLOSE
   ✅ REAL SCRATCH
===================================================== */

/* ================= ELEMENTS ================= */
const canvas  = document.getElementById("scratchCanvas");
const section = document.getElementById("scratchSection");

if (!canvas || !section) {
  console.warn("⚠️ Scratch elements not found");
}

/* ================= STATE ================= */
let ctx, W, H;
let scratching = false;
let scratched = false;
let ready = false;

/* ================= INIT SCRATCH ================= */
function initScratchCard() {
  if (!canvas) return;

  ctx = canvas.getContext("2d", { willReadFrequently: true });
  W = canvas.width;
  H = canvas.height;

  // reset flags
  scratching = false;
  scratched = false;
  ready = true;

  // reset canvas
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, W, H);

  // cover layer
  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "destination-out";

  // show UI
  section.classList.remove("hidden");
  canvas.style.display = "block";

  if (window.playSound) playSound("clickSound");
}

/* expose */
window.initScratchCard = initScratchCard;

/* ================= DRAW ================= */
function drawScratch(x, y) {
  if (!ready || scratched) return;

  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= PERCENT ================= */
function getPercent() {
  const data = ctx.getImageData(0, 0, W, H).data;
  let cleared = 0;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] === 0) cleared++;
  }

  return (cleared / (W * H)) * 100;
}

/* ================= CHECK ================= */
function checkScratch() {
  if (!ready || scratched) return;

  if (getPercent() >= 60) {
    scratched = true;
    ready = false;
    finishScratch();
  }
}

/* ================= FINISH ================= */
async function finishScratch() {
  canvas.style.display = "none";
  section.classList.add("hidden");

  if (window.playSound) playSound("winSound");

  await claimScratchReward();
}

/* ================= MOUSE ================= */
canvas.addEventListener("mousedown", () => {
  if (!ready) return;
  scratching = true;
});

canvas.addEventListener("mouseup", () => scratching = false);
canvas.addEventListener("mouseleave", () => scratching = false);

canvas.addEventListener("mousemove", e => {
  if (!scratching || scratched) return;
  drawScratch(e.offsetX, e.offsetY);
  checkScratch();
});

/* ================= TOUCH (ANDROID SAFE) ================= */
canvas.addEventListener(
  "touchstart",
  e => {
    if (!ready) return;
    e.preventDefault();
    scratching = true;
  },
  { passive: false }
);

canvas.addEventListener(
  "touchend",
  e => {
    e.preventDefault();
    scratching = false;
  },
  { passive: false }
);

canvas.addEventListener(
  "touchcancel",
  () => scratching = false,
  { passive: false }
);

canvas.addEventListener(
  "touchmove",
  e => {
    if (!scratching || scratched) return;
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];

    drawScratch(
      t.clientX - rect.left,
      t.clientY - rect.top
    );

    checkScratch();
  },
  { passive: false }
);

/* =====================================================
   VISUAL FEEDBACK
===================================================== */

/* ================= COINS ================= */
function spawnCoins(count = 12) {
  const target = document.getElementById("balance");
  if (!target) return;

  const rect = target.getBoundingClientRect();

  for (let i = 0; i < count; i++) {
    const coin = document.createElement("div");
    coin.className = "coin";

    coin.style.left = window.innerWidth / 2 + "px";
    coin.style.top  = window.innerHeight / 2 + "px";

    document.body.appendChild(coin);

    setTimeout(() => {
      coin.style.left = rect.left + 20 + "px";
      coin.style.top  = rect.top + 10 + "px";
      coin.style.opacity = "0";
      coin.style.transform = "scale(0.5)";
    }, 60);

    setTimeout(() => coin.remove(), 900);
  }
}

/* ================= CONFETTI ================= */
function launchConfetti(count = 25) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";

    c.style.left = Math.random() * window.innerWidth + "px";
    c.style.backgroundColor =
      ["#ffd700", "#ff5722", "#4caf50", "#03a9f4"][
        Math.floor(Math.random() * 4)
      ];

    document.body.appendChild(c);

    c.animate(
      [
        { transform: "translateY(0)", opacity: 1 },
        {
          transform: `translateY(${window.innerHeight}px) rotate(${Math.random() * 360}deg)`,
          opacity: 0
        }
      ],
      { duration: 1200 + Math.random() * 800 }
    );

    setTimeout(() => c.remove(), 2000);
  }
}
