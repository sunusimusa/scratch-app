async function buy(item) {
  try {
    const res = await fetch("/api/shop/buy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ item })
    });

    const data = await res.json();

    if (data.error) {
      alert("❌ Not enough balance");
      return;
    }

    alert("✅ Purchase successful!");
    window.location.href = "/";

  } catch {
    alert("❌ Network error");
  }
}

function buyWithPoints() {
  buy("POINTS");
}

function buyWithGold() {
  buy("GOLD");
}

function buyWithDiamond() {
  buy("DIAMOND");
}
