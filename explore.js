/* Pastel Pad — trait explorer + share buttons.
   Uses globals from the main script: state, show, draw, getMeta, imageUrl, rankOf,
   tierOf, R, toast, $, emit, SIZES. */
(() => {
  /* =========================================================
     SHARE
     ========================================================= */
  const hosted = location.protocol === "https:";
  function postText() {
    const id = state.id, rk = rankOf(id);
    const rarity = rk != null ? ` is ${tierOf(rk).name}, rank ${rk.toLocaleString()} of 10,000 🌈` : " 🌈";
    return `My Doodle #${id}${rarity} Dressed it up on Pastel Pad` + (hosted ? ` ${location.origin}${location.pathname}#${id}` : "");
  }
  function updateShare() {
    $("shareX").href = "https://x.com/intent/post?text=" + encodeURIComponent(postText());
  }
  // Grab the current picture without the sticker selection ring
  function pictureBlob() {
    return new Promise((resolve) => {
      window.PP_exporting = true; draw();
      $("cv").toBlob((b) => { window.PP_exporting = false; draw(); resolve(b); }, "image/png");
    });
  }
  // Native share sheet (phones) can send the actual picture
  (async () => {
    try {
      const probe = new File([new Blob(["x"], { type: "image/png" })], "probe.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [probe] })) $("shareNative").hidden = false;
    } catch {}
  })();
  $("shareNative").onclick = async () => {
    try {
      const blob = await pictureBlob();
      const file = new File([blob], `pastelpad-doodle-${state.id}.png`, { type: "image/png" });
      await navigator.share({ files: [file], text: postText() });
      emit("download");
    } catch (e) { if (e && e.name !== "AbortError") toast("Sharing didn't work here. Try Download picture instead."); }
  };
  $("shareX").addEventListener("click", () => { updateShare(); toast("Tip: download the picture first, then attach it to your post"); });
  $("shareCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(postText()); toast("Post text copied"); }
    catch { toast(postText()); }
  };
  document.addEventListener("pp:found", updateShare);
  updateShare();

  /* =========================================================
     TRAIT EXPLORER
     ========================================================= */
  const el = $("explore");
  if (!R) { el.innerHTML = `<h2>Explore</h2><p class="hint">The explorer needs the rarity data file (rarity.js) next to this page.</p>`; return; }

  const PAGE = 24;
  const ex = { tab: "rarest", type: null, value: null, ids: [], shown: 0 };
  const byRank = [...Array(R.n).keys()].sort((a, b) => R.rank[a] - R.rank[b]);
  const label = (v) => (v === "none" ? "None" : v);

  function idsWith(type, value) {
    const ti = R.types.indexOf(type), vi = R.values[type].indexOf(value);
    return byRank.filter((id) => R.tokens[id][ti] === vi);
  }

  el.innerHTML = `
    <div class="title-row"><h2>Explore</h2><span class="hint">Tap any trait to see every Doodle that has it</span></div>
    <div class="tabs" id="exTabs" role="group" aria-label="Browse by"></div>
    <div class="values" id="exValues" hidden></div>
    <div class="results-head"><h3 id="exTitle"></h3><span class="hint" id="exCount"></span></div>
    <div class="ex-grid" id="exGrid"></div>
    <div class="more-row"><button class="btn ghost" type="button" id="exMore" hidden>Show more</button></div>`;

  function renderTabs() {
    const tabs = [["rarest", "Rarest 100"], ...R.types.map((t) => [t, t])];
    $("exTabs").innerHTML = "";
    tabs.forEach(([k, name]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = name; b.setAttribute("aria-pressed", ex.tab === k);
      b.onclick = () => { ex.tab = k; if (k === "rarest") showRarest(); else pickType(k); };
      $("exTabs").appendChild(b);
    });
  }

  function renderValues() {
    const box = $("exValues"); box.hidden = !ex.type; box.innerHTML = "";
    if (!ex.type) return;
    const t = ex.type;
    // rarest first
    const order = R.values[t].map((v, i) => [v, R.counts[t][i]]).sort((a, b) => a[1] - b[1]);
    order.forEach(([v, c]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "val"; b.setAttribute("aria-pressed", v === ex.value);
      b.innerHTML = `<span></span><small>${c.toLocaleString()}</small>`;
      b.querySelector("span").textContent = label(v);
      b.title = `${c.toLocaleString()} Doodles (${((c / R.n) * 100).toFixed(c / R.n < .01 ? 2 : 1)}%)`;
      b.onclick = () => pickValue(t, v);
      box.appendChild(b);
    });
    const sel = box.querySelector('[aria-pressed="true"]');
    if (sel) box.scrollTop = Math.max(0, sel.offsetTop - box.offsetTop - 40);
  }

  function showRarest() {
    ex.tab = "rarest"; ex.type = null; ex.value = null;
    ex.ids = byRank.slice(0, 100);
    $("exTitle").textContent = "The 100 rarest Doodles";
    $("exCount").textContent = "Ranked by how rare all their traits are together";
    renderTabs(); renderValues(); resetGrid();
  }
  function pickType(t) {
    ex.tab = t; ex.type = t;
    // Start on the rarest value of that trait
    const rarestVal = R.values[t][R.counts[t].indexOf(Math.min(...R.counts[t]))];
    pickValue(t, rarestVal);
  }
  function pickValue(t, v) {
    ex.tab = t; ex.type = t; ex.value = v;
    ex.ids = idsWith(t, v);
    $("exTitle").textContent = `${label(v)} ${t}`.replace(/^./, (c) => c.toUpperCase());
    const c = ex.ids.length;
    $("exCount").textContent = `${c.toLocaleString()} Doodle${c === 1 ? "" : "s"} · ${((c / R.n) * 100).toFixed(c / R.n < .01 ? 2 : 1)}% · rarest first`;
    renderTabs(); renderValues(); resetGrid();
  }

  // Lazy-load tile pictures as they scroll into view
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      const id = Number(en.target.dataset.id), img = en.target.querySelector("img");
      getMeta(id).then((m) => { setDoodleImg(img, m); }).catch(() => {});
    });
  }, { rootMargin: "200px" }) : null;

  function resetGrid() { $("exGrid").innerHTML = ""; ex.shown = 0; addTiles(); }
  function addTiles() {
    const grid = $("exGrid");
    ex.ids.slice(ex.shown, ex.shown + PAGE).forEach((id) => {
      const rk = R.rank[id], t = tierOf(rk);
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.id = id;
      b.innerHTML = `<img alt="Doodle #${id}" loading="lazy"><b>#${id}</b><small><span class="dot" style="--tier:${t.color}"></span>Rank ${rk.toLocaleString()}</small>`;
      b.onclick = () => { show(id); window.PPGo && window.PPGo("home"); };
      grid.appendChild(b);
      if (io) io.observe(b); else getMeta(id).then((m) => { setDoodleImg(b.querySelector("img"), m); }).catch(() => {});
    });
    ex.shown = Math.min(ex.ids.length, ex.shown + PAGE);
    $("exMore").hidden = ex.shown >= ex.ids.length;
    $("exMore").textContent = `Show more (${(ex.ids.length - ex.shown).toLocaleString()} left)`;
  }
  $("exMore").onclick = addTiles;

  // Trait chips on the Doodle card jump into the explorer
  const openTrait = (chip) => {
    if (!chip || !chip.dataset.type || !R.values[chip.dataset.type]) return;
    pickValue(chip.dataset.type, chip.dataset.value);
    if (window.PPGo) window.PPGo("explore"); else el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  $("traits").addEventListener("click", (e) => openTrait(e.target.closest(".trait")));
  $("traits").addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTrait(e.target.closest(".trait")); } });

  showRarest();
})();
