const STORAGE_KEY = "clutch-ledger-moments-v1";

const colors = {
  fire: "#ff4d5a",
  joy: "#f2b84b",
  pride: "#4ba3ff",
  nerves: "#9f7aea",
  respect: "#3ccf91"
};

const emotionLabels = {
  fire: "Fire",
  joy: "Joy",
  pride: "Pride",
  nerves: "Nerves",
  respect: "Respect"
};

const profileDefs = {
  obsession: { label: "Obsession Mode", text: "High stakes and high heat on almost every entry. This is the kind of passion that changes how you sit in the chair." },
  fire: { label: "Rivalry Heat", text: "The opponent is the fuel. The moments that move you are the ones where the push has a name and every possession feels personal." },
  nerves: { label: "Pressure Junkie", text: "You care most when the outcome is unsettled. The nerves are not a problem, they are the receipt that the game matters." },
  pride: { label: "Coach's Pride", text: "Your biggest moments are someone else doing it right. The win you track is growth you can point at." },
  respect: { label: "Respect Mode", text: "You log the opponent's best plays too. The game matters to you as a craft, not just a result." },
  joy: { label: "Game Joy", text: "The love shows up without needing pressure. This is the clean reason people come back to a game." },
  devotion: { label: "Team Devotion", text: "No single emotion owns your ledger. You show up for all of it, which is what steady loyalty looks like." },
  empty: { label: "No entries", text: "Log a moment to see whether tonight is rivalry heat, devotion, joy, respect, or pressure." }
};

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
const profileReceiptsEl = document.querySelector("#profile-receipts");
const intensityEl = document.querySelector("#intensity");
const stakesEl = document.querySelector("#stakes");
const intensityValue = document.querySelector("#intensity-value");
const stakesValue = document.querySelector("#stakes-value");
const replayButton = document.querySelector("#replay-button");
const replayCaption = document.querySelector("#replay-caption");
const canvas = document.querySelector("#court");
const ctx = canvas.getContext("2d");

let moments = loadMoments();
let pulse = 0;
let replay = null;

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

// The profile is earned from the pattern of entries, and every profile ships
// with its receipts: the evidence lines that justify the read. A profile the
// app cannot back with the ledger is a profile it does not get to claim.
function analyzeLedger() {
  if (!moments.length) {
    return { score: 0, profile: profileDefs.empty, receipts: [], counts: {} };
  }

  const counts = {};
  let intensityTotal = 0;
  let stakesTotal = 0;
  let namedOpponents = 0;

  moments.forEach((moment) => {
    counts[moment.emotion] = (counts[moment.emotion] || 0) + 1;
    intensityTotal += Number(moment.intensity);
    stakesTotal += Number(moment.stakes);
    if (moment.opponent) namedOpponents += 1;
  });

  const total = moments.length;
  const avgIntensity = intensityTotal / total;
  const avgStakes = stakesTotal / total;
  const score = computeScore();
  const [topEmotion, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const dominant = topCount / total > 0.4 ? topEmotion : null;

  let profile;
  if (score >= 85 && avgStakes >= 7.5) {
    profile = profileDefs.obsession;
  } else if (dominant) {
    profile = profileDefs[dominant];
  } else {
    profile = profileDefs.devotion;
  }

  const receipts = [];
  if (profile === profileDefs.obsession) {
    receipts.push(`Passion score ${score} with average stakes ${avgStakes.toFixed(1)}/10. Almost nothing on this ledger was casual.`);
  }
  receipts.push(dominant
    ? `${emotionLabels[dominant]} drove ${topCount} of ${total} moment${total === 1 ? "" : "s"}.`
    : `No single emotion owns the night: ${Object.entries(counts).map(([e, c]) => `${c} ${emotionLabels[e].toLowerCase()}`).join(", ")}.`);
  receipts.push(`Average intensity ${avgIntensity.toFixed(1)}/10, average stakes ${avgStakes.toFixed(1)}/10.`);

  const top = moments.slice().sort((a, b) => scoreMoment(b) - scoreMoment(a))[0];
  receipts.push(`Biggest moment: ${top.matchup} (${scoreMoment(top)}). "${top.moment}"`);

  if (total > 1 && namedOpponents >= Math.ceil(total / 2)) {
    receipts.push(`A named push shows up in ${namedOpponents} of ${total} moments. The opponent is part of why it matters.`);
  }

  return { score, profile, receipts, counts };
}

function updateSliders() {
  intensityValue.value = intensityEl.value;
  stakesValue.value = stakesEl.value;
}

function renderSummary() {
  const { score, profile, receipts } = analyzeLedger();
  passionScoreEl.textContent = String(score);
  heatLabelEl.textContent = profile.label;
  countEl.textContent = String(moments.length);
  profileTextEl.textContent = profile.text;

  profileReceiptsEl.innerHTML = "";
  receipts.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    profileReceiptsEl.appendChild(item);
  });
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

