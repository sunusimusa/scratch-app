async function loadAchievements() {
  try {
    const res = await fetch("/api/achievements", {
      credentials: "include"
    });

    const data = await res.json();
    if (!data.success) return;

    renderAchievements(data.achievements);

  } catch (err) {
    console.log("Achievements load failed");
  }
}

function renderAchievements(list) {
  const box = document.getElementById("achievementsList");
  if (!box) return;

  box.innerHTML = "";

  list.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement " + (a.unlocked ? "unlocked" : "locked");

    div.innerHTML = `
      <div class="title">
        ${a.unlocked ? "🏆" : "🔒"} ${a.title}
      </div>
      <div class="desc">${a.desc}</div>
      <div class="reward">${a.reward}</div>
    `;

    box.appendChild(div);
  });
}

window.addEventListener("load", loadAchievements);
