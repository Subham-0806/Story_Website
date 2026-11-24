import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, doc, query, orderBy, where, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// PASTE YOUR firebaseConfig HERE (from Firebase Project settings)
const firebaseConfig = {
  apiKey: "AIzaSyBuwKaueiiWr3y2-Iox8ygCXKmzEAWCLL4",
  authDomain: "moonlit-pages-cd638.firebaseapp.com",
  projectId: "moonlit-pages-cd638",
  storageBucket: "moonlit-pages-cd638.appspot.com",
  messagingSenderId: "1054480812345",
  appId: "1:1054480812345:web:1234567890abcdef"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const $ = s => document.querySelector(s);
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const genres = ["Horror", "Fantasy", "Mystery", "Adventure"];
let genre = "Horror", isAdmin = false, stories = [], shayari = [], current = null;


const acc = { horror: "#e5253a", fantasy: "#b57bff", mystery: "#3fbf8f", adventure: "#f5a623", shayari: "#e8d28f" };
const tag = { horror: "Don't read alone.", fantasy: "Step through the portal.", mystery: "Every clue lies.", adventure: "The map is only the start." };
const Q = {
  home: ["Somewhere between the first line and the last, you become someone else for a while.", "Every platform here opens into a different night.", "Read slowly. The dark has all the time in the world.", "Words are small, until they are the only light in the room."],
  horror: ["The scariest sound is the one you hear after the story ends.", "It was never the dark. It was what the dark remembered."],
  fantasy: ["Magic is just the world, noticed properly.", "Every map has an edge. Every edge has a door."],
  mystery: ["The truth was in the room. So was the liar.", "A clue is just a lie that forgot to hide."],
  adventure: ["The road does not ask if you are ready.", "Somewhere past the last page, the real journey begins."],
  shayari: ["चाँद ने पूछा, इतनी रात गए क्यों जागे हो?\nमैंने कहा, कुछ अल्फ़ाज़ अब तक अधूरे हैं।", "कुछ बातें लफ़्ज़ों में नहीं आतीं,\nइसीलिए तो शायरी बनती है।"]
};
const chip = { horror: "Warning: not recommended after midnight", fantasy: "The realm is open", mystery: "Case file No. 0001", adventure: "Expedition log" };
const EMPTY = {
  horror: "The shelves are silent. Something is still being written in the dark.",
  fantasy: "The scrolls are still being enchanted.",
  mystery: "No cases on the desk. The detective is out, chasing a lie.",
  adventure: "The map is blank. The first expedition has not left yet."
};
const GL = { horror: "\u2020", fantasy: "\u2727", mystery: "\u25C8", adventure: "\u2736", shayari: "\u263E" };
const roman = n => { let r = ""; for (const [v, s] of [[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]]) while (n >= v) { r += s; n -= v; } return r; };
function setBg(w) { const a = w && document.querySelector(`#arts [data-art=${w}] svg`); $("#world-bg").innerHTML = a ? a.outerHTML : ""; }
const RS = { horror: "\u2620", fantasy: "\u2605", mystery: "\u25CE", adventure: "\u2736", shayari: "\u2665" };
function buildRate(th) {
  const r = $("#r-rating"); r.dataset.v = 5;
  const paint = v => r.querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.v <= v));
  r.innerHTML = [1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" title="${i} of 5">${RS[th]}</button>`).join("");
  paint(5);
  r.onclick = e => { const b = e.target.closest("button"); if (b) { r.dataset.v = b.dataset.v; paint(+b.dataset.v); } };
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const AMB = {
  home: [["ff", 16], ["pgfall", 6]],
  horror: [["eyes", 6], ["spider", 3]], fantasy: [["wisp", 7], ["rune", 7]],
  mystery: [["qmark", 7], ["fp", 10]], adventure: [["route", 1], ["seed", 10], ["bird", 2]], shayari: [["word", 6], ["ripple", 4]]
};
const INIT = {
  rune: e => e.textContent = pick(["\u2726", "\u2727", "\u263E", "\u2736", "\u2756", "\u273A", "\u2606"]),
  word: e => e.textContent = pick(["\u0907\u0936\u094D\u0915\u093C", "\u091A\u093E\u0901\u0926", "\u0916\u093C\u094D\u0935\u093E\u092C", "\u0930\u093E\u0924", "\u0926\u093F\u0932", "love", "moon", "midnight"]),
  qmark: e => e.textContent = "?",
  fp: (e, i, n) => { e.style.setProperty("--x", (4 + i * (90 / n)) + "%"); e.style.setProperty("--y", (i % 2 ? 6 : 11) + "%"); e.style.setProperty("--d", (i * .9) + "s"); },
  route: e => { e.innerHTML = '<svg viewBox="0 0 400 120"><path d="M6 100C70 20 130 120 200 60S330 20 394 80"/><text x="378" y="100">\u2715</text></svg>'; }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

function setTheme(t) {
  document.body.dataset.theme = t;
  if (typeof BGS !== "undefined") { $("#bg").innerHTML = BGS[t] || BGS.home; if (t === "home") moonPhase(); }
  const amb = $("#amb"); amb.innerHTML = "";
  for (const [k, n] of AMB[t] || []) for (let i = 0; i < n; i++) {
    const e = document.createElement("b"); e.className = k;
    e.style.cssText = `--x:${Math.random() * 100}%;--y:${10 + Math.random() * 70}%;--s:${0.6 + Math.random() * 1.2};--t:${14 + Math.random() * 16}s;--d:-${Math.random() * 20}s`;
    if (INIT[k]) INIT[k](e, i, n);
    amb.appendChild(e);
  }
  const fx = $("#fx"); fx.innerHTML = "";
  for (let i = 0; i < (t === "mystery" ? 0 : t === "home" ? 14 : 22); i++) {
    const e = document.createElement("i");
    e.style.cssText = `--x:${Math.random() * 100}%;--y:${Math.random() * 100}%;--s:${2 + Math.random() * 5}px;--t:${4 + Math.random() * 8}s;--d:-${Math.random() * 10}s`;
    fx.appendChild(e);
  }
}

function go(view, theme) {
  scrollMem[lastView + (lastView === "library" ? ":" + genre : "")] = scrollY;
  const back = view === "library" && lastView === "reader"; lastView = view;
  document.querySelectorAll(".view").forEach(v => v.classList.toggle("on", v.id === view));
  if (view === "library") { setTheme(genre.toLowerCase()); renderLibrary(); }
  else setTheme(theme || { diary: "shayari" }[view] || "home");
  document.body.classList.toggle("reading", view === "reader");
  setBg(view === "library" ? genre.toLowerCase() : view === "diary" ? "shayari" : view === "reader" ? theme : "");
  $("#home").hidden = view === "gate"; $("#corner").hidden = view !== "gate"; document.body.classList.toggle("home", view === "gate");
  if (view !== "reader" && "speechSynthesis" in window) speechSynthesis.cancel();
  scrollTo(0, back ? (scrollMem["library:" + genre] || 0) : 0);
}

async function enter(view, theme, e) {
  const c = $("#curtain");
  if (view === "library") genre = genres.find(g => g.toLowerCase() === theme) || genre;
  if (document.body.classList.contains("calm")) { go(view, theme); markDeck(theme); return; }
  c.style.setProperty("--cx", (e?.clientX ?? innerWidth / 2) + "px");
  c.style.setProperty("--cy", (e?.clientY ?? innerHeight / 2) + "px");
  STING[theme]?.(); c.dataset.w = theme; c.innerHTML = CURT[theme] || ""; c.className = "go";
  const [swap, total] = SW[theme] || [820, 1000];
  await sleep(swap); go(view, theme); markDeck(theme);
  await sleep(total - swap);
  c.className = "out"; await sleep(650); c.className = ""; c.innerHTML = "";
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-go]");
  if (b) return go(b.dataset.go);
  const w = e.target.closest("[data-world]");
  if (!w) return;
  const isDoor = w.classList.contains("tarot");
  if (isDoor) { w.classList.add("flip"); await sleep(document.body.classList.contains("calm") ? 0 : 880); }
  await enter(w.dataset.world === "shayari" ? "diary" : "library", w.dataset.world, e);
  if (isDoor) w.classList.remove("flip");
});

async function loadAll() {
  try {
    const get = async col => {
      const src = isAdmin ? collection(db, col) : query(collection(db, col), where("draft", "==", false));
      const snap = await getDocs(src);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0));
    };
    stories = await get("stories"); shayari = await get("shayari");
  } catch (err) { console.error(err); }
  loadedOnce = true; renderLibrary(); renderDiary();
}

function renderLibrary() {
  renderLibrary0(); if (!loadedOnce) $("#story-list").innerHTML = SKEL;
  const f = stories.find(s => s.genre === genre); $("#peek").innerHTML = f ? peekHTML(f) : "";
}
function renderLibrary0() {
  $("#genre-title").textContent = genre;
  $("#genre-tag").textContent = tag[genre.toLowerCase()] || "";
  $("#genre-quote").textContent = pick(Q[genre.toLowerCase()]);
  const g = genre.toLowerCase();
  $("#chip").textContent = chip[g];
  $("#bart").innerHTML = WIDE[g];
  $("#tabs").innerHTML = genres.map(g => `<button class="${g === genre ? "on" : ""}" data-genre="${g}">${g}</button>`).join("");
  const list = stories.filter(s => s.genre === genre);
  $("#story-list").innerHTML = list.length ? list.map((s, i) => `
    <article class="row${s.id === lastRead ? " last" : ""}" data-id="${s.id}" style="--i:${i}">
      <span class="rno">${String(i + 1).padStart(2, "0")}</span>
      <h3>${esc(s.title)}</h3>
      <small>${Math.max(1, Math.round((s.body || "").split(/\s+/).length / 200))} min read</small>
      ${isAdmin ? `${s.draft ? '<span class="draft">DRAFT</span>' : ""}<span class="adm"><button data-edit="stories:${s.id}">Edit</button><button data-del="stories:${s.id}">Delete</button></span>` : ""}
    </article>`).join("") : `<div class="slot"><div><div class="gl">${GL[genre.toLowerCase()]}</div>${EMPTY[genre.toLowerCase()]}</div></div>`;
}

function renderDiary() {
  $("#diary-quote").textContent = pick(Q.shayari);
  $("#shayari-list").innerHTML = shayari.length ? shayari.map((s, i) => `
    <div class="page" style="--i:${i}">${lines(s.body)}<small>${esc(s.mood || "")}</small><button class="sharebtn" data-share="${s.id}">Share as image</button>
    ${isAdmin ? `${s.draft ? '<span class="draft">DRAFT</span>' : ""}<span class="adm"><button data-edit="shayari:${s.id}">Edit</button><button data-del="shayari:${s.id}">Delete</button></span>` : ""}</div>`).join("") : `<p class="empty">The diary is empty for now.</p>`;
  renderSotd(); observeLines();
}

$("#tabs").addEventListener("click", e => {
  const g = e.target.dataset.genre;
  if (g && g !== genre) enter("library", g.toLowerCase(), e);
});

$("#story-list").addEventListener("click", async e => {
  const del = e.target.dataset.del, ed = e.target.dataset.edit;
  if (ed) return startEdit(...ed.split(":"));
  if (del) return remove(del);
  const card = e.target.closest(".row");
  if (card) openStory(card.dataset.id, e);
});
$("#shayari-list").addEventListener("click", e => {
  if (e.target.dataset.share) return openShare(e.target.dataset.share);
  if (e.target.dataset.edit) return startEdit(...e.target.dataset.edit.split(":"));
  if (e.target.dataset.del) remove(e.target.dataset.del);
});

async function remove(key) {
  if (!confirm("Delete this permanently?")) return;
  const [col, id] = key.split(":");
  await deleteDoc(doc(db, col, id));
  loadAll();
}

function dress(body, theme) {
  let t = esc(body), i = 0;
  if (theme === "thriller") t = t.replace(/\b[A-Za-z]{5,}\b/g, w => (++i % 9 === 0 ? `<span class="red">${w}</span>` : w));
  return t;
}

async function openStory(id, e) {
  current = stories.find(s => s.id === id);
  lastRead = id;
  const th = current.genre.toLowerCase();
  const sib = stories.filter(s => s.genre === current.genre), nx = sib.length > 1 ? sib[(sib.findIndex(s => s.id === current.id) + 1) % sib.length] : null;
  const inner = `<button id="listen" class="listen ghost">Listen</button>${nx ? `<button class="nxt" data-next="${nx.id}">Next ${esc(current.genre)} story: ${esc(nx.title)} &rarr;</button>` : ""}`;
  $("#story").innerHTML = bookHTML(current, th, inner); $("#reader").classList.add("closed");
  buildRate(th);
  loadReviews();
  if (e) await enter("reader", th, e); else go("reader", th);
}

async function loadReviews() {
  const snap = await getDocs(query(collection(db, "reviews"), where("postId", "==", current.id)));
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const avg = items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : 0;
  $("#avg").textContent = items.length ? `Rated ${avg.toFixed(1)} / 5 by ${items.length} reader${items.length > 1 ? "s" : ""}` : "";
  $("#reviews").innerHTML = items.length ? items.map(r => `
    <div class="review"><strong>${esc(r.name)}</strong> ${RS[current.genre.toLowerCase()].repeat(r.rating)}<p>${esc(r.comment)}</p>
    ${isAdmin ? `<button data-rdel="${r.id}">Delete</button>` : ""}</div>`).join("") : `<p class="empty">No reviews yet. Be the first.</p>`;
}
$("#reviews").addEventListener("click", async e => {
  if (e.target.dataset.rdel) { await deleteDoc(doc(db, "reviews", e.target.dataset.rdel)); loadReviews(); }
});

$("#r-send").addEventListener("click", async () => {
  const name = $("#r-name").value.trim(), comment = $("#r-text").value.trim();
  if (!name || !comment) return alert("Add your name and a comment.");
  await addDoc(collection(db, "reviews"), { postId: current.id, name, comment, rating: Number($("#r-rating").dataset.v), createdAt: serverTimestamp() });
  $("#r-text").value = "";
  loadReviews();
});

// admin
$("#login").addEventListener("submit", async e => {
  e.preventDefault();
  try { await signInWithEmailAndPassword(auth, $("#a-email").value, $("#a-pass").value); $("#a-err").textContent = ""; }
  catch { $("#a-err").textContent = "Wrong email or password."; }
});
$("#logout").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, u => {
  isAdmin = !!u;
  $("#login").hidden = isAdmin;
  $("#editor").hidden = !isAdmin; $("#about-editor").hidden = !isAdmin; $("#secret-editor").hidden = !isAdmin;
  loadAll();
});
$("#kind").addEventListener("change", () => {
  const story = $("#kind").value === "stories";
  $("#e-title").hidden = $("#e-genre").hidden = $("#e-cover").hidden = !story; $("#cover-tools").hidden = !story;
  $("#e-mood").hidden = story;
});
let editing = null;
function resetEditor() {
  editing = null;
  ["#e-body", "#e-title", "#e-mood", "#e-cover"].forEach(s => $(s).value = "");
  $("#e-draft").checked = false; $("#kind").disabled = false; coverData = ""; $("#e-showtitle").checked = true; $("#e-coverfile").value = ""; showCoverPrev();
  $("#publish").textContent = "Publish"; $("#cancel-edit").hidden = true;
}
function startEdit(col, id) {
  const it = (col === "stories" ? stories : shayari).find(x => x.id === id);
  if (!it) return;
  go("admin"); resetEditor(); editing = { col, id };
  $("#kind").value = col; $("#kind").dispatchEvent(new Event("change")); $("#kind").disabled = true;
  $("#e-title").value = it.title || ""; coverData = (it.cover || "").startsWith("data:") ? it.cover : ""; $("#e-cover").value = coverData ? "" : (it.cover || ""); $("#e-showtitle").checked = it.showTitle !== false; showCoverPrev(); $("#e-genre").value = it.genre || "Horror"; $("#e-mood").value = it.mood || "";
  $("#e-body").value = it.body || ""; $("#e-draft").checked = !!it.draft;
  $("#publish").textContent = "Save changes"; $("#cancel-edit").hidden = false;
  $("#e-msg").textContent = "Editing. Change what you need, then save.";
}
$("#cancel-edit").addEventListener("click", () => { resetEditor(); $("#e-msg").textContent = ""; });
$("#publish").addEventListener("click", async () => {
  const kind = $("#kind").value, body = $("#e-body").value.trim(), draft = $("#e-draft").checked;
  if (!body) return;
  const data = kind === "stories"
    ? { title: $("#e-title").value.trim() || "Untitled", genre: $("#e-genre").value, cover: coverData || $("#e-cover").value.trim(), showTitle: $("#e-showtitle").checked, body, draft }
    : { mood: $("#e-mood").value.trim(), body, draft };
  try {
    if (editing) await updateDoc(doc(db, editing.col, editing.id), data);
    else await addDoc(collection(db, kind), { ...data, createdAt: serverTimestamp() });
    $("#e-msg").textContent = draft ? "Saved as draft. Readers can't see it." : (editing ? "Changes saved." : "Published.");
    resetEditor();
    loadAll();
  } catch { $("#e-msg").textContent = "Could not save. Check the Firestore rules and that you are logged in."; }
});



