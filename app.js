const STORAGE_KEY = "clutch-receipts-v1";

const resultLabels = {
  pending: "Pending",
  cashed: "Cashed",
  "half-right": "Half-right",
  missed: "Missed",
  cope: "Shameless cope"
};

const resultColors = {
  cashed: "#3ccf91",
  "half-right": "#f2b84b",
  missed: "#ff4d5a",
  cope: "#9f7aea",
  pending: "#4ba3ff"
};

const state = loadState();

const gameForm = document.querySelector("#game-form");
const takeForm = document.querySelector("#take-form");
const modelForm = document.querySelector("#model-form");
const takeList = document.querySelector("#take-list");
const modelList = document.querySelector("#model-list");
const emptyState = document.querySelector("#empty-state");
const takeCountEl = document.querySelector("#take-count");
const hitRateEl = document.querySelector("#hit-rate");
const modelCountEl = document.querySelector("#model-count");
const receiptTextEl = document.querySelector("#receipt-text");
const receiptLinesEl = document.querySelector("#receipt-lines");
const teamAInput = document.querySelector("#team-a");
const teamBInput = document.querySelector("#team-b");
const teamALabel = document.querySelector("#team-a-label");
const teamBLabel = document.querySelector("#team-b-label");
const canvas = document.querySelector("#court");
const ctx = canvas.getContext("2d");

let pulse = 0;

function defaultState() {
  return {
    game: { teamA: "Celtics", teamB: "Lakers" },
    takes: [],
    quarters: [],
    modelCalls: []
  };
}

function loadState() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function quarterTotals(throughQuarter = 4) {
  return state.quarters
    .filter((quarter) => quarter.quarter <= throughQuarter)
    .reduce((totals, quarter) => {
      totals.a += quarter.aPoints;
      totals.b += quarter.bPoints;
      return totals;
    }, { a: 0, b: 0 });
}

function gradedTakes() {
  return state.takes.filter((take) => take.result !== "pending");
}

function receiptStats() {
  const graded = gradedTakes();
  const wins = state.takes.filter((take) => take.result === "cashed").length;
  const partial = state.takes.filter((take) => take.result === "half-right").length;
  const hitScore = graded.length ? Math.round(((wins + partial * 0.5) / graded.length) * 100) : 0;
  const biggestHit = state.takes.find((take) => take.result === "cashed")
    || state.takes.find((take) => take.result === "half-right")
    || null;
  return { graded, wins, partial, hitScore, biggestHit };
}

function projectFromQuarter(quarter) {
  const priorTotals = quarterTotals(quarter.quarter - 1);
  const currentMargin = (priorTotals.a + quarter.aPoints) - (priorTotals.b + quarter.bPoints);
  const quarterMargin = quarter.aPoints - quarter.bPoints;
  const fgEdge = quarter.aFg - quarter.bFg;
  const turnoverEdge = quarter.bTurnovers - quarter.aTurnovers;

  const nextMarginRaw = (quarterMargin * 0.42) + (currentMargin * 0.18) + (fgEdge * 0.11) + (turnoverEdge * 1.7);
  const nextMargin = Math.round(nextMarginRaw);
  const projectedFinalMargin = Math.round(currentMargin + (nextMargin * (4 - quarter.quarter)));
  const pace = Math.round((quarter.aPoints + quarter.bPoints) / 2);
  const nextA = Math.max(12, pace + Math.round(nextMargin / 2));
  const nextB = Math.max(12, pace - Math.round(nextMargin / 2));

  return {
    nextMargin,
    nextA,
    nextB,
    projectedFinalMargin,
    reasoning: [
      `Current margin after Q${quarter.quarter}: ${formatMargin(currentMargin)} ${state.game.teamA}.`,
      `Q${quarter.quarter} margin was ${formatMargin(quarterMargin)}; the model weights recent pressure, not just the scoreboard.`,
      `FG edge: ${formatMargin(fgEdge, false)} percentage points. Turnover edge: ${formatMargin(turnoverEdge, false)} possessions.`,
      `Formula: recent margin * 0.42 + current margin * 0.18 + FG edge * 0.11 + turnover edge * 1.7.`
    ]
  };
}

