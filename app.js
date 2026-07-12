const STORAGE_KEY = "clutch-ledger-moments-v1";

const colors = {
  fire: "#ff4d5a",
  joy: "#f2b84b",
  pride: "#4ba3ff",
  nerves: "#9f7aea",
  respect: "#3ccf91"
};

const profiles = [
  { min: 86, label: "Obsession Mode", text: "This is the kind of passion that changes how you sit in the chair. High stakes, high heat, no casual viewing." },
  { min: 72, label: "Rivalry Heat", text: "The push is doing its job. The opponent matters, the moment matters, and every possession feels personal." },
  { min: 56, label: "Team Devotion", text: "This is steady loyalty. You care enough to track the details, not just the final score." },
  { min: 36, label: "Game Joy", text: "The love is present without becoming pressure. This is the clean reason people come back to a game." },
  { min: 0, label: "No entries", text: "Log a moment to see whether tonight is rivalry heat, devotion, joy, respect, or pressure." }
];

const sampleMoments = [
  {
    matchup: "Celtics vs Lakers",
    side: "Celtics",
    opponent: "Lakers",
    emotion: "fire",
    moment: "The late defensive stop felt better than a highlight. It was the rivalry showing its teeth.",
    intensity: 9,
    stakes: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 33).toISOString()
  },
  {
    matchup: "Sunday pickup run",
    side: "My squad",
    opponent: "The old heads",
    emotion: "respect",
    moment: "They kept punishing every lazy closeout. Annoying, but it made the game honest.",
    intensity: 7,
    stakes: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    matchup: "Coaching night",
    side: "The kids",
    opponent: "Pressure",
    emotion: "pride",
    moment: "One player made the extra pass without being reminded. That was the win.",
    intensity: 8,
    stakes: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  }
];

const form = document.querySelector("#moment-form");
const entriesEl = document.querySelector("#entries");
const emptyState = document.querySelector("#empty-state");
const passionScoreEl = document.querySelector("#passion-score");
const heatLabelEl = document.querySelector("#heat-label");
const countEl = document.querySelector("#moment-count");
const profileTextEl = document.querySelector("#profile-text");
const intensityEl = document.querySelector("#intensity");
const stakesEl = document.querySelector("#stakes");
const intensityValue = document.querySelector("#intensity-value");
const stakesValue = document.querySelector("#stakes-value");
const canvas = document.querySelector("#court");
const ctx = canvas.getContext("2d");

let moments = loadMoments();
let pulse = 0;

function loadMoments() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveMoments() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(moments));
}

function emotionWeight(emotion) {
  return {
    fire: 1.2,
    nerves: 1.12,
    pride: 1.05,
    joy: 0.95,
    respect: 0.9
  }[emotion] || 1;
}

function scoreMoment(moment) {
  const base = (Number(moment.intensity) * 6) + (Number(moment.stakes) * 4);
  return Math.min(100, Math.round(base * emotionWeight(moment.emotion)));
}

function computeScore() {
  if (!moments.length) return 0;
  const total = moments.reduce((sum, moment) => sum + scoreMoment(moment), 0);
  return Math.round(total / moments.length);
}

function profileFor(score) {
  return profiles.find((profile) => score >= profile.min) || profiles[profiles.length - 1];
}

function updateSliders() {
  intensityValue.value = intensityEl.value;
  stakesValue.value = stakesEl.value;
}

function renderSummary() {
  const score = computeScore();
  const profile = profileFor(score);
  passionScoreEl.textContent = String(score);
  heatLabelEl.textContent = profile.label;
  countEl.textContent = String(moments.length);
  profileTextEl.textContent = profile.text;
}

