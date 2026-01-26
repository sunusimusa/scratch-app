const wheel = document.getElementById("wheel");
const btn   = document.getElementById("spinBtn");
const txt   = document.getElementById("spinStatus");

let spinning = false;

// 🎁 Rewards (virtual only)
const rewards = [
  { label: "+5 Energy",  type: "energy", value: 5 },
  { label: "+10 Energy", type: "energy", value: 10 },
  { label: "+20 Points", type: "points", value: 20 },
  { label: "+1 Luck",    type: "luck",   value: 1 },
  { label: "+15 Energy", type: "energy", value: 15 },
  { label: "+50 Points", type: "points", value: 50 }
];

btn.addEventListener("click", () => {
  if (spinning) return;

  // 🔒 Daily lock (1 spin per day)
  const today = new Date().toDateString();
  const last  = localStorage.getItem("lastSpin");

  if (last === today) {
    txt.innerText = "⏳ Come back tomorrow";
    return;
  }

  spinning = true;
  btn.disabled = true;
  txt.innerText = "🎡 Spinning...";

  // 🎯 Pick reward
  const index = Math.floor(Math.random() * rewards.length);
  const anglePer = 360 / rewards.length;

  // 🔄 Spin animation (5 rounds)
  const rotateTo = 360 * 5 + (index * anglePer) + anglePer / 2;
  wheel.style.transition = "transform 4s cubic-bezier(.25,1,.5,1)";
  wheel.style.transform  = `rotate(${rotateTo}deg)`;

  setTimeout(() => {
    const r = rewards[index];

    txt.innerText = `🎉 You won ${r.label}`;
    localStorage.setItem("lastSpin", today);

    // ✅ APPLY REWARD (LOCAL / GAME ONLY)
    if (window.USER) {
      if (r.type === "energy") USER.energy += r.value;
      if (r.type === "points") USER.points += r.value;
      if (r.type === "luck")   USER.luck   += r.value;
      if (window.updateUI) updateUI();
    }

    spinning = false;
    btn.disabled = false;
  }, 4200);
});
