let USER = null;

const energyText = document.getElementById("energyText");
const pointsText = document.getElementById("pointsText");
const energyFill = document.getElementById("energyFill");
const status = document.getElementById("status");

/* INIT */
fetch("/api/user", { method:"POST", credentials:"include" })
.then(r=>r.json())
.then(d=>{
  USER=d;
  updateUI();
});

function updateUI(){
  energyText.innerText = "Energy: " + USER.energy;
  pointsText.innerText = "Points: " + USER.points;
  energyFill.style.width = Math.min(USER.energy*10,100)+"%";
}

/* SCRATCH */
scratchBtn.onclick = async ()=>{
  status.innerText="Scratching...";
  const r = await fetch("/api/scratch",{method:"POST",credentials:"include"});
  const d = await r.json();
  if(d.error) return status.innerText="No energy";
  USER.energy=d.energy;
  USER.points=d.points;
  updateUI();
  status.innerText="🎉 You won "+d.reward+" points";
};

/* ADS */
adsBtn.onclick = async ()=>{
  status.innerText="Watching ad...";
  setTimeout(async ()=>{
    const r = await fetch("/api/ads/watch",{method:"POST",credentials:"include"});
    const d = await r.json();
    if(d.error) return status.innerText="Limit reached";
    USER.energy=d.energy;
    updateUI();
    status.innerText="⚡ +2 Energy";
  },3000);
};

/* SPIN */
spinBtn.onclick = async () => {
  spinBtn.disabled = true;
  status.innerText = "🎡 Spinning...";

  const deg = 1440 + Math.floor(Math.random() * 360);
  wheel.style.transform = `rotate(${deg}deg)`;

  setTimeout(async () => {
    const r = await fetch("/api/spin", {
      method: "POST",
      credentials: "include"
    });
    const d = await r.json();

    if (d.error) {
      status.innerText = "⏳ Come back tomorrow";
      spinBtn.disabled = false;
      return;
    }

    USER.energy = d.energy;
    updateUI();
    status.innerText = `🎁 You won +${d.reward} energy`;
    spinBtn.disabled = false;
  }, 3000);
};

function initScratchCard() {
  const canvas = document.getElementById("scratchCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let scratching = false;

  // Cover
  ctx.fillStyle = "#999";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  function scratch(x, y) {
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  canvas.addEventListener("touchstart", e => {
    scratching = true;
  });

  canvas.addEventListener("touchend", e => {
    scratching = false;
    claimScratchReward(); // 👉 reward bayan an gama
  });

  canvas.addEventListener("touchmove", e => {
    if (!scratching) return;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches[0];
    scratch(t.clientX - rect.left, t.clientY - rect.top);
  });
}
