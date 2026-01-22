let USER = {
  energy: 0,
  balance: 0,
  gold: 0,
  diamond: 0
};

const statusText = document.getElementById("statusText");

function showStatus(msg) {
  if (statusText) statusText.innerText = msg;
}

/* ===== LOAD USER DATA ===== */
async function loadUser() {
  try {
    const res = await fetch("/api/user", {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    USER.energy  = data.energy ?? 0;
    USER.balance = data.points ?? 0;
    USER.gold    = data.gold ?? 0;
    USER.diamond = data.diamond ?? 0;

    updateInventory();

  } catch {
    showStatus("❌ Failed to load user");
  }
}

/* ===== UPDATE INVENTORY ===== */
function updateInventory() {
  document.getElementById("invEnergy").innerText  = USER.energy;
  document.getElementById("invPoints").innerText  = USER.balance;
  document.getElementById("invGold").innerText    = USER.gold;
  document.getElementById("invDiamond").innerText = USER.diamond;
}

/* ===== BUY ITEM ===== */
async function buyItem(item) {
  showStatus("🛒 Processing purchase...");

  try {
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ item })
    });

    const data = await res.json();

    if (data.error) {
      if (data.error === "NOT_ENOUGH_POINTS") showStatus("❌ Babu isassun Points");
      else if (data.error === "NOT_ENOUGH_GOLD") showStatus("❌ Babu isasshen Gold");
      else if (data.error === "NOT_ENOUGH_DIAMOND") showStatus("❌ Babu isasshen Diamond");
      else showStatus("❌ Purchase failed");
      return;
    }

    // ✅ SYNC
    USER.energy  = data.energy;
    USER.balance = data.points;
    USER.gold    = data.gold;
    USER.diamond = data.diamond;

    updateInventory();
    showStatus(`✅ +${data.rewardEnergy} Energy added!`);

  } catch {
    showStatus("❌ Network error");
  }
}

/* 🔥 MUHIMMI: expose function */
window.buyItem = buyItem;

/* START */
loadUser();
