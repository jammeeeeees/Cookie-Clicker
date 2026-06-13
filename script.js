let game = {
  cookies: 0,
  cps: 0,
  prestige: 1,

  autoClickers: 0,

  upgrades: {
    cursor: { owned: 0, baseCost: 10, cps: 0.1 },
    grandma: { owned: 0, baseCost: 50, cps: 1 },
    farm: { owned: 0, baseCost: 200, cps: 5 },
    autoclicker: { owned: 0, baseCost: 100, cps: 0 }
  },

  achievements: []
};

/* ELEMENTS */
const cookie = document.getElementById("cookie");
const cookieCount = document.getElementById("cookieCount");
const cpsDisplay = document.getElementById("cps");
const upgradesContainer = document.getElementById("upgrades");

const achievementBox = document.getElementById("achievement");

const achBtn = document.getElementById("achBtn");
const saveBtn = document.getElementById("saveBtn");

const achMenu = document.getElementById("achMenu");
const achList = document.getElementById("achList");
const closeAch = document.getElementById("closeAch");

/* SAVE LOAD SAFE */
const saved = localStorage.getItem("cookieSave");

if (saved) {
  try {
    const data = JSON.parse(saved);

    game.cookies = Number(data.cookies) || 0;
    game.cps = Number(data.cps) || 0;
    game.prestige = Number(data.prestige) || 1;
    game.autoClickers = Number(data.autoClickers) || 0;

    if (data.upgrades) {
      for (let k in game.upgrades) {
        if (data.upgrades[k]) {
          game.upgrades[k].owned = Number(data.upgrades[k].owned) || 0;
        }
      }
    }

    if (Array.isArray(data.achievements)) {
      game.achievements = data.achievements;
    }

  } catch (e) {}
}

/* AUTO SAVE */
setInterval(() => {
  localStorage.setItem("cookieSave", JSON.stringify(game));
}, 5000);

/* MANUAL SAVE BUTTON */
saveBtn.onclick = () => {
  localStorage.setItem("cookieSave", JSON.stringify(game));
  showAch("Game Saved!");
};

/* ACH MENU OPEN/CLOSE */
achBtn.onclick = () => {
  achMenu.classList.remove("hidden");
  renderAchievements();
};

closeAch.onclick = () => {
  achMenu.classList.add("hidden");
};

/* RENDER ACH LIST */
function renderAchievements() {
  achList.innerHTML = "";

  if (game.achievements.length === 0) {
    achList.innerHTML = "<p>No achievements yet</p>";
    return;
  }

  game.achievements.forEach(a => {
    const div = document.createElement("div");
    div.textContent = "🏆 " + a;
    achList.appendChild(div);
  });
}

/* CPS */
function calcCPS() {
  let cps = 0;

  for (let k in game.upgrades) {
    cps += game.upgrades[k].owned * game.upgrades[k].cps;
  }

  cps += game.autoClickers * 1;

  game.cps = cps * game.prestige;
}

/* UI */
function updateUI() {
  cookieCount.textContent = `Cookies: ${Math.floor(game.cookies)}`;
  cpsDisplay.textContent = `Per Second: ${game.cps.toFixed(1)}`;
}

/* COOKIE CLICK */
cookie.onclick = (e) => {
  game.cookies++;

  spawnFloat("+1", e.pageX, e.pageY);

  playTapSound();
  checkAchievements();
  updateUI();
};

/* FLOAT */
function spawnFloat(text, x, y) {
  const el = document.createElement("div");
  el.className = "float";
  el.textContent = text;
  el.style.left = x + "px";
  el.style.top = y + "px";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

/* COST */
function cost(type) {
  const u = game.upgrades[type];
  return Math.floor(u.baseCost * Math.pow(1.15, u.owned));
}

/* BUY */
function buy(type) {
  const c = cost(type);

  if (game.cookies >= c) {
    game.cookies -= c;
    game.upgrades[type].owned++;

    if (type === "autoclicker") {
      game.autoClickers++;
      unlock("Auto Clicker Owner", true);
    }

    calcCPS();
    render();
    updateUI();

    playCashSound();
  }
}

/* SHOP */
function render() {
  upgradesContainer.innerHTML = "";

  for (let k in game.upgrades) {
    const u = game.upgrades[k];
    const c = cost(k);

    const div = document.createElement("div");
    div.className = "upgrade";

    div.innerHTML = `
      ${k.toUpperCase()}<br>
      Cost: ${c}<br>
      Owned: ${u.owned}
    `;

    div.onclick = () => buy(k);
    upgradesContainer.appendChild(div);
  }
}

/* LOOP */
setInterval(() => {
  calcCPS();

  game.cookies += game.cps / 10;
  game.cookies += game.autoClickers * 0.2;

  updateUI();
}, 100);

/* AUDIO */
let ctx;

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function playTapSound() {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();

  o.frequency.value = 180;
  o.type = "triangle";

  g.gain.value = 0.15;

  o.connect(g);
  g.connect(c.destination);

  o.start();
  o.stop(c.currentTime + 0.08);
}

function playCashSound() {
  const c = audio();
  const g = c.createGain();

  const o1 = c.createOscillator();
  const o2 = c.createOscillator();

  o1.frequency.value = 880;
  o2.frequency.value = 1320;

  g.gain.value = 0.2;

  o1.connect(g);
  o2.connect(g);
  g.connect(c.destination);

  o1.start();
  o2.start();

  o1.stop(c.currentTime + 0.12);
  o2.stop(c.currentTime + 0.25);
}

/* =========================
   ACHIEVEMENTS SYSTEM
========================= */
function checkAchievements() {
  unlock("First Cookie", game.cookies >= 1);
  unlock("100 Cookies", game.cookies >= 100);
  unlock("1K Cookies", game.cookies >= 1000);
}

function unlock(name, condition) {
  if (condition && !game.achievements.includes(name)) {
    game.achievements.push(name);
    showAch(name);
  }
}

function showAch(text) {
  achievementBox.textContent = "🏆 " + text;
  achievementBox.classList.remove("hidden");

  setTimeout(() => {
    achievementBox.classList.add("hidden");
  }, 2000);
}

/* INIT */
render();
calcCPS();
updateUI();