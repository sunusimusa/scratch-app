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
spinBtn.onclick = async ()=>{
  wheel.style.transform="rotate(1440deg)";
  const r = await fetch("/api/spin",{method:"POST",credentials:"include"});
  const d = await r.json();
  if(d.error) return status.innerText="Come back tomorrow";
  USER.energy=d.energy;
  updateUI();
  status.innerText="🎁 Spin reward +"+d.reward;
};
