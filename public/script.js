/* =====================================================
   SCRATCH CARD – REAL RUB / SWIPE
   ANDROID + WEBVIEW SAFE
===================================================== */

const canvas = document.getElementById("scratchCanvas");
const section = document.getElementById("scratchSection");

let ctx, W, H;
let scratching = false;
let scratchedDone = false;

/* ================= INIT ================= */
function initScratchCard() {
  if (!canvas) return;

  ctx = canvas.getContext("2d");
  W = canvas.width;
  H = canvas.height;

  // cover
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#9e9e9e";
  ctx.fillRect(0, 0, W, H);

  ctx.globalCompositeOperation = "destination-out";
  scratchedDone = false;

  section.classList.remove("hidden");
}

/* ================= DRAW ================= */
function scratch(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.fill();
}

/* ================= CHECK % ================= */
function scratchedPercent() {
  const img = ctx.getImageData(0, 0, W, H).data;
  let cleared = 0;

  for (let i = 3; i < img.length; i += 4) {
    if (img[i] === 0) cleared++;
  }

  return (cleared / (W * H)) * 100;
}

function checkScratch() {
  if (scratchedDone) return;

  if (scratchedPercent() >= 60) {
    scratchedDone = true;
    finishScratch();
  }
}

/* ================= FINISH ================= */
async function finishScratch() {
  section.classList.add("hidden");
  await claimScratchReward();
}

/* ================= MOUSE ================= */
canvas.addEventListener("mousedown", () => scratching = true);
canvas.addEventListener("mouseup", () => scratching = false);
canvas.addEventListener("mousemove", e => {
  if (!scratching || scratchedDone) return;
  scratch(e.offsetX, e.offsetY);
  checkScratch();
});

/* ================= TOUCH (ANDROID) ================= */
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  scratching = true;
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  scratching = false;
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (!scratching || scratchedDone) return;

  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];

  scratch(
    t.clientX - rect.left,
    t.clientY - rect.top
  );

  checkScratch();
}, { passive: false });


/* ================= COIN FLY ================= */
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
    }, 50);

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




