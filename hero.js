/* Pastel Pad — hero floating Doodles + ticker strip.
   Uses globals from the main script: show, getMeta, imageUrl, R, dayId, MAX_ID, tierOf. */
(() => {
  // Ticker: the list is doubled so the loop is seamless
  const items = [
    ["Find", "your rank"], ["Dress", "it up"], ["Play", "Higher or Lower"], ["Collect", "daily stamps"],
    ["Unlock", "15 badges"], ["Make", "a phone wallpaper"], ["Explore", "every rare trait"], ["Meet", "your Doodle's personality"],
  ];
  const html = items.map(([a, b]) => `<span><i>★</i><b>${a}</b> ${b}</span>`).join("");
  const mq = document.getElementById("marquee"); if (mq) mq.innerHTML = html + html;

  // Floating Doodles: the rarest one, today's pick, and a random rare one
  const art = document.getElementById("heroArt");
  const rarest = R ? R.rank.indexOf(1) : 1803;
  let randomRare = Math.floor(Math.random() * (MAX_ID + 1));
  if (R) { const pool = []; R.rank.forEach((rk, id) => { if (rk <= 500) pool.push(id); }); if (pool.length) randomRare = pool[Math.floor(Math.random() * pool.length)]; }
  const picks = [
    [rarest, "Rank #1"],
    [dayId(), "Today's pick"],
    [randomRare, R ? `Rank #${R.rank[randomRare]}` : "Surprise"],
  ];
  picks.forEach(([id, label]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "float"; b.tabIndex = -1;
    b.innerHTML = `<img alt=""><span class="tagline"></span>`;
    b.querySelector(".tagline").textContent = `#${id} · ${label}`;
    b.onclick = () => { show(id); document.getElementById("doodleCard").scrollIntoView({ behavior: "smooth", block: "center" }); };
    art.appendChild(b);
    getMeta(id).then((m) => { setDoodleImg(b.querySelector("img"), m); }).catch(() => {});
  });
  // A couple of sparkles
  const spark = (x, y, s, d) => `<svg class="spark" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s" viewBox="0 0 20 20"><path d="M10 0 L12.4 7.6 20 10 12.4 12.4 10 20 7.6 12.4 0 10 7.6 7.6Z" fill="#ffd36b" stroke="#2b2540" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
  art.insertAdjacentHTML("beforeend", spark(44, 2, 34, 0) + spark(92, 62, 26, -.8) + spark(-2, 70, 22, -1.6));
})();