function gradeModelCalls() {
  state.modelCalls.forEach((call) => {
    const nextQuarter = state.quarters.find((quarter) => quarter.quarter === call.quarter + 1);
    if (nextQuarter && call.nextGrade === "pending") {
      const actual = nextQuarter.aPoints - nextQuarter.bPoints;
      const miss = Math.abs(call.nextMargin - actual);
      call.actualNextMargin = actual;
      call.nextGrade = miss <= 3 ? "cashed" : miss <= 7 ? "half-right" : "missed";
      call.nextReceipt = `Called Q${call.quarter + 1} ${formatMargin(call.nextMargin)}; actual was ${formatMargin(actual)}. Missed by ${miss}.`;
    }

    const finalTotals = quarterTotals(4);
    if (state.quarters.some((quarter) => quarter.quarter === 4) && call.finalGrade === "pending") {
      const actualFinal = finalTotals.a - finalTotals.b;
      const miss = Math.abs(call.projectedFinalMargin - actualFinal);
      call.actualFinalMargin = actualFinal;
      call.finalGrade = miss <= 5 ? "cashed" : miss <= 10 ? "half-right" : "missed";
      call.finalReceipt = `Projected final ${formatMargin(call.projectedFinalMargin)}; actual final was ${formatMargin(actualFinal)}. Missed by ${miss}.`;
    }
  });
}

function formatMargin(value, includeTeam = true) {
  const prefix = value > 0 ? "+" : "";
  if (!includeTeam) return `${prefix}${value}`;
  if (value === 0) return "even";
  return `${prefix}${value}`;
}

function renderSummary() {
  const stats = receiptStats();
  const modelGraded = state.modelCalls.filter((call) => call.nextGrade !== "pending" || call.finalGrade !== "pending").length;

  takeCountEl.textContent = String(state.takes.length);
  hitRateEl.textContent = `${stats.hitScore}%`;
  modelCountEl.textContent = String(state.modelCalls.length);

  receiptLinesEl.innerHTML = "";
  const lines = [];
  if (!state.takes.length && !state.modelCalls.length) {
    receiptTextEl.textContent = "Call a take or run the quarter model to start building a receipt.";
  } else {
    receiptTextEl.textContent = `${state.game.teamA} vs ${state.game.teamB}: receipts, not vibes.`;
    lines.push(`${stats.graded.length} graded take${stats.graded.length === 1 ? "" : "s"}: ${stats.wins} cashed, ${stats.partial} half-right.`);
    lines.push(`Hit rate counts half-right as half credit: ${stats.hitScore}%.`);
    if (stats.biggestHit) lines.push(`Best receipt so far: "${stats.biggestHit.text}" (${resultLabels[stats.biggestHit.result]}).`);
    if (state.modelCalls.length) lines.push(`${state.modelCalls.length} readable model call${state.modelCalls.length === 1 ? "" : "s"}, ${modelGraded} graded by later game data.`);
  }

  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    receiptLinesEl.appendChild(item);
  });
}

function renderTakes() {
  takeList.innerHTML = "";
  state.takes.forEach((take) => {
    const item = document.createElement("li");
    item.className = `entry ${take.result}`;
    item.innerHTML = `
      <header>
        <div>
          <h3>${escapeHtml(take.text)}</h3>
          <span class="metric-label">${escapeHtml(take.tag)} · ${escapeHtml(take.confidence)}</span>
        </div>
        <span class="chip">${resultLabels[take.result]}</span>
      </header>
      <div class="result-row" data-id="${take.id}">
        ${Object.entries(resultLabels).map(([value, label]) => `
          <button class="${take.result === value ? "active" : ""}" type="button" data-result="${value}">${label}</button>
        `).join("")}
      </div>
    `;
    takeList.appendChild(item);
  });
}

function renderModelCalls() {
  modelList.innerHTML = "";
  state.modelCalls.forEach((call) => {
    const grade = call.finalGrade !== "pending" ? call.finalGrade : call.nextGrade;
    const item = document.createElement("li");
    item.className = `entry ${grade}`;
    item.innerHTML = `
      <header>
        <div>
          <h3>Q${call.quarter} model call</h3>
          <span class="metric-label">Next quarter ${formatMargin(call.nextMargin)} · Final ${formatMargin(call.projectedFinalMargin)}</span>
        </div>
        <span class="chip">${resultLabels[grade] || "Pending"}</span>
      </header>
      <ul class="mini-receipts">
        ${call.reasoning.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        ${call.nextReceipt ? `<li>${escapeHtml(call.nextReceipt)}</li>` : ""}
        ${call.finalReceipt ? `<li>${escapeHtml(call.finalReceipt)}</li>` : ""}
      </ul>
    `;
    modelList.appendChild(item);
  });
}

function renderLabels() {
  teamAInput.value = state.game.teamA;
  teamBInput.value = state.game.teamB;
  teamALabel.textContent = state.game.teamA;
  teamBLabel.textContent = state.game.teamB;
}

function render() {
  gradeModelCalls();
  renderLabels();
  renderSummary();
  renderTakes();
  renderModelCalls();
  emptyState.hidden = state.takes.length > 0 || state.modelCalls.length > 0;
  saveState();
}

