/*************************************************
 * State
 *************************************************/
let cards = [];        // CSVから読み込んだ全カード
let cardsByMode = []; // 出題用（動画順など）
let index = 0;
let revealed = false;

let currentAnswer = "";
let currentJp = "";

/*************************************************
 * DOM
 *************************************************/
const jpEl = document.getElementById("jp");
const enEl = document.getElementById("en");
const cardEl = document.getElementById("card");
const nextBtn = document.getElementById("next");
const videoBtn = document.getElementById("videoOrder");

/*************************************************
 * CSV Loader
 *************************************************/
async function loadCSV() {
  const res = await fetch("data.csv");
  const text = await res.text();
  cards = parseCSV(text);

  // 初期モード：動画順
  cardsByMode = getCardsByVideoOrder();
  render();
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  lines.shift(); // header

  return lines.map(line => {
    const cols = splitCSV(line);

    const no = Number(cols[0]);
    const jp = cols[1];
    const en = cols[2];
    const slotsRaw = cols[3];
    const video = cols[4];
    const lv = Number(cols[5]);

    let slots = null;
    if (slotsRaw) {
      slots = slotsRaw.split("|").map(s => {
        const [jpSlot, enSlot] = s.split("=");
        return { jp: jpSlot, en: enSlot };
      });
    }

    return { no, jp, en, slots, video, lv };
  });
}

// Safari対応CSV split
function splitCSV(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;

  for (let c of line) {
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map(s => s.replace(/^"|"$/g, ""));
}

/*************************************************
 * Mode helpers
 *************************************************/
function getCardsByVideoOrder() {
  return [...cards].sort((a, b) => a.no - b.no);
}

/*************************************************
 * Card Logic
 *************************************************/
function pickSlot(card) {
  if (!card.slots) return null;
  const i = Math.floor(Math.random() * card.slots.length);
  return card.slots[i];
}

function render() {
  if (!cardsByMode.length) return;

  const card = cardsByMode[index];
  const slot = pickSlot(card);

  if (slot) {
    currentJp = card.jp.replace("{x}", slot.jp);
    currentAnswer = card.en.replace("{x}", slot.en);

    jpEl.textContent = currentJp;
    enEl.textContent = revealed
      ? currentAnswer
      : card.en.replace("{x}", "___");
  } else {
    currentJp = card.jp;
    currentAnswer = card.en;

    jpEl.textContent = currentJp;
    enEl.textContent = revealed ? currentAnswer : "タップして答え";
  }
}

/*************************************************
 * Events
 *************************************************/
cardEl.addEventListener("click", () => {
  revealed = !revealed;
  enEl.textContent = revealed ? currentAnswer : "タップして答え";
});

nextBtn.addEventListener("click", () => {
  index = (index + 1) % cardsByMode.length;
  revealed = false;
  render();
});

videoBtn?.addEventListener("click", () => {
  cardsByMode = getCardsByVideoOrder();
  index = 0;
  revealed = false;
  render();
});

/*************************************************
 * Init
 *************************************************/
loadCSV();