function renderEntries() {
  entriesEl.innerHTML = "";
  emptyState.hidden = moments.length > 0;

  moments
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((moment) => {
      const item = document.createElement("li");
      item.className = "entry";
      item.innerHTML = `
        <header>
          <div>
            <h3>${escapeHtml(moment.matchup)}</h3>
            <span class="metric-label">${escapeHtml(moment.side)}${moment.opponent ? " vs " + escapeHtml(moment.opponent) : ""}</span>
          </div>
          <span class="chip">${escapeHtml(moment.emotion)}</span>
        </header>
        <p>${escapeHtml(moment.moment)}</p>
        <div class="entry-meta">
          <span>Score ${scoreMoment(moment)}</span>
          <span>Intensity ${moment.intensity}/10</span>
          <span>Stakes ${moment.stakes}/10</span>
        </div>
      `;
      entriesEl.appendChild(item);
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function drawCourt() {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const wood = ctx.createLinearGradient(0, 0, width, height);
  wood.addColorStop(0, "#bf7436");
  wood.addColorStop(0.5, "#a85c2d");
  wood.addColorStop(1, "#d48b46");
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(255,245,226,0.72)";
  ctx.lineWidth = 5;
  ctx.strokeRect(34, 34, width - 68, height - 68);

  ctx.beginPath();
  ctx.moveTo(width / 2, 34);
  ctx.lineTo(width / 2, height - 34);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width / 2, height / 2, 86, 0, Math.PI * 2);
  ctx.stroke();

  drawHalfCourt(34, width / 2 - 34, height);
  drawHalfCourt(width - 34, -(width / 2 - 34), height);

  drawMoments();
  requestAnimationFrame(drawCourt);
}

function drawHalfCourt(originX, direction, height) {
  const sign = direction > 0 ? 1 : -1;
  const hoopX = originX + sign * 78;
  const hoopY = height / 2;

  ctx.strokeStyle = "rgba(255,245,226,0.7)";
  ctx.lineWidth = 4;

  ctx.strokeRect(originX, hoopY - 118, sign * 190, 236);
  ctx.strokeRect(originX, hoopY - 72, sign * 72, 144);

  ctx.beginPath();
  ctx.arc(hoopX, hoopY, 17, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(hoopX, hoopY, 168, -Math.PI / 2, Math.PI / 2, sign < 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(originX + sign * 190, hoopY, 70, -Math.PI / 2, Math.PI / 2, sign < 0);
  ctx.stroke();
}

function drawMoments() {
  const width = canvas.width;
  const height = canvas.height;
  pulse = (pulse + 0.025) % (Math.PI * 2);

  moments.forEach((moment, index) => {
    const score = scoreMoment(moment);
    const side = index % 2 === 0 ? 0.28 : 0.72;
    const x = width * side + Math.sin(index * 1.93) * 120;
    const y = height * (0.24 + ((index * 0.19) % 0.52));
    const radius = 8 + (score / 10) + Math.sin(pulse + index) * 2;

    ctx.beginPath();
    ctx.fillStyle = colors[moment.emotion] || "#fff";
    ctx.globalAlpha = 0.9;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    ctx.arc(x, y, radius + 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (!moments.length) {
    ctx.fillStyle = "rgba(16,17,19,0.5)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f5efe5";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Log the moment that made the game matter.", width / 2, height / 2);
  }
}

function render() {
  renderSummary();
  renderEntries();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  moments.push({
    matchup: data.get("matchup").trim(),
    side: data.get("side").trim(),
    opponent: data.get("opponent").trim(),
    emotion: data.get("emotion"),
    moment: data.get("moment").trim(),
    intensity: Number(data.get("intensity")),
    stakes: Number(data.get("stakes")),
    createdAt: new Date().toISOString()
  });
  saveMoments();
  form.reset();
  intensityEl.value = 7;
  stakesEl.value = 6;
  updateSliders();
  render();
});

document.querySelector("#clear-button").addEventListener("click", () => {
  moments = [];
  saveMoments();
  render();
});

document.querySelector("#seed-button").addEventListener("click", () => {
  moments = sampleMoments.slice();
  saveMoments();
  render();
});

document.querySelector("#export-button").addEventListener("click", async () => {
  await copyText(JSON.stringify(moments, null, 2));
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  const score = computeScore();
  const profile = profileFor(score);
  const top = moments.slice().sort((a, b) => scoreMoment(b) - scoreMoment(a))[0];
  const summary = moments.length
    ? `Clutch Ledger: ${moments.length} moments, passion score ${score}, profile ${profile.label}. Top moment: ${top.matchup} - ${top.moment}`
    : "Clutch Ledger: no moments logged yet.";
  await copyText(summary);
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

intensityEl.addEventListener("input", updateSliders);
stakesEl.addEventListener("input", updateSliders);

updateSliders();
render();
drawCourt();