// opening scene: a closed book opens, its pages glow, then the tagline writes itself
(async () => {
  const o = $("#intro"), t = $("#intro-text"); let skip = false;
  if (sessionStorage.getItem("seen")) { o.remove(); maybeTour(); return; }
  sessionStorage.setItem("seen", "1"); o.onclick = () => skip = true;
  await sleep(450); o.classList.add("go"); await sleep(1600);
  for (const ch of "stories after dark") { if (skip) break; t.textContent += ch; await sleep(95); }
  if (!skip) await sleep(1000);
  o.classList.add("done"); await sleep(1000); o.remove(); maybeTour();
})();


// reading progress, heartbeat, surprise
addEventListener("scroll", () => {
  const h = document.documentElement, p = h.scrollTop / Math.max(1, h.scrollHeight - innerHeight);
  $("#prog").style.width = (document.body.classList.contains("reading") ? p * 100 : 0) + "%";
  h.style.setProperty("--hb", (1.7 - p * 1.1) + "s");
}, { passive: true });

// scroll-driven scenes on the landing page
const io = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  en.target.classList.add("in");
  const s = en.target.dataset.scene;
  if (en.intersectionRatio > .5 && s && $("#gate").classList.contains("on") && document.body.dataset.theme !== s) setTheme(s);
}), { threshold: [.25, .55] });
document.querySelectorAll("[data-scene]").forEach(el => io.observe(el));

setTheme("home");


// wide animated banner scenes
const WIDE = {
  horror: `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="whs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030003"/><stop offset=".5" stop-color="#18030a"/><stop offset="1" stop-color="#5a0814"/></linearGradient><radialGradient id="whm"><stop offset="0" stop-color="#ff8a7a" stop-opacity=".9"/><stop offset=".5" stop-color="#e5253a" stop-opacity=".4"/><stop offset="1" stop-color="#e5253a" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="360" fill="url(#whs)"/><circle class="bglow" cx="980" cy="100" r="210" fill="url(#whm)"/><circle cx="980" cy="100" r="74" fill="#ff6b5a"/><circle cx="958" cy="82" r="12" fill="#b0301f" opacity=".55"/><circle cx="1002" cy="122" r="16" fill="#b0301f" opacity=".45"/><circle cx="1014" cy="76" r="7" fill="#b0301f" opacity=".5"/><g class="drift2" fill="#1a0308" opacity=".65"><ellipse cx="260" cy="110" rx="240" ry="20"/><ellipse cx="430" cy="130" rx="170" ry="14"/></g><path d="M0 270L120 200 230 260 350 180 470 270 590 210 710 280 830 200 950 270 1070 210 1200 270V360H0z" fill="#080104"/><path d="M560 300V205h30v-35h45v35h30V165h65v40h22V145h65v60h30V180h55v120z" fill="#050102"/><path d="M545 205l50-90 50 90zM650 165l40-80 40 80zM730 145l48-105 48 105zM825 180l32-70 32 70z" fill="#050102"/><g fill="#ffd98a"><rect class="fl" x="620" y="240" width="14" height="22" rx="2"/><rect class="fl d2" x="668" y="252" width="14" height="22" rx="2"/><rect class="fl" x="724" y="232" width="14" height="24" rx="2"/><rect class="fl d2" x="786" y="252" width="14" height="22" rx="2"/><rect class="fl" x="832" y="238" width="12" height="20" rx="2"/></g><path d="M640 300V270q0-10 10-10h24q10 0 10 10v30z" fill="#12030a"/><path d="M100 360V235m0 50l-60-65m60 34l52-58m-52 20l-16-46m16 82l62-30M1090 360V250m0 40l48-56m-48 26l-52-64m52 92l-58-34" stroke="#030001" stroke-width="9" stroke-linecap="round" fill="none"/><path class="flyw" d="M0 70q10-14 20 0q10-14 20 0q-10 6-20 3q-10 3-20-3z" fill="#000"/><path class="flyw" style="animation-delay:-6s" d="M0 120q8-11 16 0q8-11 16 0q-8 5-16 2q-8 3-16-2z" fill="#000"/><path class="flyw" style="animation-delay:-10s" d="M0 40q7-10 14 0q7-10 14 0q-7 4-14 2q-7 2-14-2z" fill="#000"/><path d="M0 360V300q200-30 400-10t400 0 400-20V360z" fill="#020001"/><ellipse class="drift2" cx="400" cy="310" rx="420" ry="28" fill="#ffb14a" opacity=".06"/><g fill="#ff2a3a" opacity=".8"><ellipse class="fl" cx="300" cy="330" rx="3" ry="2"/><ellipse class="fl d2" cx="312" cy="330" rx="3" ry="2"/><ellipse class="fl" cx="880" cy="340" rx="3" ry="2"/><ellipse class="fl d2" cx="892" cy="340" rx="3" ry="2"/></g></svg>`,
  fantasy: `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wfs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06021a"/><stop offset=".5" stop-color="#2a1458"/><stop offset="1" stop-color="#b57bff"/></linearGradient><linearGradient id="wfa" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7affc8" stop-opacity="0"/><stop offset=".3" stop-color="#7affc8"/><stop offset=".65" stop-color="#b57bff"/><stop offset="1" stop-color="#ff9ad8" stop-opacity="0"/></linearGradient><radialGradient id="wfm"><stop offset="0" stop-color="#f0e6ff" stop-opacity=".95"/><stop offset=".5" stop-color="#b57bff" stop-opacity=".3"/><stop offset="1" stop-color="#b57bff" stop-opacity="0"/></radialGradient></defs><rect width="1200" height="360" fill="url(#wfs)"/><circle class="bglow" cx="220" cy="80" r="180" fill="url(#wfm)"/><circle cx="220" cy="80" r="58" fill="#f0e6ff"/><circle cx="204" cy="64" r="9" fill="#c8b8ee" opacity=".55"/><circle cx="1010" cy="60" r="26" fill="#9fd6ff"/><circle cx="1000" cy="52" r="5" fill="#6aa8d6" opacity=".6"/><g class="aur2" opacity=".45"><path d="M-80 120C180 50 360 180 590 90S980 50 1280 130V210C980 130 760 240 560 170S180 150 -80 220z" fill="url(#wfa)"/></g><g class="isl"><path d="M500 210q100-32 220 0q-30 16-50 66l-42 92q-18 34-36 0l-44-92q-18-50-48-66z" fill="#2a1458"/><path d="M500 210q100-32 220 0q-110 20-220 0z" fill="#4a8a5a"/><path d="M560 200v-46h12v-20l8-14 8 14v20h16v-34l8-12 8 12v34h10v26z" fill="#1a0a3a"/><rect class="fl" x="598" y="150" width="5" height="8" fill="#ffd66b"/><path d="M610 280v60" stroke="#9fffe0" stroke-width="7" opacity=".55"/></g><g class="isl" style="animation-delay:-2s"><path d="M120 250q60-20 130 0q-18 10-30 40l-26 56q-10 20-20 0l-26-56q-10-30-28-40z" fill="#24104a"/><path d="M120 250q60-20 130 0q-65 14-130 0z" fill="#3a7a52"/><path d="M158 242v-30h8v-14l6-10 6 10v14h8v18z" fill="#150830"/></g><g class="isl" style="animation-delay:-3.4s"><path d="M920 230q56-18 120 0q-18 10-28 38l-24 52q-10 18-18 0l-24-52q-10-28-26-38z" fill="#24104a"/><path d="M920 230q56-18 120 0q-60 12-120 0z" fill="#3a7a52"/></g><path d="M500 210l-54-80 42 14 28-54 20 48 48-20-28 92z" fill="#12072a"/><path d="M720 210l34-74 28 20 14-48 28 62 34-14-34 70z" fill="#12072a"/><path d="M550 170l16-66 16 66zM640 150l20-80 20 80zM710 180l14-58 14 58z" fill="#2a1458" stroke="#b57bff" stroke-width="2"/><circle class="fl" cx="566" cy="100" r="4" fill="#ffd66b"/><circle class="fl d2" cx="660" cy="66" r="4" fill="#ffd66b"/><circle class="fl" cx="724" cy="118" r="3" fill="#ffd66b"/><g fill="#9fffe0" opacity=".7"><circle class="tw" cx="400" cy="200" r="2"/><circle class="tw" cx="840" cy="190" r="2"/><circle class="tw" cx="930" cy="160" r="2"/><circle class="tw" cx="300" cy="260" r="2"/></g><rect y="320" width="1200" height="40" fill="#160a30" opacity=".75"/></svg>`,
  mystery: `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010604"/><stop offset=".55" stop-color="#06241a"/><stop offset="1" stop-color="#0e5a42"/></linearGradient><radialGradient id="wmm"><stop offset="0" stop-color="#dff5e8" stop-opacity=".9"/><stop offset=".45" stop-color="#3fbf8f" stop-opacity=".3"/><stop offset="1" stop-color="#3fbf8f" stop-opacity="0"/></radialGradient><linearGradient id="wml" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfffe5" stop-opacity=".5"/><stop offset="1" stop-color="#bfffe5" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="360" fill="url(#wms)"/><circle class="bglow" cx="980" cy="80" r="170" fill="url(#wmm)"/><circle cx="980" cy="80" r="46" fill="#dff5e8" opacity=".85"/><ellipse class="drift2" cx="940" cy="90" rx="190" ry="16" fill="#06241a" opacity=".85"/><path d="M0 360V130h80v-50h50v50h60v-28h42v28h60V360z" fill="#020806"/><path d="M1200 360V120h-100v-40h-50v40h-70v-34h-44v34h-56V360z" fill="#020806"/><g fill="#ffd98a"><rect class="fl" x="24" y="150" width="10" height="14"/><rect class="fl d2" x="66" y="190" width="10" height="14"/><rect class="fl" x="130" y="170" width="10" height="14"/><rect class="fl d2" x="210" y="150" width="10" height="14"/><rect class="fl" x="1040" y="150" width="10" height="14"/><rect class="fl d2" x="1090" y="190" width="10" height="14"/><rect class="fl" x="980" y="170" width="10" height="14"/></g><path d="M390 360V190h-20" stroke="#020806" stroke-width="7" fill="none"/><circle class="fl" cx="370" cy="182" r="11" fill="#bfffe5"/><circle cx="370" cy="182" r="48" fill="#bfffe5" opacity=".16"/><path d="M370 192L270 360h200z" fill="url(#wml)" opacity=".45"/><g transform="translate(404 290)"><circle cx="0" cy="0" r="12" fill="#020806"/><path d="M-12 10q12-7 24 0l9 42h-42z" fill="#020806"/><path d="M-9 15l-16 24M9 15l16 22" stroke="#020806" stroke-width="7" stroke-linecap="round"/><path d="M-21 24h42" stroke="#020806" stroke-width="6"/><rect x="-7" y="-20" width="14" height="12" fill="#020806"/><ellipse cx="0" cy="-22" rx="18" ry="4" fill="#020806"/></g><path d="M790 360V220h-16" stroke="#020806" stroke-width="7" fill="none"/><circle class="fl d2" cx="774" cy="212" r="10" fill="#ffd98a"/><circle class="fl d2" cx="774" cy="212" r="44" fill="#ffd98a" opacity=".14"/><path d="M774 222L680 360h188z" fill="url(#wml)" opacity=".26"/><path d="M0 360V320q200-24 400-6t400-10 400 16V360z" fill="#020806"/><g stroke="#bfffe5" stroke-width="1" opacity=".18"><path d="M0 330h1200"/></g><g class="drift2" fill="#bfffe5" opacity=".07"><ellipse cx="420" cy="330" rx="400" ry="22"/><ellipse cx="900" cy="344" rx="420" ry="24"/></g><g stroke="#bfffe5" stroke-width="1.2" opacity=".25"><line class="rain" x1="80" y1="0" x2="74" y2="28"/><line class="rain" style="animation-delay:-.3s" x1="220" y1="0" x2="214" y2="28"/><line class="rain" style="animation-delay:-.6s" x1="360" y1="0" x2="354" y2="28"/><line class="rain" style="animation-delay:-.2s" x1="500" y1="0" x2="494" y2="28"/><line class="rain" style="animation-delay:-.8s" x1="640" y1="0" x2="634" y2="28"/><line class="rain" style="animation-delay:-.4s" x1="780" y1="0" x2="774" y2="28"/><line class="rain" style="animation-delay:-.1s" x1="920" y1="0" x2="914" y2="28"/><line class="rain" style="animation-delay:-.7s" x1="1060" y1="0" x2="1054" y2="28"/><line class="rain" style="animation-delay:-.5s" x1="1160" y1="0" x2="1154" y2="28"/></g><text x="1010" y="160" font-family="Georgia,serif" font-size="130" fill="#3fbf8f" opacity=".07">?</text></svg>`,
  adventure: `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="was" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1030"/><stop offset=".35" stop-color="#a8451f"/><stop offset=".7" stop-color="#ffb347"/><stop offset="1" stop-color="#ffe6a8"/></linearGradient><radialGradient id="wag"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient><linearGradient id="war" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd98a" stop-opacity="0"/><stop offset=".5" stop-color="#ffd98a"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></linearGradient></defs><rect width="1200" height="360" fill="url(#was)"/><circle class="bglow" cx="600" cy="250" r="210" fill="url(#wag)" opacity=".7"/><circle cx="600" cy="250" r="76" fill="#fff6c8"/><g class="cl1" fill="#fff" opacity=".22"><ellipse cx="260" cy="90" rx="130" ry="14"/><ellipse cx="360" cy="112" rx="100" ry="10"/></g><g class="cl2" fill="#fff" opacity=".16"><ellipse cx="860" cy="70" rx="150" ry="12"/></g><path d="M0 260L120 180 220 240 350 160 480 250 600 190 730 260 850 170 980 250 1100 190 1200 240V360H0z" fill="#7a3a1a"/><path d="M350 160l20 28-20-6-20 10zM850 170l18 26-18-6-18 10zM120 180l18 24-18-6-18 10z" fill="#fff" opacity=".6"/><path d="M0 300L100 230 220 290 340 220 470 300 600 240 730 310 860 230 990 300 1110 240 1200 290V360H0z" fill="#4a2210"/><g transform="translate(540 210)"><path d="M0 130V44h18V24h24v20h18V12h36v32h18V24h24v20h18v86z" fill="#2a1408"/><path d="M0 44l18-24 18 24zM60 32l18-30 18 30zM96 44l18-24 18 24z" fill="#1a0a04"/><rect x="46" y="92" width="38" height="38" rx="3" fill="#0a0502"/><rect x="24" y="60" width="10" height="14" fill="#ffd98a" opacity=".8"/><rect x="102" y="60" width="10" height="14" fill="#ffd98a" opacity=".8"/></g><path d="M520 360C540 300 570 280 570 240s-24-34 0-58" stroke="#ffd98a" stroke-width="14" fill="none" opacity=".35"/><path d="M0 360V330q150-20 300 6t300 0 300-14 300 12V360z" fill="#140a04"/><g class="bal"><g transform="translate(900 120)"><ellipse rx="26" ry="32" fill="#e5253a"/><path d="M0-32v64" stroke="#ffd98a" stroke-width="2"/><path d="M-14 30l8 14M14 30l-8 14" stroke="#3a1a08" stroke-width="2"/><rect x="-8" y="42" width="16" height="11" fill="#5a2a0a"/></g></g><g class="spin" transform="translate(1040 260)"><circle r="26" fill="none" stroke="#f5a623" stroke-width="2"/><path d="M0-36L5 0 0 36-5 0z" fill="#f5a623"/><path d="M-36 0L0-5 36 0 0 5z" fill="#ffd98a" opacity=".7"/></g><path class="rp" d="M40 300C160 260 240 320 360 280S540 240 640 270s180 10 300-30" stroke="url(#war)" stroke-width="2.5" stroke-dasharray="2 12" fill="none" opacity=".8"/><path class="flyw" d="M0 60q8-10 16 0q8-10 16 0q-8 4-16 2q-8 2-16-2z" fill="#2a1408"/></svg>`,
  shayari: `<svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="wss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081f"/><stop offset=".5" stop-color="#1b2466"/><stop offset=".8" stop-color="#6a3a8a"/><stop offset="1" stop-color="#d0708a"/></linearGradient><radialGradient id="wsm"><stop offset="0" stop-color="#f3e6b8" stop-opacity=".9"/><stop offset=".5" stop-color="#f3e6b8" stop-opacity=".25"/><stop offset="1" stop-color="#f3e6b8" stop-opacity="0"/></radialGradient><linearGradient id="wsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e9bd" stop-opacity=".9"/><stop offset="1" stop-color="#d8b98a" stop-opacity=".2"/></linearGradient></defs><rect width="1200" height="360" fill="url(#wss)"/><circle class="bglow" cx="210" cy="80" r="170" fill="url(#wsm)"/><path d="M210 34a66 66 0 1 0 54 120a52 52 0 1 1-54-120z" fill="#f3e6b8"/><g fill="#fff"><circle class="tw" cx="80" cy="50" r="1.6"/><circle class="tw" style="animation-delay:-1s" cx="360" cy="40" r="1.6"/><circle class="tw" style="animation-delay:-2s" cx="520" cy="80" r="1.4"/><circle class="tw" style="animation-delay:-3s" cx="700" cy="36" r="1.6"/><circle class="tw" style="animation-delay:-4s" cx="900" cy="70" r="1.4"/><circle class="tw" style="animation-delay:-1.5s" cx="1100" cy="44" r="1.6"/></g><path d="M0 260L120 210 260 260 400 200 560 270 720 210 880 270 1040 210 1200 260V360H0z" fill="#0a0e36"/><path d="M0 300L160 260 320 300 500 250 680 310 860 260 1040 310 1200 270V360H0z" fill="#070b28"/><rect y="310" width="1200" height="50" fill="#070b28"/><path d="M0 310h1200v8H0z" fill="#e8d28f" opacity=".12"/><g stroke="#e8d28f" stroke-width="3" opacity=".28"><path d="M80 310v-36M120 310v-36M160 310v-36M200 310v-36M960 310v-36M1000 310v-36M1040 310v-36M1080 310v-36"/></g><g transform="translate(470 290)"><ellipse cx="0" cy="12" rx="100" ry="12" fill="#000" opacity=".25"/><path d="M-88 0h176l-18 12H-70z" fill="#3a200c"/><path d="M-68 0V-9h136V0" fill="#5a3214"/></g><g transform="translate(450 252)"><path d="M-32 0Q-16-11 0-3Q16-11 32 0L29 17Q15 8 0 15Q-15 8-29 17Z" fill="url(#wsg)"/><path d="M0-3v18" stroke="#b08a58" stroke-width="1.5"/><path d="M-26 5Q-13-1 0 5M3 5Q16-1 26 5" stroke="#b08a58" stroke-width="1" fill="none" opacity=".65"/></g><g transform="translate(548 278)"><ellipse cx="0" cy="10" rx="20" ry="4" fill="#000" opacity=".3"/><path d="M-12 0h24q0 10-12 11q-12-1-12-11z" fill="#e8d28f"/><path d="M12 3q9 1 0 8" stroke="#e8d28f" stroke-width="2" fill="none"/><path d="M-7-6q3-10 0-17M0-6q3-10 0-17M7-6q3-10 0-17" stroke="#ffffff" stroke-width="1.5" opacity=".22" fill="none"/></g><g transform="translate(300 275)"><circle cx="0" cy="0" r="7" fill="#05060f"/><path d="M-7 6q7-4 14 0l6 28h-26z" fill="#05060f"/><path d="M-6 9l-10 14M6 9l12 12" stroke="#05060f" stroke-width="4" stroke-linecap="round"/><path d="M-14 19l14-7 14 7-14 8z" fill="#e8d28f" opacity=".8"/></g><g class="lantern" transform="translate(860 250)"><path d="M0-28v14" stroke="#e8d28f" stroke-width="1.5"/><rect x="-8" y="-14" width="16" height="20" rx="3" fill="#ffd98a" opacity=".9"/><circle cx="0" cy="-4" r="20" fill="#ffd98a" opacity=".18"/></g><g fill="#ff9ec0" opacity=".8"><g transform="translate(90 100)"><path class="petal" style="--d:-1s" d="M0 0q6-4 10 0q-4 6-10 0z"/></g><g transform="translate(200 70)"><path class="petal" style="--d:-4s" d="M0 0q6-4 10 0q-4 6-10 0z"/></g><g transform="translate(900 120)"><path class="petal" style="--d:-7s" d="M0 0q6-4 10 0q-4 6-10 0z"/></g><g transform="translate(1040 80)"><path class="petal" style="--d:-2s" d="M0 0q6-4 10 0q-4 6-10 0z"/></g></g><g stroke="#f3e6b8" stroke-width="3" opacity=".35" stroke-linecap="round"><path class="rp" d="M880 320h120M900 338h90M920 356h60"/></g></svg>`
};
$("#bart-d").innerHTML = WIDE.shayari;

