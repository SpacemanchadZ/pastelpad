/* Pastel Pad — Doodle Room scenes, painted style.
   Soft light, depth and haze instead of outlines: far layers are blurred and lighter,
   lamps and fire glow, and a little film grain + vignette ties each scene together.

   Each scene draws on a 1600×1000 stage:
     bakeBack(ctx)  – still background, painted once and cached (can use blur)
     bakeFront(ctx) – still foreground pieces (desk, table, railing…), cached
     back(ctx, t)   – moving things behind the Doodles (rain, snow, fire, clouds…)
     front(ctx, t, guests, placeFront) – moving things in front; placeFront() draws the cached front
     tint           – a soft colour wash so the Doodles share the room's light
   spots: where up to 3 Doodles stand [x, bottom, size]; pose: how they move. */
window.PP_SCENES = (() => {
  const VW = 1600, VH = 1000, TAU = Math.PI * 2;
  const R = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  /* ---------- painting helpers ---------- */
  const lin = (ctx, x0, y0, x1, y1, stops) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  const rad = (ctx, x, y, r, stops) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; };
  function fill(ctx, path, style) { ctx.beginPath(); path(); ctx.fillStyle = style; ctx.fill(); }
  function blur(ctx, px, fn) { ctx.save(); ctx.filter = `blur(${px}px)`; fn(); ctx.restore(); }
  function glow(ctx, x, y, r, color, alpha = 1) {
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = alpha;
    ctx.fillStyle = rad(ctx, x, y, r, [[0, color], [1, "rgba(0,0,0,0)"]]); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const rr = (ctx, x, y, w, h, r) => () => (ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h));

  // Soft cloud sprite, painted once and reused at any size
  let cloudImg = null;
  function cloudSprite() {
    if (cloudImg) return cloudImg;
    const c = document.createElement("canvas"); c.width = 600; c.height = 300; const x = c.getContext("2d");
    x.filter = "blur(3px)";
    [[170, 190, 95], [270, 140, 120], [390, 170, 105], [470, 205, 75], [110, 220, 60], [300, 215, 110]].forEach(([cx, cy, r]) => {
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rad(x, cx - r * .3, cy - r * .5, r * 1.4, [[0, "#ffffff"], [.7, "#fbf6ff"], [1, "#e9def5"]]); x.fill();
    });
    x.filter = "none"; x.globalCompositeOperation = "source-atop";
    x.fillStyle = lin(x, 0, 120, 0, 300, [[0, "rgba(255,255,255,0)"], [1, "rgba(190,170,220,.45)"]]); x.fillRect(0, 0, 600, 300);
    cloudImg = c; return c;
  }
  const cloud = (ctx, x, y, w, alpha = 1) => { ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(cloudSprite(), x, y, w, w / 2); ctx.restore(); };

  function steam(ctx, x, y, t, height = 200, n = 3, spread = 16) {
    for (let w = 0; w < n; w++) {
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const yy = y - k * height / 30, life = k / 30;
        const xx = x + (w - (n - 1) / 2) * spread + Math.sin(yy * .04 + t * 1.6 + w * 1.9) * (4 + life * 16);
        k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.strokeStyle = lin(ctx, 0, y, 0, y - height, [[0, "rgba(255,255,255,.55)"], [1, "rgba(255,255,255,0)"]]);
      ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.stroke();
    }
  }
  function cup(ctx, x, y, body = "#f4efe8", liquid = "#6b4330") {
    fill(ctx, () => ctx.ellipse(x, y + 4, 64, 15, 0, 0, TAU), lin(ctx, 0, y - 10, 0, y + 18, [[0, "#ffffff"], [1, "#d9d2cc"]]));
    fill(ctx, () => { ctx.moveTo(x - 44, y - 72); ctx.lineTo(x + 44, y - 72); ctx.quadraticCurveTo(x + 42, y - 2, x, y); ctx.quadraticCurveTo(x - 42, y - 2, x - 44, y - 72); ctx.closePath(); },
      lin(ctx, x - 44, 0, x + 44, 0, [[0, "#ffffff"], [.55, body], [1, "#c9bfb6"]]));
    ctx.beginPath(); ctx.arc(x + 50, y - 46, 15, -1.3, 1.3); ctx.lineWidth = 9; ctx.strokeStyle = "#ddd5ce"; ctx.stroke();
    fill(ctx, () => ctx.ellipse(x, y - 72, 44, 10, 0, 0, TAU), lin(ctx, 0, y - 82, 0, y - 62, [[0, "#8a5a40"], [1, liquid]]));
    ctx.fillStyle = "rgba(245,230,210,.9)"; ctx.beginPath(); ctx.moveTo(x, y - 66); ctx.bezierCurveTo(x - 14, y - 74, x - 8, y - 82, x, y - 75); ctx.bezierCurveTo(x + 8, y - 82, x + 14, y - 74, x, y - 66); ctx.fill();
  }

  // Post effects shared by every room: colour wash, vignette, film grain
  let grain = null;
  function grainTile() {
    if (grain) return grain;
    const c = document.createElement("canvas"); c.width = c.height = 160; const x = c.getContext("2d"), d = x.createImageData(160, 160);
    for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    x.putImageData(d, 0, 0); grain = c; return c;
  }
  function post(ctx, t, tint) {
    if (tint) { ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = tint; ctx.fillRect(0, 0, VW, VH); ctx.restore(); }
    ctx.save(); ctx.fillStyle = rad(ctx, VW / 2, VH * .48, VW * .72, [[0, "rgba(0,0,0,0)"], [.6, "rgba(0,0,0,0)"], [1, "rgba(12,6,20,.5)"]]); ctx.fillRect(0, 0, VW, VH); ctx.restore();
    ctx.save(); ctx.globalAlpha = .045; ctx.globalCompositeOperation = "overlay";
    const g = grainTile(), ox = Math.floor(R(Math.floor(t * 12)) * 160), oy = Math.floor(R(Math.floor(t * 12) + 9) * 160);
    ctx.translate(-ox, -oy); ctx.fillStyle = ctx.createPattern(g, "repeat"); ctx.fillRect(0, 0, VW + 160, VH + 160); ctx.restore();
  }

  /* =====================================================
     RAINY WINDOW — dim evening room, city lights through wet glass
     ===================================================== */
  const W1 = { x: 300, y: 80, w: 1000, h: 560 };
  function frame1(ctx) {
    const fr = "#3f3566";
    [[W1.x - 22, W1.y - 22, W1.w + 44, 24], [W1.x - 22, W1.y + W1.h - 2, W1.w + 44, 24], [W1.x - 22, W1.y - 22, 24, W1.h + 44], [W1.x + W1.w - 2, W1.y - 22, 24, W1.h + 44],
      [W1.x + W1.w / 2 - 9, W1.y, 18, W1.h], [W1.x, W1.y + 270, W1.w, 16]].forEach(([x, y, w, h]) => {
      ctx.fillStyle = fr; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(x, y, w, 3);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x, y + h - 3, w, 3);
    });
  }
  const rainy = {
    tint: "rgba(120,110,200,.35)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [[0, "#2c2448"], [1, "#171228"]]); ctx.fillRect(0, 0, VW, VH);
      // the view
      ctx.save(); ctx.beginPath(); ctx.rect(W1.x, W1.y, W1.w, W1.h); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, W1.y, 0, W1.y + W1.h, [[0, "#141a3a"], [.6, "#2c2a5a"], [1, "#4a3566"]]); ctx.fillRect(W1.x, W1.y, W1.w, W1.h);
      blur(ctx, 3, () => { for (let i = 0; i < 16; i++) { const bx = W1.x - 20 + i * 68, bh = 140 + R(i) * 250; ctx.fillStyle = i % 3 ? "#181d40" : "#1e2350"; ctx.fillRect(bx, W1.y + W1.h - bh, 64, bh); } });
      blur(ctx, 7, () => {
        for (let i = 0; i < 90; i++) {
          const x = W1.x + R(i) * W1.w, y = W1.y + 180 + R(i + 50) * (W1.h - 200), r = 6 + R(i + 99) * 22;
          ctx.globalAlpha = .25 + R(i + 7) * .5; ctx.fillStyle = ["#ffcf8a", "#ff9fb8", "#9fc4ff", "#fff1c4", "#ffb37a"][i % 5];
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      ctx.fillStyle = lin(ctx, W1.x, W1.y, W1.x + W1.w, W1.y + W1.h, [[0, "rgba(255,255,255,.07)"], [.5, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,.04)"]]); ctx.fillRect(W1.x, W1.y, W1.w, W1.h);
      ctx.restore();
      // (the frame is drawn every frame, over the rain)
      fill(ctx, rr(ctx, W1.x - 50, W1.y + W1.h + 18, W1.w + 100, 30, 6), lin(ctx, 0, W1.y + W1.h + 18, 0, W1.y + W1.h + 48, [[0, "#5a4d8f"], [1, "#2f2752"]]));
      // (the plant on the sill is drawn every frame, in front of the frame)
    },
    bakeFront(ctx) {
      // desk
      fill(ctx, () => ctx.rect(0, 800, VW, 200), lin(ctx, 0, 800, 0, 1000, [[0, "#b98d6e"], [.12, "#a27659"], [1, "#6e4a37"]]));
      ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(0, 800, VW, 4);
      // lamp
      fill(ctx, () => ctx.ellipse(1335, 800, 70, 14, 0, 0, TAU), "#2b2340");
      ctx.beginPath(); ctx.moveTo(1335, 796); ctx.lineTo(1300, 640); ctx.lineWidth = 10; ctx.strokeStyle = "#2b2340"; ctx.lineCap = "round"; ctx.stroke();
      fill(ctx, () => { ctx.moveTo(1225, 668); ctx.lineTo(1296, 566); ctx.lineTo(1388, 646); ctx.closePath(); }, lin(ctx, 1225, 600, 1388, 660, [[0, "#ffe7bf"], [1, "#e9a86c"]]));
      // books + mug
      fill(ctx, rr(ctx, 170, 752, 170, 26, 5), "#8fa7d6"); fill(ctx, rr(ctx, 182, 726, 146, 26, 5), "#d98ba3"); fill(ctx, rr(ctx, 176, 702, 150, 24, 5), "#e8d6a8");
      cup(ctx, 470, 800, "#e9e6f5", "#5a3a2a");
    },
    back(ctx, t) {
      ctx.save(); ctx.beginPath(); ctx.rect(W1.x, W1.y, W1.w, W1.h); ctx.clip();
      // far rain: thin, faint, slightly blurred (it's out past the glass)
      ctx.save(); ctx.filter = "blur(1px)"; ctx.strokeStyle = "rgba(190,200,255,.13)"; ctx.lineWidth = 1.2;
      for (let k = 0; k < 140; k++) {
        const x = W1.x + R(k + 300) * (W1.w + 40), y = W1.y + ((R(k + 302) * W1.h + t * 480 * (.8 + R(k + 301) * .4)) % (W1.h + 40)) - 30;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 20); ctx.stroke();
      }
      ctx.restore();
      // nearer rain, still outside
      ctx.strokeStyle = "rgba(205,215,255,.2)"; ctx.lineWidth = 1.5;
      for (let k = 0; k < 90; k++) {
        const sp = .8 + R(k + 1) * .5, x = W1.x + R(k) * (W1.w + 40), y = W1.y + ((R(k + 2) * W1.h + t * 700 * sp) % (W1.h + 40)) - 30;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 28); ctx.stroke();
      }
      // the glass: a soft reflection and a little mist at the bottom
      ctx.fillStyle = lin(ctx, W1.x, W1.y, W1.x + W1.w * .6, W1.y + W1.h, [[0, "rgba(255,255,255,.08)"], [.35, "rgba(255,255,255,.02)"], [.36, "rgba(255,255,255,0)"], [1, "rgba(255,255,255,0)"]]);
      ctx.fillRect(W1.x, W1.y, W1.w, W1.h);
      ctx.fillStyle = lin(ctx, 0, W1.y + W1.h - 140, 0, W1.y + W1.h, [[0, "rgba(200,190,240,0)"], [1, "rgba(200,190,240,.16)"]]);
      ctx.fillRect(W1.x, W1.y + W1.h - 140, W1.w, 140);
      // drops sitting on the glass, sliding slowly
      for (let k = 0; k < 26; k++) {
        const x = W1.x + 30 + R(k * 3) * (W1.w - 60), y = W1.y + ((R(k * 5) * W1.h + t * 16 * (.4 + R(k))) % W1.h), r = 3 + R(k + 4) * 5;
        ctx.fillStyle = "rgba(220,230,255,.22)"; ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.3, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .4, r * .3, 0, TAU); ctx.fill();
      }
      ctx.restore();
      // the frame goes over everything outside, so rain never crosses it
      frame1(ctx);
      // plant on the sill, swaying a little
      for (let i = 0; i < 7; i++) {
        ctx.save(); ctx.translate(1180, 640); ctx.rotate(-2.5 + i * .36 + Math.sin(t * 1.1 + i) * .03);
        fill(ctx, () => ctx.ellipse(0, -62, 20, 64, 0, 0, TAU), i % 2 ? "#2f5a4e" : "#3e7564"); ctx.restore();
      }
      fill(ctx, rr(ctx, 1145, 625, 72, 62, 10), lin(ctx, 1145, 0, 1217, 0, [[0, "#d98b6a"], [1, "#a8604a"]]));
    },
    front(ctx, t, guests, placeFront) {
      placeFront();
      const fl = .92 + .08 * Math.sin(t * 2.3);
      // lamp light pool on the desk + glow
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .22 * fl;
      fill(ctx, () => { ctx.moveTo(1240, 660); ctx.lineTo(1380, 650); ctx.lineTo(1560, 860); ctx.lineTo(1080, 860); ctx.closePath(); }, lin(ctx, 0, 650, 0, 860, [[0, "rgba(255,210,150,.9)"], [1, "rgba(255,210,150,0)"]]));
      ctx.restore();
      glow(ctx, 1310, 650, 520, "rgba(255,190,120,.55)", .55 * fl);
      steam(ctx, 470, 720, t, 170);
    },
    spots: [[800, 830, 520], [1060, 822, 380], [560, 822, 380]], pose: "nod",
  };

  /* =====================================================
     SUNNY MEADOW — hazy morning, light rays, layered hills
     ===================================================== */
  const meadow = {
    tint: "rgba(255,230,170,.35)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, 700, [[0, "#8ec6ee"], [.55, "#cfe6f2"], [1, "#fde6c4"]]); ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = rad(ctx, 1240, 230, 620, [[0, "rgba(255,248,220,1)"], [.15, "rgba(255,240,200,.9)"], [1, "rgba(255,240,200,0)"]]); ctx.fillRect(0, 0, VW, VH);
      blur(ctx, 6, () => fill(ctx, () => { ctx.moveTo(0, 560); ctx.bezierCurveTo(300, 470, 650, 520, 900, 540); ctx.bezierCurveTo(1150, 560, 1350, 470, 1600, 520); ctx.lineTo(1600, 1000); ctx.lineTo(0, 1000); ctx.closePath(); }, "#b3d3c4"));
      blur(ctx, 5, () => { for (let i = 0; i < 9; i++) { const x = 80 + i * 190 + R(i) * 60, y = 560 + R(i + 3) * 30; ctx.fillStyle = "#93bfa6"; ctx.beginPath(); ctx.ellipse(x, y, 60, 50, 0, 0, TAU); ctx.fill(); } });
      blur(ctx, 2.5, () => fill(ctx, () => { ctx.moveTo(0, 680); ctx.bezierCurveTo(400, 600, 800, 690, 1100, 660); ctx.bezierCurveTo(1300, 640, 1450, 650, 1600, 680); ctx.lineTo(1600, 1000); ctx.lineTo(0, 1000); ctx.closePath(); }, lin(ctx, 0, 620, 0, 900, [[0, "#9ccaa4"], [1, "#82b98b"]])));
      fill(ctx, () => { ctx.moveTo(0, 790); ctx.bezierCurveTo(500, 720, 1000, 800, 1600, 760); ctx.lineTo(1600, 1000); ctx.lineTo(0, 1000); ctx.closePath(); }, lin(ctx, 0, 740, 0, 1000, [[0, "#86c08d"], [1, "#5c9a68"]]));
      blur(ctx, 1.5, () => { for (let i = 0; i < 160; i++) { const x = R(i) * VW, y = 800 + R(i + 9) * 160; ctx.globalAlpha = .7; ctx.fillStyle = ["#ffd1df", "#fff3b8", "#ffffff", "#e8d4ff"][i % 4]; ctx.beginPath(); ctx.arc(x, y, 3 + R(i + 2) * 4, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; });
      // a soft tree on the left
      blur(ctx, 1.2, () => {
        fill(ctx, rr(ctx, 205, 560, 26, 170, 8), "#7a5a48");
        [[218, 520, 95, "#5f9a72"], [168, 560, 70, "#6aa77d"], [270, 556, 72, "#589068"], [220, 450, 72, "#73b086"]].forEach(([x, y, r, c]) => fill(ctx, () => ctx.arc(x, y, r, 0, TAU), c));
      });
    },
    back(ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const a = 1.95 + i * .16 + Math.sin(t * .15 + i) * .02;
        ctx.globalAlpha = .045 + .02 * Math.sin(t * .5 + i);
        fill(ctx, () => { ctx.moveTo(1240, 230); ctx.lineTo(1240 + Math.cos(a - .04) * 1500, 230 + Math.sin(a - .04) * 1500); ctx.lineTo(1240 + Math.cos(a + .04) * 1500, 230 + Math.sin(a + .04) * 1500); ctx.closePath(); }, "#fff6d8");
      }
      ctx.restore();
      for (let i = 0; i < 4; i++) cloud(ctx, ((R(i) * 1900 + t * (10 + i * 5)) % 2200) - 400, 90 + i * 55, 260 + R(i + 5) * 160, .9);
    },
    front(ctx, t) {
      // foreground grass, no outlines, slight sway
      for (let layer = 0; layer < 2; layer++) {
        for (let i = 0; i < 70; i++) {
          const x = i * 24 + R(i + layer * 70) * 18 - 10, h = (60 + R(i + 3 + layer * 70) * 70) * (layer ? 1.15 : .85), sw = Math.sin(t * 1.6 + x * .008 + layer) * 14;
          fill(ctx, () => { ctx.moveTo(x - 7, 1005); ctx.quadraticCurveTo(x + sw * .4, 1005 - h * .6, x + sw, 1005 - h); ctx.quadraticCurveTo(x + sw * .3 + 4, 1005 - h * .5, x + 7, 1005); ctx.closePath(); },
            layer ? lin(ctx, 0, 1005 - h, 0, 1005, [[0, "#6fae74"], [1, "#3f7a4e"]]) : lin(ctx, 0, 1005 - h, 0, 1005, [[0, "#8cc58c"], [1, "#5a9564"]]));
        }
      }
      // pollen catching the light
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 40; i++) {
        const x = (R(i) * VW + Math.sin(t * .3 + i) * 40) % VW, y = 300 + ((R(i + 4) * 600 - t * (8 + R(i) * 10)) % 600 + 600) % 600;
        ctx.globalAlpha = .3 + .3 * Math.sin(t * 2 + i); ctx.fillStyle = "#fff6d0"; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
      }
      ctx.restore();
      // butterflies
      for (let i = 0; i < 2; i++) {
        const x = 800 + Math.sin(t * .4 + i * 2.4) * 560, y = 480 + Math.sin(t * .7 + i) * 130 + Math.sin(t * 2.6 + i) * 14, f = .35 + Math.abs(Math.sin(t * 11 + i)) * .65;
        ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.globalAlpha = .9;
        fill(ctx, () => { ctx.ellipse(-12, -4, 14, 11, -.5, 0, TAU); ctx.ellipse(12, -4, 14, 11, .5, 0, TAU); }, i ? "#ffd1e3" : "#fff2b5");
        ctx.restore();
      }
    },
    spots: [[800, 975, 560], [1130, 965, 420], [470, 965, 420]], pose: "sway",
  };

  /* =====================================================
     CLOUD NAP — dreamy pastel sky above the clouds
     ===================================================== */
  const clouds = {
    tint: "rgba(255,200,230,.3)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [[0, "#c9b6ef"], [.45, "#f4c6dc"], [1, "#ffe1d0"]]); ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = rad(ctx, 800, 640, 700, [[0, "rgba(255,240,230,.85)"], [1, "rgba(255,240,230,0)"]]); ctx.fillRect(0, 0, VW, VH);
      blur(ctx, 14, () => {
        ["rgba(255,170,200,.35)", "rgba(255,230,160,.32)", "rgba(170,230,200,.3)", "rgba(160,200,255,.32)", "rgba(210,180,255,.3)"].forEach((c, i) => {
          ctx.beginPath(); ctx.arc(800, 1050, 760 - i * 34, Math.PI, 0); ctx.lineWidth = 34; ctx.strokeStyle = c; ctx.stroke();
        });
      });
      for (let i = 0; i < 60; i++) { ctx.globalAlpha = .25 + R(i) * .5; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(R(i + 3) * VW, R(i + 40) * 420, .8 + R(i + 80) * 1.8, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      blur(ctx, 8, () => { for (let i = 0; i < 7; i++) cloud(ctx, -150 + i * 260, 700 + R(i) * 60, 520, .9); });
    },
    back(ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 18; i++) { ctx.globalAlpha = .4 * Math.abs(Math.sin(t * .7 + i * 1.3)); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(R(i + 200) * VW, R(i + 240) * 380, 2.2, 0, TAU); ctx.fill(); }
      ctx.restore();
      for (let i = 0; i < 5; i++) cloud(ctx, ((R(i + 3) * 1900 + t * (6 + i * 3)) % 2300) - 450, 120 + i * 85, 300 + R(i) * 220, .85);
      const b = Math.sin(t * .6) * 8;
      cloud(ctx, 120, 560 + b, 1360, 1);
    },
    front(ctx, t, guests) {
      const b = Math.sin(t * .6) * 8;
      cloud(ctx, 200, 790 + b, 560, 1); cloud(ctx, 760, 810 + b, 640, 1); cloud(ctx, -120, 830 + b, 420, 1); cloud(ctx, 1280, 830 + b, 440, 1);
      ctx.save();
      guests.forEach((g, gi) => {
        for (let k = 0; k < 3; k++) {
          const p = ((t * .3 + k / 3 + gi * .17) % 1);
          ctx.globalAlpha = Math.sin(p * Math.PI) * .9;
          ctx.font = `600 ${Math.round(24 + p * 26)}px "Fraunces", Georgia, serif`;
          ctx.fillStyle = "#ffffff"; ctx.fillText("z", g.x + g.size * .18 + p * 60 + Math.sin(p * 6) * 10, g.bottom - g.size * .85 - p * 160);
        }
      });
      ctx.restore();
    },
    spots: [[800, 915, 500], [1055, 925, 380], [545, 925, 380]], pose: "doze",
  };

  /* =====================================================
     SUNSET BOARDWALK — golden hour over the sea
     ===================================================== */
  function palm(ctx, x, y, s, t, flip) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip ? -s : s, s);
    fill(ctx, () => { ctx.moveTo(-14, 0); ctx.quadraticCurveTo(14, -200, 70, -390); ctx.lineTo(90, -384); ctx.quadraticCurveTo(42, -200, 18, 0); ctx.closePath(); }, "#3a2a4a");
    ctx.translate(80, -388);
    for (let i = 0; i < 7; i++) {
      ctx.save(); ctx.rotate(-2.95 + i * .5 + Math.sin(t * 1.1 + i) * .05);
      fill(ctx, () => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(90, -34, 200, 18); ctx.quadraticCurveTo(100, 4, 0, 6); ctx.closePath(); }, "#3a2a4a");
      ctx.restore();
    }
    ctx.restore();
  }
  const boardwalk = {
    tint: "rgba(255,170,120,.35)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, 560, [[0, "#6f5fae"], [.45, "#e690a8"], [.8, "#ffc28c"], [1, "#ffe0a3"]]); ctx.fillRect(0, 0, VW, 560);
      ctx.fillStyle = rad(ctx, 800, 540, 720, [[0, "rgba(255,240,200,.95)"], [.18, "rgba(255,210,150,.6)"], [1, "rgba(255,200,150,0)"]]); ctx.fillRect(0, 0, VW, 560);
      fill(ctx, () => ctx.arc(800, 552, 150, Math.PI, 0), rad(ctx, 800, 520, 170, [[0, "#fffbe6"], [1, "#ffd89a"]]));
      blur(ctx, 5, () => fill(ctx, () => { ctx.moveTo(0, 560); ctx.bezierCurveTo(180, 520, 330, 528, 470, 560); ctx.closePath(); ctx.moveTo(1130, 560); ctx.bezierCurveTo(1300, 515, 1450, 520, 1600, 548); ctx.lineTo(1600, 560); ctx.closePath(); }, "#9a6f9e"));
      ctx.fillStyle = lin(ctx, 0, 560, 0, 800, [[0, "#f6b0a6"], [.35, "#b493c4"], [1, "#6d6ea8"]]); ctx.fillRect(0, 560, VW, 240);
      // deck
      fill(ctx, () => ctx.rect(0, 790, VW, 210), lin(ctx, 0, 790, 0, 1000, [[0, "#c08a6a"], [1, "#7c4f3f"]]));
      ctx.strokeStyle = "rgba(60,30,30,.18)"; ctx.lineWidth = 3;
      for (let y = 826; y < VH; y += 38 + (y - 790) * .12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VW, y); ctx.stroke(); }
      ctx.fillStyle = "rgba(255,220,180,.18)"; ctx.fillRect(0, 790, VW, 6);
    },
    bakeFront(ctx) {
      for (let x = 40; x <= VW; x += 190) fill(ctx, rr(ctx, x - 9, 880, 18, 130, 4), "#3a2a4a");
      fill(ctx, rr(ctx, -10, 892, VW + 20, 14, 7), "#3a2a4a");
      fill(ctx, rr(ctx, -10, 950, VW + 20, 14, 7), "#3a2a4a");
    },
    back(ctx, t) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 14; i++) {
        const y = 570 + i * 16, w = (320 - i * 18) * (.8 + .2 * Math.sin(t * 1.7 + i * 1.3));
        ctx.globalAlpha = .55 - i * .03; ctx.fillStyle = "#ffe3b0"; ctx.fillRect(800 - w / 2 + Math.sin(t * 1.2 + i) * 12, y, w, 4);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(255,240,230,.18)"; ctx.lineWidth = 2;
      for (let j = 0; j < 6; j++) { ctx.beginPath(); for (let x = 0; x <= VW; x += 24) { const y = 600 + j * 34 + Math.sin(x * .015 + t * 1.1 + j) * 4; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      for (let i = 0; i < 3; i++) {
        const x = ((R(i) * 1600 + t * (40 + i * 14)) % 1900) - 150, y = 200 + i * 70 + Math.sin(t * 1.6 + i) * 8, f = Math.sin(t * 5 + i) * 7;
        ctx.beginPath(); ctx.moveTo(x - 24, y - f); ctx.quadraticCurveTo(x - 10, y - 12, x, y); ctx.quadraticCurveTo(x + 10, y - 12, x + 24, y - f);
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(60,40,80,.75)"; ctx.lineCap = "round"; ctx.stroke();
      }
      palm(ctx, 120, 800, 1, t, false); palm(ctx, 1520, 810, .85, t + 2, true);
    },
    front(ctx, t, guests, placeFront) {
      placeFront();
      glow(ctx, 800, 540, 900, "rgba(255,200,140,.4)", .35);
    },
    spots: [[800, 945, 540], [1100, 950, 420], [500, 950, 420]], pose: "dance",
  };

  /* =====================================================
     DOODLE CAFÉ — warm, sunny corner café
     ===================================================== */
  const W5 = { x: 110, y: 140, w: 640, h: 460 };
  const cafe = {
    tint: "rgba(255,200,150,.3)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [[0, "#f3dcc6"], [1, "#e2bfa0"]]); ctx.fillRect(0, 0, VW, VH);
      fill(ctx, () => ctx.rect(0, 650, VW, 350), lin(ctx, 0, 650, 0, 1000, [[0, "#b98566"], [1, "#8a5d47"]]));
      ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(0, 650, VW, 4);
      ctx.save(); ctx.beginPath(); ctx.rect(W5.x, W5.y, W5.w, W5.h); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, W5.y, 0, W5.y + W5.h, [[0, "#cfe6f4"], [1, "#f6ecdc"]]); ctx.fillRect(W5.x, W5.y, W5.w, W5.h);
      blur(ctx, 8, () => {
        [[260, 360, 120, "#9cc7a2"], [180, 420, 90, "#8bbd95"], [610, 380, 110, "#a7cfa9"]].forEach(([x, y, r, c]) => fill(ctx, () => ctx.arc(x, y, r, 0, TAU), c));
        fill(ctx, () => ctx.rect(W5.x, 520, W5.w, 90), "#d8cdbf");
        fill(ctx, () => ctx.rect(430, 230, 220, 300), "#e9c9b3");
      });
      ctx.restore();
      const fr = "#7a5a48";
      [[W5.x - 18, W5.y - 18, W5.w + 36, 20], [W5.x - 18, W5.y + W5.h - 2, W5.w + 36, 22], [W5.x - 18, W5.y - 18, 20, W5.h + 40], [W5.x + W5.w - 2, W5.y - 18, 20, W5.h + 40], [W5.x + W5.w / 2 - 7, W5.y, 14, W5.h]]
        .forEach(([x, y, w, h]) => { ctx.fillStyle = fr; ctx.fillRect(x, y, w, h); });
      ctx.font = '600 44px "Fraunces", Georgia, serif'; ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText("Doodle Café", W5.x + W5.w / 2, W5.y + 70); ctx.textAlign = "left";
      // shelves + cups
      [430, 560].forEach((y, s) => {
        fill(ctx, rr(ctx, 1040, y, 460, 16, 4), "#8a5d47");
        for (let i = 0; i < 5; i++) fill(ctx, rr(ctx, 1065 + i * 88, y - 52, 52, 50, 10), ["#e8d9f5", "#f6d6c2", "#cfe3ef", "#f3e3b5", "#e2efd8"][(i + s) % 5]);
      });
      // menu board
      fill(ctx, rr(ctx, 1080, 130, 360, 230, 10), "#2f3a35");
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = '600 32px "Fraunces", Georgia, serif'; ctx.fillText("Today", 1115, 180);
      ctx.font = '500 22px "Nunito", system-ui, sans-serif'; ctx.fillStyle = "rgba(255,255,255,.6)";
      ["Pastel latte", "Cloud cocoa", "Honey toast", "Sprinkle bun"].forEach((s, i) => ctx.fillText(s, 1115, 222 + i * 34));
      // pendant cords + shades
      [820, 960].forEach((x) => { ctx.fillStyle = "#3a2f2a"; ctx.fillRect(x - 1.5, 0, 3, 200); fill(ctx, () => { ctx.moveTo(x - 44, 236); ctx.lineTo(x - 18, 196); ctx.lineTo(x + 18, 196); ctx.lineTo(x + 44, 236); ctx.closePath(); }, "#3a2f2a"); });
    },
    bakeFront(ctx) {
      fill(ctx, () => ctx.ellipse(800, 840, 430, 38, 0, 0, TAU), lin(ctx, 0, 800, 0, 880, [[0, "#d7a985"], [1, "#a8775a"]]));
      fill(ctx, () => ctx.rect(430, 846, 740, 170), lin(ctx, 0, 846, 0, 1000, [[0, "#9a6a50"], [1, "#6e4838"]]));
      cup(ctx, 590, 832, "#f6e8d6"); cup(ctx, 1030, 832, "#e3eef6", "#6b4a3a");
      fill(ctx, () => ctx.ellipse(810, 828, 72, 15, 0, 0, TAU), "#ffffff");
      fill(ctx, () => ctx.ellipse(800, 812, 44, 18, 0, 0, TAU), lin(ctx, 0, 795, 0, 830, [[0, "#f3c58f"], [1, "#d49a63"]]));
    },
    back(ctx, t) {
      ctx.save(); ctx.beginPath(); ctx.rect(W5.x, W5.y, W5.w, W5.h); ctx.clip();
      ctx.filter = "blur(5px)";
      for (let i = 0; i < 3; i++) {
        const x = W5.x + ((R(i) * 900 + t * (30 + i * 12)) % (W5.w + 200)) - 100, y = 590;
        ctx.fillStyle = ["#8a9fd0", "#d79a8a", "#a88fc0"][i];
        ctx.beginPath(); ctx.arc(x, y - 120, 20, 0, TAU); ctx.fill(); ctx.fillRect(x - 24, y - 98, 48, 98);
      }
      ctx.restore();
      [820, 960].forEach((x, i) => glow(ctx, x, 250, 300, "rgba(255,200,130,.6)", .5 + .05 * Math.sin(t * 2 + i)));
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .12;
      fill(ctx, () => { ctx.moveTo(W5.x + W5.w, W5.y); ctx.lineTo(W5.x + W5.w + 600, 1000); ctx.lineTo(W5.x + 200, 1000); ctx.lineTo(W5.x, W5.y + W5.h); ctx.closePath(); }, lin(ctx, 0, W5.y, 0, 1000, [[0, "rgba(255,240,210,.9)"], [1, "rgba(255,240,210,0)"]]));
      ctx.restore();
    },
    front(ctx, t, guests, placeFront) {
      placeFront();
      steam(ctx, 590, 750, t, 180); steam(ctx, 1030, 750, t + 1.3, 160);
    },
    spots: [[800, 865, 480], [1040, 865, 380], [560, 865, 380]], pose: "bob",
  };

  /* =====================================================
     FIRESIDE SKETCHES — snowy night, warm fire, coffee
     ===================================================== */
  const W6 = { x: 520, y: 150, w: 270, h: 330 };
  function frame6(ctx) {
    [[W6.x - 16, W6.y - 16, W6.w + 32, 18], [W6.x - 16, W6.y + W6.h - 2, W6.w + 32, 20], [W6.x - 16, W6.y - 16, 18, W6.h + 36], [W6.x + W6.w - 2, W6.y - 16, 18, W6.h + 36],
      [W6.x + W6.w / 2 - 6, W6.y, 12, W6.h], [W6.x, W6.y + W6.h * .45, W6.w, 12]].forEach(([x, y, w, h]) => {
      ctx.fillStyle = "#5a3d3d"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(x, y, w, 2);
      ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.fillRect(x, y + h - 2, w, 2);
    });
    // snow resting on the outside of the bottom frame and on the middle bar
    blur(ctx, .8, () => {
      [[30, 4, 18], [80, 8, 24], [140, 5, 20], [195, 9, 25], [245, 4, 18]].forEach(([dx, dy, r]) => fill(ctx, () => ctx.arc(W6.x + dx, W6.y + W6.h - dy, r, Math.PI, 0), "#f4f6ff"));
      [[40, 10], [100, 13], [170, 11], [230, 12]].forEach(([dx, r]) => fill(ctx, () => ctx.arc(W6.x + dx, W6.y + W6.h * .45 + 1, r, Math.PI, 0), "#eef1ff"));
    });
  }
  const fireside = {
    tint: "rgba(255,150,90,.32)",
    bakeBack(ctx) {
      ctx.fillStyle = lin(ctx, 0, 0, 0, VH, [[0, "#3a2633"], [1, "#1f141b"]]); ctx.fillRect(0, 0, VW, VH);
      fill(ctx, () => ctx.rect(0, 700, VW, 300), lin(ctx, 0, 700, 0, 1000, [[0, "#3e2a2c"], [1, "#24171a"]]));
      // bookshelf
      fill(ctx, rr(ctx, 60, 110, 380, 720, 8), lin(ctx, 60, 0, 440, 0, [[0, "#4a2f2a"], [1, "#3a2420"]]));
      for (let s = 0; s < 4; s++) {
        const y = 150 + s * 170; let x = 86;
        while (x < 400) {
          const w = 20 + R(x + s * 9) * 22, h = 105 + R(x * 3 + s) * 32; if (x + w > 414) break;
          fill(ctx, rr(ctx, x, y + 140 - h, w, h, 3), ["#8c5f6e", "#5f6f8f", "#a08a5e", "#6e8a72", "#7d6a96", "#9a6a52"][Math.floor(R(x + s) * 6)]);
          ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.fillRect(x + 3, y + 140 - h + 8, 3, h - 16); x += w + 3;
        }
        fill(ctx, rr(ctx, 70, y + 140, 360, 14, 3), "#2e1c18");
      }
      // snowy window view
      ctx.save(); ctx.beginPath(); ctx.rect(W6.x, W6.y, W6.w, W6.h); ctx.clip();
      ctx.fillStyle = lin(ctx, 0, W6.y, 0, W6.y + W6.h, [[0, "#1d2652"], [1, "#46589a"]]); ctx.fillRect(W6.x, W6.y, W6.w, W6.h);
      ctx.fillStyle = rad(ctx, W6.x + 200, W6.y + 70, 90, [[0, "rgba(255,245,210,.9)"], [.25, "rgba(255,245,210,.5)"], [1, "rgba(255,245,210,0)"]]); ctx.fillRect(W6.x, W6.y, W6.w, W6.h);
      blur(ctx, 2, () => {
        fill(ctx, () => { ctx.moveTo(W6.x, W6.y + 270); ctx.quadraticCurveTo(W6.x + 130, W6.y + 215, W6.x + W6.w, W6.y + 255); ctx.lineTo(W6.x + W6.w, W6.y + W6.h); ctx.lineTo(W6.x, W6.y + W6.h); ctx.closePath(); }, "#dde4fb");
        [[W6.x + 60, W6.y + 258, 1], [W6.x + 105, W6.y + 246, .8], [W6.x + 215, W6.y + 252, .9]].forEach(([x, y, k]) => {
          fill(ctx, () => { ctx.moveTo(x, y - 74 * k); ctx.lineTo(x + 26 * k, y); ctx.lineTo(x - 26 * k, y); ctx.closePath(); }, "#2c4470");
          fill(ctx, () => { ctx.moveTo(x, y - 74 * k); ctx.lineTo(x + 10 * k, y - 48 * k); ctx.lineTo(x - 10 * k, y - 48 * k); ctx.closePath(); }, "#eef2ff");
        });
      });
      ctx.fillStyle = rad(ctx, W6.x, W6.y, 70, [[0, "rgba(255,255,255,.4)"], [1, "rgba(255,255,255,0)"]]); ctx.fillRect(W6.x, W6.y, 80, 80);
      ctx.restore();
      // (the window frame and its snow are drawn every frame, over the falling snow)
      // fireplace
      fill(ctx, rr(ctx, 900, 300, 560, 560, 10), lin(ctx, 900, 0, 1460, 0, [[0, "#8a7480"], [.5, "#9b8590"], [1, "#6e5966"]]));
      ctx.strokeStyle = "rgba(0,0,0,.12)"; ctx.lineWidth = 2;
      for (let y = 340; y < 860; y += 52) for (let x = 900 + ((y / 52) % 2) * 40; x < 1460; x += 80) ctx.strokeRect(x, y, 80, 52);
      fill(ctx, rr(ctx, 870, 280, 620, 44, 8), lin(ctx, 0, 280, 0, 324, [[0, "#b7a3b0"], [1, "#8a7480"]]));
      fill(ctx, () => { ctx.moveTo(980, 860); ctx.lineTo(980, 560); ctx.quadraticCurveTo(1180, 430, 1380, 560); ctx.lineTo(1380, 860); ctx.closePath(); }, lin(ctx, 0, 480, 0, 860, [[0, "#150b10"], [1, "#2a1410"]]));
      fill(ctx, rr(ctx, 1040, 808, 280, 30, 14), "#5a3426"); fill(ctx, rr(ctx, 1070, 784, 220, 28, 14), "#6e4030");
      // mantel candle + plant
      fill(ctx, rr(ctx, 962, 232, 22, 48, 5), "#f3e6c8");
      fill(ctx, rr(ctx, 1362, 228, 54, 52, 8), "#9fb3d6");
      [[1376, 210, 20], [1404, 208, 20], [1390, 190, 20]].forEach(([x, y, r]) => fill(ctx, () => ctx.arc(x, y, r, 0, TAU), "#5f8f72"));
      // rug + armchair
      blur(ctx, 1, () => fill(ctx, () => ctx.ellipse(800, 960, 640, 92, 0, 0, TAU), rad(ctx, 800, 960, 640, [[0, "#9a5a6a"], [1, "#6e3d4c"]])));
      fill(ctx, rr(ctx, 470, 520, 440, 390, 80), lin(ctx, 470, 520, 910, 900, [[0, "#9a7397"], [1, "#6a4b6a"]]));
    },
    bakeFront(ctx) {
      fill(ctx, rr(ctx, 450, 812, 480, 120, 30), lin(ctx, 0, 812, 0, 932, [[0, "#8a6588"], [1, "#5e425e"]]));
      fill(ctx, rr(ctx, 430, 700, 112, 240, 44), lin(ctx, 430, 0, 542, 0, [[0, "#7d5b7c"], [1, "#a07a9e"]]));
      fill(ctx, rr(ctx, 838, 700, 112, 240, 44), lin(ctx, 838, 0, 950, 0, [[0, "#a07a9e"], [1, "#7d5b7c"]]));
      // coffee table with cup, cookies, books
      const tx = 1090, ty = 880;
      [[-120], [120], [-70], [70]].forEach(([dx]) => fill(ctx, rr(ctx, tx + dx - 11, ty + 10, 22, 110, 6), "#3e261c"));
      fill(ctx, () => ctx.ellipse(tx, ty + 14, 175, 30, 0, 0, TAU), "#3e261c");
      fill(ctx, () => ctx.ellipse(tx, ty, 175, 34, 0, 0, TAU), lin(ctx, 0, ty - 34, 0, ty + 34, [[0, "#8a5a40"], [1, "#5e3a28"]]));
      fill(ctx, rr(ctx, tx - 150, ty - 22, 92, 16, 4), "#6f86b5"); fill(ctx, rr(ctx, tx - 142, ty - 36, 78, 15, 4), "#b06f86");
      fill(ctx, () => ctx.ellipse(tx + 95, ty - 4, 48, 12, 0, 0, TAU), "#efe8e2");
      [[tx + 78, ty - 14], [tx + 108, ty - 16]].forEach(([x, y]) => { fill(ctx, () => ctx.ellipse(x, y, 20, 9, 0, 0, TAU), "#c8935f"); ctx.fillStyle = "#5a3426"; [[-6, -2], [5, 1], [0, -4]].forEach(([a, b]) => { ctx.beginPath(); ctx.arc(x + a, y + b, 2.4, 0, TAU); ctx.fill(); }); });
      cup(ctx, tx - 5, ty - 6, "#f1e6d8");
    },
    back(ctx, t) {
      // snow, outside the glass
      ctx.save(); ctx.beginPath(); ctx.rect(W6.x, W6.y, W6.w, W6.h); ctx.clip();
      ctx.save(); ctx.filter = "blur(1px)";
      for (let k = 0; k < 70; k++) { // far flakes: small, slow, soft
        const sp = 18 + R(k + 403) * 22, r = 1 + R(k + 407) * 1.4, y = W6.y + ((R(k + 402) * W6.h + t * sp) % (W6.h + 20)) - 10, x = W6.x + R(k + 400) * W6.w + Math.sin(t * .6 + k) * 8;
        ctx.globalAlpha = .35 + R(k + 411) * .3; ctx.fillStyle = "#e9eeff"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.restore();
      for (let k = 0; k < 45; k++) { // nearer flakes
        const sp = 32 + R(k + 3) * 40, r = 1.8 + R(k + 7) * 2.4, y = W6.y + ((R(k + 2) * W6.h + t * sp) % (W6.h + 20)) - 10, x = W6.x + R(k) * W6.w + Math.sin(t * .8 + k) * 12;
        ctx.globalAlpha = .55 + R(k + 11) * .4; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // the glass: a warm reflection of the fire, frost at the corners, mist at the bottom
      ctx.fillStyle = lin(ctx, W6.x + W6.w, W6.y, W6.x, W6.y + W6.h, [[0, "rgba(255,170,110,.12)"], [.4, "rgba(255,170,110,.02)"], [1, "rgba(255,170,110,0)"]]);
      ctx.fillRect(W6.x, W6.y, W6.w, W6.h);
      [[W6.x, W6.y], [W6.x + W6.w, W6.y], [W6.x, W6.y + W6.h], [W6.x + W6.w, W6.y + W6.h]].forEach(([x, y]) => {
        ctx.fillStyle = rad(ctx, x, y, 70, [[0, "rgba(240,245,255,.45)"], [1, "rgba(240,245,255,0)"]]); ctx.fillRect(x - 70, y - 70, 140, 140);
      });
      ctx.fillStyle = lin(ctx, 0, W6.y + W6.h - 90, 0, W6.y + W6.h, [[0, "rgba(220,225,255,0)"], [1, "rgba(220,225,255,.2)"]]);
      ctx.fillRect(W6.x, W6.y + W6.h - 90, W6.w, 90);
      ctx.restore();
      frame6(ctx);
      // fire
      const fl = .85 + .15 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.filter = "blur(2px)";
      for (let i = 0; i < 7; i++) {
        const x = 1070 + i * 37, h = (110 + 80 * Math.abs(Math.sin(t * (2.6 + i * .6) + i * 1.7))) * (i % 2 ? .8 : 1), w = 52;
        ctx.save(); ctx.translate(x, 800);
        fill(ctx, () => { ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w / 2, -h * .55, Math.sin(t * 4 + i) * 10, -h); ctx.quadraticCurveTo(w / 2, -h * .55, w / 2, 0); ctx.closePath(); },
          lin(ctx, 0, 0, 0, -h, [[0, "rgba(255,170,70,.9)"], [.6, "rgba(255,110,40,.55)"], [1, "rgba(255,80,30,0)"]]));
        fill(ctx, () => { ctx.moveTo(-w / 4, 0); ctx.quadraticCurveTo(-w / 4, -h * .3, Math.sin(t * 4 + i) * 6, -h * .5); ctx.quadraticCurveTo(w / 4, -h * .3, w / 4, 0); ctx.closePath(); }, "rgba(255,235,170,.8)");
        ctx.restore();
      }
      ctx.filter = "none";
      for (let i = 0; i < 16; i++) {
        const p = (R(i) + t * .22 * (.6 + R(i + 5))) % 1, x = 1100 + R(i + 9) * 170 + Math.sin(p * 9 + i) * 18, y = 770 - p * 300;
        ctx.globalAlpha = (1 - p) * .9; ctx.fillStyle = "#ffcf7a"; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
      glow(ctx, 973, 222, 60, "rgba(255,210,140,.8)", .7 + .1 * Math.sin(t * 9));
      fill(ctx, () => ctx.ellipse(973, 218 + Math.sin(t * 9) * 2, 6, 12, 0, 0, TAU), "#ffe6a8");
      glow(ctx, 1180, 760, 1000, "rgba(255,140,60,.5)", .38 * fl);
    },
    front(ctx, t, guests, placeFront) {
      placeFront();
      steam(ctx, 1085, 790, t, 190);
      glow(ctx, 1180, 780, 700, "rgba(255,150,70,.35)", .25 * (.9 + .1 * Math.sin(t * 6)));
    },
    spots: [[690, 860, 430], [1400, 975, 300], [300, 975, 300]], pose: "nod",
  };

  const SCENES = { rainy, meadow, clouds, boardwalk, cafe, fireside };

  // Bake still layers once (at 1.25× for sharpness on big screens)
  const BAKE = 1.25, cache = {};
  function baked(id, which) {
    const key = id + which; if (cache[key] !== undefined) return cache[key];
    const sc = SCENES[id], fn = which === "back" ? sc.bakeBack : sc.bakeFront;
    if (!fn) { cache[key] = null; return null; }
    const c = document.createElement("canvas"); c.width = VW * BAKE; c.height = VH * BAKE;
    const x = c.getContext("2d"); x.scale(BAKE, BAKE); fn(x);
    cache[key] = c; return c;
  }
  function drawScene(ctx, id, t, drawGuests, guests) {
    const sc = SCENES[id];
    ctx.drawImage(baked(id, "back"), 0, 0, VW, VH);
    sc.back(ctx, t);
    drawGuests();
    const fb = baked(id, "front");
    sc.front(ctx, t, guests, () => { if (fb) ctx.drawImage(fb, 0, 0, VW, VH); });
    post(ctx, t, sc.tint);
  }
  return { SCENES, drawScene, VW, VH };
})();
