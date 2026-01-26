let USER = null;

/* ELEMENTS */
const energyText = document.getElementById("energyText");
const pointsText = document.getElementById("pointsText");
const energyFill = document.getElementById("energyFill");
const statusMsg  = document.getElementById("statusMsg");

const scratchBtn = document.getElementById("scratchBtn");
const adsBtn     = document.getElementById("adsBtn");
const spinBtn    = document.getElementById("spinBtn");
const wheel      = document.getElementById("spinWheel");

/* ================= INIT USER ================= */
fetch("/api/user", { method:"POST", credentials:"include" })
.then(r => r.json())
.then(d => {
  USER = {
    energy: Number(d.energy) || 0,
    points: Number(d.points) || 0
  };
  updateUI();
});

/* ================= UI ================= */
function updateUI(){
  energyText.innerText = "Energy: " + USER.energy;
  pointsText.innerText = "Points: " + USER.points;
  energyFill.style.width = Math.min(USER.energy*2,100)+"%";
}

function showStatus(t){
  statusMsg.innerText = t;
  statusMsg.classList.remove("hidden");
}

/* ================= SCRATCH ================= */
scratchBtn.onclick = ()=>{
  document.getElementById("scratchSection").classList.remove("hidden");
  initScratchCard();
  showStatus("✋ Scratch with your finger");
};

async function claimScratchReward(){
  const r = await fetch("/api/scratch",{method:"POST",credentials:"include"});
  const d = await r.json();

  if(d.error){
    showStatus("⚡ No energy");
    return;
  }

  USER.energy = d.energy;
  USER.points = d.balance || d.points;

  updateUI();
  showStatus("🎉 You won reward!");
}

/* 👉 SCRATCH CANVAS (SWIPE WORKING) */
function initScratchCard() {
  const canvas = document.getElementById("scratchCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let scratching = false;

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#999";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  function scratch(x,y){
    ctx.globalCompositeOperation="destination-out";
    ctx.beginPath();
    ctx.arc(x,y,25,0,Math.PI*2);
    ctx.fill();
  }

  canvas.ontouchstart = ()=> scratching=true;

  canvas.ontouchmove = e=>{
    if(!scratching) return;
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    scratch(t.clientX-r.left, t.clientY-r.top);
  };

  canvas.ontouchend = ()=>{
    scratching=false;
    claimScratchReward();
  };
}

/* ================= ADS ================= */
adsBtn.onclick = ()=>{
  showStatus("📺 Watching ad...");
  setTimeout(async ()=>{
    const r = await fetch("/api/ads/watch",{method:"POST",credentials:"include"});
    const d = await r.json();
    if(d.error) return showStatus("❌ Limit reached");

    USER.energy=d.energy;
    updateUI();
    showStatus("⚡ +2 Energy");
  },3000);
};

/* ================= SPIN ================= */
spinBtn.onclick = () => {
  spinBtn.disabled = true;
  status.innerText = "🎡 Spinning...";

  const rewards = [
    { text:"+2 Energy", energy:2 },
    { text:"+5 Points", points:5 },
    { text:"+10 Points", points:10 },
    { text:"+3 Energy", energy:3 },
    { text:"+20 Points", points:20 },
    { text:"+1 Diamond", diamond:1 }
  ];

  const index = Math.floor(Math.random()*rewards.length);
  const angle = 360*5 + index*(360/rewards.length);

  wheel.style.transform = `rotate(${angle}deg)`;

  setTimeout(()=>{
    const r = rewards[index];

    if(r.energy) USER.energy += r.energy;
    if(r.points) USER.points += r.points;

    updateUI();
    status.innerText = `🎁 You won ${r.text}`;
    spinBtn.disabled = false;
  },4000);
};