// bottom quote: words surface one by one out of the dark
(async () => {
  const el = $("#foot-quote"); let i = 0;
  for (;;) {
    const q = Q.home[i++ % Q.home.length], words = q.split(" ");
    el.classList.remove("out");
    el.innerHTML = words.map((w, k) => `<span style="animation-delay:${k * .15}s">${esc(w)}</span>`).join(" ");
    await sleep(words.length * 150 + 4300); el.classList.add("out"); await sleep(1000);
  }
})();

// shayari share image
const STY = { night: { bg: ["#05081f", "#1b2466"], ink: "#f3ead3", ac: "#e8d28f" }, rose: { bg: ["#2a0713", "#7a1633"], ink: "#ffe9ee", ac: "#ffb3c1" }, paper: { bg: ["#f4ecd8", "#e6d8b4"], ink: "#2a1d0a", ac: "#8a5a1a" }, moon: { bg: ["#070b2a", "#b8486f"], ink: "#fff4dc", ac: "#f3e6b8" }, rain: { bg: ["#0a121c", "#2c3e50"], ink: "#e6f2ff", ac: "#9fd0ff" } };
let shareStyle = "night", shareItem = null;
async function drawShare() {
  const s = shareItem, S = STY[shareStyle], x = $("#sc").getContext("2d");
  try { await document.fonts.load("60px " + SFONT[shareFont].split(",")[0], s.body); } catch {}
  const g = x.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, S.bg[0]); g.addColorStop(1, S.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, 1080, 1350); decorShare(x);
  if (shareStyle === "night") {
    x.fillStyle = "#fff";
    for (let i = 0; i < 60; i++) { x.globalAlpha = .3 + ((i * 37) % 7) / 10; x.fillRect((i * 197) % 1080, (i * 113) % 700, 2 + (i % 3), 2 + (i % 3)); }
    x.globalAlpha = 1; x.fillStyle = "#f3e6b8"; x.beginPath(); x.arc(880, 200, 70, 0, 7); x.fill();
    x.fillStyle = S.bg[0]; x.beginPath(); x.arc(910, 180, 62, 0, 7); x.fill();
  }
  x.fillStyle = S.ink; x.textAlign = "center";
  let size = 76, lines = [];
  const wrap = () => {
    x.font = `${size}px ${SFONT[shareFont]}`; lines = [];
    for (const para of s.body.split("\n")) { let cur = ""; for (const w of para.split(" ")) { const t = cur ? cur + " " + w : w; if (x.measureText(t).width > 880 && cur) { lines.push(cur); cur = w; } else cur = t; } lines.push(cur); }
  };
  wrap(); while (lines.length * size * 1.5 > 760 && size > 34) { size -= 4; wrap(); }
  const top = 675 - lines.length * size * .75;
  lines.forEach((l, i) => x.fillText(l, 540, top + i * size * 1.5 + size));
  x.fillStyle = S.ac; x.font = "34px Georgia, serif"; if (s.mood) x.fillText(s.mood, 540, 1130);
  x.font = "30px Georgia, serif"; x.fillText("Moonlit Pages", 540, 1250);
}
function openShare(id) { shareItem = shayari.find(s => s.id === id); if (!shareItem) return; $("#sharebox").hidden = false; drawShare(); }
document.querySelectorAll("#sharebox [data-st]").forEach(b => b.addEventListener("click", () => { shareStyle = b.dataset.st; drawShare(); }));
$("#sx").addEventListener("click", () => $("#sharebox").hidden = true);
$("#sdl").addEventListener("click", () => $("#sc").toBlob(async b => {
  const f = new File([b], "shayari.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch {} }
  const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "shayari.png"; a.click();
}));

// sound (made in the browser, no files). Off until the reader turns it on.
let snd = localStorage.getItem("snd") === "1", ac;
const AC = window.AudioContext || window.webkitAudioContext;
function tone(f, d = .15, type = "sine", v = .05, to) {
  if (!snd || !AC) return;
  ac ||= new AC(); if (ac.state === "suspended") ac.resume();
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(ac.destination); o.start(); o.stop(t + d);
}
const STING = {
  horror: () => tone(70, .9, "sawtooth", .06, 38),
  fantasy: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .5, "sine", .05), i * 90)),
  mystery: () => tone(196, .7, "triangle", .07),
  adventure: () => { tone(220, .35, "sawtooth", .04); setTimeout(() => tone(330, .5, "sawtooth", .04), 200); },
  shayari: () => [880, 1318].forEach((f, i) => setTimeout(() => tone(f, .9, "sine", .04), i * 160))
};


// your deck: worlds the reader has visited
const WORLDS = ["horror", "fantasy", "mystery", "adventure", "shayari"];
let deck = new Set();
try { deck = new Set(JSON.parse(localStorage.getItem("deck") || "[]")); } catch {}
function renderDeck() {
  document.querySelectorAll(".door,.spine,.win,.mn").forEach(c => c.classList.toggle("seen", deck.has(c.dataset.world)));
  $("#moons").innerHTML = WORLDS.map(w => `<i class="${deck.has(w) ? "on" : ""}" title="${w}"></i>`).join("") + (localStorage.getItem("secret") ? '<i class="on sec" title="You found the secret room"></i>' : "");
}
function markDeck(w) { if (!WORLDS.includes(w) || deck.has(w)) return; deck.add(w); localStorage.setItem("deck", JSON.stringify([...deck])); renderDeck(); }
renderDeck();

// read aloud + next story
$("#story").addEventListener("click", e => {
  if (e.target.closest("#bk-open")) return openBook();
  const nx = e.target.closest("[data-next]");
  if (nx) return openStory(nx.dataset.next);
  if (e.target.id !== "listen") return;
  if (!("speechSynthesis" in window)) return alert("Listening isn't supported in this browser.");
  const s = speechSynthesis;
  if (s.speaking) { s.cancel(); e.target.textContent = "Listen"; return; }
  const u = new SpeechSynthesisUtterance(current.title + ". " + current.body);
  u.lang = /[\u0900-\u097F]/.test(current.body) ? "hi-IN" : /[\u0B00-\u0B7F]/.test(current.body) ? "or-IN" : "en-IN";
  u.rate = .95; u.onend = () => { const b = $("#listen"); if (b) b.textContent = "Listen"; };
  s.speak(u); e.target.textContent = "Stop";
});

let calm = false; // calm mode removed: effects are always on

