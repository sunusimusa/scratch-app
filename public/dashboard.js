/* =====================================================
   DASHBOARD.JS – READ ONLY (PLAY STORE SAFE)
===================================================== */

document.addEventListener("DOMContentLoaded", loadDashboard);

async function loadDashboard() {
  try {
    const res = await fetch("/api/dashboard", {
      credentials: "include"
    });

    const d = await res.json();
    if (!d || !d.success) throw new Error("Invalid response");

    /* ===== BASIC STATS ===== */
    setText("dEnergy", d.energy);
    setText("dPoints", d.points);
    setText("dGold", d.gold);
    setText("dDiamond", d.diamond);
    setText("dLevel", d.level);
    setText("dStreak", d.streak);
    setText("dAch", d.achievements);

    /* ===== LEVEL PROGRESS ===== */
    const levelPct = Math.min(100, ((d.points % 100) / 100) * 100);
    setBar("levelFill", levelPct);
    setText("levelPct", Math.round(levelPct) + "%");

    /* ===== LUCK ===== */
    const luckPct = Math.min(100, Number(d.luck) || 0);
    setBar("luckFill", luckPct);
    setText("luckPct", Math.round(luckPct) + "%");

    /* ===== META ===== */
    setText(
      "lastActive",
      d.lastActive ? new Date(d.lastActive).toLocaleString() : "—"
    );

    if (d.createdAt) {
      const days =
        Math.floor(
          (Date.now() - new Date(d.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
        ) || 0;

      setText("ageDays", `${days} days`);
    }

  } catch (err) {
    console.error("Dashboard error:", err);
    alert("❌ Failed to load dashboard");
  }
}

/* ================= HELPERS ================= */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value ?? 0;
}

function setBar(id, percent) {
  const el = document.getElementById(id);
  if (el) el.style.width = percent + "%";
}
