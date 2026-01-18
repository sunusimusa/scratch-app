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