// about the author
let about = { name: "", bio: "", photo: "", ig: "", wa: "" };
const okImg = u => /^(https?:\/\/[^\s"'()]+|[\w./-]+|data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+\/=]+)$/.test(u || "") ? u : "";
const okLink = u => /^https?:\/\/[^\s"']+$/.test(u || "") ? u : "";
function paintAbout() {
  $("#aname").textContent = about.name || "The Storyteller";
  $("#abio").textContent = about.bio || "Stories after dark and shayari from the heart.";
  const p = okImg(about.photo), ph = $("#aphoto");
  ph.style.backgroundImage = p ? `url("${p}")` : ""; ph.classList.toggle("empty", !p);
  $("#alinks").innerHTML = [["Instagram", okLink(about.ig)], ["WhatsApp", okLink(about.wa)]].filter(l => l[1]).map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${t}</a>`).join("");
  $("#ab-name").value = about.name || ""; $("#ab-bio").value = about.bio || ""; $("#ab-photo").value = about.photo || ""; $("#ab-ig").value = about.ig || ""; $("#ab-wa").value = about.wa || "";
}
async function loadAbout() { try { const d = await getDoc(doc(db, "site", "about")); if (d.exists()) about = { ...about, ...d.data() }; } catch {} paintAbout(); }
$("#about-save").addEventListener("click", async () => {
  const d = { name: $("#ab-name").value.trim(), bio: $("#ab-bio").value.trim(), photo: $("#ab-photo").value.trim(), ig: $("#ab-ig").value.trim(), wa: $("#ab-wa").value.trim() };
  try { await setDoc(doc(db, "site", "about"), d); about = d; paintAbout(); $("#ab-msg").textContent = "Saved."; }
  catch { $("#ab-msg").textContent = "Could not save. Add the new 'site' rule in Firestore Rules and log in again."; }
});
$("#aboutbtn").addEventListener("click", () => $("#about").hidden = false);
$("#aclose").addEventListener("click", () => $("#about").hidden = true);
$("#about").addEventListener("click", e => { if (e.target.id === "about") $("#about").hidden = true; });
loadAbout();

// the book: a cover first, then the pages
function bookHTML(s, th, inner) {
  const art = document.querySelector(`#arts [data-art=${th}] svg`), cv = okImg(s.cover);
  const label = `Open the book: ${esc(s.title)}`;
  const cover = cv
    ? `<button class="bk-cover img" id="bk-open" aria-label="${label}" style="background-image:url('${cv}')">${s.showTitle !== false ? `<span class="cv-shade"></span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</span>` : ""}</button>`
    : `<button class="bk-cover gen" id="bk-open" aria-label="${label}"><span class="cv-art">${art ? art.outerHTML : ""}</span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</span></button>`;
  return `<div class="bk-stage" id="bk-stage"><div class="bk-inside"><div class="orn2">&#10022; &#10023; &#10022;</div><h3>${esc(s.title)}</h3><small>${esc(s.genre)}</small></div>${cover}</div><p class="bk-hint" id="bk-hint">Tap the book to open it</p><div class="rd-actions" id="rd-actions">${inner}</div>`;
}
async function openBook() {
  const st = $("#bk-stage"); if (!st || st.classList.contains("opening")) return;
  st.classList.add("opening"); tone(300, .3, "triangle", .04);
  await sleep(800);
  $("#reader").classList.remove("closed"); await openSpread();
  await sleep(800); st.classList.remove("opening");
}

// contents list: cover preview
function peekHTML(s) {
  const th = s.genre.toLowerCase(), art = document.querySelector(`#arts [data-art=${th}] svg`), cv = okImg(s.cover);
  return cv ? `<div class="pk" style="background-image:url('${cv}')">${s.showTitle !== false ? `<span class="cv-shade"></span><span class="cv-ti">${esc(s.title)}</span>` : ""}</div>`
    : `<div class="pk gen"><span class="cv-art">${art ? art.outerHTML : ""}</span><span class="cv-ti">${esc(s.title)}</span><span class="cv-by">${esc(s.genre)}</span></div>`;
}
var peekId = null;
$("#story-list").addEventListener("mouseover", e => {
  const r = e.target.closest(".row"); if (!r || r.dataset.id === peekId) return;
  const s = stories.find(x => x.id === r.dataset.id); if (!s) return;
  peekId = s.id; $("#peek").innerHTML = peekHTML(s); const pk = $("#peek .pk"); if (pk) pk.classList.add("peel");
});

// three landing looks: Windows (default), Shelf, Moon Phases
const LOOKS = { windows: "Windows", shelf: "Shelf", moons: "Moons" }, LOOK_ORDER = Object.keys(LOOKS);
let look = LOOKS[localStorage.getItem("look")] ? localStorage.getItem("look") : "windows";
function setLook(l) {
  look = l; localStorage.setItem("look", l);
  LOOK_ORDER.forEach(k => document.body.classList.toggle("look-" + k, k === l));
  $("#look").textContent = "Look: " + LOOKS[l];
}
$("#look").addEventListener("click", () => setLook(LOOK_ORDER[(LOOK_ORDER.indexOf(look) + 1) % LOOK_ORDER.length])); setLook(look);
// each window and moon shows its world's own art
document.querySelectorAll(".wview,.mview").forEach(el => { const art = document.querySelector(`#arts [data-art=${el.closest("[data-world]").dataset.world}] svg`); if (art) el.insertAdjacentHTML("afterbegin", art.outerHTML); });



// ===== the open book: full screen, two pages, page turning, ribbon bookmark =====
let bk = { P: [], i: 0, step: 2, single: false, busy: false, wm: "" };
const nextOf = s => { const sib = stories.filter(x => x.genre === s.genre); return sib.length > 1 ? sib[(sib.findIndex(x => x.id === s.id) + 1) % sib.length] : null; };
const wmFor = (s, th) => { const cv = okImg(s.cover); return cv ? `url('${cv}')` : `url("data:image/svg+xml;utf8,${encodeURIComponent(WIDE[th])}")`; };
function pgEl(inner, side) {
  const d = document.createElement("div"); d.className = "pg " + side;
  d.innerHTML = `<div class="wm" style="background-image:${bk.wm}"></div><i class="fx2"></i>${inner}`; return d;
}
function paginate(body) {
  const m = $("#measure"), toks = [];
  body.split(/\n\s*\n/).forEach(p => p.trim().split(/\s+/).filter(Boolean).forEach((w, k) => toks.push({ w, p: k === 0 })));
  const htmlOf = (a, b) => { let out = "", open = false; for (let x = a; x < b; x++) { const t = toks[x]; if (t.p || !open) { if (open) out += "</p>"; out += "<p>"; open = true; } out += esc(t.w) + " "; } return out + (open ? "</p>" : ""); };
  const pages = []; let i = 0;
  while (i < toks.length) {
    let lo = 1, hi = Math.min(toks.length - i, 450), best = 1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; m.innerHTML = htmlOf(i, i + mid); if (m.scrollHeight <= m.clientHeight + 1) { best = mid; lo = mid + 1; } else hi = mid - 1; }
    pages.push(htmlOf(i, i + best)); i += best;
  }
  return pages;
}
function renderSlots() {
  const sg = (bk.segs || []).filter(x => x.start <= bk.i).pop(); if (sg && sg.story.id !== current.id) current = sg.story;
  const L = $("#pl"), R = $("#pr"); L.innerHTML = ""; R.innerHTML = "";
  if (!bk.single && bk.P[bk.i]) L.appendChild(pgEl(bk.P[bk.i], "l"));
  const r = bk.P[bk.i + (bk.single ? 0 : 1)]; if (r) R.appendChild(pgEl(r, "r"));
  updateCharm(); setSeek();
  if (bk.i + bk.step >= bk.P.length) bk.done = true;
  $("#bf-pn").textContent = bk.single ? `Page ${bk.i + 1} of ${bk.P.length}` : `Pages ${bk.i + 1}\u2013${Math.min(bk.i + 2, bk.P.length)} of ${bk.P.length}`;
}
async function openSpread() {
  const s = current, th = s.genre.toLowerCase(), fs = $("#bookfs"), nx = nextOf(s);
  bk = { P: [], i: 0, single: innerWidth < 820, busy: false, wm: wmFor(s, th) }; bk.step = bk.single ? 1 : 2;
  fs.classList.toggle("single", bk.single); $("#bf-bg").innerHTML = WIDE[th]; bfAmbience(th);
  fs.hidden = false; fs.getBoundingClientRect();
  const P = buildPages(s, nx);
  bk.P = P; bk.segs = [{ story: s, start: 0 }]; const sv = localStorage.getItem("bm:" + s.id);
  if (sv !== null && +sv > 0 && +sv < P.length) { bk.i = +sv - (+sv % bk.step); toast(`Continuing from page ${+sv + 1}`); }
  renderSlots();
  typeOpening();
  fs.classList.add("on"); document.body.classList.add("bookopen"); puffDust(); const sp = $("#spread"); sp.classList.add("pg-in"); setTimeout(() => sp.classList.remove("pg-in"), 3400); sp.classList.add("ob"); setTimeout(() => sp.classList.remove("ob"), 1400);
}
function buildPages(s, nx) {
  const texts = paginate(s.body || ""), P = [];
  P.push(`<div class="pgtxt tp"><div class="orn2">&#10022; &#10023; &#10022;</div><h2>${esc(s.title)}</h2><small>${esc(s.genre)} &middot; ${esc(about.name || "Moonlit Pages")}</small></div>`);
  texts.forEach((t, k) => P.push(`<div class="pgtxt${k === 0 ? " first" : ""}">${k === 0 ? '<i class="fxp"></i>' : ""}${t}</div><span class="pn">${k + 2}</span>`));
  P.push(`<div class="pgtxt tp"><div class="orn2">&#10022; &#10023; &#10022;</div><h3>The End</h3><button id="bf-end" class="endbtn">Close the book</button>${nx ? `<button class="endbtn" data-next="${nx.id}">Next: ${esc(nx.title)}</button>` : ""}</div>`);
  if (!bk.single && P.length % 2) P.splice(P.length - 1, 0, '<div class="pgtxt"></div>');
  return P;
}
async function turnTo(ni, dir) {
  if (bk.busy || ni === bk.i || ni < 0 || ni >= bk.P.length) return;
  bk.busy = true; tone(220, .2, "triangle", .04);
  const sp = $("#spread"), parts = [];
  const mk = (html, side, cls) => { const d = document.createElement("div"); d.className = "dl " + cls; d.appendChild(pgEl(html, side)); return d; };
  if (dir > 0) {
    if (!bk.single) parts.push(mk(bk.P[bk.i], "l", "lt"));
    parts.push(mk(bk.P[bk.i + (bk.single ? 0 : 1)] || "", "r", "rt"));
    bk.i = ni; renderSlots();
    parts.forEach(p => sp.appendChild(p)); parts[0].getBoundingClientRect(); parts.forEach(p => p.classList.add("away"));
  } else {
    if (!bk.single) parts.push(mk(bk.P[ni], "l", "lt away"));
    parts.push(mk(bk.P[ni + (bk.single ? 0 : 1)] || "", "r", "rt away"));
    parts.forEach(p => sp.appendChild(p)); parts[0].getBoundingClientRect(); parts.forEach(p => p.classList.remove("away"));
  }
  await sleep(880); if (dir < 0) { bk.i = ni; renderSlots(); } parts.forEach(p => p.remove()); bk.busy = false;
}
const turn = dir => turnTo(bk.i + dir * bk.step, dir);
function closeBook() {
  const fs = $("#bookfs"); fs.classList.remove("on");
  if (bk.segs && bk.segs.length > 1) { const last = bk.segs.filter(x => x.start <= bk.i).pop().story; if (last.id !== bk.segs[0].story.id) openStory(last.id); } document.body.classList.remove("bookopen"); if (bk.done && !document.body.classList.contains("lite")) releaseLanterns(); setTimeout(() => fs.hidden = true, 600); }
$("#bf-close").addEventListener("click", closeBook);
$("#bf-next").addEventListener("click", () => turn(1));
$("#bf-prev").addEventListener("click", () => turn(-1));
$("#bookfs").addEventListener("click", e => {
  if (e.target.id === "bf-end") return closeBook();
  const nx = e.target.closest("[data-next]"); if (nx) appendNext(nx.dataset.next);
});
addEventListener("keydown", e => {
  if ($("#bookfs").hidden) return;
  if (e.key === "ArrowRight") turn(1); else if (e.key === "ArrowLeft") turn(-1); else if (e.key === "Escape") closeBook();
});
let tx = 0;
$("#bookfs").addEventListener("touchstart", e => tx = e.touches[0].clientX, { passive: true });
$("#bookfs").addEventListener("touchend", e => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) turn(dx < 0 ? 1 : -1); }, { passive: true });

// ===== new icons (drawn once, used on the landing page and on the bookmark charm) =====
const V = '<svg viewBox="0 0 64 64" aria-hidden="true">';
const ICONS = {
  horror: V + '<g class="gh"><path d="M12 56V28C12 14 21 6 32 6s20 8 20 22v28l-7-6-6 6-7-6-7 6-6-6-7 6z" fill="#eef0f6"/><ellipse cx="24" cy="26" rx="4" ry="6" fill="#1a1a2e"/><ellipse cx="40" cy="26" rx="4" ry="6" fill="#1a1a2e"/><ellipse cx="32" cy="38" rx="4" ry="5" fill="#1a1a2e"/></g><rect x="49" y="38" width="5" height="14" rx="1" fill="#d9cdb4"/><path class="fl" d="M51.5 27q4 6 0 10q-4-4 0-10z" fill="#ffb347"/></svg>',
  fantasy: V + '<path class="egg" d="M32 6C20 6 12 26 12 40c0 12 9 18 20 18s20-6 20-18C52 26 44 6 32 6z" fill="#6a3fb8" stroke="#d2b0ff" stroke-width="2.5"/><circle cx="22" cy="24" r="2" fill="#9a6be8"/><circle cx="40" cy="20" r="2" fill="#9a6be8"/><circle cx="32" cy="14" r="1.6" fill="#9a6be8"/><path class="crk" d="M14 33l8 6 6-8 8 8 7-7 9 6" fill="none" stroke="#1a0a3a" stroke-width="2.5" stroke-linejoin="round"/><circle class="bl" cx="26" cy="46" r="2.6" fill="#ffd66b"/><circle class="bl" cx="38" cy="46" r="2.6" fill="#ffd66b"/><path class="tw" d="M54 6l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd66b"/></svg>',
  mystery: V + '<g class="hat"><ellipse cx="32" cy="48" rx="26" ry="8" fill="#0b2018" stroke="#3fbf8f" stroke-width="2.5"/><path d="M16 46c0-14 6-22 16-22s16 8 16 22z" fill="#0b2018" stroke="#3fbf8f" stroke-width="2.5"/><path d="M16 42h32" stroke="#3fbf8f" stroke-width="4"/></g><path class="tw" d="M27 9q0-6 5-6t5 5q0 3-4 5-2 1-2 4" fill="none" stroke="#9ff5cf" stroke-width="3" stroke-linecap="round"/><circle class="tw" cx="31" cy="21" r="1.8" fill="#9ff5cf"/></svg>',
  adventure: V + '<path d="M32 4C18 4 8 14 8 26c0 10 8 18 16 24h16c8-6 16-14 16-24C56 14 46 4 32 4z" fill="#f5a623"/><path d="M32 4c-5 7-6 18-6 22h12c0-4-1-15-6-22z" fill="#e5253a" opacity=".9"/><path d="M32 4c-8 8-8 38 0 46M32 4c8 8 8 38 0 46M8 26h48" fill="none" stroke="#3a2308" stroke-width="2.5"/><path d="M24 50l4 8M40 50l-4 8" stroke="#3a2308" stroke-width="2"/><rect x="26" y="58" width="12" height="6" rx="1.5" fill="#6b4a1e"/></svg>',
  shayari: V + '<path d="M30 5a24 24 0 1 0 20 38 19 19 0 1 1-20-38z" fill="#f3e6b8"/><path class="ht" d="M46 46C36 38 34 32 34 28a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 4-2 10-12 18z" fill="#e5568a"/><circle class="tw" cx="52" cy="10" r="2" fill="#e8d28f"/><circle class="tw" cx="58" cy="54" r="1.6" fill="#e8d28f"/><circle class="tw" cx="14" cy="14" r="1.6" fill="#fff"/></svg>'
};
document.querySelectorAll(".spine .ico").forEach(el => el.innerHTML = ICONS[el.closest("[data-world]").dataset.world]);

// ===== bookmark charm: hangs above the book; tap it to save your place =====
function toast(t) { const e = $("#bf-toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2600); }
function updateCharm() {
  const st = segStart(), sv = localStorage.getItem("bm:" + current.id), abs = sv === null ? null : st + +sv, c = $("#charm");
  const here = abs !== null && abs >= bk.i && abs < bk.i + bk.step;
  c.classList.toggle("saved", here); c.classList.toggle("other", abs !== null && !here);
  c.querySelector(".cl").textContent = here ? "The firefly rests here" : abs !== null ? `Firefly waits on page ${+sv + 1}. Tap to go` : "Leave a firefly here";
}
$("#charm").addEventListener("click", () => {
  const k = "bm:" + current.id, st = segStart(), sv = localStorage.getItem(k), abs = sv === null ? null : st + +sv, here = abs !== null && abs >= bk.i && abs < bk.i + bk.step;
  if (here) { localStorage.removeItem(k); toast("The firefly flies free"); }
  else if (abs !== null) { turnTo(abs - (abs % bk.step), abs > bk.i ? 1 : -1); toast(`Following the firefly to page ${+sv + 1}`); }
  else { localStorage.setItem(k, bk.i - st); toast(`The firefly will keep page ${bk.i - st + 1}`); }
  updateCharm();
});

// ===== more for the book: text size, night pages, a page slider, click a page to turn =====
let fsz = 1;
function setSeek() { const r = $("#bf-seek"); if (!r) return; const last = Math.max(1, bk.P.length - 1); r.max = bk.P.length - 1; r.value = bk.i; r.style.setProperty("--p", (bk.i / last * 100) + "%"); }
function rebuild() {
  const frac = bk.i / Math.max(1, bk.P.length); bk.P = buildPages(current, nextOf(current));
  bk.i = Math.min(bk.P.length - 1, Math.floor(frac * bk.P.length)); bk.i -= bk.i % bk.step; renderSlots();
}
function setFsz(v) { fsz = Math.max(.8, Math.min(1.5, v)); $("#bookfs").style.setProperty("--fs", fsz); rebuild(); }
$("#bf-full").addEventListener("click", () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); });
$("#bf-mode").addEventListener("click", () => { const d = $("#bookfs").classList.toggle("dark"); $("#bf-mode").textContent = d ? "Paper pages" : "Night pages"; });
$("#pr").addEventListener("click", e => { if (!e.target.closest("button") && !getSelection().toString()) turn(1); });
$("#pl").addEventListener("click", e => { if (!e.target.closest("button") && !getSelection().toString()) turn(-1); });

// ===== covers: choose a picture from your computer (resized and kept inside the story) =====
let coverData = "";
function showCoverPrev() { const v = coverData || okImg($("#e-cover").value.trim()); $("#cprev").hidden = !v; if (v) $("#cprev-img").src = v; }
function readCover(file) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 700 / img.width, 1050 / img.height), c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", .82));
    };
    img.src = URL.createObjectURL(file);
  });
}
$("#e-coverfile").addEventListener("change", async e => { const f = e.target.files[0]; if (!f) return; coverData = await readCover(f); $("#e-cover").value = ""; showCoverPrev(); });
$("#cprev-rm").addEventListener("click", () => { coverData = ""; $("#e-cover").value = ""; $("#e-coverfile").value = ""; showCoverPrev(); });
$("#e-cover").addEventListener("input", () => { coverData = ""; showCoverPrev(); });

// ===== 9. the sky follows the real time; a line says what hour it is =====
function skyTime() {
  const d = new Date(), h = d.getHours(), tm = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $("#bg").dataset.tod = h < 5 ? "deep" : h < 8 ? "dawn" : h < 17 ? "day" : h < 20 ? "dusk" : "night";
  $("#clk").textContent = h < 5 ? `It's ${tm}. The perfect hour for horror.` : h < 8 ? "Good morning. Shayari tastes best with the first light." : h < 17 ? `It's ${tm}. A fine time for an adventure.` : h < 20 ? "Good evening. The lamps on the lake are being lit." : `It's ${tm}. The night is only beginning.`;
}
skyTime(); setInterval(skyTime, 60000);


// ===== 8. on a phone, tilting the device moves the scenery a little =====
function tilt(e) {
  const x = Math.max(-20, Math.min(20, e.gamma || 0)), y = Math.max(-20, Math.min(20, (e.beta || 45) - 45));
  $("#bg").style.setProperty("--tx", (-x * .9) + "px"); $("#bg").style.setProperty("--ty", (-y * .6) + "px");
}
async function enableTilt() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && DeviceOrientationEvent.requestPermission) { if (await DeviceOrientationEvent.requestPermission() !== "granted") return; }
    addEventListener("deviceorientation", tilt);
  } catch {}
}
addEventListener("touchstart", enableTilt, { once: true, passive: true });

// ===== the secret room =====
let secretData = { title: "You found the secret room", text: "Few readers ever come here.\nSit for a moment. The candle burns only for those who look closely.\n\nचुपके से आए हो, चुपके से जाना,\nयह कमरा किसी को मत बताना।" };
async function loadSecret() {
  try { const d = await getDoc(doc(db, "site", "secret")); if (d.exists()) secretData = { ...secretData, ...d.data() }; } catch {}
  $("#sc-title").value = secretData.title; $("#sc-text").value = secretData.text;
}
function openSecret() {
  const s = $("#secret"); let k = 0;
  $("#s-title").textContent = secretData.title;
  $("#s-text").innerHTML = secretData.text.split("\n").map(l => l.split(" ").filter(Boolean).map(w => `<span style="animation-delay:${(2.2 + k++ * .13).toFixed(2)}s">${esc(w)}</span>`).join(" ")).join("<br>");
  s.hidden = false; s.getBoundingClientRect(); s.classList.add("on");
  localStorage.setItem("secret", "1"); renderDeck();
}
function closeSecret() { const s = $("#secret"); s.classList.remove("on"); setTimeout(() => s.hidden = true, 700); }
$("#s-close").addEventListener("click", closeSecret);
$("#sc-save").addEventListener("click", async () => {
  const d = { title: $("#sc-title").value.trim() || "You found the secret room", text: $("#sc-text").value.trim() };
  try { await setDoc(doc(db, "site", "secret"), d); secretData = d; $("#sc-msg").textContent = "Saved."; }
  catch { $("#sc-msg").textContent = "Could not save. Make sure you are logged in and the Firestore rules allow the 'site' collection."; }
});
let mtaps = [];
$("#moons").addEventListener("click", () => { const n = Date.now(); mtaps = mtaps.filter(t => n - t < 2500); mtaps.push(n); if (mtaps.length >= 3) { mtaps = []; openSecret(); } });
let typed = "";
addEventListener("keydown", e => {
  if (/input|textarea/i.test(e.target.tagName) || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-8); if (typed === "midnight") { typed = ""; openSecret(); }
});
loadSecret();

