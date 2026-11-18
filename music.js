/* Pastel Pad Radio — original songs played live in the browser (no audio files).

   Sound: plucked strings are made with the Karplus–Strong string model (guitar, harp, bass),
   plus an FM electric piano, marimba, kalimba, breathy flute and soft strings, all sent
   through a generated room reverb. Every note is slightly humanized in timing and loudness.

   Music: each song has chords, a scale, a comping style, a bass style and drum grooves.
   Melodies are written as phrases (a 2-bar hook, an answer, the hook again, a resolving
   ending) using mostly step-wise motion and long notes, and the song moves through
   intro → verse → variation → lift → breakdown → fill, then around again with new phrases. */
(() => {
  /* ======================= songs ======================= */
  // chords: MIDI voicings (mid register); roots: bass notes; mel: scale notes for the melody
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const scaleNotes = (root, mode, lo, hi) => { const out = []; for (let n = lo; n <= hi; n++) if (mode.includes(((n - root) % 12 + 12) % 12)) out.push(n); return out; };
  const TRACKS = [
    { id: "auto", title: "Pastel Pad Theme", sub: "sunny marimba & guitar", bpm: 98, swing: 0.04,
      chords: [[57, 60, 65, 69], [55, 60, 64, 67], [57, 62, 65, 69], [58, 62, 65, 69]], roots: [41, 40, 38, 46], // F – C/E – Dm7 – Bbmaj7
      mel: scaleNotes(5, MAJ, 69, 89), lead: "marimba", comp: "strum", bass: "walk", bassTone: "string", pad: false,
      drums: { k: "x.....o.x.......", s: "....x.......x..o", h: "", sh: "x.o.x.o.x.o.x.o." },
      cover: ["#ffc8e1", "#fff1b8", "#c9e4ff"] },
    { id: "cotton", title: "Cotton Candy Clouds", sub: "dreamy harp & kalimba", bpm: 74, swing: 0,
      chords: [[60, 64, 67, 71], [59, 62, 64, 67], [57, 60, 64, 65], [56, 60, 62, 65]], roots: [48, 52, 53, 53], // Cmaj7 – Em7 – Fmaj7 – Fm6
      mel: scaleNotes(0, MAJ, 72, 91), lead: "kalimba", comp: "harp", bass: "round", bassTone: "soft", pad: true,
      drums: { k: "x.........o.....", s: "", h: "", sh: "..o...x...o...x." },
      cover: ["#ffc8e1", "#e2d6ff", "#ffffff"] },
    { id: "mint", title: "Mint Chip Stroll", sub: "flute & fingerpicked guitar", bpm: 90, swing: 0.08,
      chords: [[55, 59, 62, 67], [55, 59, 62, 64], [55, 60, 64, 67], [54, 57, 62, 66]], roots: [43, 40, 48, 50], // G – Em7 – Cmaj7 – D
      mel: scaleNotes(7, MAJ, 71, 91), lead: "flute", comp: "pick", bass: "walk", bassTone: "string", pad: false,
      drums: { k: "x.......o.x.....", s: "....b.......b...", h: "x.o.x.o.x.o.x.o.", sh: "" },
      cover: ["#c6f2dc", "#c9e4ff", "#fff1b8"] },
    { id: "sunset", title: "Sunset Rollerskate", sub: "roller-disco electric piano", bpm: 108, swing: 0.02,
      chords: [[60, 64, 67, 69], [60, 62, 65, 69], [59, 62, 65, 67], [59, 64, 67, 71]], roots: [45, 50, 43, 48], // Am7 – Dm7 – G7 – Cmaj7
      mel: scaleNotes(9, MIN, 69, 88), lead: "rhodesLead", comp: "stab", bass: "octave", bassTone: "string", pad: true,
      drums: { k: "x...x...x...x...", s: "....c.......c...", h: "..O...O...O...O.", sh: "x.o.x.o.x.o.x.o." },
      cover: ["#fff1b8", "#ffb36b", "#ff8fb8"] },
    { id: "midnight", title: "Midnight Doodles", sub: "lo-fi electric piano", bpm: 76, swing: 0.14,
      chords: [[59, 64, 67, 71], [55, 60, 64, 69], [57, 60, 64, 69], [55, 59, 62, 64]], roots: [48, 45, 41, 43], // Cmaj7 – Am7 – Fmaj7 – G6
      mel: scaleNotes(0, MAJ, 72, 88), lead: "guitarLead", comp: "rhodes", bass: "round", bassTone: "string", pad: false, crackle: true,
      drums: { k: "x.........x.o...", s: "....r.......r...", h: "x.o.x.o.x.o.x.oo", sh: "" },
      cover: ["#1a1e46", "#8fb2ff", "#e2d6ff"] },
    { id: "fireside", title: "Fireside Sketches", sub: "slow piano & strings", bpm: 66, swing: 0,
      chords: [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]], roots: [45, 41, 48, 43], // Am - F - C - G
      mel: scaleNotes(9, MIN, 69, 88), lead: "piano", comp: "pianoArp", bass: "none", bassTone: "soft", pad: true,
      drums: { k: "................", s: "", h: "", sh: "" },
      cover: ["#ffb36b", "#5b2a6e", "#fff1b8"] },
  ];

  TRACKS.push({ ...TRACKS[0], id: "cafe", title: "Doodle Café", sub: "café jazz", cover: ["#ffe9d6", "#ffc8e1", "#c9e4ff"] });

  /* Real recorded songs (Pixabay Content License: free to use, no credit required).
     Put the MP3s in the "music" folder next to this page. If a file is missing,
     the built-in tune above plays instead. */
  const REAL = {
    auto:     { file: "music/ikoliks-children-ukulele-upbeat-positive-pop-rock-622115.mp3", song: "Children Ukulele Upbeat Positive Pop Rock", artist: "ikoliks", bpm: 118 },
    midnight: { file: "music/fassounds-good-night-lofi-cozy-chill-music-160166.mp3", song: "Good Night - Lofi Cozy Chill Music", artist: "FASSounds", bpm: 80 },
    mint:     { file: "music/jonasblakewood-acoustic-guitar-acoustic-guitar-music-513152.mp3", song: "Acoustic Guitar", artist: "JonasBlakewood", bpm: 92 },
    cotton:   { file: "music/atlasaudio-ambient-piano-580084.mp3", song: "Ambient Piano", artist: "AtlasAudio", bpm: 66 },
    sunset:   { file: "music/monume-disco-funk-556485.mp3", song: "Disco Funk", artist: "Monume", bpm: 116 },
    cafe:     { file: "music/atlasaudio-coffee-jazz-617555.mp3", song: "Coffee Jazz", artist: "AtlasAudio", bpm: 100 },
    fireside: { file: "music/leberch-piano-calm-525211.mp3", song: "Piano Calm", artist: "leberch", bpm: 68 },
  };
  const hasFile = {};
  Object.entries(REAL).forEach(([id, r]) => {
    fetch(r.file, { method: "HEAD" }).then((res) => { hasFile[id] = res.ok; if (T && T.id === id) paint(); }).catch(() => { hasFile[id] = false; });
  });
  const useFile = () => !!(REAL[T.id] && hasFile[T.id]);
  const audioEl = new Audio(); audioEl.loop = true; audioEl.preload = "none";
  let mediaSrc = null;

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const human = () => (Math.random() - 0.5) * 0.014;        // ±7 ms
  const vary = (v) => v * (0.82 + Math.random() * 0.18);     // loudness wobble

  /* ======================= audio graph ======================= */
  let ctx = null, master, dry, verb, verbSend, analyser, timer = null, crackleSrc = null;
  let playing = false, ti = 0, T = TRACKS[0], STEP = 0, nextTime = 0, step = 0;
  let volume = 0.6;
  try { const v = parseFloat(localStorage.getItem("pastelpad.musicVol")); if (v >= 0 && v <= 1) volume = v; } catch {}

  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds), b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 2.5; comp.attack.value = .01; comp.release.value = .25;
    const tone = ctx.createBiquadFilter(); tone.type = "highshelf"; tone.frequency.value = 6000; tone.gain.value = -4;
    analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = .78;
    master.connect(tone).connect(comp).connect(analyser).connect(ctx.destination);
    mediaSrc = ctx.createMediaElementSource(audioEl); mediaSrc.connect(master);
    dry = ctx.createGain(); dry.connect(master);
    verb = ctx.createConvolver(); verb.buffer = impulse(2.6, 3.2);
    const verbOut = ctx.createGain(); verbOut.gain.value = .34; verb.connect(verbOut).connect(master);
    verbSend = verb;
  }
  // every voice goes to the dry mix and (partly) to the reverb
  function voice(node, wet = .35) {
    node.connect(dry);
    if (wet > 0) { const s = ctx.createGain(); s.gain.value = wet; node.connect(s).connect(verbSend); }
  }

  /* ======================= instruments ======================= */
  // Karplus–Strong plucked string, rendered once per note and cached
  const ksCache = new Map();
  function ksBuffer(note, kind) {
    const key = note + kind; if (ksCache.has(key)) return ksCache.get(key);
    const sr = ctx.sampleRate, f = midi(note);
    const cfg = { guitar: [2.2, .9965, .55], harp: [3.2, .998, .45], bass: [2.4, .9975, .25], soft: [2.4, .999, .12] }[kind];
    const len = Math.floor(sr * cfg[0]), N = Math.max(2, Math.round(sr / f)), d = new Float32Array(len);
    let prev = 0;
    for (let i = 0; i < N; i++) { prev += cfg[2] * ((Math.random() * 2 - 1) - prev); d[i] = prev; }
    for (let i = N; i < len; i++) d[i] = cfg[1] * 0.5 * (d[i - N] + d[i - N + 1 < i ? i - N + 1 : i - N]);
    let peak = 0; for (let i = 0; i < N * 4 && i < len; i++) peak = Math.max(peak, Math.abs(d[i]));
    const b = ctx.createBuffer(1, len, sr); const ch = b.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = d[i] / (peak || 1);
    ksCache.set(key, b); return b;
  }
  function pluck(note, t, vel, kind, wet = .3, dur = null, lp = 4500) {
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    s.buffer = ksBuffer(note, kind); fl.type = "lowpass"; fl.frequency.value = lp;
    g.gain.value = vel;
    if (dur) { g.gain.setValueAtTime(vel, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + .25); }
    s.connect(fl).connect(g); voice(g, wet); s.start(t); s.stop(t + (dur ? dur + .3 : s.buffer.duration));
  }
  function sine(f, t, a, peak, decay, wet, type = "sine") {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
    o.connect(g); voice(g, wet); o.start(t); o.stop(t + a + decay + .05);
  }
  // FM electric piano: bright bell-like attack that mellows out
  function rhodes(note, t, vel, dur, wet = .3) {
    const f = midi(note), c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
    c.frequency.value = f; m.frequency.value = f;
    mg.gain.setValueAtTime(f * 2.2 * vel, t); mg.gain.exponentialRampToValueAtTime(f * .25, t + .7);
    m.connect(mg).connect(c.frequency);
    const end = t + Math.min(dur + .6, 3.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.11 * vel, t + .006);
    g.gain.exponentialRampToValueAtTime(.05 * vel, t + .5); g.gain.setValueAtTime(.05 * vel, t + dur);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    c.connect(g); voice(g, wet); c.start(t); m.start(t); c.stop(end + .05); m.stop(end + .05);
    sine(f * 4.02, t, .002, .012 * vel, .25, wet); // tine ping
  }
  // Soft felt piano: a few decaying partials, slightly detuned, with a hint of hammer
  function piano(note, t, vel, dur) {
    const f = midi(note), end = Math.min(dur + 1.2, 4.5);
    [[1, .14, 1], [2, .05, .6], [3, .02, .4], [4, .01, .25]].forEach(([h, a, d]) => {
      [-3, 3].forEach((c) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = f * h; o.detune.value = c;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a * vel, t + .005);
        g.gain.exponentialRampToValueAtTime(a * vel * .35, t + .4 * d);
        g.gain.exponentialRampToValueAtTime(0.0001, t + end * d);
        o.connect(g); voice(g, .45); o.start(t); o.stop(t + end * d + .05);
      });
    });
    noiseHit("lowpass", 1200, .5, t, .01 * vel, .03, .2);
  }
  function marimba(note, t, vel) {
    const f = midi(note);
    sine(f, t, .003, .2 * vel, 1.1, .32); sine(f * 3.93, t, .002, .05 * vel, .12, .32); sine(f * 9.2, t, .001, .015 * vel, .04, .2);
  }
  function kalimba(note, t, vel) {
    const f = midi(note);
    sine(f, t, .004, .17 * vel, 1.8, .45); sine(f * 5.4, t, .002, .035 * vel, .16, .45); sine(f * 2, t, .003, .02 * vel, .5, .45);
  }
  function flute(note, t, vel, dur) {
    const f = midi(note), o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    o.type = "triangle"; o2.type = "sine"; o.frequency.value = f; o2.frequency.value = f;
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(0, t + .25); lg.gain.linearRampToValueAtTime(9, t + .6);
    lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
    fl.type = "lowpass"; fl.frequency.value = 2600;
    const end = t + dur + .18;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.075 * vel, t + .07);
    g.gain.setValueAtTime(.07 * vel, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, end);
    o.connect(fl); o2.connect(fl); fl.connect(g); voice(g, .4);
    [o, o2, lfo].forEach((x) => { x.start(t); x.stop(end + .05); });
    // breath
    noiseHit("bandpass", f * 2, 2, t, .012 * vel, .12, .3);
  }
  function strings(notes, t, dur) {
    notes.forEach((n) => [-8, 8].forEach((c) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
      o.type = "sawtooth"; o.frequency.value = midi(n); o.detune.value = c; fl.type = "lowpass"; fl.frequency.value = 900;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.014, t + 1.1);
      g.gain.setValueAtTime(.014, t + dur - .2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 1);
      o.connect(fl).connect(g); voice(g, .5); o.start(t); o.stop(t + dur + 1.05);
    }));
  }
  let nb = null;
  const noise = () => { if (nb) return nb; nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb; };
  function noiseHit(type, f, q, t, peak, decay, wet = .2, attack = .002) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); s.playbackRate.value = .8 + Math.random() * .4; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    s.connect(fl).connect(g); voice(g, wet); s.start(t, Math.random() * .5); s.stop(t + attack + decay + .02);
  }
  const DRUM = {
    kick: (t, v) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(105, t); o.frequency.exponentialRampToValueAtTime(44, t + .14);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.42 * v, t + .004); g.gain.exponentialRampToValueAtTime(0.0001, t + .32);
      o.connect(g); voice(g, .05); o.start(t); o.stop(t + .35); },
    snare: (t, v) => { noiseHit("bandpass", 1900, .7, t, .16 * v, .16, .3); sine(190, t, .002, .06 * v, .08, .2); },
    brush: (t, v) => noiseHit("bandpass", 3200, .6, t, .07 * v, .2, .35, .025),
    rim: (t, v) => { noiseHit("bandpass", 2600, 7, t, .1 * v, .03, .3); sine(820, t, .001, .04 * v, .02, .2); },
    clap: (t, v) => { [0, .011, .023].forEach((d) => noiseHit("bandpass", 1300, 1.2, t + d, .1 * v, .06, .35)); },
    hat: (t, v) => noiseHit("highpass", 8200, .7, t, .045 * v, .035, .15),
    open: (t, v) => noiseHit("highpass", 7600, .7, t, .04 * v, .22, .2),
    shaker: (t, v) => noiseHit("bandpass", 5800, 1.4, t, .035 * v, .05, .15, .012),
  };
  function startCrackle() {
    if (crackleSrc) return;
    const len = ctx.sampleRate * 3, b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() < .0006 ? (Math.random() * 2 - 1) * .7 : 0) + (Math.random() * 2 - 1) * .004;
    const s = ctx.createBufferSource(), g = ctx.createGain(), fl = ctx.createBiquadFilter();
    s.buffer = b; s.loop = true; fl.type = "bandpass"; fl.frequency.value = 3000; fl.Q.value = .5; g.gain.value = .5;
    s.connect(fl).connect(g).connect(dry); s.start(); crackleSrc = s;
  }
  function stopCrackle() { if (crackleSrc) { try { crackleSrc.stop(); } catch {} crackleSrc = null; } }

  /* ======================= melody writer ======================= */
  // Rhythms for a 2-bar hook, in 16th-note steps: [start, length]
  const HOOKS = [
    [[0, 6], [6, 2], [8, 4], [12, 4], [16, 10], [28, 4]],
    [[0, 4], [4, 4], [8, 2], [10, 6], [16, 12]],
    [[2, 2], [4, 4], [8, 8], [16, 4], [20, 4], [24, 8]],
    [[0, 8], [8, 4], [12, 4], [16, 6], [22, 10]],
    [[0, 3], [3, 3], [6, 2], [8, 8], [18, 2], [20, 4], [24, 8]],
  ];
  const ENDINGS = [[[0, 4], [4, 4], [8, 8], [16, 16]], [[0, 6], [6, 2], [8, 4], [12, 20]], [[0, 8], [8, 8], [16, 16]]];
  const chordTonesIdx = (bar) => { const pcs = T.chords[bar % 4].map((n) => n % 12); return T.mel.map((n, i) => (pcs.includes(n % 12) ? i : -1)).filter((i) => i >= 0); };
  const nearest = (idx, list) => list.reduce((a, b) => (Math.abs(b - idx) < Math.abs(a - idx) ? b : a), list[0]);
  // phrase = 8 bars of {step, len, note} events (step is absolute within the 8 bars)
  function writePhrase(lift = 0) {
    const ev = []; const hook = HOOKS[Math.floor(rnd() * HOOKS.length)], end = ENDINGS[Math.floor(rnd() * ENDINGS.length)];
    let idx = Math.floor(T.mel.length * .35) + lift;
    const dir = rnd() < .5 ? 1 : -1;
    const hookPitches = [];
    hook.forEach(([s, l], k) => {
      const bar = Math.floor(s / 16);
      if (k > 0) idx += (rnd() < .7 ? 1 : 2) * (k < hook.length / 2 ? dir : -dir) * (rnd() < .2 ? -1 : 1);
      idx = Math.max(0, Math.min(T.mel.length - 1, idx));
      if (s % 8 === 0) idx = nearest(idx, chordTonesIdx(bar));
      hookPitches.push(idx); ev.push({ step: s, len: l, idx });
    });
    // bars 3-4: answer — same rhythm, shifted pitches that fit the new chords
    hook.forEach(([s, l], k) => {
      const bar = 2 + Math.floor(s / 16); let i2 = hookPitches[k] + (k === hook.length - 1 ? -1 : 1);
      if (s % 8 === 0) i2 = nearest(i2, chordTonesIdx(bar));
      ev.push({ step: 32 + s, len: l, idx: Math.max(0, Math.min(T.mel.length - 1, i2)) });
    });
    // bars 5-6: the hook again (people like hearing it twice)
    hook.forEach(([s, l], k) => ev.push({ step: 64 + s, len: l, idx: hookPitches[k] }));
    // bars 7-8: ending that settles on the home chord
    let j = hookPitches[hookPitches.length - 1];
    end.forEach(([s, l], k) => {
      j += k === end.length - 1 ? 0 : (rnd() < .6 ? -1 : 1);
      const bar = 6 + Math.floor(s / 16);
      if (k === end.length - 1) j = nearest(j, chordTonesIdx(0)); else if (s % 8 === 0) j = nearest(j, chordTonesIdx(bar));
      ev.push({ step: 96 + s, len: l, idx: Math.max(0, Math.min(T.mel.length - 1, j)) });
    });
    return ev.map((e) => ({ ...e, note: T.mel[e.idx] }));
  }

  /* ======================= arrangement ======================= */
  // 32-bar cycle: 0-1 intro · 2-9 verse · 10-17 variation · 18-25 lift · 26-29 breakdown · 30-31 build
  let phrases = {}, cycle = -1;
  function newCycle() {
    cycle++;
    const keep = cycle % 2 === 1 && phrases.A; // reuse the verse every other cycle so it feels familiar
    phrases = { A: keep ? phrases.A : writePhrase(0), B: writePhrase(1), C: writePhrase(3) };
  }
  function section(b) {
    if (b < 2) return "intro"; if (b < 10) return "A"; if (b < 18) return "B"; if (b < 26) return "C"; if (b < 30) return "break"; return "build";
  }

  function playLead(note, t, vel, len) {
    const dur = len * STEP;
    if (T.lead === "marimba") marimba(note, t, vel);
    else if (T.lead === "kalimba") kalimba(note, t, vel);
    else if (T.lead === "flute") flute(note, t, vel, dur);
    else if (T.lead === "rhodesLead") rhodes(note, t, vel * 1.1, dur, .35);
    else if (T.lead === "guitarLead") pluck(note, t, .22 * vel, "guitar", .4, null, 2800);
    else if (T.lead === "piano") piano(note, t, vel * 1.1, dur);
  }
  function playComp(x, t, chord, sec, barAbs) {
    const soft = sec === "intro" || sec === "break" ? .7 : 1;
    if (T.comp === "strum") {
      // island-pop strum: D . D U . U D U
      const pat = { 0: "d", 4: "d", 6: "u", 10: "u", 12: "d", 14: "u" };
      if (!pat[x]) return;
      const notes = pat[x] === "d" ? chord : [...chord].reverse();
      notes.forEach((n, i) => pluck(n, t + i * .014, vary(.075 * soft * (pat[x] === "d" ? 1 : .7)), "guitar", .25, STEP * 3.5));
    } else if (T.comp === "harp") {
      // rolling arpeggio up two octaves
      if (x % 2) return;
      const up = [...chord, ...chord.map((n) => n + 12)];
      pluck(up[(x / 2) % up.length], t, vary(.09 * soft), "harp", .5);
    } else if (T.comp === "pick") {
      // fingerpicking: thumb on beats, fingers in between
      if (x % 2) return;
      const order = [0, 2, 1, 3, 0, 3, 2, 1];
      const n = x % 8 === 0 ? chord[0] - 12 : chord[order[(x / 2) % 8]];
      pluck(n, t, vary((x % 8 === 0 ? .12 : .08) * soft), "guitar", .3);
    } else if (T.comp === "rhodes") {
      // lazy chords with a little roll, one on 1 and a push before 3
      if (x === 0) chord.forEach((n, i) => rhodes(n, t + i * .02, vary(.8 * soft), STEP * 9));
      if (x === 10 && barAbs % 2) chord.slice(1).forEach((n, i) => rhodes(n + (i === 2 ? 0 : 0), t + i * .015, vary(.55 * soft), STEP * 5));
    } else if (T.comp === "pianoArp") {
      // flowing left-hand broken chords, held like a sustain pedal
      if (x % 2) return;
      const r = T.roots[barAbs % 4], c = chord;
      const pat = [r, r + 7, r + 12, c[1], c[2], c[1], r + 12, r + 7];
      piano(pat[(x / 2) % 8], t, vary((x === 0 ? .7 : .45) * soft), STEP * 8);
    } else if (T.comp === "stab") {
      // disco off-beat stabs
      if (x === 2 || x === 6 || x === 10 || x === 14) chord.forEach((n) => rhodes(n, t, vary(.55 * soft), STEP * 1.2, .25));
    }
  }
  function playBass(x, t, bar, sec) {
    if (sec === "intro" && T.comp !== "rhodes") return;
    const root = T.roots[bar], next = T.roots[(bar + 1) % 4];
    const tone = (n, len, v) => (T.bassTone === "soft" ? sine(midi(n), t, .02, .22 * v, len * STEP + .3, 0) : pluck(n, t, .55 * v, "bass", .05, len * STEP, 900));
    if (T.bass === "round") { if (x === 0) tone(root, 7, 1); if (x === 8) tone(root + 7, 3, .8); if (x === 12) tone(root, 4, .85); }
    if (T.bass === "walk") {
      if (x === 0) tone(root, 6, 1); if (x === 6) tone(root + 7, 2, .75); if (x === 8) tone(root + 12, 4, .8);
      if (x === 12) tone(root + 7, 2, .75);
      if (x === 14) tone(next + (next > root ? -1 : 1), 2, .7); // step into the next chord
    }
    if (T.bass === "octave" && x % 2 === 0) tone(x % 4 === 0 ? root : root + 12, 1.6, x % 4 === 0 ? 1 : .7);
  }
  function playDrums(x, t, sec, barInCycle) {
    const d = T.drums, sw = (x % 4 === 2) ? STEP * 2 * T.swing : 0, tt = t + sw;
    const v = (ch) => (ch === "o" ? .45 : 1);
    const full = sec === "A" || sec === "B" || sec === "C" || sec === "build";
    if (d.sh && d.sh[x] !== ".") DRUM.shaker(tt + human(), vary(v(d.sh[x])));
    if (!full && sec !== "break") return;
    if (sec === "break") { if (d.h && d.h[x] !== "." && x % 4 === 0) DRUM.hat(tt, .5); return; }
    if (d.k[x] !== ".") DRUM.kick(t, vary(v(d.k[x])));
    if (d.s && d.s[x] !== ".") { const ch = d.s[x]; const f = { x: DRUM.snare, b: DRUM.brush, r: DRUM.rim, c: DRUM.clap, o: DRUM.snare }[ch]; f(tt + human(), vary(ch === "o" ? .35 : 1)); }
    if (d.h && d.h[x] !== ".") (d.h[x] === "O" ? DRUM.open : DRUM.hat)(tt + human(), vary(v(d.h[x])));
    // fill at the very end of the build
    if (sec === "build" && barInCycle === 31 && x >= 8 && x % 2 === 0) DRUM.snare(tt, .35 + (x - 8) * .06);
  }

  function scheduleStep(s, t) {
    const barAbs = Math.floor(s / 16), b = barAbs % 32, bar = barAbs % 4, x = s % 16, chord = T.chords[bar], sec = section(b);
    if (b === 0 && x === 0) newCycle();
    const sw = (x % 4 === 2) ? STEP * 2 * T.swing : 0;
    // pad
    if (x === 0 && T.pad && sec !== "intro") strings(chord.map((n) => n - 12 + 12), t, STEP * 16);
    playComp(x, t + sw + human(), chord, sec, barAbs);
    playBass(x, t + human(), bar, sec);
    playDrums(x, t, sec, b);
    // melody
    let ph = null, base = 0, lift = 0;
    if (sec === "A") { ph = phrases.A; base = 2; } else if (sec === "B") { ph = phrases.B; base = 10; } else if (sec === "C") { ph = phrases.C; base = 18; lift = 12; }
    else if (sec === "break") { ph = phrases.A; base = 26; }
    if (ph) {
      const local = (b - base) * 16 + x;
      ph.forEach((e) => {
        if (e.step !== local) return;
        if (sec === "break" && (e.step >= 64 || rnd() < .4)) return; // sparse fragments in the breakdown
        const n = e.note + (lift && e.note + 12 <= 96 && T.lead !== "flute" ? 12 : 0);
        playLead(n, t + sw + human(), vary(x % 8 === 0 ? 1 : .85), e.len);
      });
    }
  }
  function scheduler() { while (nextTime < ctx.currentTime + .2) { scheduleStep(step, nextTime); nextTime += STEP; step++; } }

  /* ======================= room sounds ======================= */
  let amb = { kind: null, nodes: [], timers: [] }, ambBus = null, ambVol = .6;
  try { const v = parseFloat(localStorage.getItem("pastelpad.ambVol")); if (v >= 0 && v <= 1) ambVol = v; } catch {}
  function ambOut() { if (!ambBus) { ambBus = ctx.createGain(); ambBus.gain.value = 0; ambBus.connect(ctx.destination); } return ambBus; }
  function loopNoise(type, f, q, gain) {
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); s.loop = true; fl.type = type; fl.frequency.value = f; fl.Q.value = q; g.gain.value = gain;
    s.connect(fl).connect(g).connect(ambOut()); s.start(); amb.nodes.push(s);
    return { fl, g };
  }
  function lfo(param, rate, depth) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = rate; g.gain.value = depth; o.connect(g).connect(param); o.start(); amb.nodes.push(o); }
  function blip(type, f, q, peak, decay) {
    const t = ctx.currentTime + .02, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .002); g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    s.connect(fl).connect(g).connect(ambOut()); s.start(t, Math.random() * .5); s.stop(t + decay + .02);
  }
  function chirp(f, f2, peak, dur, delay = 0) {
    const t = ctx.currentTime + .02 + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + .01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ambOut()); o.start(t); o.stop(t + dur + .02);
  }
  const every = (ms, fn) => amb.timers.push(setInterval(fn, ms));
  const AMB = {
    rain: () => { loopNoise("lowpass", 4500, .3, .16); loopNoise("highpass", 6500, .3, .05);
      every(70, () => { if (Math.random() < .35) chirp(2200 + Math.random() * 2200, 1500, .015 + Math.random() * .02, .03); }); },
    fire: () => { const r = loopNoise("lowpass", 260, .7, .22); lfo(r.g.gain, .3, .06); loopNoise("bandpass", 1200, .6, .015);
      every(50, () => { if (Math.random() < .28) blip("bandpass", 1500 + Math.random() * 3000, 1.5, .05 + Math.random() * .18, .01 + Math.random() * .03); }); },
    birds: () => { const w = loopNoise("bandpass", 600, .5, .03); lfo(w.fl.frequency, .08, 250);
      every(450, () => { if (Math.random() < .13) { const b = 2600 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) chirp(b, b * (1.2 + Math.random() * .3), .03, .07, i * .11); } }); },
    wind: () => { const w = loopNoise("bandpass", 450, .7, .09); lfo(w.fl.frequency, .06, 280); lfo(w.g.gain, .05, .04);
      every(900, () => { if (Math.random() < .12) chirp(1800 + Math.random() * 900, 2400, .012, .9); }); },
    waves: () => { const w = loopNoise("lowpass", 800, .4, .12); lfo(w.g.gain, .11, .1); lfo(w.fl.frequency, .11, 300);
      every(700, () => { if (Math.random() < .06) { const b = 1400 + Math.random() * 500; chirp(b, b * .7, .02, .35); chirp(b, b * .7, .015, .3, .4); } }); },
    cafe: () => { const m = loopNoise("bandpass", 650, .5, .06); lfo(m.g.gain, .4, .02); loopNoise("bandpass", 1700, .8, .012);
      every(320, () => { if (Math.random() < .05) { const b = 2800 + Math.random() * 900; chirp(b, b, .035, .35); chirp(b * 1.01, b * 1.01, .02, .25, .07); } }); },
  };
  function setAmbience(kind) {
    if (!ctx) setup();
    if (ctx.state === "suspended") ctx.resume();
    amb.timers.forEach(clearInterval);
    amb.nodes.forEach((n) => { try { n.stop(); } catch (e) {} });
    amb = { kind, nodes: [], timers: [] };
    const out = ambOut();
    out.gain.cancelScheduledValues(ctx.currentTime);
    if (kind && AMB[kind]) { AMB[kind](); out.gain.setValueAtTime(0, ctx.currentTime); out.gain.linearRampToValueAtTime(ambVol * .9, ctx.currentTime + 2); }
    else out.gain.setValueAtTime(0, ctx.currentTime);
  }
  function setAmbienceVolume(v) { ambVol = v; try { localStorage.setItem("pastelpad.ambVol", v); } catch (e) {} if (ambBus && amb.kind) ambBus.gain.setTargetAtTime(v * .9, ctx.currentTime, .1); }

  /* ======================= transport ======================= */
  function startSource() {
    clearInterval(timer); stopCrackle();
    if (useFile()) {
      const src = REAL[T.id].file;
      if (!audioEl.src.endsWith(src)) { audioEl.src = src; }
      audioEl.currentTime = 0; audioEl.play().catch(() => {});
    } else {
      audioEl.pause();
      nextTime = ctx.currentTime + .12; step = 0; cycle = -1;
      if (T.crackle) startCrackle();
      timer = setInterval(scheduler, 25);
    }
  }
  function load(i) {
    ti = (i + TRACKS.length) % TRACKS.length; T = TRACKS[ti]; STEP = 60 / T.bpm / 4;
    seed = 11 + ti * 101; cycle = -1; phrases = {}; step = 0;
    if (ctx && playing) startSource();
    paint();
  }
  function play() {
    if (!ctx) setup();
    if (ctx.state === "suspended") ctx.resume();
    playing = true;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(volume, ctx.currentTime + (useFile() ? 1.2 : 2));
    startSource();
    remember(); paint(); draw();
  }
  function pause() {
    playing = false; remember(); paint();
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
    setTimeout(() => { if (!playing) { clearInterval(timer); stopCrackle(); audioEl.pause(); } }, 1100);
  }
  function skip(dir) {
    if (!playing) { load(ti + dir); return; }
    master.gain.setTargetAtTime(0, ctx.currentTime, .15);
    setTimeout(() => { load(ti + dir); master.gain.setTargetAtTime(volume, ctx.currentTime, .5); }, 500);
  }
  function remember() { try { localStorage.setItem("pastelpad.music", playing ? "on" : "off"); } catch {} }

  /* ======================= player UI ======================= */
  const el = document.createElement("aside");
  el.className = "player"; el.setAttribute("aria-label", "Music player");
  el.innerHTML = `
    <div class="disc" aria-hidden="true"><i></i></div>
    <div class="pinfo">
      <span class="plabel">Pastel Pad Radio</span>
      <b class="ptitle-track" id="trackTitle"></b>
      <span class="psub" id="trackSub"></span>
    </div>
    <canvas class="viz" id="viz" width="160" height="56" aria-hidden="true"></canvas>
    <div class="pctrl">
      <button type="button" class="pbtn" id="prevBtn" aria-label="Previous song">
        <svg viewBox="0 0 24 24"><path d="M7 5v14M19 5 9 12l10 7z"/></svg></button>
      <button type="button" class="pbtn big" id="playBtn" aria-label="Play music">
        <svg viewBox="0 0 24 24" class="i-play"><path d="M7 4.5v15l13-7.5z"/></svg>
        <svg viewBox="0 0 24 24" class="i-pause"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button>
      <button type="button" class="pbtn" id="nextBtn" aria-label="Next song">
        <svg viewBox="0 0 24 24"><path d="M17 5v14M5 5l10 7-10 7z"/></svg></button>
    </div>
    <label class="pvol" for="pvol"><span class="sr">Music volume</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7" fill="none"/></svg>
      <input type="range" id="pvol" min="0" max="100" value="${Math.round(volume * 100)}"></label>
    <button type="button" class="pmin" id="pmin" aria-label="Shrink player">–</button>`;
  el.hidden = true; // the floating player is retired; Rooms has its own controls
  document.body.appendChild(el);
  const $$ = (id) => document.getElementById(id);
  const viz = $$("viz"), vctx = viz.getContext("2d");

  function paint() {
    const r = REAL[T.id], real = useFile();
    $$("trackTitle").textContent = real ? r.song : T.title;
    $$("trackSub").textContent = real ? `${r.artist} · ${T.title}` : `${T.sub} · ${ti + 1} of ${TRACKS.length}`;
    el.style.setProperty("--c1", T.cover[0]); el.style.setProperty("--c2", T.cover[1]); el.style.setProperty("--c3", T.cover[2]);
    el.classList.toggle("playing", playing);
    $$("playBtn").setAttribute("aria-label", playing ? "Pause music" : "Play music");
    if (!playing) idle();
    if (window.__ppNotify) window.__ppNotify();
  }
  function idle() { vctx.clearRect(0, 0, viz.width, viz.height); for (let i = 0; i < 16; i++) bar(i, 5 + 9 * Math.abs(Math.sin(i * 1.7))); }
  function bar(i, h) {
    const w = viz.width / 16, x = i * w + 2;
    vctx.fillStyle = T.cover[i % 3] === "#1a1e46" ? "#8fb2ff" : T.cover[i % 3];
    vctx.strokeStyle = "#2b2540"; vctx.lineWidth = 2;
    vctx.beginPath(); vctx.roundRect ? vctx.roundRect(x, viz.height - h - 2, w - 4, h, 3) : vctx.rect(x, viz.height - h - 2, w - 4, h);
    vctx.fill(); vctx.stroke();
  }
  const data = new Uint8Array(512);
  const BINS = Array.from({ length: 17 }, (_, i) => Math.round(2 * Math.pow(130 / 2, i / 16)));
  function draw() {
    if (!playing || !analyser) return;
    analyser.getByteFrequencyData(data);
    vctx.clearRect(0, 0, viz.width, viz.height);
    for (let i = 0; i < 16; i++) {
      let m = 0; for (let b = BINS[i]; b <= Math.max(BINS[i], BINS[i + 1] - 1); b++) m = Math.max(m, data[b]);
      bar(i, 4 + Math.pow(Math.min(1, (m / 255) * (1 + i * .06)), 1.4) * (viz.height - 8));
    }
    requestAnimationFrame(draw);
  }

  $$("playBtn").onclick = () => (playing ? pause() : play());
  $$("prevBtn").onclick = () => skip(-1);
  $$("nextBtn").onclick = () => skip(1);
  $$("pvol").oninput = (e) => {
    volume = e.target.value / 100;
    try { localStorage.setItem("pastelpad.musicVol", volume); } catch {}
    if (ctx && playing) master.gain.setTargetAtTime(volume, ctx.currentTime, .1);
  };
  let mini = false; try { mini = localStorage.getItem("pastelpad.playerMini") === "1"; } catch {}
  const setMini = (m) => { mini = m; el.classList.toggle("mini", m); $$("pmin").textContent = m ? "+" : "–"; $$("pmin").setAttribute("aria-label", m ? "Expand player" : "Shrink player"); try { localStorage.setItem("pastelpad.playerMini", m ? "1" : "0"); } catch {} };
  $$("pmin").onclick = () => setMini(!mini);
  setMini(mini);

  // Song follows the color mood
  const moodTrack = () => Math.max(0, TRACKS.findIndex((t) => t.id === (document.documentElement.getAttribute("data-mood") || "auto")));
  load(moodTrack());

  // Public controls for Doodle Rooms
  const listeners = [];
  const notify = () => listeners.forEach((f) => f({ playing, track: T.id, bpm: T.bpm }));
  window.__ppNotify = notify;
  window.PPMusic = {
    bpm: () => (useFile() ? REAL[T.id].bpm : T.bpm),
    playTrack(id) {
      const i = TRACKS.findIndex((t) => t.id === id); if (i < 0) return;
      if (playing) { if (i !== ti) skip(i - ti); } else { load(i); play(); }
    },
    play: () => play(), pause: () => pause(), isPlaying: () => playing, current: () => T.id,
    setAmbience, setAmbienceVolume, ambienceVolume: () => ambVol,
    setVolume(v) { volume = v; $$("pvol").value = Math.round(v * 100); if (ctx && playing) master.gain.setTargetAtTime(v, ctx.currentTime, .1); },
    volume: () => volume,
    onChange(f) { listeners.push(f); },
    status: () => ({ playing, track: T.id, file: useFile(), src: audioEl.currentSrc, paused: audioEl.paused, time: audioEl.currentTime, ready: audioEl.readyState, err: audioEl.error && audioEl.error.code, ctx: ctx && ctx.state, gain: master && master.gain.value, vol: volume }),
  };

  const wanted = false;
  if (wanted) document.addEventListener("pointerdown", (e) => { if (!playing && !e.target.closest(".player")) play(); }, { once: true, capture: true });
  document.addEventListener("visibilitychange", () => { if (ctx && playing) document.hidden ? ctx.suspend() : ctx.resume(); });
})();
