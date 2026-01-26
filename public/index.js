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
spinBtn.onclick = async ()=>{
  spinBtn.disabled=true;
  showStatus("🎡 Spinning...");

  const deg = 1440 + Math.floor(Math.random()*360);
  wheel.style.transition="transform 3s ease-out";
  wheel.style.transform=`rotate(${deg}deg)`;

  setTimeout(async ()=>{
    const r = await fetch("/api/spin",{method:"POST",credentials:"include"});
    const d = await r.json();

    if(d.error){
      showStatus("⏳ Come back tomorrow");
    }else{
      USER.energy=d.energy;
      updateUI();
      showStatus("🎁 You won +"+d.reward+" energy");
    }

    spinBtn.disabled=false;
  },3000);
};