// ===== performance =====
var loadedOnce = false, SKEL = "<div class=\"loadc\"><svg viewBox=\"0 0 40 90\" aria-hidden=\"true\"><rect x=\"12\" y=\"38\" width=\"16\" height=\"50\" rx=\"2\" fill=\"#d9cdb4\"/><path class=\"lf\" d=\"M20 4q12 16 0 30q-12-14 0-30z\" fill=\"#ffb347\"/><path d=\"M20 14q6 9 0 16q-6-7 0-16z\" fill=\"#fff3c0\"/></svg><p>Lighting the candle...</p></div>";
document.body.classList.add("home");
document.addEventListener("visibilitychange", () => document.body.classList.toggle("tabhidden", document.hidden));
// automatic lite mode: if the device struggles, the heaviest effects switch themselves off
(function () {
  const weak = (navigator.hardwareConcurrency || 8) <= 3 || (navigator.deviceMemory || 8) <= 2 || (navigator.connection && navigator.connection.saveData);
  if (weak) { document.body.classList.add("lite"); return; }
  setTimeout(() => {
    if (document.hidden) return;
    let frames = 0, t0 = 0, aborted = false;
    const stop = () => { aborted = true; };
    document.addEventListener("visibilitychange", stop, { once: true });
    (function tick(t) {
      if (aborted) return; if (!t0) t0 = t; frames++;
      if (t - t0 < 2500) return requestAnimationFrame(tick);
      if (frames / ((t - t0) / 1000) < 42) document.body.classList.add("lite");
    })(performance.now());
  }, 2500);
})();

// ===== 1. headline letters rise into place, one by one =====
function splitH1(el) {
  let n = 0; el.setAttribute("aria-label", el.textContent);
  const walk = node => [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) {
      const frag = document.createDocumentFragment();
      ch.textContent.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(" ")); return; }
        const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
        [...tok].forEach(c => { const s = document.createElement("span"); s.className = "lt"; s.style.setProperty("--n", n++); s.textContent = c; w.appendChild(s); });
        frag.appendChild(w);
      });
      node.replaceChild(frag, ch);
    } else if (ch.nodeType === 1) walk(ch);
  });
  walk(el);
}
document.querySelectorAll("#gate h1").forEach(splitH1);

// ===== 3 and 5. lanterns when a story is finished; dust when a book opens =====
function releaseLanterns() {
  for (let i = 0; i < 7; i++) {
    const l = document.createElement("i"); l.className = "lant";
    l.style.cssText = `--x:${8 + Math.random() * 84}%;--dx:${(Math.random() - .5) * 120}px;--d:${i * .22}s`;
    document.body.appendChild(l); setTimeout(() => l.remove(), 5200);
  }
}
function puffDust() {
  if (document.body.classList.contains("lite")) return;
  const fs = $("#bookfs");
  for (let i = 0; i < 16; i++) {
    const d = document.createElement("i"); d.className = "bdust";
    d.style.cssText = `--dx:${(Math.random() - .5) * 620}px;--dy:${(Math.random() - .6) * 380}px;--s:${2 + Math.random() * 4}px`;
    fs.appendChild(d); setTimeout(() => d.remove(), 2000);
  }
}

// ===== 6. the moon shows today's real phase =====
function moonPhase() {
  const M = 29.530588853, jd = Date.now() / 86400000 + 2440587.5, age = (((jd - 2451550.1) % M) + M) % M, p = age / M;
  const r = 108, cx = 1210, cy = 235, k = Math.cos(2 * Math.PI * p), rx = (r * Math.abs(k)).toFixed(1), waxing = p <= .5;
  const s1 = waxing ? 0 : 1, s2 = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  moonLabel(p);
  const ms = $("#moonshade"); if (!ms) return; ms.setAttribute("d", `M${cx} ${cy - r}A${r} ${r} 0 0 ${s1} ${cx} ${cy + r}A${rx} ${r} 0 0 ${s2} ${cx} ${cy - r}z`);
}
moonPhase();

// ===== opening effects: each world opens in its own way =====
var CURT = {
  horror: "<div class=\"wsc\"><svg viewBox=\"0 0 1200 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><radialGradient id=\"he-b\" cx=\".5\" cy=\".5\" r=\".7\"><stop offset=\"0\" stop-color=\"#3a0008\"/><stop offset=\"1\" stop-color=\"#030001\"/></radialGradient><radialGradient id=\"he-i\"><stop offset=\"0\" stop-color=\"#ffd23a\"/><stop offset=\".4\" stop-color=\"#ff6a1a\"/><stop offset=\".78\" stop-color=\"#c0101e\"/><stop offset=\"1\" stop-color=\"#4a0008\"/></radialGradient><radialGradient id=\"he-g\"><stop offset=\"0\" stop-color=\"#ff2a2a\" stop-opacity=\".45\"/><stop offset=\"1\" stop-color=\"#ff2a2a\" stop-opacity=\"0\"/></radialGradient><clipPath id=\"he-c\"><path d=\"M150 350Q600 60 1050 350Q600 640 150 350Z\"/></clipPath><pattern id=\"he-sc\" width=\"26\" height=\"18\" patternUnits=\"userSpaceOnUse\"><path d=\"M0 18q13-18 26 0\" stroke=\"#4a0c16\" stroke-width=\"2\" fill=\"none\"/></pattern></defs><rect width=\"1200\" height=\"700\" fill=\"url(#he-b)\"/><circle class=\"he-glow\" cx=\"600\" cy=\"350\" r=\"420\" fill=\"url(#he-g)\"/><g class=\"he-eye\"><g clip-path=\"url(#he-c)\"><rect x=\"150\" y=\"60\" width=\"900\" height=\"580\" fill=\"#2a0508\"/><circle cx=\"600\" cy=\"350\" r=\"185\" fill=\"url(#he-i)\"/><g stroke=\"#ffb04a\" stroke-opacity=\".45\" stroke-width=\"2\" fill=\"none\"><path d=\"M670 350L785 350\"/><path d=\"M667 372L776 407\"/><path d=\"M657 391L750 459\"/><path d=\"M641 407L709 500\"/><path d=\"M622 417L657 526\"/><path d=\"M600 420L600 535\"/><path d=\"M578 417L543 526\"/><path d=\"M559 407L491 500\"/><path d=\"M543 391L450 459\"/><path d=\"M533 372L424 407\"/><path d=\"M530 350L415 350\"/><path d=\"M533 328L424 293\"/><path d=\"M543 309L450 241\"/><path d=\"M559 293L491 200\"/><path d=\"M578 283L543 174\"/><path d=\"M600 280L600 165\"/><path d=\"M622 283L657 174\"/><path d=\"M641 293L709 200\"/><path d=\"M657 309L750 241\"/><path d=\"M667 328L776 293\"/></g><ellipse class=\"he-p\" cx=\"600\" cy=\"350\" rx=\"26\" ry=\"150\" fill=\"#000\"/><ellipse cx=\"545\" cy=\"290\" rx=\"22\" ry=\"11\" fill=\"#fff\" opacity=\".55\"/><g class=\"he-lu\"><rect x=\"140\" y=\"40\" width=\"920\" height=\"312\" fill=\"#14030a\"/><rect x=\"140\" y=\"40\" width=\"920\" height=\"312\" fill=\"url(#he-sc)\"/></g><g class=\"he-ll\"><rect x=\"140\" y=\"348\" width=\"920\" height=\"312\" fill=\"#14030a\"/><rect x=\"140\" y=\"348\" width=\"920\" height=\"312\" fill=\"url(#he-sc)\"/></g></g><path d=\"M150 350Q600 60 1050 350Q600 640 150 350Z\" fill=\"none\" stroke=\"#7a0a14\" stroke-width=\"8\"/><rect class=\"he-slit\" x=\"150\" y=\"346\" width=\"900\" height=\"8\" rx=\"4\" fill=\"#ff3a3a\"/></g></svg></div>",
  fantasy: "<div class=\"wsc\"><svg viewBox=\"0 0 1200 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><radialGradient id=\"fa-b\" cx=\".5\" cy=\".5\" r=\".75\"><stop offset=\"0\" stop-color=\"#3a1a7a\"/><stop offset=\"1\" stop-color=\"#07031c\"/></radialGradient><radialGradient id=\"fa-c\"><stop offset=\"0\" stop-color=\"#fff6dc\"/><stop offset=\".35\" stop-color=\"#d9b8ff\"/><stop offset=\"1\" stop-color=\"#7b3aff\" stop-opacity=\"0\"/></radialGradient></defs><rect width=\"1200\" height=\"700\" fill=\"url(#fa-b)\"/><circle class=\"sc-tw\" style=\"animation-delay:-0.00s\" cx=\"0\" cy=\"0\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-0.25s\" cx=\"163\" cy=\"97\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-0.50s\" cx=\"326\" cy=\"194\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-0.75s\" cx=\"489\" cy=\"291\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-1.00s\" cx=\"652\" cy=\"388\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-1.25s\" cx=\"815\" cy=\"485\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-1.50s\" cx=\"978\" cy=\"582\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-1.75s\" cx=\"1141\" cy=\"679\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-2.00s\" cx=\"104\" cy=\"76\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-2.25s\" cx=\"267\" cy=\"173\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-2.50s\" cx=\"430\" cy=\"270\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-2.75s\" cx=\"593\" cy=\"367\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-3.00s\" cx=\"756\" cy=\"464\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-3.25s\" cx=\"919\" cy=\"561\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-3.50s\" cx=\"1082\" cy=\"658\" r=\"1.7\" fill=\"#fff\"/><circle class=\"sc-tw\" style=\"animation-delay:-3.75s\" cx=\"45\" cy=\"55\" r=\"1.7\" fill=\"#fff\"/><g transform=\"translate(600 350)\"><g class=\"fa-r fa-r1\"><circle r=\"240\" fill=\"none\" stroke=\"#c89bff\" stroke-width=\"3\"/><circle r=\"226\" fill=\"none\" stroke=\"#c89bff\" stroke-opacity=\".5\" stroke-dasharray=\"4 10\"/><g stroke=\"#c89bff\" stroke-width=\"3\"><path d=\"M236 0L256 0\"/><path d=\"M228 61L247 66\"/><path d=\"M204 118L222 128\"/><path d=\"M167 167L181 181\"/><path d=\"M118 204L128 222\"/><path d=\"M61 228L66 247\"/><path d=\"M0 236L0 256\"/><path d=\"M-61 228L-66 247\"/><path d=\"M-118 204L-128 222\"/><path d=\"M-167 167L-181 181\"/><path d=\"M-204 118L-222 128\"/><path d=\"M-228 61L-247 66\"/><path d=\"M-236 0L-256 0\"/><path d=\"M-228 -61L-247 -66\"/><path d=\"M-204 -118L-222 -128\"/><path d=\"M-167 -167L-181 -181\"/><path d=\"M-118 -204L-128 -222\"/><path d=\"M-61 -228L-66 -247\"/><path d=\"M-0 -236L-0 -256\"/><path d=\"M61 -228L66 -247\"/><path d=\"M118 -204L128 -222\"/><path d=\"M167 -167L181 -181\"/><path d=\"M204 -118L222 -128\"/><path d=\"M228 -61L247 -66\"/></g></g><g class=\"fa-r fa-r2\"><circle r=\"190\" fill=\"none\" stroke=\"#ffd66b\" stroke-width=\"2.5\" stroke-dasharray=\"18 9\"/><path d=\"M0-160L139 80H-139zM0 160L139-80H-139z\" fill=\"none\" stroke=\"#ffd66b\" stroke-width=\"2.5\"/></g><circle class=\"fa-core\" r=\"130\" fill=\"url(#fa-c)\"/><path class=\"fa-sp\" style=\"--a:0deg;--d:0.00s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:30deg;--d:0.08s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:60deg;--d:0.16s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:90deg;--d:0.24s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:120deg;--d:0.00s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:150deg;--d:0.08s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:180deg;--d:0.16s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:210deg;--d:0.24s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:240deg;--d:0.00s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:270deg;--d:0.08s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:300deg;--d:0.16s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/><path class=\"fa-sp\" style=\"--a:330deg;--d:0.24s\" d=\"M0-14L4-4L14 0L4 4L0 14L-4 4L-14 0L-4-4z\" fill=\"#fff6dc\"/></g></svg></div>",
  mystery: "<div class=\"wsc\"><svg viewBox=\"0 0 1200 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"my-b\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#010806\"/><stop offset=\"1\" stop-color=\"#0a3a2a\"/></linearGradient><linearGradient id=\"my-f\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#9fffd8\" stop-opacity=\"0\"/><stop offset=\".5\" stop-color=\"#9fffd8\" stop-opacity=\".22\"/><stop offset=\"1\" stop-color=\"#9fffd8\" stop-opacity=\"0\"/></linearGradient></defs><rect width=\"1200\" height=\"700\" fill=\"url(#my-b)\"/><g class=\"my-cl\" style=\"--d:0.45s\" transform=\"translate(250 350)\"><ellipse rx=\"12\" ry=\"16\" fill=\"none\" stroke=\"#6fffc0\" stroke-width=\"3\" stroke-dasharray=\"30 6\"/><ellipse rx=\"21\" ry=\"27\" fill=\"none\" stroke=\"#6fffc0\" stroke-width=\"3\" stroke-dasharray=\"27 6\"/><ellipse rx=\"30\" ry=\"38\" fill=\"none\" stroke=\"#6fffc0\" stroke-width=\"3\" stroke-dasharray=\"24 6\"/><ellipse rx=\"39\" ry=\"49\" fill=\"none\" stroke=\"#6fffc0\" stroke-width=\"3\" stroke-dasharray=\"21 6\"/><ellipse rx=\"48\" ry=\"60\" fill=\"none\" stroke=\"#6fffc0\" stroke-width=\"3\" stroke-dasharray=\"18 6\"/></g><g class=\"my-cl\" style=\"--d:0.75s\" transform=\"translate(500 350)\"><g fill=\"#6fffc0\"><ellipse cx=\"-24\" cy=\"-30\" rx=\"14\" ry=\"26\"/><ellipse cx=\"22\" cy=\"34\" rx=\"14\" ry=\"26\"/></g></g><g class=\"my-cl\" style=\"--d:1.05s\" transform=\"translate(740 350)\"><text y=\"60\" font-size=\"190\" font-family=\"Georgia,serif\" font-weight=\"900\" fill=\"#6fffc0\" text-anchor=\"middle\">?</text></g><g class=\"my-cl\" style=\"--d:1.35s\" transform=\"translate(980 350)\"><g stroke=\"#6fffc0\" stroke-width=\"8\" fill=\"none\" stroke-linecap=\"round\"><circle cx=\"-34\" r=\"22\"/><path d=\"M-12 0H50M34 0v18M50 0v14\"/></g></g><g class=\"my-fog\"><rect x=\"-400\" y=\"200\" width=\"2000\" height=\"140\" fill=\"url(#my-f)\"/></g><g class=\"my-fog my-fog2\"><rect x=\"-400\" y=\"380\" width=\"2000\" height=\"160\" fill=\"url(#my-f)\"/></g><g class=\"my-lens\"><circle r=\"78\" fill=\"#3fbf8f\" fill-opacity=\".14\" stroke=\"#6fffc0\" stroke-width=\"10\"/><path d=\"M-48-30A58 58 0 0 1 -10-58\" stroke=\"#fff\" stroke-opacity=\".7\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M56 56L130 130\" stroke=\"#6fffc0\" stroke-width=\"16\" stroke-linecap=\"round\"/></g></svg></div>",
  adventure: "<div class=\"wsc\"><svg viewBox=\"0 0 1200 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><radialGradient id=\"ad-b\" cx=\".5\" cy=\".5\" r=\".8\"><stop offset=\"0\" stop-color=\"#7a3a0a\"/><stop offset=\"1\" stop-color=\"#140902\"/></radialGradient><linearGradient id=\"ad-p\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f3e3b8\"/><stop offset=\".6\" stop-color=\"#dcc08a\"/><stop offset=\"1\" stop-color=\"#c9a86a\"/></linearGradient><mask id=\"ad-m\" maskUnits=\"userSpaceOnUse\" x=\"0\" y=\"0\" width=\"1200\" height=\"700\"><path class=\"ad-rv\" pathLength=\"100\" d=\"M170 470C260 360 340 520 450 420S600 300 700 380S880 330 960 260\" stroke=\"#fff\" stroke-width=\"16\" fill=\"none\"/></mask></defs><rect width=\"1200\" height=\"700\" fill=\"url(#ad-b)\"/><g class=\"ad-map\"><rect x=\"110\" y=\"130\" width=\"980\" height=\"440\" rx=\"10\" fill=\"url(#ad-p)\"/><rect x=\"140\" y=\"160\" width=\"920\" height=\"380\" fill=\"none\" stroke=\"#8a6a3a\" stroke-opacity=\".5\" stroke-dasharray=\"6 8\" stroke-width=\"3\"/></g><g class=\"ad-in\"><g fill=\"#8a5a2a\" fill-opacity=\".75\"><path d=\"M230 300l50-80 50 80zM300 300l40-60 40 60z\"/><path d=\"M820 520l60-90 60 90zM900 520l40-60 40 60z\"/></g><path d=\"M170 520q30-14 60 0t60 0t60 0M700 200q30-14 60 0t60 0t60 0\" stroke=\"#4a8aa0\" stroke-width=\"4\" fill=\"none\" stroke-opacity=\".7\"/><path d=\"M560 470v-60M560 420q-40-10-50 10M560 420q40-10 50 10M560 426q-30-30-60-20\" stroke=\"#4a6a2a\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\"/><circle cx=\"170\" cy=\"470\" r=\"9\" fill=\"#8a3a1a\"/><path d=\"M170 470C260 360 340 520 450 420S600 300 700 380S880 330 960 260\" stroke=\"#8a3a1a\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-dasharray=\"2 16\" fill=\"none\" mask=\"url(#ad-m)\"/><path class=\"ad-x\" d=\"M930 230l60 60m0-60l-60 60\" stroke=\"#c0392b\" stroke-width=\"14\" stroke-linecap=\"round\"/><g transform=\"translate(990 190)\"><g class=\"ad-cp\"><circle r=\"38\" fill=\"none\" stroke=\"#8a5a2a\" stroke-width=\"4\"/><path d=\"M0-50v100M-50 0h100\" stroke=\"#8a5a2a\" stroke-width=\"3\"/><path d=\"M0-34L7 0H-7z\" fill=\"#c0392b\"/></g></g></g></svg></div>",
  shayari: "<div class=\"wsc\"><svg viewBox=\"0 0 1200 700\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><defs><linearGradient id=\"sh2-s\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#090a2c\"/><stop offset=\".55\" stop-color=\"#3a2a7a\"/><stop offset=\"1\" stop-color=\"#c0507a\"/></linearGradient></defs><rect width=\"1200\" height=\"700\" fill=\"url(#sh2-s)\"/><path d=\"M980 70a54 54 0 1 0 44 98a42 42 0 1 1-44-98z\" fill=\"#f3e6b8\" opacity=\".85\"/><path class=\"sh2-w\" style=\"--d:0.00s\" d=\"M-100 120Q300 40 650 150T1400 100\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-w\" style=\"--d:0.12s\" d=\"M-100 225Q300 145 650 255T1400 205\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-w\" style=\"--d:0.24s\" d=\"M-100 330Q300 250 650 360T1400 310\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-w\" style=\"--d:0.36s\" d=\"M-100 435Q300 355 650 465T1400 415\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-w\" style=\"--d:0.48s\" d=\"M-100 540Q300 460 650 570T1400 520\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-w\" style=\"--d:0.60s\" d=\"M-100 645Q300 565 650 675T1400 625\" stroke=\"#ffc2d9\" stroke-opacity=\".28\" stroke-width=\"2\" fill=\"none\" stroke-dasharray=\"140 420\"/><path class=\"sh2-p\" style=\"--py:60px;--py2:-110px;--pw:60px;--s:0.8;--d:0.00s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:113px;--py2:-28px;--pw:97px;--s:1.1;--d:0.06s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:166px;--py2:54px;--pw:134px;--s:1.4;--d:0.12s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:219px;--py2:136px;--pw:171px;--s:1.7;--d:0.18s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:272px;--py2:218px;--pw:208px;--s:2.0;--d:0.24s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:325px;--py2:160px;--pw:75px;--s:0.8;--d:0.30s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:378px;--py2:242px;--pw:112px;--s:1.1;--d:0.37s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:431px;--py2:324px;--pw:149px;--s:1.4;--d:0.43s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:484px;--py2:406px;--pw:186px;--s:1.7;--d:0.49s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:537px;--py2:488px;--pw:223px;--s:2.0;--d:0.55s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:590px;--py2:430px;--pw:90px;--s:0.8;--d:0.61s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:83px;--py2:-48px;--pw:127px;--s:1.1;--d:0.67s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:136px;--py2:34px;--pw:164px;--s:1.4;--d:0.03s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:189px;--py2:116px;--pw:201px;--s:1.7;--d:0.09s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:242px;--py2:198px;--pw:68px;--s:2.0;--d:0.15s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:295px;--py2:140px;--pw:105px;--s:0.8;--d:0.22s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:348px;--py2:222px;--pw:142px;--s:1.1;--d:0.28s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:401px;--py2:304px;--pw:179px;--s:1.4;--d:0.34s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:454px;--py2:386px;--pw:216px;--s:1.7;--d:0.40s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:507px;--py2:468px;--pw:83px;--s:2.0;--d:0.46s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:560px;--py2:410px;--pw:120px;--s:0.8;--d:0.52s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:613px;--py2:492px;--pw:157px;--s:1.1;--d:0.58s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:106px;--py2:14px;--pw:194px;--s:1.4;--d:0.64s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:159px;--py2:96px;--pw:61px;--s:1.7;--d:0.00s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:212px;--py2:178px;--pw:98px;--s:2.0;--d:0.06s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:265px;--py2:120px;--pw:135px;--s:0.8;--d:0.12s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:318px;--py2:202px;--pw:172px;--s:1.1;--d:0.19s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:371px;--py2:284px;--pw:209px;--s:1.4;--d:0.25s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:424px;--py2:366px;--pw:76px;--s:1.7;--d:0.31s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:477px;--py2:308px;--pw:113px;--s:2.0;--d:0.37s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/><path class=\"sh2-p\" style=\"--py:530px;--py2:390px;--pw:150px;--s:0.8;--d:0.43s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ffc2d9\"/><path class=\"sh2-p\" style=\"--py:583px;--py2:472px;--pw:187px;--s:1.1;--d:0.49s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff86b4\"/><path class=\"sh2-p\" style=\"--py:76px;--py2:-6px;--pw:224px;--s:1.4;--d:0.55s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff9ec0\"/><path class=\"sh2-p\" style=\"--py:129px;--py2:76px;--pw:91px;--s:1.7;--d:0.61s\" d=\"M0 0q9-9 17 0q-8 11-17 0z\" fill=\"#ff6fa5\"/></svg></div>"
};
var SW = { horror: [1600, 2100], fantasy: [1500, 2000], mystery: [1600, 2100], adventure: [1500, 2000], shayari: [1500, 2000] };
// ===== first-visit guide =====
const TOUR = [
  ["horror", "Welcome to Moonlit Pages", "Stories and shayari for the dark hours. This quick guide takes about 20 seconds."],
  ["fantasy", "Choose a world", "The home page holds five worlds. Point at one to feel its mood, then tap it to step inside."],
  ["mystery", "Pick a story", "Inside a world, the stories are listed. Tap one to see its book, then tap the cover to open it."],
  ["adventure", "Read like a real book", "Turn pages with the arrows, by tapping a page, or by swiping. Tap the glowing firefly to keep your place. Full screen gives the biggest book."],
  ["shayari", "Make it yours", "Look changes the home page, Guide shows this again, and About introduces the writer. Some platforms on this site are hidden. Keep exploring."]
];
let tstep = 0;
function showTour(i) {
  tstep = i; const [ic, h, p] = TOUR[i];
  $("#t-ico").innerHTML = ICONS[ic]; $("#t-h").textContent = h; $("#t-p").textContent = p;
  $("#t-dots").innerHTML = TOUR.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
  $("#t-next").textContent = i === TOUR.length - 1 ? "Start exploring" : "Next";
}
function openTour() { $("#tour").hidden = false; showTour(0); requestAnimationFrame(() => $("#tour").classList.add("on")); }
function closeTour() { localStorage.setItem("tour", "1"); $("#tour").classList.remove("on"); setTimeout(() => $("#tour").hidden = true, 400); }
function maybeTour() { if (!localStorage.getItem("tour")) setTimeout(openTour, 500); }
$("#t-next").addEventListener("click", () => tstep < TOUR.length - 1 ? showTour(tstep + 1) : closeTour());
$("#t-skip").addEventListener("click", closeTour);
$("#guide").addEventListener("click", openTour);

