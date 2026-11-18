/* Pastel Pad — Doodle Rooms.
   Six animated places to hang out and focus, each with its own song and room sounds.
   Your Doodles live inside the scene: add any Doodle by number (up to 3), drag them around,
   and they breathe, bob to the beat, hop now and then, or doze, depending on the room.

   Scenes are drawn on a 1600×1000 stage that is scaled to cover the screen.
   Each scene has a back layer, then the Doodles, then a front layer (desk, grass, cloud…)
   so the Doodles sit *inside* the room.
   Uses globals from the main script: state, getMeta, loadImage, cutout, toast, $, MAX_ID. */
(() => {
  const VW = 1600, VH = 1000, INK = "#2b2540";
  const R = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  const TAU = Math.PI * 2;

  // Painted scenes live in scenes.js
  const { SCENES, drawScene } = window.PP_SCENES;

  const ROOMS = [
    { id: "rainy", name: "Rainy Window", track: "midnight", amb: "rain", tags: ["Lo-fi", "Evening", "Calm"],
      desc: "Rain taps on the glass while the city glows outside. A slow lo-fi beat keeps you company as you sketch into the evening." },
    { id: "meadow", name: "Sunny Meadow", track: "mint", amb: "birds", tags: ["Acoustic", "Morning", "Moderate"],
      desc: "Warm grass, butterflies and a soft breeze. Flute and fingerpicked guitar for thoughts that like to wander." },
    { id: "clouds", name: "Cloud Nap", track: "cotton", amb: "wind", tags: ["Dreamy", "Daytime", "Calm"],
      desc: "Float above everything on a cotton-candy cloud. Harp, kalimba and soft strings for slow, drifting focus." },
    { id: "boardwalk", name: "Sunset Boardwalk", track: "sunset", amb: "waves", tags: ["Disco", "Golden hour", "Upbeat"],
      desc: "Golden light, rolling waves and a roller-disco groove. Turn it up when you need energy." },
    { id: "cafe", name: "Doodle Café", track: "cafe", amb: "cafe", tags: ["Jazz", "Daytime", "Moderate"],
      desc: "Clinking cups, string lights and friendly chatter. Easy café jazz for getting things done." },
    { id: "fireside", name: "Fireside Sketches", track: "fireside", amb: "fire", tags: ["Piano", "Night", "Calm"],
      desc: "A crackling fire, snow drifting past the window and a hot cup of coffee. Settle into the armchair with a slow, thoughtful piano." },
  ];
  const TAG_ICONS = [
    '<svg viewBox="0 0 24 24"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.6"/><circle cx="17.5" cy="16" r="2.6"/></svg>',
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
    '<svg viewBox="0 0 24 24"><path d="M4 17a8 8 0 0 1 16 0"/><path d="M12 17l4-5"/></svg>',
  ];

  /* ---------------- your Doodles in the room ---------------- */
  const guests = []; // { id, src, x, bottom, size, phase, hopAt, dragged }
  let savedIds = []; try { savedIds = JSON.parse(localStorage.getItem("pastelpad.roomGuests2") || "[]"); } catch {}
  const saveIds = () => { try { localStorage.setItem("pastelpad.roomGuests2", JSON.stringify(guests.filter((g) => !g.auto).map((g) => g.id))); } catch {} };
  const loading = new Set();

  async function addGuest(id, quiet, auto) {
    id = Number(id);
    if (!Number.isInteger(id) || id < 0 || id > MAX_ID) { if (!quiet) toast(`Doodle numbers go from 0 to ${MAX_ID}`); return; }
    if (guests.some((g) => g.id === id) || loading.has(id)) { if (!quiet) toast(`#${id} is already in the room`); return; }
    if (guests.length >= 3) { if (!quiet) toast("This room fits 3 Doodles. Remove one first."); return; }
    loading.add(id); renderGuestList();
    try {
      let src;
      if (state.id === id && (state.cut || state.img)) src = state.cut || state.img;
      else { const meta = await getMeta(id); const img = await loadImage(meta); src = cutout(img).cut || img; }
      const g = { id, auto: !!auto, src, phase: Math.random() * TAU, hopAt: 3 + Math.random() * 6, dragged: false };
      guests.push(g); placeGuests(); saveIds();
      if (!quiet) toast(`#${id} joined the room`);
    } catch { if (!quiet) toast(`Couldn't load #${id}. Try again in a moment.`); }
    loading.delete(id); renderGuestList(); redrawPreviews();
  }
  function removeGuest(id) { const i = guests.findIndex((g) => g.id === id); if (i >= 0) guests.splice(i, 1); placeGuests(); saveIds(); renderGuestList(); redrawPreviews(); }
  function placeGuests(force) {
    const sc = SCENES[ROOMS[cur].id];
    guests.forEach((g, i) => { if (g.dragged && !force) return; const [x, b, s] = sc.spots[i]; g.x = x; g.bottom = b; g.size = s; g.dragged = false; });
  }

  // How a Doodle moves: breathing always, plus the room's pose, plus an occasional hop
  function drawGuest(ctx, g, t, pose, bpm, live, selected) {
    const beat = t * (live ? bpm : 60) / 60, amp = live ? 1 : .5, s = g.size;
    const br = Math.sin(t * 2.2 + g.phase);
    let dy = 0, rot = 0, sx = 1 - .008 * br, sy = 1 + .012 * br;
    if (pose === "nod") { rot = Math.sin(beat * Math.PI + g.phase) * .025 * amp; dy = -Math.abs(Math.sin(beat * Math.PI)) * s * .01 * amp; }
    if (pose === "bob") { dy = -Math.abs(Math.sin(beat * Math.PI)) * s * .025 * amp; rot = Math.sin(beat * Math.PI / 2 + g.phase) * .02; }
    if (pose === "dance") { const b = Math.abs(Math.sin(beat * Math.PI)); dy = -b * s * .05 * amp; rot = Math.sin(beat * Math.PI / 2 + g.phase) * .05 * amp; sy *= 1 - .035 * (1 - b) * amp; sx *= 1 + .03 * (1 - b) * amp; }
    if (pose === "sway") rot = Math.sin(t * 1.3 + g.phase) * .05;
    if (pose === "doze") { rot = -.06 + Math.sin(t * .7 + g.phase) * .02; sy = 1 + .025 * Math.sin(t * 1.1 + g.phase); sx = 1 - .012 * Math.sin(t * 1.1 + g.phase); }
    // little hop every few seconds (not while dozing or being dragged)
    if (pose !== "doze" && !selected) {
      if (t > g.hopAt + .7) g.hopAt = t + 5 + Math.random() * 7;
      if (t >= g.hopAt) {
        const p = (t - g.hopAt) / .7;
        if (p < .15) { sy *= 1 - .08 * Math.sin(p / .15 * Math.PI); sx *= 1 + .06 * Math.sin(p / .15 * Math.PI); }
        else if (p < .85) dy -= Math.sin((p - .15) / .7 * Math.PI) * s * .12;
        else { sy *= 1 - .06 * Math.sin((p - .85) / .15 * Math.PI); sx *= 1 + .05 * Math.sin((p - .85) / .15 * Math.PI); }
      }
    }
    ctx.save();
    ctx.globalAlpha = .28; ctx.filter = "blur(6px)"; ctx.fillStyle = "#1a0f1f"; ctx.beginPath(); ctx.ellipse(g.x, g.bottom - 6, s * .33 * (1 + dy / s), s * .04, 0, 0, TAU); ctx.fill(); ctx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.translate(g.x, g.bottom + dy); ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.drawImage(g.src, -s / 2, -s * .99, s, s);
    if (selected) { ctx.setLineDash([10, 10]); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.strokeRect(-s * .38, -s * .97, s * .76, s * .97); }
    ctx.restore();
  }

  function renderScene(ctx, w, h, roomIdx, t, live, selectedId) {
    const room = ROOMS[roomIdx], sc = SCENES[room.id];
    const s = Math.max(w / VW, h / VH), ox = (w - VW * s) / 2, oy = (h - VH * s) / 2;
    ctx.setTransform(s, 0, 0, s, ox, oy);
    const bpm = window.PPMusic ? window.PPMusic.bpm() : 80;
    const list = roomIdx === cur ? guests : guests.map((g, i) => ({ ...g, x: sc.spots[i][0], bottom: sc.spots[i][1], size: sc.spots[i][2] }));
    drawScene(ctx, room.id, t, () => list.forEach((g) => drawGuest(ctx, g, t, sc.pose, bpm, live, g.id === selectedId)), list);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { s, ox, oy };
  }

  /* ---------------- section with room cards ---------------- */
  let cur = 0;
  const section = $("rooms");
  section.innerHTML = `
    <div class="title-row">
      <div><p class="pkicker">Doodle Rooms</p><h2>Take your Doodle somewhere nice</h2></div>
      <span class="hint">Pick a room, put on headphones, find your flow</span>
    </div>
    <div class="room-grid" id="roomGrid"></div>`;
  const grid = $("roomGrid");
  const previews = [];
  ROOMS.forEach((room, i) => {
    const card = document.createElement("article");
    card.className = "room-card";
    card.innerHTML = `
      <button type="button" class="room-thumb" aria-label="Enter ${room.name}"><canvas width="480" height="300"></canvas><span class="room-enter">Enter room →</span></button>
      <div class="room-body">
        <h3 class="room-name"></h3>
        <p class="room-desc"></p>
        <div class="room-tags">${room.tags.map((tg, k) => `<span>${TAG_ICONS[k]}${tg}</span>`).join("")}</div>
      </div>`;
    card.querySelector(".room-name").textContent = room.name;
    card.querySelector(".room-desc").textContent = room.desc;
    const cv = card.querySelector("canvas");
    previews.push(cv);
    let hoverRAF = null;
    const thumb = card.querySelector(".room-thumb");
    thumb.onclick = () => openRoom(i, true);
    thumb.onpointerenter = () => { const t0 = performance.now(); const loop = (now) => { renderScene(cv.getContext("2d"), cv.width, cv.height, i, 2 + (now - t0) / 1000, false); hoverRAF = requestAnimationFrame(loop); }; hoverRAF = requestAnimationFrame(loop); };
    thumb.onpointerleave = () => { cancelAnimationFrame(hoverRAF); renderScene(cv.getContext("2d"), cv.width, cv.height, i, 2, false); };
    grid.appendChild(card);
  });
  function redrawPreviews() { previews.forEach((cv, i) => renderScene(cv.getContext("2d"), cv.width, cv.height, i, 2, false)); }

  /* ---------------- full-screen room ---------------- */
  const ov = document.createElement("div");
  ov.className = "room-view"; ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
  ov.innerHTML = `
    <canvas class="room-canvas" id="roomCanvas"></canvas>
    <div class="room-top">
      <button type="button" class="room-pill" id="roomClose"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>Browse rooms</button>
      <div class="room-nav">
        <button type="button" class="room-round" id="roomPrev" aria-label="Previous room"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button type="button" class="room-round" id="roomNext" aria-label="Next room"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>
    </div>
    <div class="room-panel" id="roomPanel">
      <button type="button" class="room-hide" id="roomHide" aria-label="Hide panel">–</button>
      <h2 class="room-title" id="roomTitle"></h2>
      <p class="room-text" id="roomText"></p>
      <div class="room-tags" id="roomTags"></div>
      <div class="room-controls">
        <button type="button" class="room-play" id="roomPlay" aria-label="Play this room">
          <svg viewBox="0 0 24 24" class="i-play"><path d="M7 4.5v15l13-7.5z"/></svg>
          <svg viewBox="0 0 24 24" class="i-pause"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>
        </button>
        <div class="mixer">
          <label for="mixMusic"><span>Music</span><input type="range" id="mixMusic" min="0" max="100"></label>
          <label for="mixAmb"><span id="mixAmbLabel">Room sounds</span><input type="range" id="mixAmb" min="0" max="100"></label>
        </div>
      </div>
      <div class="room-guests">
        <h3>Doodles in this room</h3>
        <div class="guest-list" id="guestList"></div>
        <form class="guest-add" id="guestAdd">
          <label for="guestNum" class="sr">Doodle number to add</label>
          <span>#</span><input id="guestNum" inputmode="numeric" autocomplete="off" placeholder="Add a Doodle by number">
          <button type="submit" class="btn">Add</button>
        </form>
        <p class="hint">Drag your Doodles to move them around the room.</p>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const rc = $("roomCanvas"), rctx = rc.getContext("2d");
  let raf = null, t0 = 0, layout = { s: 1, ox: 0, oy: 0 }, dragging = null;
  const AMB_NAMES = { rain: "Rain", fire: "Crackling fire", birds: "Birds & breeze", wind: "Soft wind", waves: "Waves", cafe: "Café chatter" };

  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    rc.width = Math.round(innerWidth * dpr); rc.height = Math.round(innerHeight * dpr);
  }
  function loop(now) {
    const t = (now - t0) / 1000;
    layout = renderScene(rctx, rc.width, rc.height, cur, t, window.PPMusic && window.PPMusic.isPlaying(), dragging && dragging.g.id);
    raf = requestAnimationFrame(loop);
  }
  const isRoomPlaying = () => window.PPMusic && window.PPMusic.isPlaying() && window.PPMusic.current() === ROOMS[cur].track;
  function paintRoom() {
    const room = ROOMS[cur];
    $("roomTitle").textContent = room.name;
    $("roomText").textContent = room.desc;
    $("roomTags").innerHTML = room.tags.map((tg, k) => `<span>${TAG_ICONS[k]}${tg}</span>`).join("");
    $("mixAmbLabel").textContent = AMB_NAMES[room.amb];
    const on = isRoomPlaying();
    $("roomPlay").classList.toggle("on", on);
    $("roomPlay").setAttribute("aria-label", on ? "Pause this room" : "Play this room");
  }
  function renderGuestList() {
    const el = $("guestList"); if (!el) return;
    el.innerHTML = "";
    guests.forEach((g) => {
      const chip = document.createElement("span"); chip.className = "guest-chip";
      chip.innerHTML = `<b>#${g.id}</b><button type="button" aria-label="Remove #${g.id} from the room">×</button>`;
      chip.querySelector("button").onclick = () => removeGuest(g.id);
      el.appendChild(chip);
    });
    loading.forEach((id) => { const chip = document.createElement("span"); chip.className = "guest-chip loading"; chip.textContent = `#${id}…`; el.appendChild(chip); });
    if (!guests.length && !loading.size) el.innerHTML = `<span class="hint">No Doodles here yet. Add one below.</span>`;
    $("guestNum").disabled = guests.length >= 3;
  }
  function openRoom(i, fromCard) {
    cur = (i + ROOMS.length) % ROOMS.length;
    placeGuests(true);
    if (ov.hidden) {
      ov.hidden = false; document.body.classList.add("room-open"); sizeCanvas(); t0 = performance.now();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      $("mixMusic").value = Math.round((window.PPMusic ? window.PPMusic.volume() : .6) * 100);
      $("mixAmb").value = Math.round((window.PPMusic ? window.PPMusic.ambienceVolume() : .6) * 100);
      $("roomClose").focus();
      // on phones, start with the panel folded so your Doodle is visible
      const tuck = innerWidth < 640, p = $("roomPanel");
      p.classList.toggle("tucked", tuck);
      $("roomHide").textContent = tuck ? "+" : "–";
      $("roomHide").setAttribute("aria-label", tuck ? "Show panel" : "Hide panel");
    }
    // entering a room starts its song + sounds (the click counts as permission to play);
    // switching rooms while music is on hands over to the new room's song
    if (window.PPMusic && (fromCard || window.PPMusic.isPlaying())) { window.PPMusic.playTrack(ROOMS[cur].track); window.PPMusic.setAmbience(ROOMS[cur].amb); }
    paintRoom(); renderGuestList();
  }
  function closeRoom() {
    ov.hidden = true; document.body.classList.remove("room-open"); cancelAnimationFrame(raf);
    if (window.PPMusic) { window.PPMusic.setAmbience(null); if (window.PPMusic.isPlaying()) window.PPMusic.pause(); }
    redrawPreviews();
  }
  $("roomClose").onclick = closeRoom;
  $("roomPrev").onclick = () => openRoom(cur - 1);
  $("roomNext").onclick = () => openRoom(cur + 1);
  $("roomPlay").onclick = () => {
    if (!window.PPMusic) return;
    if (isRoomPlaying()) { window.PPMusic.pause(); window.PPMusic.setAmbience(null); }
    else { window.PPMusic.playTrack(ROOMS[cur].track); window.PPMusic.setAmbience(ROOMS[cur].amb); }
    setTimeout(paintRoom, 50);
  };
  $("mixMusic").oninput = (e) => window.PPMusic && window.PPMusic.setVolume(e.target.value / 100);
  $("mixAmb").oninput = (e) => window.PPMusic && window.PPMusic.setAmbienceVolume(e.target.value / 100);
  $("roomHide").onclick = () => { const p = $("roomPanel"); p.classList.toggle("tucked"); $("roomHide").textContent = p.classList.contains("tucked") ? "+" : "–"; $("roomHide").setAttribute("aria-label", p.classList.contains("tucked") ? "Show panel" : "Hide panel"); };
  $("guestAdd").onsubmit = (e) => {
    e.preventDefault(); const v = $("guestNum").value.replace(/[^0-9]/g, ""); if (!v) return; $("guestNum").value = "";
    guests.forEach((g) => { g.auto = false; }); // once you pick guests yourself, they stay
    addGuest(v);
  };
  if (window.PPMusic) window.PPMusic.onChange(() => { if (!ov.hidden) paintRoom(); });
  addEventListener("resize", () => { if (!ov.hidden) sizeCanvas(); });
  addEventListener("keydown", (e) => {
    if (ov.hidden || e.target.tagName === "INPUT") return;
    if (e.key === "Escape") closeRoom();
    if (e.key === "ArrowRight") openRoom(cur + 1);
    if (e.key === "ArrowLeft") openRoom(cur - 1);
    if (e.key === " ") { e.preventDefault(); $("roomPlay").click(); }
  });

  // Dragging Doodles around the room
  const toStage = (e) => { const dpr = rc.width / rc.clientWidth; return { x: ((e.clientX * dpr) - layout.ox) / layout.s, y: ((e.clientY * dpr) - layout.oy) / layout.s }; };
  rc.addEventListener("pointerdown", (e) => {
    const p = toStage(e);
    for (let i = guests.length - 1; i >= 0; i--) {
      const g = guests[i];
      if (Math.abs(p.x - g.x) < g.size * .36 && p.y < g.bottom && p.y > g.bottom - g.size * .95) {
        dragging = { g, dx: p.x - g.x, dy: p.y - g.bottom }; rc.setPointerCapture(e.pointerId); rc.classList.add("dragging");
        guests.push(...guests.splice(i, 1)); // bring to front
        return;
      }
    }
  });
  rc.addEventListener("pointermove", (e) => {
    const p = toStage(e);
    if (!dragging) {
      rc.style.cursor = guests.some((g) => Math.abs(p.x - g.x) < g.size * .36 && p.y < g.bottom && p.y > g.bottom - g.size * .95) ? "grab" : "";
      return;
    }
    const g = dragging.g;
    g.x = Math.max(80, Math.min(VW - 80, p.x - dragging.dx));
    g.bottom = Math.max(g.size * .7, Math.min(VH + 40, p.y - dragging.dy));
    // a bit bigger in front, a bit smaller further back
    const base = SCENES[ROOMS[cur].id].spots[0][2];
    g.size = Math.max(base * .45, Math.min(base * 1.15, base * (.35 + .65 * g.bottom / VH)));
    g.dragged = true;
  });
  const drop = () => { if (dragging) { dragging = null; rc.classList.remove("dragging"); } };
  rc.addEventListener("pointerup", drop); rc.addEventListener("pointercancel", drop);

  /* ---------------- start ---------------- */
  // Your current Doodle joins automatically; saved guests come back too
  document.addEventListener("pp:found", (e) => {
    const id = e.detail.id;
    // your Doodle is always in the rooms: it takes the place of the last one you looked up
    if (guests.some((g) => g.id === id)) return redrawPreviews();
    const old = guests.findIndex((g) => g.auto);
    if (old >= 0) guests.splice(old, 1);
    if (guests.length >= 3) guests.pop();
    addGuest(id, true, true).then(() => {
      const i = guests.findIndex((x) => x.id === id);
      if (i >= 0) { guests.unshift(guests.splice(i, 1)[0]); placeGuests(true); }
      redrawPreviews();
    });
  });
  (async () => { for (const id of savedIds.slice(0, 3)) await addGuest(id, true); redrawPreviews(); })();
  redrawPreviews();
  if (document.fonts) document.fonts.ready.then(redrawPreviews);
})();