function positionFor(index) {
  const width = canvas.width;
  const height = canvas.height;
  const side = index % 2 === 0 ? 0.32 : 0.68;
  const x = width * side + Math.sin(index * 1.9) * 110;
  const y = height * (0.24 + ((index * 0.17) % 0.5));
  return { x, y };
}

function drawCourt() {
  const width = canvas.width;
  const height = canvas.height;
  pulse = (pulse + 0.022) % (Math.PI * 2);

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
  drawHoop(112, height / 2, 1);
  drawHoop(width - 112, height / 2, -1);

  const dots = [
    ...state.takes.map((take) => ({ result: take.result, size: take.confidence === "Legacy on the line" ? 21 : take.confidence === "Locked in" ? 17 : 13 })),
    ...state.modelCalls.map((call) => ({ result: call.finalGrade !== "pending" ? call.finalGrade : call.nextGrade, size: 18 }))
  ];

  dots.forEach((dot, index) => {
    const { x, y } = positionFor(index);
    const radius = dot.size + Math.sin(pulse + index) * 2;
    ctx.beginPath();
    ctx.fillStyle = resultColors[dot.result] || resultColors.pending;
    ctx.globalAlpha = 0.9;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.globalAlpha = 0.18;
    ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  if (!dots.length) {
    ctx.fillStyle = "rgba(16,17,19,0.5)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#f5efe5";
    ctx.font = "700 34px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Call it before the game scores it.", width / 2, height / 2);
    ctx.textAlign = "left";
  }

  requestAnimationFrame(drawCourt);
}

function drawHoop(x, y, direction) {
  ctx.strokeStyle = "rgba(255,245,226,0.7)";
  ctx.lineWidth = 4;
  ctx.strokeRect(x - (direction > 0 ? 78 : 112), y - 118, 190, 236);
  ctx.strokeRect(x - (direction > 0 ? 0 : 72), y - 72, 72, 144);
  ctx.beginPath();
  ctx.arc(x, y, 17, 0, Math.PI * 2);
  ctx.stroke();
}

function buildReceiptCard() {
  const stats = receiptStats();
  const card = document.createElement("canvas");
  card.width = 1080;
  card.height = 1080;
  const c = card.getContext("2d");

  c.fillStyle = "#101113";
  c.fillRect(0, 0, 1080, 1080);
  c.strokeStyle = "rgba(255,245,226,0.08)";
  c.lineWidth = 4;
  c.beginPath();
  c.arc(540, 1110, 430, Math.PI, Math.PI * 2);
  c.stroke();

  c.fillStyle = "#f2b84b";
  c.font = "800 32px system-ui, sans-serif";
  c.fillText("CLUTCH RECEIPTS", 80, 110);

  c.fillStyle = "#f5efe5";
  c.font = "900 72px system-ui, sans-serif";
  wrapText(c, `${state.game.teamA} vs ${state.game.teamB}`, 80, 210, 920, 78);

  c.fillStyle = "#aeb6bd";
  c.font = "700 38px system-ui, sans-serif";
  c.fillText(`${state.takes.length} takes · ${stats.hitScore}% hit rate · ${state.modelCalls.length} model calls`, 80, 340);

  let y = 450;
  Object.entries(resultLabels).forEach(([key, label]) => {
    const count = state.takes.filter((take) => take.result === key).length;
    c.fillStyle = resultColors[key];
    c.fillRect(80, y - 28, Math.max(8, count * 90), 34);
    c.fillStyle = "#f5efe5";
    c.font = "700 30px system-ui, sans-serif";
    c.fillText(`${label}: ${count}`, 80, y + 34);
    y += 84;
  });

  if (stats.biggestHit) {
    y += 30;
    c.fillStyle = "#f2b84b";
    c.font = "800 28px system-ui, sans-serif";
    c.fillText("BEST RECEIPT", 80, y);
    y += 50;
    c.fillStyle = "#f5efe5";
    c.font = "650 34px system-ui, sans-serif";
    wrapText(c, `"${stats.biggestHit.text}"`, 80, y, 900, 44);
  }

  const gradedModel = state.modelCalls.find((call) => call.nextReceipt || call.finalReceipt);
  if (gradedModel) {
    c.fillStyle = "#f2b84b";
    c.font = "800 28px system-ui, sans-serif";
    c.fillText("MODEL RECEIPT", 80, 900);
    c.fillStyle = "#f5efe5";
    c.font = "650 30px system-ui, sans-serif";
    wrapText(c, gradedModel.finalReceipt || gradedModel.nextReceipt, 80, 950, 900, 40);
  }

  c.fillStyle = "#aeb6bd";
  c.font = "700 24px system-ui, sans-serif";
  c.fillText("Transparent heuristic. Manual stats. No AI claims.", 80, 1030);
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

function downloadReceiptCard() {
  if (!state.takes.length && !state.modelCalls.length) return;
  const card = buildReceiptCard();
  card.toBlob((blob) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "clutch-receipts-card.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  });
}

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

gameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(gameForm);
  state.game.teamA = data.get("teamA").trim() || "Team A";
  state.game.teamB = data.get("teamB").trim() || "Team B";
  render();
});

takeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(takeForm);
  state.takes.unshift({
    id: makeId("take"),
    text: data.get("take").trim(),
    tag: data.get("tag"),
    confidence: data.get("confidence"),
    result: "pending",
    createdAt: new Date().toISOString()
  });
  takeForm.reset();
  render();
});

modelForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(modelForm);
  const quarter = {
    quarter: Number(data.get("quarter")),
    aPoints: Number(data.get("aPoints")),
    bPoints: Number(data.get("bPoints")),
    aFg: Number(data.get("aFg")),
    bFg: Number(data.get("bFg")),
    aTurnovers: Number(data.get("aTurnovers")),
    bTurnovers: Number(data.get("bTurnovers"))
  };
  state.quarters = state.quarters.filter((item) => item.quarter !== quarter.quarter).concat(quarter);
  state.quarters.sort((a, b) => a.quarter - b.quarter);

  if (quarter.quarter < 4) {
    const projection = projectFromQuarter(quarter);
    state.modelCalls.unshift({
      id: makeId("model"),
      quarter: quarter.quarter,
      nextMargin: projection.nextMargin,
      projectedNextScore: `${state.game.teamA} ${projection.nextA}, ${state.game.teamB} ${projection.nextB}`,
      projectedFinalMargin: projection.projectedFinalMargin,
      reasoning: projection.reasoning,
      nextGrade: "pending",
      finalGrade: "pending",
      createdAt: new Date().toISOString()
    });
  }
  render();
});

takeList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-result]");
  if (!button) return;
  const row = button.closest(".result-row");
  const take = state.takes.find((item) => item.id === row.dataset.id);
  if (!take) return;
  take.result = button.dataset.result;
  render();
});

document.querySelector("#seed-button").addEventListener("click", () => {
  Object.assign(state, {
    game: { teamA: "Celtics", teamB: "Lakers" },
    takes: [
      { id: makeId("take"), text: "Bench decides this game before the stars do.", tag: "Clutch call", confidence: "Locked in", result: "cashed", createdAt: new Date().toISOString() },
      { id: makeId("take"), text: "Tatum gets to 30 if the Lakers keep switching small.", tag: "Player prop", confidence: "Legacy on the line", result: "half-right", createdAt: new Date().toISOString() },
      { id: makeId("take"), text: "Lakers fans blame the whistle by halftime.", tag: "Rivalry talk", confidence: "Casual", result: "pending", createdAt: new Date().toISOString() }
    ],
    quarters: [
      { quarter: 1, aPoints: 31, bPoints: 24, aFg: 51, bFg: 43, aTurnovers: 3, bTurnovers: 6 },
      { quarter: 2, aPoints: 27, bPoints: 29, aFg: 45, bFg: 48, aTurnovers: 5, bTurnovers: 4 }
    ],
    modelCalls: []
  });
  const projection = projectFromQuarter(state.quarters[0]);
  state.modelCalls.unshift({
    id: makeId("model"),
    quarter: 1,
    nextMargin: projection.nextMargin,
    projectedNextScore: `${state.game.teamA} ${projection.nextA}, ${state.game.teamB} ${projection.nextB}`,
    projectedFinalMargin: projection.projectedFinalMargin,
    reasoning: projection.reasoning,
    nextGrade: "pending",
    finalGrade: "pending",
    createdAt: new Date().toISOString()
  });
  render();
});

document.querySelector("#clear-button").addEventListener("click", () => {
  Object.assign(state, defaultState());
  render();
});

document.querySelector("#export-button").addEventListener("click", async () => {
  await copyText(JSON.stringify(state, null, 2));
});

document.querySelector("#copy-summary").addEventListener("click", async () => {
  const stats = receiptStats();
  const summary = `Clutch Receipts: ${state.game.teamA} vs ${state.game.teamB}. ${state.takes.length} takes, ${stats.hitScore}% hit rate, ${state.modelCalls.length} readable model calls.`;
  await copyText(summary);
});

document.querySelector("#card-button").addEventListener("click", downloadReceiptCard);

render();
drawCourt();