// ===== stories continue one after another inside the same book =====
var scrollMem = {}, lastView = "gate", lastRead = null;
const segStart = () => ((bk.segs || []).filter(x => x.start <= bk.i).pop() || { start: 0 }).start;
function appendNext(id) {
  const s = stories.find(x => x.id === id); if (!s) return;
  if (!bk.segs.some(g => g.story.id === id)) { const start = bk.P.length; bk.P.push(...buildPages(s, nextOf(s))); bk.segs.push({ story: s, start }); }
  const g = bk.segs.find(x => x.story.id === id); turnTo(g.start - (g.start % bk.step), 1);
}
// ===== the five doors: each world's scene waits behind its own door =====
document.querySelectorAll(".door .dscene").forEach(el => el.innerHTML = WIDE[el.closest("[data-world]").dataset.world]);

// ===== backgrounds: one full scene for the home page and one for every world =====
var BGH = '<svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">';
var _seed = 11; const rnd = () => (_seed = (_seed * 16807) % 2147483647) / 2147483647;
const stars = (n, y0, y1) => Array.from({ length: n }, () => `<circle ${rnd() < .22 ? `class="tw" style="animation-delay:-${(rnd() * 4).toFixed(1)}s" ` : ""}cx="${(rnd() * 1600) | 0}" cy="${(y0 + rnd() * (y1 - y0)) | 0}" r="${(.5 + rnd() * 1.5).toFixed(1)}" fill="#fff" opacity="${(.3 + rnd() * .7).toFixed(2)}"/>`).join("");
const grad = (id, st) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${st.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join("")}</linearGradient>`;
const diya = (y, s, d, dl) => `<g transform="translate(0 ${y}) scale(${s})"><g class="diya" style="animation-duration:${d}s,3.2s;animation-delay:${dl}s,${dl / 10}s"><ellipse cx="0" cy="12" rx="30" ry="6" fill="#ffd98a" opacity=".25"/><circle cx="0" cy="-8" r="24" fill="#ffd98a" opacity=".16"/><path d="M-16 0h32q0 10-16 12q-16-2-16-12z" fill="#c9701f"/><path class="fl" d="M0 -22q9 10 0 20q-9-10 0-20z" fill="#ffb347"/></g></g>`;
const bat = (y, dl) => `<path class="flyw" style="animation-delay:${dl}s" d="M0 ${y}q14-18 28 0q14-18 28 0q-14 8-28 4q-14 4-28-4z" fill="#000"/>`;
const rain = n => Array.from({ length: n }, () => { const x = (rnd() * 1600) | 0; return `<line class="rain" x1="${x}" y1="0" x2="${x - 6}" y2="38" stroke="#bfffe5" stroke-width="1.5" opacity=".28" style="animation-delay:-${(rnd() * 1).toFixed(2)}s;animation-duration:${(.7 + rnd() * .5).toFixed(2)}s"/>`; }).join("");
var HOME_SCENE = BGH + `<defs>
<linearGradient id="hs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s0)"/><stop offset=".5" style="stop-color:var(--s1)"/><stop offset="1" style="stop-color:var(--s2)"/></linearGradient>
<radialGradient id="hm"><stop offset="0" style="stop-color:var(--m);stop-opacity:.95"/><stop offset=".45" style="stop-color:var(--m);stop-opacity:.26"/><stop offset="1" style="stop-color:var(--m);stop-opacity:0"/></radialGradient>
<linearGradient id="hglow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--m);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--m);stop-opacity:0"/></linearGradient>
<filter id="hb" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
</defs>
<rect width="1600" height="900" fill="url(#hs)"/>
${stars(230, 0, 590)}
<g class="twk" fill="#fff"><circle cx="180" cy="120" r="2.6"/><circle cx="420" cy="90" r="2"/><circle cx="690" cy="150" r="2.4"/><circle cx="960" cy="70" r="2"/><circle cx="1390" cy="120" r="2.6"/><circle cx="1520" cy="280" r="1.8"/></g>
<circle class="bglow" cx="1230" cy="210" r="320" fill="url(#hm)" opacity=".72"/>
<circle cx="1230" cy="210" r="106" style="fill:var(--m)"/>
<circle cx="1200" cy="188" r="15" fill="#000" opacity=".08"/><circle cx="1258" cy="236" r="22" fill="#000" opacity=".06"/>
<path id="moonshade" d="" style="fill:var(--s1)" opacity=".9"/>
<g class="mring" fill="none" stroke="#ffffff2e" stroke-width="1.4"><circle cx="1230" cy="210" r="148" stroke-dasharray="2 14"/><circle cx="1230" cy="210" r="194" stroke-dasharray="1 22"/></g>
<g class="hcloud" fill="#ffffff" opacity=".07"><ellipse cx="300" cy="220" rx="260" ry="22"/><ellipse cx="460" cy="250" rx="180" ry="16"/><ellipse cx="980" cy="160" rx="200" ry="18"/></g>
<g class="hcloud hc2" fill="#ffffff" opacity=".05"><ellipse cx="700" cy="330" rx="300" ry="24"/><ellipse cx="1180" cy="360" rx="240" ry="18"/></g>
<path d="M0 640L150 520 300 600 470 470 640 590 820 500 990 610 1170 480 1350 600 1510 520 1600 570V760H0z" style="fill:var(--mt1)" stroke="#ffffff12"/>
<path d="M0 720L140 620 280 690 440 600 610 700 790 630 970 720 1150 640 1330 710 1500 650 1600 690V800H0z" style="fill:var(--mt2)"/>
<g fill="url(#hglow)"><path d="M0 760h1600v80H0z"/></g>
<g fill="#03040d" opacity=".9">${Array.from({ length: 24 }, (_, k) => { const x = 30 + k * 68; const h = 34 + ((k * 47) % 58); const y = 700 + ((k * 23) % 18); return `<path d="M${x} ${y - h}l${(h * .4).toFixed(1)} ${h}h-${(h * .8).toFixed(1)}z"/>`; }).join("")}</g>
<g fill="#02030a">${Array.from({ length: 20 }, (_, k) => { const x = 10 + k * 82; const h = 56 + ((k * 61) % 74); const y = 762 + ((k * 19) % 20); return `<path d="M${x} ${y - h}l${(h * .38).toFixed(1)} ${h}h-${(h * .76).toFixed(1)}z"/>`; }).join("")}</g>
<path d="M706 716L894 716 1560 900 40 900Z" style="fill:var(--tr)"/>
<path d="M742 718L520 900M858 718L1080 900" stroke="#8a7a5a" stroke-width="3" opacity=".55"/>
<g stroke="#3a2f22" stroke-width="3" opacity=".7">${Array.from({ length: 12 }, (_, k) => { const t = k / 11; const y = 718 + 182 * Math.pow(t, 1.55); const half = 78 + 400 * Math.pow(t, 1.25); return `<path d="M${(800 - half).toFixed(0)} ${y.toFixed(0)}h${(half * 2).toFixed(0)}"/>`; }).join("")}</g>
<g transform="translate(1300 690)">
  <path d="M-150 0h320l60 90H-210z" style="fill:var(--mt2)"/>
  <path d="M-150 0h320v10H-150z" fill="#e8d28f" opacity=".12"/>
  <path d="M40 0V-120" stroke="#05060f" stroke-width="7"/>
  <path d="M14-120h52" stroke="#05060f" stroke-width="6"/>
  <circle class="lantern" cx="40" cy="-96" r="10" fill="#ffd98a"/>
  <circle class="lantern" cx="40" cy="-96" r="34" fill="#ffd98a" opacity=".16"/>
  <g transform="translate(-70 0)"><path d="M-34 0h68l-6-8H-28z" fill="#05060f"/><path d="M-26-8V-22h52v14" fill="none" stroke="#05060f" stroke-width="5"/></g>
