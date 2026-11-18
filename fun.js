/* Pastel Pad — fun layer: moods, sounds, confetti, personality card, stickers,
   Higher or Lower, daily stamps and badges.
   Uses globals from the main script: state, show, draw, getMeta, imageUrl, rankOf,
   tierOf, R, toast, $, load, store, shelf, FRAMES, PATTERNS, MAX_ID, cap. */
(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hash = (str) => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const pickBy = (arr, seed) => arr[seed % arr.length];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* =========================================================
     SOUNDS (tiny synth, no files)
     ========================================================= */
  let muted = load("pastelpad.muted", false);
  let actx = null;
  function tone(freq, dur = 0.12, type = "sine", vol = 0.12, delay = 0, slideTo = null) {
    if (muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch {}
  }
  const sfx = {
    pop: () => tone(520, 0.08, "sine", 0.1, 0, 880),
    click: () => tone(700, 0.04, "triangle", 0.05),
    right: () => { tone(660, 0.1, "triangle", 0.12); tone(990, 0.16, "triangle", 0.12, 0.09); },
    wrong: () => tone(220, 0.28, "sawtooth", 0.06, 0, 110),
    sparkle: () => [880, 1175, 1568].forEach((f, i) => tone(f, 0.12, "sine", 0.08, i * 0.06)),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i === 3 ? 0.35 : 0.12, "triangle", 0.12, i * 0.1)),
  };

  /* =========================================================
     CONFETTI
     ========================================================= */
  const cc = document.createElement("canvas"); cc.id = "confetti"; document.body.appendChild(cc);
  const cctx = cc.getContext("2d");
  let bits = [], running = false;
  const CONF_COLORS = ["#ffc8e1", "#c9e4ff", "#c6f2dc", "#fff1b8", "#e2d6ff", "#ffb36b", "#a48cff"];
  function confetti(amount = 120, x = innerWidth / 2, y = innerHeight / 3) {
    if (reduceMotion) return;
    for (let i = 0; i < amount; i++) {
      const a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
      bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, r: Math.random() * 6.3, vr: (Math.random() - .5) * .4,
        s: 6 + Math.random() * 8, c: CONF_COLORS[i % CONF_COLORS.length], life: 1, shape: i % 3 });
    }
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    const dpr = devicePixelRatio || 1;
    if (cc.width !== innerWidth * dpr) { cc.width = innerWidth * dpr; cc.height = innerHeight * dpr; }
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0); cctx.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter((b) => b.life > 0 && b.y < innerHeight + 40);
    for (const b of bits) {
      b.vy += 0.28; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life -= 0.006;
      cctx.save(); cctx.globalAlpha = Math.min(1, b.life * 2); cctx.translate(b.x, b.y); cctx.rotate(b.r); cctx.fillStyle = b.c;
      if (b.shape === 0) cctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
      else if (b.shape === 1) { cctx.beginPath(); cctx.arc(0, 0, b.s / 3, 0, 7); cctx.fill(); }
      else { cctx.beginPath(); cctx.moveTo(0, -b.s / 2); cctx.lineTo(b.s / 2, b.s / 2); cctx.lineTo(-b.s / 2, b.s / 2); cctx.fill(); }
      cctx.restore();
    }
    if (bits.length) requestAnimationFrame(tick); else { running = false; cctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  const burstAt = (el, n) => { const r = el.getBoundingClientRect(); confetti(n, r.left + r.width / 2, r.top + r.height / 2); };

  // Soft click sound on every button
  document.addEventListener("click", (e) => { if (e.target.closest("button")) sfx.click(); }, true);

  /* =========================================================
     MOODS (theme switcher) + mute button
     ========================================================= */
  const MOODS = [
    { k: "auto", name: "Classic (follows your device)", sw: "conic-gradient(#ffc8e1, #c9e4ff, #c6f2dc, #fff1b8, #ffc8e1)" },
    { k: "cotton", name: "Cotton Candy", sw: "linear-gradient(135deg, #ffc8e1, #e2d6ff)" },
    { k: "mint", name: "Mint Chip", sw: "linear-gradient(135deg, #c6f2dc, #6b4a3a 140%)" },
    { k: "sunset", name: "Sunset", sw: "linear-gradient(135deg, #fff1b8, #ffb36b, #ff8fb8)" },
    { k: "midnight", name: "Midnight", sw: "linear-gradient(135deg, #1a1e46, #8fb2ff)" },
  ];
  let mood = load("pastelpad.mood", "auto");
  function applyMood() {
    if (mood === "auto") document.documentElement.removeAttribute("data-mood");
    else document.documentElement.setAttribute("data-mood", mood);
    document.querySelectorAll(".mood").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === mood));
  }
  const tools = $("headerTools");
  const moodWrap = document.createElement("div"); moodWrap.className = "moods"; moodWrap.setAttribute("role", "group"); moodWrap.setAttribute("aria-label", "Color mood");
  MOODS.forEach((m) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "mood"; b.dataset.k = m.k; b.title = m.name; b.setAttribute("aria-label", m.name);
    b.style.setProperty("--sw", m.sw);
    b.onclick = () => { mood = m.k; store("pastelpad.mood", mood); applyMood(); sfx.sparkle(); toast(`Mood: ${m.name.replace(/ \(.*/, "")}`); track("mood", m.k); };
    moodWrap.appendChild(b);
  });
  const muteBtn = document.createElement("button");
  muteBtn.type = "button"; muteBtn.className = "icon-btn";
  const paintMute = () => { muteBtn.textContent = muted ? "🔇" : "🔊"; muteBtn.setAttribute("aria-label", muted ? "Turn sounds on" : "Turn sounds off"); muteBtn.title = muteBtn.getAttribute("aria-label"); };
  muteBtn.onclick = () => { muted = !muted; store("pastelpad.muted", muted); paintMute(); if (!muted) sfx.pop(); };
  tools.append(moodWrap, muteBtn); paintMute(); applyMood();

  /* =========================================================
     PERSONALITY CARD
     ========================================================= */
  const P = window.PERSONA;
  const findWord = (vals, table) => { for (const v of vals) for (const [k, w] of table) if (v.toLowerCase().includes(k)) return w; return null; };
  // Each field gets its own independent pick from the Doodle's seed
  const pick = (list, seed, salt) => list[hash(seed + ":" + salt) % list.length];
  const FIELDS = [
    ["Spirit animal", "spiritAnimals"], ["Favorite snack", "snacks"], ["Hobby", "hobbies"], ["Secret talent", "talents"],
    ["Biggest fear", "fears"], ["Love language", "loveLanguages"], ["Perfect weekend", "weekends"], ["Dream job", "dreamJobs"],
    ["Pet peeve", "peeves"], ["Theme song", "themeSongs"],
  ];
  // How many different personality cards are possible
  const TOTAL = (() => {
    let n = P.adjectives.length * P.nouns.length * P.signs.length * P.quotes.length * Math.pow(101, P.stats.length);
    FIELDS.forEach(([, k]) => { n *= P[k].length; });
    return n;
  })();
  function bigWords(n) {
    const names = ["", "thousand", "million", "billion", "trillion", "quadrillion", "quintillion", "sextillion", "septillion", "octillion", "nonillion", "decillion"];
    let i = 0; while (n >= 1000 && i < names.length - 1) { n /= 1000; i++; }
    return `${Math.floor(n).toLocaleString()} ${names[i]}`.trim();
  }

  function renderPersona() {
    const el = $("persona"); const meta = state.meta; if (!meta || !P) return;
    const attrs = meta.attributes || [];
    const vals = attrs.map((a) => a.value);
    const seed = `${state.id}|${vals.join("|")}`;
    const body = attrs.filter((a) => a.trait_type === "body").map((a) => a.value);
    // Use a trait-matched word about half the time so titles stay varied
    const adjMatch = findWord(vals.filter((v, i) => attrs[i].trait_type !== "background"), P.adjWords);
    const nounMatch = findWord(body.length ? body : vals, P.nounWords);
    const adj = adjMatch && hash(seed + ":am") % 2 ? adjMatch : pick(P.adjectives, seed, "adj");
    const noun = nounMatch && hash(seed + ":nm") % 2 ? nounMatch : pick(P.nouns, seed, "noun");
    let rarest = attrs[0];
    if (R) { let best = Infinity; attrs.forEach((a) => { const c = traitCountSafe(a); if (c != null && c < best) { best = c; rarest = a; } }); }
    const rk = rankOf(state.id), tier = rk != null ? tierOf(rk).name : null;
    const stats = P.stats.map((name) => {
      let v = hash(seed + ":stat:" + name) % 101;
      if (name === "Main-character energy" && rk != null) v = Math.max(v, Math.round(100 - (rk / R.n) * 60)); // rarer = more main character
      return [name, v];
    });
    el.hidden = false;
    el.innerHTML = `
      <p class="pkicker">Personality card</p>
      <h2 class="ptitle">The ${esc(adj)} ${esc(noun)}</h2>
      <div class="pmeta">
        <span class="psign">Sign: ${esc(pick(P.signs, seed, "sign"))}</span>
        ${tier ? `<span class="pvibe">${esc(P.vibes[tier])}</span>` : ""}
      </div>
      <div class="pstats">${stats.map(([n, v]) => `
        <div class="pstat"><span>${esc(n)}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join("")}
      </div>
      <dl class="pfacts">
        ${rarest ? `<div><dt>Superpower</dt><dd>Turning heads with that ${esc(String(rarest.value).toLowerCase())} ${esc(rarest.trait_type)}</dd></div>` : ""}
        ${FIELDS.map(([label, k]) => `<div><dt>${label}</dt><dd>${esc(pick(P[k], seed, k))}</dd></div>`).join("")}
      </dl>
      <p class="quote">“${esc(pick(P.quotes, seed, "quote"))}”</p>
      <p class="pcount">One of more than ${bigWords(TOTAL)} possible personalities</p>`;
  }
  function traitCountSafe(a) { try { return traitCount(a.trait_type, a.value); } catch { return null; } }

  /* =========================================================
     STICKERS (drawn on the picture, draggable)
     ========================================================= */
  // Hand-drawn vector stickers (color emoji don't draw reliably on canvas in every browser)
  const STICKERS = [
    { k: "heart", name: "heart" }, { k: "star", name: "star" }, { k: "sparkle", name: "sparkle" }, { k: "rainbow", name: "rainbow" },
    { k: "crown", name: "crown" }, { k: "shades", name: "sunglasses" }, { k: "flame", name: "flame" }, { k: "flower", name: "flower" },
    { k: "💬gm", name: "gm bubble" }, { k: "💬hi!", name: "hi bubble" }, { k: "💬lol", name: "lol bubble" },
  ];
  const OUT = "#2b2540";
  function shapePath(ctx, kind, r) {
    ctx.beginPath();
    if (kind === "heart") {
      ctx.moveTo(0, r * .85);
      ctx.bezierCurveTo(-r * 1.1, r * .05, -r * .9, -r * .95, 0, -r * .4);
      ctx.bezierCurveTo(r * .9, -r * .95, r * 1.1, r * .05, 0, r * .85);
    } else if (kind === "star") {
      for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    } else if (kind === "sparkle") {
      for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, rr = i % 2 ? r * .22 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    } else if (kind === "crown") {
      ctx.moveTo(-r * .85, r * .55); ctx.lineTo(-r * .95, -r * .45); ctx.lineTo(-r * .45, 0); ctx.lineTo(0, -r * .7);
      ctx.lineTo(r * .45, 0); ctx.lineTo(r * .95, -r * .45); ctx.lineTo(r * .85, r * .55);
    } else if (kind === "flame") {
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r * .9, r, -r * .85, r * .1, -r * .35, -r * .3);
      ctx.bezierCurveTo(-r * .3, 0, -r * .1, 0, -r * .05, -r * .15);
      ctx.bezierCurveTo(-r * .1, -r * .6, r * .1, -r * .9, r * .2, -r);
      ctx.bezierCurveTo(r * .3, -r * .5, r * .9, -r * .1, r * .75, r * .45);
      ctx.bezierCurveTo(r * .65, r * .85, r * .35, r, 0, r);
    }
    ctx.closePath();
  }
  function drawShape(ctx, kind, size) {
    const r = size / 2, lw = Math.max(1.5, size * .055);
    ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = OUT; ctx.lineWidth = lw;
    const fillStroke = (fill) => { ctx.fillStyle = fill; ctx.fill(); ctx.save(); ctx.shadowColor = "transparent"; ctx.stroke(); ctx.restore(); };
    if (kind === "heart") { shapePath(ctx, kind, r); fillStroke("#ff8fb8"); }
    else if (kind === "star") { shapePath(ctx, kind, r); fillStroke("#ffd36b"); }
    else if (kind === "sparkle") { shapePath(ctx, kind, r); fillStroke("#c9e4ff"); }
    else if (kind === "crown") {
      shapePath(ctx, kind, r); fillStroke("#ffd36b");
      ctx.shadowColor = "transparent";
      [[-r * .95, -r * .45], [0, -r * .7], [r * .95, -r * .45]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, r * .13, 0, 7); ctx.fillStyle = "#ff8fb8"; ctx.fill(); ctx.stroke(); });
    } else if (kind === "flame") {
      shapePath(ctx, kind, r); fillStroke("#ffb36b");
      ctx.shadowColor = "transparent"; ctx.save(); ctx.scale(.5, .5); ctx.translate(0, r * .9); shapePath(ctx, kind, r); ctx.restore();
      ctx.fillStyle = "#fff1b8"; ctx.fill();
    } else if (kind === "rainbow") {
      const bands = ["#ff8fb8", "#ffd36b", "#c6f2dc", "#c9e4ff", "#e2d6ff"], bw = r * .17;
      ctx.save(); ctx.translate(0, r * .45);
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.arc(0, 0, r - bw * bands.length, 0, Math.PI, true); ctx.closePath();
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.shadowColor = "transparent";
      bands.forEach((c, i) => { ctx.beginPath(); ctx.arc(0, 0, r - bw * (i + .5), Math.PI, 0); ctx.strokeStyle = c; ctx.lineWidth = bw; ctx.lineCap = "butt"; ctx.stroke(); });
      ctx.strokeStyle = OUT; ctx.lineWidth = lw; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 0); ctx.arc(0, 0, r - bw * bands.length, 0, Math.PI, true); ctx.closePath(); ctx.stroke();
      ctx.restore();
    } else if (kind === "flower") {
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
        ctx.beginPath(); ctx.arc(Math.cos(a) * r * .5, Math.sin(a) * r * .5, r * .42, 0, 7); fillStroke(i % 2 ? "#ffc8e1" : "#e2d6ff");
      }
      ctx.shadowColor = "transparent"; ctx.beginPath(); ctx.arc(0, 0, r * .32, 0, 7); fillStroke("#ffd36b");
    } else if (kind === "shades") {
      ctx.beginPath();
      ctx.moveTo(-r, -r * .2); ctx.lineTo(r, -r * .2); ctx.stroke();
      [-1, 1].forEach((sgn) => {
        ctx.beginPath(); ctx.moveTo(sgn * r * .1, -r * .25); ctx.lineTo(sgn * r * .95, -r * .25);
        ctx.quadraticCurveTo(sgn * r * .95, r * .45, sgn * r * .55, r * .45); ctx.quadraticCurveTo(sgn * r * .12, r * .45, sgn * r * .1, -r * .25);
        ctx.closePath(); fillStroke("#2b2540");
        ctx.save(); ctx.shadowColor = "transparent"; ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = lw * .9;
        ctx.beginPath(); ctx.moveTo(sgn * r * .35, -r * .08); ctx.lineTo(sgn * r * .55 , r * .12); ctx.stroke(); ctx.restore();
      });
    }
  }
  state.stickers = [];
  let selected = -1;
  const tray = $("stickerTray");
  STICKERS.forEach(({ k: s, name }) => {
    const b = document.createElement("button");
    const word = s.startsWith("💬");
    b.type = "button"; b.className = "stk" + (word ? " word" : "");
    if (word) b.textContent = "“" + s.slice(2) + "”";
    else {
      const ic = document.createElement("canvas"); ic.width = ic.height = 56; ic.style.width = ic.style.height = "28px";
      const ictx = ic.getContext("2d"); ictx.translate(28, 28); drawShape(ictx, s, 44); b.appendChild(ic);
    }
    b.setAttribute("aria-label", "Add " + name + " sticker");
    b.onclick = () => {
      const n = state.stickers.length;
      state.stickers.push({ e: s, x: 0.5 + ((n % 3) - 1) * 0.18, y: 0.3 + ((n / 3) % 3 | 0) * 0.2, s: 0.14, r: (Math.random() - .5) * 20 });
      selected = state.stickers.length - 1; syncStickerUI(); draw(); sfx.pop();
      if (state.stickers.length >= 5) unlock("stickers");
    };
    tray.appendChild(b);
  });
  const sizeIn = $("stickerSize"), turnIn = $("stickerTurn");
  function syncStickerUI() {
    $("stickerEdit").hidden = state.stickers.length === 0;
    $("cv").classList.toggle("has-stickers", state.stickers.length > 0);
    const st = state.stickers[selected];
    sizeIn.disabled = turnIn.disabled = $("stickerDel").disabled = !st;
    if (st) { sizeIn.value = Math.round(st.s * 100); turnIn.value = Math.round(st.r); }
  }
  sizeIn.oninput = () => { const st = state.stickers[selected]; if (st) { st.s = sizeIn.value / 100; draw(); } };
  turnIn.oninput = () => { const st = state.stickers[selected]; if (st) { st.r = Number(turnIn.value); draw(); } };
  $("stickerDel").onclick = () => { if (selected >= 0) { state.stickers.splice(selected, 1); selected = state.stickers.length - 1; syncStickerUI(); draw(); } };
  $("stickerClear").onclick = () => { state.stickers = []; selected = -1; syncStickerUI(); draw(); };

  function drawSticker(ctx, st, w, h, isSel) {
    const m = Math.min(w, h), size = st.s * m, x = st.x * w, y = st.y * h;
    ctx.save(); ctx.translate(x, y); ctx.rotate((st.r * Math.PI) / 180);
    if (st.e.startsWith("💬")) {
      const text = st.e.slice(2);
      ctx.font = `800 ${size * .5}px "Bricolage Grotesque", system-ui, sans-serif`;
      const tw = ctx.measureText(text).width, bw = tw + size * .6, bh = size * .8;
      ctx.shadowColor = "rgba(30,20,60,.25)"; ctx.shadowBlur = size * .12; ctx.shadowOffsetY = size * .04;
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#2b2540"; ctx.lineWidth = size * .06;
      ctx.beginPath(); roundRect(ctx, -bw / 2, -bh / 2, bw, bh, bh * .45);
      ctx.moveTo(-bw * .15, bh / 2 - 1); ctx.lineTo(-bw * .3, bh / 2 + size * .25); ctx.lineTo(-bw * .02, bh / 2 - 1);
      ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.fillRect(-bw * .14, bh / 2 - size * .07, bw * .11, size * .08);
      ctx.fillStyle = "#2b2540"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 0, size * .03);
      st._r = Math.max(bw, bh) / 2;
    } else {
      ctx.shadowColor = "rgba(30,20,60,.25)"; ctx.shadowBlur = size * .1; ctx.shadowOffsetY = size * .04;
      drawShape(ctx, st.e, size);
      st._r = size * .6;
    }
    if (isSel) {
      ctx.shadowColor = "transparent"; ctx.setLineDash([size * .08, size * .06]); ctx.lineWidth = Math.max(3, m * .004);
      ctx.strokeStyle = "#7b5cff"; ctx.beginPath(); ctx.arc(0, 0, st._r + m * .01, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }
  window.PP_afterDraw = (ctx, w, h) => {
    state.stickers.forEach((st, i) => drawSticker(ctx, st, w, h, i === selected && !window.PP_exporting));
  };

  // Dragging stickers on the canvas
  const cv = $("cv"); let drag = null;
  const toCanvas = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) }; };
  cv.addEventListener("pointerdown", (e) => {
    if (!state.stickers.length) return;
    const p = toCanvas(e);
    for (let i = state.stickers.length - 1; i >= 0; i--) {
      const st = state.stickers[i], dx = p.x - st.x * cv.width, dy = p.y - st.y * cv.height;
      if (Math.hypot(dx, dy) <= (st._r || 60) * 1.1) {
        selected = i; drag = { dx, dy }; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging");
        syncStickerUI(); draw(); e.preventDefault(); return;
      }
    }
    selected = -1; syncStickerUI(); draw();
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drag || selected < 0) return;
    const p = toCanvas(e), st = state.stickers[selected];
    st.x = Math.min(1, Math.max(0, (p.x - drag.dx) / cv.width)); st.y = Math.min(1, Math.max(0, (p.y - drag.dy) / cv.height)); draw();
  });
  const endDrag = () => { if (drag) { drag = null; cv.classList.remove("dragging"); } };
  cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
  syncStickerUI();

  /* =========================================================
     BADGES + DAILY STAMPS (saved on this device)
     ========================================================= */
  const BADGES = [
    { k: "first", icon: "🔍", name: "First Look", desc: "Look up a Doodle by number" },
    { k: "explorer", icon: "🧭", name: "Explorer", desc: "Look at 25 different Doodles", goal: 25, count: () => prog.seen.length },
    { k: "epic", icon: "💜", name: "Epic Find", desc: "Find an Epic Doodle (top 5%)" },
    { k: "legend", icon: "🏆", name: "Legend Hunter", desc: "Find a Legendary Doodle (top 1%)" },
    { k: "collector", icon: "📚", name: "Collector", desc: "Save 10 Doodles to your shelf", goal: 10, count: () => shelf.length },
    { k: "frames", icon: "🖼️", name: "Frame Fan", desc: "Try every frame", goal: FRAMES.length, count: () => prog.frames.length },
    { k: "patterns", icon: "🎨", name: "Pattern Party", desc: "Try every pattern", goal: PATTERNS.length, count: () => prog.patterns.length },
    { k: "moods", icon: "🌈", name: "Mood Swings", desc: "Try every color mood", goal: MOODS.length, count: () => prog.moods.length },
    { k: "stickers", icon: "🎉", name: "Sticker Bomb", desc: "Put 5 stickers on one picture" },
    { k: "download", icon: "💾", name: "Keeper", desc: "Download a picture" },
    { k: "hl5", icon: "👀", name: "Sharp Eye", desc: "Get 5 in a row in Higher or Lower" },
    { k: "hl10", icon: "🧠", name: "Rarity Expert", desc: "Get 10 in a row in Higher or Lower" },
    { k: "day3", icon: "🔥", name: "3-Day Streak", desc: "Check the Doodle of the Day 3 days in a row", goal: 3, count: () => streakNow() },
    { k: "day7", icon: "⚡", name: "7-Day Streak", desc: "7 days in a row", goal: 7, count: () => streakNow() },
    { k: "day30", icon: "👑", name: "30-Day Streak", desc: "30 days in a row", goal: 30, count: () => streakNow() },
  ];
  const prog = Object.assign({ got: [], seen: [], frames: [], patterns: [], moods: [], days: [] }, load("pastelpad.progress", {}));
  const saveProg = () => store("pastelpad.progress", prog);
  const addTo = (list, v) => { if (!list.includes(v)) { list.push(v); return true; } return false; };

  function unlock(k) {
    if (prog.got.includes(k)) return;
    prog.got.push(k); saveProg();
    const b = BADGES.find((x) => x.k === k);
    toast(`${b.icon} Badge unlocked: ${b.name}`); sfx.fanfare(); confetti(140);
    renderBadges(k);
  }
  function checkGoals() { BADGES.forEach((b) => { if (b.goal && b.count() >= b.goal) unlock(b.k); }); }
  function track(kind, v) {
    if (kind === "mood" && addTo(prog.moods, v)) saveProg();
    renderBadges(); checkGoals();
  }

  function streakNow() {
    const set = new Set(prog.days); let n = 0; const d = new Date();
    if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1); // streak still alive if you came yesterday
    while (set.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function renderBadges(fresh) {
    const el = $("badges"); const set = new Set(prog.days); const streak = streakNow();
    const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d); }
    const stamped = set.has(todayKey());
    el.innerHTML = `
      <div class="title-row"><h2>Stamps &amp; badges</h2><span class="hint">${prog.got.length} of ${BADGES.length} badges</span></div>
      <div class="badges-grid">
        <div class="stampcard">
          <h3>Daily stamps</h3>
          <div><span class="streak">${streak}</span> <span class="muted">day streak</span></div>
          <div class="stamps">${days.map((d, i) => `<div class="stamp${set.has(todayKey(d)) ? " on" : ""}${i === 6 ? " today" : ""}"><i>${set.has(todayKey(d)) ? "★" : ""}</i><span>${i === 6 ? "Today" : d.toLocaleDateString(undefined, { weekday: "narrow" })}</span></div>`).join("")}</div>
          <p class="hint">${stamped ? "Today's stamp is collected. Come back tomorrow to keep the streak going." : "Tap “Show me” on the Doodle of the Day to collect today's stamp."}</p>
        </div>
        <div class="badge-list">${BADGES.map((b) => {
          const got = prog.got.includes(b.k);
          const p = !got && b.goal ? ` · ${Math.min(b.count(), b.goal)}/${b.goal}` : "";
          return `<div class="badge ${got ? "got" : "locked"}${fresh === b.k ? " fresh" : ""}"><span class="bi">${b.icon}</span><b>${b.name}</b><small>${b.desc}${p}</small></div>`;
        }).join("")}</div>
      </div>`;
  }

  /* =========================================================
     HIGHER OR LOWER
     ========================================================= */
  const game = { a: null, b: null, streak: 0, best: load("pastelpad.best", 0), locked: false, over: false };
  const gEl = $("game");
  const randId = () => Math.floor(Math.random() * (MAX_ID + 1));
  function newPair() {
    const gap = Math.max(40, 3000 - game.streak * 300); // gets harder as your streak grows
    let a, b, tries = 0;
    do { a = randId(); b = randId(); tries++; } while ((Math.abs(rankOf(a) - rankOf(b)) < gap && tries < 300) || rankOf(a) === rankOf(b));
    return [a, b];
  }
  function renderGameShell() {
    if (!R) { gEl.innerHTML = `<div class="title-row"><h2>Higher or Lower</h2></div><p class="hint">The game needs the rarity data file (rarity.js) next to this page.</p>`; return; }
    gEl.innerHTML = `
      <div class="title-row">
        <h2>Higher or Lower</h2>
        <div class="score"><span id="gStreak">Streak 0</span><span id="gBest">Best ${game.best}</span></div>
      </div>
      <p class="hint">Which Doodle is rarer? Tap it.</p>
      <div class="duel">
        <button class="pick" type="button" id="pickA"><img alt=""><span class="pid"></span><span class="prank"></span></button>
        <span class="vs">vs</span>
        <button class="pick" type="button" id="pickB"><img alt=""><span class="pid"></span><span class="prank"></span></button>
      </div>
      <p class="game-msg" id="gMsg"></p>`;
    $("pickA").onclick = () => guess("a"); $("pickB").onclick = () => guess("b");
    nextRound();
  }
  function fillPick(el, id) {
    el.classList.remove("right", "wrong"); el.disabled = false;
    el.querySelector(".pid").textContent = `#${id}`; el.querySelector(".prank").textContent = "Rank ?";
    const img = el.querySelector("img"); img.removeAttribute("src"); img.alt = `Doodle #${id}`;
    getMeta(id).then((m) => { if (el.dataset.id === String(id)) setDoodleImg(img, m); }).catch(() => {});
    el.dataset.id = id;
  }
  function nextRound() {
    [game.a, game.b] = newPair(); game.locked = false; game.over = false;
    fillPick($("pickA"), game.a); fillPick($("pickB"), game.b);
    $("gMsg").textContent = "";
    $("gStreak").textContent = `Streak ${game.streak}`; $("gBest").textContent = `Best ${game.best}`;
  }
  function guess(side) {
    if (game.locked) return; game.locked = true;
    const ra = rankOf(game.a), rb = rankOf(game.b);
    const pickedRank = side === "a" ? ra : rb, otherRank = side === "a" ? rb : ra;
    const ok = pickedRank <= otherRank; // lower rank number = rarer
    const A = $("pickA"), B = $("pickB");
    A.querySelector(".prank").textContent = `Rank ${ra.toLocaleString()} · ${tierOf(ra).name}`;
    B.querySelector(".prank").textContent = `Rank ${rb.toLocaleString()} · ${tierOf(rb).name}`;
    A.disabled = B.disabled = true;
    const rarer = ra <= rb ? A : B;
    rarer.classList.add("right");
    if (ok) {
      game.streak++; sfx.right();
      if (game.streak > game.best) { game.best = game.streak; store("pastelpad.best", game.best); }
      $("gMsg").textContent = pickBy(["Nice eye!", "Correct!", "You know your Doodles.", "Spot on!", "Rarity radar: on."], game.streak);
      if (game.streak % 5 === 0) { burstAt(gEl, 90); sfx.fanfare(); }
      if (game.streak >= 5) unlock("hl5");
      if (game.streak >= 10) unlock("hl10");
      $("gStreak").textContent = `Streak ${game.streak}`; $("gBest").textContent = `Best ${game.best}`;
      setTimeout(nextRound, 1300);
    } else {
      (side === "a" ? A : B).classList.add("wrong"); sfx.wrong();
      const final = game.streak; game.streak = 0;
      $("gMsg").innerHTML = `<span class="game-over">Not quite. Your streak was <b>${final}</b>. <button class="btn" type="button" id="again">Play again</button></span>`;
      $("again").onclick = () => nextRound();
      $("gStreak").textContent = "Streak 0";
    }
  }

  /* =========================================================
     EVENTS FROM THE MAIN PAGE
     ========================================================= */
  document.addEventListener("pp:found", (e) => {
    const { id, quiet } = e.detail;
    renderPersona();
    if (quiet) return;
    if (addTo(prog.seen, id)) saveProg();
    unlock("first");
    const rk = rankOf(id);
    if (rk != null) {
      const t = tierOf(rk).name;
      if (t === "Legendary") { confetti(220); sfx.fanfare(); unlock("legend"); unlock("epic"); toast(`Legendary! Rank ${rk} of 10,000`); }
      else if (t === "Epic") { burstAt($("doodleCard") || $("canvasBox"), 120); sfx.sparkle(); unlock("epic"); }
      else sfx.pop();
    } else sfx.pop();
    renderBadges(); checkGoals();
  });
  document.addEventListener("pp:option", (e) => {
    const { group, value } = e.detail;
    if (group === "frameChips" && addTo(prog.frames, value)) saveProg();
    if (group === "patternChips" && addTo(prog.patterns, value)) saveProg();
    renderBadges(); checkGoals();
  });
  document.addEventListener("pp:saved", () => { renderBadges(); checkGoals(); });
  document.addEventListener("pp:download", () => unlock("download"));
  document.addEventListener("pp:day", () => {
    const k = todayKey();
    if (addTo(prog.days, k)) { saveProg(); burstAt($("dayBox"), 80); toast("★ Today's stamp collected"); }
    renderBadges(); checkGoals();
  });

  if (state.meta) renderPersona();
  renderBadges(); renderGameShell();
})();