function positionFor(index) {
  const width = canvas.width;
  const height = canvas.height;
  const side = index % 2 === 0 ? 0.28 : 0.72;
  const x = width * side + Math.sin(index * 1.93) * 120;
  const y = height * (0.24 + ((index * 0.19) % 0.52));
  return { x, y };
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

  if (replay && replay.step > 0) {
    ctx.strokeStyle = "rgba(255,245,226,0.55)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    for (let step = 0; step <= replay.step; step += 1) {
      const point = positionFor(replay.order[step]);
      if (step === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  moments.forEach((moment, index) => {
    const score = scoreMoment(moment);
    const { x, y } = positionFor(index);
    const radius = 8 + (score / 10) + Math.sin(pulse + index) * 2;
    const isActive = replay && replay.order[replay.step] === index;
    const dimmed = replay && !isActive;

    ctx.beginPath();
    ctx.fillStyle = colors[moment.emotion] || "#fff";
    ctx.globalAlpha = dimmed ? 0.22 : 0.9;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.globalAlpha = dimmed ? 0.06 : 0.2;
    ctx.arc(x, y, radius + 13, 0, Math.PI * 2);
    ctx.fill();

    if (isActive) {
      ctx.beginPath();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = "#f2b84b";
      ctx.lineWidth = 4;
      ctx.arc(x, y, radius + 20 + Math.sin(pulse * 2) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });

  if (!moments.length) {
    ctx.fillStyle = "rgba(16,17,19,0.5)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f5efe5";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Log the moment that made the game matter.", width / 2, height / 2);
    ctx.textAlign = "left";
  }
}

function startReplay() {
  if (!moments.length || replay) return;
  const order = moments
    .map((moment, index) => index)
    .sort((a, b) => new Date(moments[a].createdAt) - new Date(moments[b].createdAt));
  replay = { order, step: 0, timer: null };
  replayButton.disabled = true;
  showReplayStep();
}

function showReplayStep() {
  const moment = moments[replay.order[replay.step]];
  replayCaption.hidden = false;
  replayCaption.innerHTML = `<strong>${escapeHtml(moment.matchup)} · ${emotionLabels[moment.emotion] || escapeHtml(moment.emotion)}</strong>${escapeHtml(moment.moment)}`;
  replay.timer = setTimeout(() => {
    replay.step += 1;
    if (replay.step >= replay.order.length) endReplay();
    else showReplayStep();
  }, 2200);
}

function endReplay() {
  if (!replay) return;
  clearTimeout(replay.timer);
  replay = null;
  replayCaption.hidden = true;
  replayButton.disabled = false;
}

// The film room card is rendered fresh from the ledger every time, so the
// shareable artifact can never disagree with the data behind it.
function buildFilmRoomCard() {
  const { score, profile, receipts, counts } = analyzeLedger();
  const card = document.createElement("canvas");
  card.width = 1080;
  card.height = 1080;
  const c = card.getContext("2d");

  c.fillStyle = "#101113";
  c.fillRect(0, 0, 1080, 1080);

  c.strokeStyle = "rgba(255,245,226,0.07)";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(540, 1120, 430, Math.PI, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(540, -60, 320, 0, Math.PI);
  c.stroke();

  c.textAlign = "left";
  c.fillStyle = "#f2b84b";
  c.font = "800 32px system-ui, sans-serif";
  c.fillText("CLUTCH LEDGER · FILM ROOM CARD", 80, 108);

  c.fillStyle = "#f5efe5";
  c.font = "900 88px system-ui, sans-serif";
  wrapText(c, profile.label, 80, 210, 920, 92);

  c.fillStyle = "#aeb6bd";
  c.font = "700 40px system-ui, sans-serif";
  c.fillText(`Passion score ${score} · ${moments.length} moment${moments.length === 1 ? "" : "s"}`, 80, 320);

  let y = 420;
  const total = moments.length || 1;
  Object.keys(colors).forEach((emotion) => {
    const count = counts[emotion] || 0;
    const barWidth = Math.round((count / total) * 660);
    c.fillStyle = "rgba(255,255,255,0.08)";
    c.fillRect(280, y - 26, 660, 34);
    if (barWidth) {
      c.fillStyle = colors[emotion];
      c.fillRect(280, y - 26, barWidth, 34);
    }
    c.fillStyle = "#f5efe5";
    c.font = "700 28px system-ui, sans-serif";
    c.fillText(emotionLabels[emotion], 80, y);
    c.textAlign = "right";
    c.fillText(String(count), 1000, y);
    c.textAlign = "left";
    y += 58;
  });

  y += 40;
  const top = moments.slice().sort((a, b) => scoreMoment(b) - scoreMoment(a))[0];
  if (top) {
    c.fillStyle = "#f2b84b";
    c.font = "800 26px system-ui, sans-serif";
    c.fillText("TOP MOMENT", 80, y);
    y += 46;
    c.fillStyle = "#f5efe5";
    c.font = "600 34px system-ui, sans-serif";
    y = wrapText(c, `"${top.moment}"`, 80, y, 920, 44);
    y += 14;
    c.fillStyle = "#aeb6bd";
    c.font = "700 28px system-ui, sans-serif";
    c.fillText(`${top.matchup} · score ${scoreMoment(top)}`, 80, y);
    y += 60;
  }

  const receipt = receipts[0];
  if (receipt) {
    c.fillStyle = "#f2b84b";
    c.font = "800 26px system-ui, sans-serif";
    c.fillText("THE RECEIPT", 80, y);
    y += 44;
    c.fillStyle = "#f5efe5";
    c.font = "600 30px system-ui, sans-serif";
    wrapText(c, receipt, 80, y, 920, 40);
  }

  c.fillStyle = "#aeb6bd";
  c.font = "700 26px system-ui, sans-serif";
  c.fillText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), 80, 1010);

  return card;
}

function wrapText(c, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(" ");
  let line = "";
  words.forEach((word) => {
    const attempt = line ? `${line} ${word}` : word;
    if (c.measureText(attempt).width > maxWidth && line) {
      c.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = attempt;
    }
  });
  if (line) c.fillText(line, x, y);
  return y;
}

function downloadFilmRoomCard() {
  if (!moments.length) return;
  const card = buildFilmRoomCard();
  card.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "clutch-ledger-film-room-card.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  });
}

function render() {
  endReplay();
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
  const { score, profile } = analyzeLedger();
  const top = moments.slice().sort((a, b) => scoreMoment(b) - scoreMoment(a))[0];
  const summary = moments.length
    ? `Clutch Ledger: ${moments.length} moments, passion score ${score}, profile ${profile.label}. Top moment: ${top.matchup} - ${top.moment}`
    : "Clutch Ledger: no moments logged yet.";
  await copyText(summary);
});

replayButton.addEventListener("click", startReplay);
document.querySelector("#card-button").addEventListener("click", downloadFilmRoomCard);

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