</g>
<g class="hsignal" transform="translate(1080 690)"><path d="M0 0V-96" stroke="#05060f" stroke-width="6"/><rect x="-12" y="-118" width="24" height="26" rx="4" fill="#0a0d1a" stroke="#05060f"/><circle cx="0" cy="-110" r="6" fill="#ff5a5a"/><circle cx="0" cy="-110" r="18" fill="#ff5a5a" opacity=".18"/></g>
<g class="htrain" fill="#05060f"><g transform="translate(0 618)">
  <rect x="0" y="0" width="34" height="20" rx="3"/><rect x="38" y="2" width="46" height="18" rx="3"/><rect x="88" y="2" width="46" height="18" rx="3"/><rect x="138" y="2" width="40" height="18" rx="3"/>
  <g fill="#ffd98a" opacity=".85"><rect x="43" y="6" width="7" height="7" rx="1"/><rect x="55" y="6" width="7" height="7" rx="1"/><rect x="67" y="6" width="7" height="7" rx="1"/><rect x="93" y="6" width="7" height="7" rx="1"/><rect x="105" y="6" width="7" height="7" rx="1"/><rect x="117" y="6" width="7" height="7" rx="1"/><rect x="143" y="6" width="7" height="7" rx="1"/><rect x="155" y="6" width="7" height="7" rx="1"/></g>
  <circle cx="8" cy="22" r="3" fill="#02030a"/><circle cx="26" cy="22" r="3" fill="#02030a"/><circle cx="50" cy="22" r="3" fill="#02030a"/><circle cx="72" cy="22" r="3" fill="#02030a"/><circle cx="100" cy="22" r="3" fill="#02030a"/><circle cx="122" cy="22" r="3" fill="#02030a"/><circle cx="150" cy="22" r="3" fill="#02030a"/><circle cx="170" cy="22" r="3" fill="#02030a"/>
</g></g>
<g class="hsteam" fill="#d8d2ff" opacity=".13"><ellipse cx="700" cy="650" rx="70" ry="14"/><ellipse cx="780" cy="632" rx="52" ry="11"/><ellipse cx="840" cy="644" rx="40" ry="9"/></g>
<g class="fireflies">${Array.from({ length: 24 }, (_, k) => { const x = 60 + (k * 211) % 1480, y = 620 + (k * 97) % 230; return `<circle class="fly3" cx="${x}" cy="${y}" r="${k % 4 === 0 ? 2.2 : 1.4}" style="--d:-${(k * .6).toFixed(1)}s"/>`; }).join("")}</g>
<path d="M0 900V838q240-26 480-6t480-12 640 18V900z" style="fill:var(--tr)"/>
</svg>`;
var BGS = {
  home: HOME_SCENE,
  horror: BGH + `<defs>
<linearGradient id="hrs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030003"/><stop offset=".48" stop-color="#18030a"/><stop offset="1" stop-color="#5a0814"/></linearGradient>
<radialGradient id="hrm"><stop offset="0" stop-color="#ff8a7a" stop-opacity=".95"/><stop offset=".45" stop-color="#e5253a" stop-opacity=".45"/><stop offset="1" stop-color="#e5253a" stop-opacity="0"/></radialGradient>
<linearGradient id="hfw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#ff6a3a"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#hrs)"/>
${stars(70, 0, 430)}
<circle class="bglow" cx="1190" cy="210" r="330" fill="url(#hrm)" opacity=".9"/>
<circle cx="1190" cy="210" r="118" fill="#ff6b5a"/>
<circle cx="1150" cy="180" r="18" fill="#b0301f" opacity=".55"/>
<circle cx="1220" cy="250" r="26" fill="#b0301f" opacity=".45"/>
<circle cx="1240" cy="175" r="10" fill="#b0301f" opacity=".5"/>
<circle cx="1150" cy="245" r="9" fill="#b0301f" opacity=".4"/>
<g class="drift2" fill="#1a0308" opacity=".65"><ellipse cx="300" cy="220" rx="300" ry="30"/><ellipse cx="520" cy="245" rx="220" ry="20"/></g>
<g class="drift2" style="animation-delay:-7s" fill="#2a050c" opacity=".5"><ellipse cx="1180" cy="290" rx="340" ry="26"/></g>
<path d="M0 640L140 520 260 600 390 470 520 610 660 520 780 620 930 500 1060 610 1210 520 1360 610 1490 540 1600 590V760H0z" fill="#080104"/>
<path d="M0 720L170 620 330 700 520 590 700 700 900 620 1080 720 1270 630 1450 710 1600 650V820H0z" fill="#050002"/>
<path d="M760 700V570h40v-45h60v45h40V500h90v70h30V455h90v115h40V540h80v160z" fill="#050102"/>
<path d="M735 570l65-120 65 120zM850 500l50-100 50 100zM945 455l60-140 60 140zM1045 540l40-90 40 90z" fill="#050102"/>
<path d="M790 455V390h20v65zM905 405V340h22v65zM1025 350V280h24v70zM1115 410V350h18v60z" fill="#0b0205"/>
<g fill="url(#hfw)"><rect class="fl" x="845" y="600" width="18" height="30" rx="3"/><rect class="fl d2" x="910" y="620" width="18" height="30" rx="3"/><rect class="fl" x="985" y="590" width="18" height="34" rx="3"/><rect class="fl d2" x="1065" y="615" width="18" height="30" rx="3"/><rect class="fl" x="1125" y="595" width="16" height="28" rx="3"/></g>
<path d="M860 700V660q0-14 14-14h32q14 0 14 14v40z" fill="#12030a"/>
<path d="M930 720l120-10 60 40-150 20z" fill="#0a0205" opacity=".9"/>
<path d="M0 900V760q260-70 520-20t520-10 560 30V900z" fill="#020001"/>
<path d="M150 900V610m0 90l-90-100m90 55l80-90m-80 30l-24-70m24 130l92-46M1390 900V650m0 70l70-84m-70 38l-78-96m78 140l-86-52" stroke="#030001" stroke-width="14" stroke-linecap="round" fill="none"/>
<path d="M180 620l-30-80m30 50l-60-40m60 100l-90-20M1420 650l36-90m-36 60l70-50m-70 120l100-24" stroke="#030001" stroke-width="8" stroke-linecap="round" fill="none"/>
<g stroke="#050102" stroke-width="9" stroke-linecap="round"><path d="M520 760v-80M500 710h40"/><path d="M660 780v-64M642 735h36"/><path d="M820 770v-74M802 724h36"/></g>
${bat(130, 0)}${bat(190, -5)}${bat(90, -10)}
<g class="drift2" fill="#ffb14a" opacity=".07"><ellipse cx="420" cy="760" rx="520" ry="40"/><ellipse cx="1220" cy="810" rx="560" ry="46"/></g>
<g fill="#ff2a3a" opacity=".8"><ellipse class="fl" cx="360" cy="790" rx="3" ry="2"/><ellipse class="fl d2" cx="372" cy="790" rx="3" ry="2"/><ellipse class="fl" cx="1210" cy="820" rx="3" ry="2"/><ellipse class="fl d2" cx="1222" cy="820" rx="3" ry="2"/></g>
</svg>`,
  fantasy: BGH + `<defs>
<linearGradient id="fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06021a"/><stop offset=".5" stop-color="#2a1458"/><stop offset="1" stop-color="#b57bff"/></linearGradient>
<linearGradient id="fa" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7affc8" stop-opacity="0"/><stop offset=".3" stop-color="#7affc8"/><stop offset=".65" stop-color="#b57bff"/><stop offset="1" stop-color="#ff9ad8" stop-opacity="0"/></linearGradient>
<radialGradient id="fm"><stop offset="0" stop-color="#f0e6ff" stop-opacity=".95"/><stop offset=".5" stop-color="#b57bff" stop-opacity=".3"/><stop offset="1" stop-color="#b57bff" stop-opacity="0"/></radialGradient>
<linearGradient id="fw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fffe0" stop-opacity=".8"/><stop offset="1" stop-color="#9fffe0" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#fs)"/>
${stars(160, 0, 560)}
<circle class="bglow" cx="280" cy="180" r="260" fill="url(#fm)" opacity=".8"/>
<circle cx="280" cy="180" r="88" fill="#f0e6ff" opacity=".95"/>
<circle cx="252" cy="158" r="13" fill="#c8b8ee" opacity=".55"/>
<circle cx="1320" cy="140" r="38" fill="#9fd6ff"/>
<circle cx="1308" cy="130" r="8" fill="#6aa8d6" opacity=".6"/>
<g class="aur2" opacity=".45"><path d="M-100 300C240 160 480 380 780 230S1320 150 1700 300V430C1320 300 1040 470 760 350S260 330 -100 450z" fill="url(#fa)"/></g>
<g class="aur2" style="animation-delay:-4s" opacity=".28"><path d="M-100 380C260 260 520 470 820 330S1360 260 1700 400V500C1340 390 1060 550 780 440S240 430 -100 520z" fill="url(#fa)"/></g>
<g class="cl1" fill="#ffffff" opacity=".16"><ellipse cx="420" cy="240" rx="190" ry="18"/><ellipse cx="540" cy="270" rx="150" ry="14"/></g>
<g class="cl2" fill="#ffffff" opacity=".12"><ellipse cx="1120" cy="200" rx="230" ry="16"/></g>
<g class="isl"><path d="M760 520q150-48 320 0q-42 24-70 100l-60 140q-24 50-50 0l-62-140q-26-76-78-100z" fill="#2a1458"/><path d="M760 520q150-48 320 0q-160 30-320 0z" fill="#4a8a5a"/><path d="M820 510v-70h18v-30l12-20 12 20v30h24v-54l12-18 12 18v54h16v40z" fill="#1a0a3a"/><rect class="fl" x="878" y="438" width="7" height="12" fill="#ffd66b"/><rect class="fl d2" x="922" y="454" width="7" height="12" fill="#ffd66b"/><path d="M900 620v120" stroke="url(#fw)" stroke-width="10" opacity=".55"/></g>
<g class="isl" style="animation-delay:-2.2s"><path d="M160 600q90-30 190 0q-26 16-42 62l-38 86q-14 30-30 0l-38-86q-16-46-42-62z" fill="#24104a"/><path d="M160 600q90-30 190 0q-95 20-190 0z" fill="#3a7a52"/><path d="M215 592v-44h12v-20l8-14 8 14v20h14v26z" fill="#150830"/><rect class="fl" x="238" y="548" width="5" height="9" fill="#ffd66b"/></g>
<g class="isl" style="animation-delay:-3.6s"><path d="M1190 560q80-26 170 0q-24 14-38 54l-34 76q-12 26-26 0l-34-76q-14-40-38-54z" fill="#24104a"/><path d="M1190 560q80-26 170 0q-85 18-170 0z" fill="#3a7a52"/><path d="M1238 552v-38h10v-18l7-12 7 12v18h12v22z" fill="#150830"/></g>
<path d="M760 520l-80-120 60 20 40-80 30 70 70-30-40 120z" fill="#12072a"/>
<path d="M1010 520l50-110 40 30 20-70 40 90 50-20-50 100z" fill="#12072a"/>
<path d="M820 460l24-100 24 100zM950 430l30-120 30 120zM1050 470l22-90 22 90z" fill="#2a1458" stroke="#b57bff" stroke-width="2"/>
<circle class="fl" cx="844" cy="350" r="6" fill="#ffd66b"/><circle class="fl d2" cx="980" cy="300" r="6" fill="#ffd66b"/><circle class="fl" cx="1072" cy="370" r="5" fill="#ffd66b"/>
<g fill="#9fffe0" opacity=".7"><circle class="tw" cx="600" cy="420" r="2"/><circle class="tw" cx="700" cy="380" r="2"/><circle class="tw" cx="1120" cy="430" r="2"/><circle class="tw" cx="1250" cy="390" r="2"/><circle class="tw" cx="400" cy="500" r="2"/></g>
<rect y="800" width="1600" height="100" fill="#160a30" opacity=".75"/>
<g class="drift2" fill="#e0c8ff" opacity=".1"><ellipse cx="420" cy="820" rx="520" ry="40"/><ellipse cx="1220" cy="850" rx="560" ry="46"/></g>
</svg>`,
  mystery: BGH + `<defs>
<linearGradient id="ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#010604"/><stop offset=".55" stop-color="#06241a"/><stop offset="1" stop-color="#0e5a42"/></linearGradient>
<radialGradient id="mm"><stop offset="0" stop-color="#dff5e8" stop-opacity=".9"/><stop offset=".45" stop-color="#3fbf8f" stop-opacity=".3"/><stop offset="1" stop-color="#3fbf8f" stop-opacity="0"/></radialGradient>
<linearGradient id="ml" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfffe5" stop-opacity=".55"/><stop offset="1" stop-color="#bfffe5" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#ms)"/>
${stars(55, 0, 300)}
<circle class="bglow" cx="1200" cy="180" r="240" fill="url(#mm)" opacity=".7"/>
<circle cx="1200" cy="180" r="66" fill="#dff5e8" opacity=".8"/>
<ellipse class="drift2" cx="1140" cy="190" rx="280" ry="24" fill="#06241a" opacity=".85"/>
<path d="M0 900V360h120v-70h70v70h80v-40h60v40h80V900z" fill="#020806"/>
<path d="M1600 900V330h-150v-60h-70v60h-100v-50h-60v50h-80V900z" fill="#020806"/>
<g fill="#ffd98a"><rect class="fl" x="40" y="400" width="14" height="20"/><rect class="fl d2" x="96" y="470" width="14" height="20"/><rect class="fl" x="190" y="430" width="14" height="20"/><rect class="fl d2" x="300" y="390" width="14" height="20"/><rect class="fl" x="1400" y="370" width="14" height="20"/><rect class="fl d2" x="1460" y="440" width="14" height="20"/><rect class="fl" x="1320" y="410" width="14" height="20"/></g>
<path d="M520 900V470h-26" stroke="#020806" stroke-width="10" fill="none"/>
<circle class="fl" cx="494" cy="460" r="16" fill="#bfffe5"/><circle cx="494" cy="460" r="70" fill="#bfffe5" opacity=".16"/>
<path d="M494 470L350 900h288z" fill="url(#ml)" opacity=".5"/>
<g transform="translate(540 700)"><circle cx="0" cy="0" r="18" fill="#020806"/><path d="M-18 16q18-10 36 0l14 64h-64z" fill="#020806"/><path d="M-14 22l-24 38M14 22l24 34" stroke="#020806" stroke-width="10" stroke-linecap="round"/><path d="M-32 36h64" stroke="#020806" stroke-width="8"/><rect x="-10" y="-30" width="20" height="18" fill="#020806"/><ellipse cx="0" cy="-32" rx="26" ry="6" fill="#020806"/></g>
<path d="M1080 900V540h-24" stroke="#020806" stroke-width="10" fill="none"/>
<circle class="fl d2" cx="1056" cy="530" r="14" fill="#ffd98a"/><circle class="fl d2" cx="1056" cy="530" r="64" fill="#ffd98a" opacity=".14"/>
<path d="M1056 540L930 900h252z" fill="url(#ml)" opacity=".28"/>
<path d="M0 900V780q260-40 520-10t520-20 560 30V900z" fill="#020806"/>
<path d="M0 820h1600" stroke="#bfffe5" stroke-width="1" opacity=".18"/>
<g class="drift2" fill="#bfffe5" opacity=".08"><ellipse cx="600" cy="820" rx="560" ry="34"/><ellipse cx="1180" cy="860" rx="600" ry="40"/></g>
<g class="drift2" style="animation-delay:-8s" fill="#bfffe5" opacity=".06"><ellipse cx="300" cy="760" rx="500" ry="30"/></g>
${rain(52)}
<text x="1270" y="330" font-family="Georgia,serif" font-size="240" fill="#3fbf8f" opacity=".07">?</text>
<g stroke="#3fbf8f" stroke-width="2" opacity=".35" fill="none"><path class="rp" d="M420 820q40-8 80 0M470 838q30-6 60 0"/></g>
</svg>`,
  adventure: BGH + `<defs>
