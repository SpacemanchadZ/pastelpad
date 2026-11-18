/* Pastel Pad — tabs. One section shows at a time:
   My Doodle · Studio · Rooms · Explore · Play.
   Top bar on desktop, app-style bottom bar on phones.
   Uses globals from the main script: state, draw, rankOf, tierOf, $. */
(() => {
  const VIEWS = [
    { k: "home", label: "My Doodle", icon: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9h11v-9"/><circle cx="10" cy="14" r=".9" fill="currentColor"/><circle cx="14" cy="14" r=".9" fill="currentColor"/>' },
    { k: "studio", label: "Studio", icon: '<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M13 7l3 3"/>' },
    { k: "rooms", label: "Rooms", icon: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>' },
    { k: "explore", label: "Explore", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>' },
    { k: "play", label: "Play", icon: '<rect x="3" y="7" width="18" height="11" rx="5"/><path d="M8 10.5v4M6 12.5h4"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor"/><circle cx="17.5" cy="13.5" r="1" fill="currentColor"/>' },
  ];
  const nav = $("tabsNav");
  nav.innerHTML = VIEWS.map((v) => `
    <button type="button" class="tab" data-go="${v.k}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${v.icon}</svg><span>${v.label}</span>
    </button>`).join("");

  let current = "home";
  function go(k, opts = {}) {
    if (!VIEWS.some((v) => v.k === k)) return;
    current = k;
    document.querySelectorAll(".view").forEach((el) => { el.hidden = el.dataset.view !== k; });
    nav.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-current", b.dataset.go === k ? "page" : "false"));
    document.body.dataset.view = k;
    if (k === "studio") draw();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: opts.smooth ? "smooth" : "auto" });
    renderNow();
  }
  window.PPGo = go;

  // Any button with data-go="…" switches tabs
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]"); if (!b) return;
    e.preventDefault(); go(b.dataset.go);
  });

  // Little "current Doodle" chip shown on the Studio tab
  function renderNow() {
    document.querySelectorAll(".now-slot").forEach((slot) => {
      if (!state.img) { slot.innerHTML = ""; return; }
      const rk = rankOf(state.id);
      slot.innerHTML = `<button type="button" class="now" data-go="home" aria-label="Change Doodle"><img alt=""><span><b>#${state.id}</b><small>${rk != null ? `${tierOf(rk).name} · rank ${rk.toLocaleString()}` : ""}</small></span><em>Change</em></button>`;
      slot.querySelector("img").src = state.img.src;
    });
  }

  // Big picture on the My Doodle tab
  document.addEventListener("pp:found", () => {
    if (state.img) { $("doodleImg").src = state.img.src; $("doodleImg").alt = `Doodle #${state.id}`; }
    renderNow();
  });
  if (state.img) $("doodleImg").src = state.img.src;

  go("home", { keepScroll: true });
})();
