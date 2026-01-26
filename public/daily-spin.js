const wheel = document.getElementById("wheel");
const btn   = document.getElementById("spinBtn");
const txt   = document.getElementById("spinStatus");

let spinning = false;

// rewards (safe)
const rewards = [
  { label: "+5 Energy",  value: 5 },
  { label: "+10 Energy", value: 10 },
  { label: "+20 Points", value: 20 },
  { label: "+1 Luck",    value: 1 },
  { label: "+15 Energy", value: 15 },
  { label: "+50 Points", value: 50 }
];

btn.onclick = () => {
  if (spinning) return;

  // daily lock
  const last = localStorage.getItem("lastSpin");
  const today = new Date().toDateString();
  if (last === today) {
    txt.innerText = "⏳ Ka riga ka yi spin yau";
    return;
  }

  spinning = true;
  txt.innerText = "🎡 Spinning...";

  // random spin
  const index = Math.floor(Math.random() * rewards.length);
  const anglePer = 360 / rewards.length;
  const rotateTo =
    360 * 5 + (index * anglePer) + anglePer / 2;

  wheel.style.transform = `rotate(${rotateTo}deg)`;

  setTimeout(() => {
  const r = rewards[index];
  txt.innerText = `🎉 Ka samu ${r.label}`;
  localStorage.setItem("lastSpin", today);

  // ===== APPLY REWARD =====
  if (r.label.includes("Energy")) {
    USER.energy += r.value;
  }

  if (r.label.includes("Points")) {
    USER.points += r.value;
  }

  // sabunta UI
  if (window.updateUI) updateUI();

  spinning = false;
}, 4200);