<linearGradient id="as" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1030"/><stop offset=".35" stop-color="#a8451f"/><stop offset=".7" stop-color="#ffb347"/><stop offset="1" stop-color="#ffe6a8"/></linearGradient>
<radialGradient id="ag"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffd27a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
<linearGradient id="ar" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd98a" stop-opacity="0"/><stop offset=".5" stop-color="#ffd98a"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#as)"/>
<circle class="bglow" cx="800" cy="610" r="330" fill="url(#ag)" opacity=".7"/>
<circle cx="800" cy="610" r="120" fill="#fff6c8"/>
<g class="cl1" fill="#fff" opacity=".22"><ellipse cx="360" cy="220" rx="190" ry="20"/><ellipse cx="490" cy="252" rx="150" ry="16"/></g>
<g class="cl2" fill="#fff" opacity=".16"><ellipse cx="1140" cy="180" rx="230" ry="18"/></g>
<path d="M0 640L180 470 330 580 520 410 720 600 900 490 1100 620 1300 460 1500 590 1600 540V760H0z" fill="#7a3a1a"/>
<path d="M520 410l30 40-30-10-30 14zM1300 460l26 36-26-8-26 12zM180 470l24 34-24-8-24 12z" fill="#fff" opacity=".6"/>
<path d="M0 720L150 590 320 690 500 560 700 700 900 600 1100 710 1300 590 1500 700 1600 650V820H0z" fill="#4a2210"/>
<g transform="translate(720 470)"><path d="M0 210V70h30V40h40v30h30V20h60v50h30V40h40v30h30v140z" fill="#2a1408"/><path d="M0 70l30-40 30 40zM100 50l30-50 30 50zM160 70l30-40 30 40z" fill="#1a0a04"/><rect x="78" y="150" width="64" height="60" rx="4" fill="#0a0502"/><rect x="40" y="100" width="16" height="24" fill="#ffd98a" opacity=".8"/><rect x="170" y="100" width="16" height="24" fill="#ffd98a" opacity=".8"/><path d="M110 210v-30" stroke="#ffd98a" stroke-width="3" opacity=".5"/></g>
<path d="M690 900C720 800 760 760 760 700s-40-60 0-100" stroke="#ffd98a" stroke-width="22" fill="none" opacity=".35"/>
<path d="M0 900V810q200-30 400 10t400 0 400-20 400 20V900z" fill="#140a04"/>
<path d="M60 830l14-60 14 60zM130 840l16-70 16 70zM1420 830l14-64 14 64zM1500 840l16-70 16 70z" fill="#0a0502"/>
<g class="bal"><g transform="translate(1180 300)"><ellipse rx="40" ry="48" fill="#e5253a"/><path d="M0 -48v96" stroke="#ffd98a" stroke-width="3"/><path d="M-22 44l12 20M22 44l-12 20" stroke="#3a1a08" stroke-width="2"/><rect x="-12" y="62" width="24" height="16" fill="#5a2a0a"/><path d="M-30 18h60" stroke="#ffd98a" stroke-width="2" opacity=".6"/></g></g>
<g class="spin" transform="translate(1340 700)"><circle r="40" fill="none" stroke="#f5a623" stroke-width="3"/><path d="M0-54L8 0 0 54-8 0z" fill="#f5a623"/><path d="M-54 0L0-8 54 0 0 8z" fill="#ffd98a" opacity=".7"/></g>
<path class="rp" d="M80 760C260 700 360 780 520 720S760 660 900 700s260 10 420-40" stroke="url(#ar)" stroke-width="3" stroke-dasharray="2 16" fill="none" opacity=".8"/>
${bat(220, -3).replace('fill="#000"', 'fill="#2a1408"')}
<g class="drift2" fill="#ffe6a8" opacity=".08"><ellipse cx="500" cy="820" rx="520" ry="40"/><ellipse cx="1200" cy="850" rx="560" ry="46"/></g>
</svg>`,
  shayari: BGH + `<defs>
<linearGradient id="ss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05081f"/><stop offset=".5" stop-color="#1b2466"/><stop offset=".8" stop-color="#6a3a8a"/><stop offset="1" stop-color="#d0708a"/></linearGradient>
<radialGradient id="sm"><stop offset="0" stop-color="#f3e6b8" stop-opacity=".9"/><stop offset=".5" stop-color="#f3e6b8" stop-opacity=".25"/><stop offset="1" stop-color="#f3e6b8" stop-opacity="0"/></radialGradient>
<linearGradient id="sr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ec0"/><stop offset="1" stop-color="#e8d28f"/></linearGradient>
<linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e9bd" stop-opacity=".9"/><stop offset="1" stop-color="#d8b98a" stop-opacity=".2"/></linearGradient>
</defs>
<rect width="1600" height="900" fill="url(#ss)"/>
${stars(150, 0, 560)}
<circle class="bglow" cx="300" cy="180" r="250" fill="url(#sm)" opacity=".8"/>
<path d="M300 90a110 110 0 1 0 90 200a88 88 0 1 1-90-200z" fill="#f3e6b8"/>
<circle cx="1390" cy="120" r="4" fill="#ff9ec0" opacity=".8"/>
<g class="cl1" fill="#ffffff" opacity=".1"><ellipse cx="800" cy="240" rx="260" ry="20"/></g>
<path d="M0 620L160 540 320 610 500 520 700 600 900 530 1100 610 1300 540 1500 600 1600 560V900H0z" fill="#0a0e36"/>
<path d="M0 680L180 620 360 680 560 610 760 690 980 620 1200 700 1400 630 1600 690V900H0z" fill="#070b28"/>
<g fill="#ff9ec0" opacity=".55"><circle class="tw" cx="1180" cy="650" r="2"/><circle class="tw" cx="1260" cy="690" r="2"/><circle class="tw" cx="1100" cy="710" r="2"/><circle class="tw" cx="1360" cy="730" r="2"/></g>
<rect y="760" width="1600" height="140" fill="#070b28"/>
<path d="M0 760h1600v18H0z" fill="#e8d28f" opacity=".12"/>
<g stroke="#e8d28f" stroke-width="4" opacity=".28"><path d="M120 760v-60M180 760v-60M240 760v-60M300 760v-60M1280 760v-60M1340 760v-60M1400 760v-60M1460 760v-60"/></g>
<path d="M100 760h160M1240 760h260" stroke="#e8d28f" stroke-width="6" opacity=".4"/>
<g transform="translate(640 720)"><ellipse cx="0" cy="18" rx="150" ry="18" fill="#000" opacity=".25"/><path d="M-130 0h260l-26 18H-104z" fill="#3a200c"/><path d="M-100 0V-14h200V0" fill="#5a3214"/><path d="M-70-14q70-40 140 0" fill="none" stroke="#e8d28f" stroke-width="3" opacity=".4"/></g>
<g transform="translate(610 660)"><path d="M-46 0Q-23-16 0-4Q23-16 46 0L42 24Q21 12 0 22Q-21 12-42 24Z" fill="url(#sg)"/><path d="M0-4v26" stroke="#b08a58" stroke-width="2"/><path d="M-38 8Q-19-1 0 8M4 8Q23-1 38 8" stroke="#b08a58" stroke-width="1.2" fill="none" opacity=".65"/></g>
<g transform="translate(760 690)"><ellipse cx="0" cy="16" rx="30" ry="6" fill="#000" opacity=".3"/><path d="M-18 0h36q0 14-18 16q-18-2-18-16z" fill="#e8d28f"/><path d="M18 4q14 2 0 12" stroke="#e8d28f" stroke-width="3" fill="none"/><path d="M-10-8q4-14 0-24M0-8q4-14 0-24M10-8q4-14 0-24" stroke="#ffffff" stroke-width="2" opacity=".22" fill="none"/></g>
<g transform="translate(390 690)"><circle cx="0" cy="0" r="10" fill="#05060f"/><path d="M-10 8q10-6 20 0l8 40h-36z" fill="#05060f"/><path d="M-8 12l-16 20M8 12l18 16" stroke="#05060f" stroke-width="5" stroke-linecap="round"/><path d="M-20 26l20-10 20 10-20 12z" fill="#e8d28f" opacity=".8"/></g>
<g class="lantern" transform="translate(1120 640)"><path d="M0-40v20" stroke="#e8d28f" stroke-width="2"/><rect x="-12" y="-20" width="24" height="30" rx="4" fill="#ffd98a" opacity=".9"/><circle cx="0" cy="-5" r="30" fill="#ffd98a" opacity=".18"/></g>
<g fill="url(#sr)"><g transform="translate(120 180)"><path class="petal" style="--d:-1s" d="M0 0q8-6 14 0q-6 8-14 0z"/></g><g transform="translate(260 120)"><path class="petal" style="--d:-4s" d="M0 0q8-6 14 0q-6 8-14 0z"/></g><g transform="translate(1180 220)"><path class="petal" style="--d:-7s" d="M0 0q8-6 14 0q-6 8-14 0z"/></g><g transform="translate(1360 160)"><path class="petal" style="--d:-2s" d="M0 0q8-6 14 0q-6 8-14 0z"/></g></g>
<g stroke="#f3e6b8" stroke-width="4" opacity=".35" stroke-linecap="round"><path class="rp" d="M1160 780h160M1180 806h120M1200 832h80"/></g>
</svg>`
};
$("#bg").innerHTML = BGS.home; moonPhase();


// ===================== extras: ambience, typewriter, day of shayari, share styles, trail, parallax, day mode, app =====================
var SFONT = { kalam: "Kalam, 'Noto Serif Devanagari', serif", deva: "'Noto Serif Devanagari', Kalam, serif", odia: "'Noto Sans Oriya', 'Noto Serif Devanagari', Kalam, serif" }, shareFont = "kalam";
document.querySelectorAll("#sharebox [data-sf]").forEach(b => b.addEventListener("click", () => { shareFont = b.dataset.sf; document.querySelectorAll("#sharebox [data-sf]").forEach(o => o.classList.toggle("on", o === b)); if (shareItem) drawShare(); }));
function decorShare(x) {
  const R = (n, m) => (n * m) % 1;
  if (shareStyle === "moon") {
    x.fillStyle = "#fff"; for (let i = 0; i < 70; i++) { x.globalAlpha = .25 + ((i * 37) % 7) / 10; x.fillRect((i * 197) % 1080, (i * 113) % 820, 2 + (i % 3), 2 + (i % 3)); }
    x.globalAlpha = 1; const g = x.createRadialGradient(840, 200, 10, 840, 200, 280); g.addColorStop(0, "#f3e6b855"); g.addColorStop(1, "#f3e6b800"); x.fillStyle = g; x.fillRect(440, 0, 640, 520);
    x.save(); x.translate(740, 70); x.scale(2.2, 2.2); x.fillStyle = "#f3e6b8"; x.fill(new Path2D("M60 0a66 66 0 1 0 54 120a52 52 0 1 1-54-120z")); x.restore();
    x.fillStyle = "#ff9ec0"; for (let i = 0; i < 14; i++) { x.globalAlpha = .7; x.save(); x.translate((i * 271) % 1080, (i * 389) % 1300); x.rotate(i); x.beginPath(); x.ellipse(0, 0, 16, 8, 0, 0, 7); x.fill(); x.restore(); } x.globalAlpha = 1;
  } else if (shareStyle === "rain") {
    x.strokeStyle = "#cfe6ff"; x.lineWidth = 2;
    for (let i = 0; i < 110; i++) { x.globalAlpha = .08 + ((i * 13) % 5) / 40; const px = (i * 149) % 1100, py = (i * 271) % 1350; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 14, py + 90 + (i % 5) * 20); x.stroke(); }
    for (let i = 0; i < 26; i++) { const px = (i * 313) % 1060 + 10, py = (i * 457) % 1300 + 20, r = 8 + (i % 5) * 5, g = x.createRadialGradient(px - r / 3, py - r / 3, 1, px, py, r); g.addColorStop(0, "#ffffffaa"); g.addColorStop(.6, "#9fd0ff22"); g.addColorStop(1, "#9fd0ff55"); x.globalAlpha = 1; x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * 1.3, 0, 0, 7); x.fill(); }
    x.globalAlpha = 1;
  }
}
// reading ambience: each world keeps its mood while people read
function bfAmbience(th) {
  const a = $("#bf-amb"), lite = document.body.classList.contains("lite"), rnd = (m, b = 0) => b + Math.random() * m;
  a.className = "bf-amb amb-" + th; let h = "";
  const part = (n, c, f) => { for (let i = 0; i < (lite ? Math.ceil(n / 3) : n); i++) h += `<b class="${c}" style="--x:${rnd(100)}%;--d:-${rnd(14)}s;--t:${f(i)}s;--s:${rnd(1, .5)}"></b>`; };
  if (th === "horror") h = '<i class="fg"></i><i class="fg fg2"></i><i class="cn"></i><i class="cn cn2"></i>';
  else if (th === "mystery") part(70, "drop", () => rnd(.5, .45));
  else if (th === "fantasy") part(32, "sp", () => rnd(8, 7));
  else if (th === "adventure") part(26, "dm", () => rnd(12, 10));
  a.innerHTML = h;
}
// the first sentence of a story writes itself in the world's own font
async function typeOpening() {
  if (document.body.classList.contains("lite") || matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  await sleep(900);
  const p = document.querySelector("#bookfs .pgtxt.first p"); if (!p || p.dataset.typed) return; p.dataset.typed = 1;
  const full = p.textContent.trim(), m = full.match(/^.{20,170}?[.!?\u0964](\s|$)/), cut = m ? m[0].length : Math.min(full.length, 90), a = full.slice(0, cut), b = full.slice(cut);
  p.innerHTML = `<span class="tw1"></span> <span class="tw2">${esc(b.trim())}</span>`; const t = p.firstChild, r = p.lastChild; r.style.opacity = 0;
  for (let i = 1; i <= a.length; i++) { t.textContent = a.slice(0, i); await sleep(a[i - 1] === " " ? 18 : 32); if (!$("#bookfs").classList.contains("on")) return; }
  t.classList.add("done"); r.style.transition = "opacity .9s"; r.style.opacity = 1;
}
// shayari: lines surface one by one; shayari of the day on the home page
function lines(b) { return String(b || "").split("\n").map((l, k) => `<span class="sl" style="--k:${k}">${esc(l) || "&nbsp;"}</span>`).join(""); }
var lineIO = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("rv"); lineIO.unobserve(en.target); } }), { threshold: .35 });
function observeLines() { document.querySelectorAll("#shayari-list .page").forEach(p => lineIO.observe(p)); }
function renderSotd() {
  const el = $("#sotd"), list = shayari.filter(s => !s.draft); if (!el) return;
  if (!list.length) { el.hidden = true; return; }
  const d = new Date(), day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5), s = list[day % list.length];
  $("#sotd-t").textContent = s.body.split("\n").filter(l => l.trim()).slice(0, 4).join("\n"); el.hidden = false;
}
function moonLabel(p) {
  const n = p < .03 || p > .97 ? "New moon" : p < .22 ? "Waxing crescent" : p < .28 ? "First quarter" : p < .47 ? "Waxing gibbous" : p < .53 ? "Full moon" : p < .72 ? "Waning gibbous" : p < .78 ? "Last quarter" : "Waning crescent";
  const el = $("#moonlbl"); if (el) el.textContent = `\u263E ${n} \u00B7 ${Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100)}% lit tonight`;
}
// desktop: firefly trail in the colour of the world under the cursor. phone and desktop: the sky shifts a little with you.
(() => {
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches, calmMo = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const WC = { horror: "#e5253a", fantasy: "#b57bff", mystery: "#3fbf8f", adventure: "#f5a623", shayari: "#e8d28f", home: "#e8d28f" }, root = document.documentElement.style;
  const par = (x, y) => { root.setProperty("--px", x.toFixed(1)); root.setProperty("--py", y.toFixed(1)); };
  if (calmMo) return;
  if (fine) {
    addEventListener("mousemove", e => par((e.clientX / innerWidth - .5) * -22, (e.clientY / innerHeight - .5) * -16), { passive: true });
    const N = 7, dots = []; let mx = -60, my = -60, col = WC.home;
    for (let i = 0; i < N; i++) { const d = document.createElement("i"); d.className = "trl"; document.body.appendChild(d); dots.push({ d, x: -60, y: -60 }); }
    addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; const w = e.target.closest && e.target.closest("[data-world]"); col = (w && w.style.getPropertyValue("--c").trim()) || WC[document.body.dataset.theme] || WC.home; }, { passive: true });
    (function loop() { let px = mx, py = my; dots.forEach((o, i) => { o.x += (px - o.x) * .35; o.y += (py - o.y) * .35; px = o.x; py = o.y; const s = o.d.style; s.transform = `translate(${o.x}px,${o.y}px) scale(${1 - i / N})`; s.background = col; s.boxShadow = `0 0 ${12 - i}px ${col}`; }); requestAnimationFrame(loop); })();
  } else if ("DeviceOrientationEvent" in window && typeof DeviceOrientationEvent.requestPermission !== "function") {
    addEventListener("deviceorientation", e => { if (e.gamma == null) return; par(-Math.max(-14, Math.min(14, e.gamma)), -.8 * Math.max(-10, Math.min(10, (e.beta || 45) - 45))); }, { passive: true });
  }
})();
// day mode: a paper-and-sunrise landing page for daytime readers
function setDay(on) {
  document.body.classList.toggle("day", on); localStorage.setItem("day", on ? "1" : "0"); $("#daybtn").textContent = on ? "Night" : "Day";
  const m = document.querySelector("meta[name=theme-color]"); if (m) m.content = on ? "#f6ead2" : "#0a0a12";
}
$("#daybtn").addEventListener("click", () => setDay(!document.body.classList.contains("day"))); setDay(localStorage.getItem("day") === "1");
// installable app
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));