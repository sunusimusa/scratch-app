let DASH = {
  energy: 0,
  points: 0,
  gold: 0,
  diamond: 0,
  level: 1,
  streak: 0,
  achievements: 0
};

const statusEl = document.getElementById("dashStatus");

function setStatus(msg) {
  if (statusEl) statusEl.innerText = msg;
}

/* ================= LOAD USER ================= */
(async function loadDashboard() {
  try {
    const res = await fetch("/api/dashboard", { credentials: "include" });
    const d = await res.json();
    if (!d.success) throw 1;

    // BASIC
    set("dEnergy", d.energy);
    set("dPoints", d.points);
    set("dGold", d.gold);
    set("dDiamond", d.diamond);
    set("dLevel", d.level);
    set("dStreak", d.streak);
    set("dAch", d.achievements);

    // PROGRESS
    const levelPct = Math.min(100, ((d.points % 100) / 100) * 100);
    bar("levelFill", levelPct);
    text("levelPct", Math.round(levelPct) + "%");

    const luckPct = Math.min(100, d.luck || 0);
    bar("luckFill", luckPct);
    text("luckPct", Math.round(luckPct) + "%");

    // META
    text("lastActive", new Date(d.lastActive).toLocaleString());
    const days = Math.max(
      0,
      Math.floor((Date.now() - new Date(d.createdAt).getTime()) / (24*60*60*1000))
    );
    text("ageDays", days + " days");

  } catch {
    alert("Failed to load dashboard");
  }

  function set(id, v){ const el=document.getElementById(id); if(el) el.innerText=v; }
  function text(id, v){ set(id, v); }
  function bar(id, pct){
    const el=document.getElementById(id);
    if(el) el.style.width = pct + "%";
  }
})();
