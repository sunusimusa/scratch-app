/* =====================================================
   SOUND SYSTEM – ANDROID / PLAY STORE SAFE (FINAL)
===================================================== */

let SOUND_UNLOCKED = false;

/* ================= UNLOCK AUDIO ================= */
function unlockSounds() {
  if (SOUND_UNLOCKED) return;

  const ids = [
    "clickSound",
    "winSound",
    "levelSound",
    "errorSound"
  ];

  ids.forEach(id => {
    const audio = document.getElementById(id);
    if (!audio) return;

    try {
      audio.muted = true;
      audio.play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {});
    } catch {}
  });

  SOUND_UNLOCKED = true;
  console.log("🔊 Sounds unlocked");
}

/* 🔓 unlock on FIRST interaction only */
document.addEventListener("click", unlockSounds, { once: true });
document.addEventListener("touchstart", unlockSounds, { once: true });

/* ================= PLAY SOUND ================= */
function playSound(id) {
  if (!SOUND_UNLOCKED) return;

  const audio = document.getElementById(id);
  if (!audio) return;

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

/* expose globally */
window.playSound = playSound;
