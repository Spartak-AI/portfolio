/* SPARTAK LAB — новый первый экран: человек в зале, вокруг шар из сайтов.
   Включается флагом heroNovo в config.js (иначе работает старый экран из app.js).
   Камера стоит; движение даёт код: шар крутится, по прокрутке разлетается,
   один сайт подлетает к экрану и оживает, затем всё собирается обратно. */
(() => {
  const S = window.SITE || {};
  const raiz = document.querySelector("[data-eu]");
  if (!raiz) return;
  if (!S.heroNovo) { raiz.remove(); return; }
  raiz.hidden = false;

  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celular = () => matchMedia("(max-width: 760px)").matches;
  const lim = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (v, a, b) => lim((v - a) / (b - a));
  const ease = (t) => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a + (b - a) * t;
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // где стоит человек в кадре (доли кадра, замерено по силуэту)
  const CENA = {
    v: { orbita: { pasta: "assets/eu/orbita_v/", n: 61, ext: "webp", mascaras: "assets/eu/mask_v/" }, src: "assets/eu/eu_v.mp4", poster: "assets/eu/eu_v.jpg", mascara: "assets/eu/mascara_v.png", ar: 0.556, cx: 0.505, topo: 0.284, pes: 0.871 },
    h: { orbita: { pasta: "assets/eu/orbita_h/", n: 55, ext: "webp", mascaras: "assets/eu/mask_h/" }, src: "assets/eu/eu_h.mp4", poster: "assets/eu/eu_h.jpg", mascara: "assets/eu/mascara_h.png", ar: 1.7985, cx: 0.498, topo: 0.197, pes: 0.954 },
  };

  const mundo = raiz.querySelector("[data-mundo]");
  const video = raiz.querySelector("[data-eu-video]");
  const tela = raiz.querySelector("[data-orbita]");
  const ctx = tela.getContext("2d");
  let quadros = [], mascaras = [], ancoras = null, ultimoQ = -1, ultimaM = "";
  const carregarOrbita = (o) => {
    quadros = []; mascaras = []; ancoras = null;
    if (!o || reduzir) return;
    for (let i = 1; i <= o.n; i++) {
      const nn = String(i).padStart(3, "0");
      const im = new Image(); im.decoding = "async"; im.src = `${o.pasta}${nn}.${o.ext}`; quadros.push(im);
      const mk = new Image(); mk.src = `${o.mascaras}${nn}.png`; mascaras.push(mk);
    }
    fetch(`${o.mascaras}ancoras.json`).then((r) => r.json()).then((a) => { ancoras = a; }).catch(() => {});
  };
  const tras = raiz.querySelector("[data-tras]");
  const frente = raiz.querySelector("[data-frente]");
  const voo = raiz.querySelector("[data-voo]");
  const momentos = [...raiz.querySelectorAll(".momento")];

  // ── карточки: каждый сайт дважды, точки ровно по сфере
  const casos = (S.casos || []).slice(0, 6);
  const N = Math.min(24, casos.length * 4);
  const cartao = (c, heroi) => `
    <div class="esf-card${heroi ? " esf-card--heroi" : ""}">
      <div class="esf-f">
        <div class="esf-barra"><i></i><i></i><i></i></div>
        <div class="esf-tela"><img src="${esc(c.poster)}" alt="" loading="lazy" decoding="async">${heroi ? `<video muted loop playsinline preload="none" poster="${esc(c.poster)}"><source src="${esc(c.video)}" type="video/mp4"></video>` : ""}</div>
      </div>
      <div class="esf-v"><img src="${esc(c.poster)}" alt="" loading="lazy" decoding="async"></div>
    </div>`;
  const tmp = document.createElement("div");
  tmp.innerHTML = Array.from({ length: N }, (_, i) => cartao(casos[i % casos.length], i === 0)).join("");
  const cards = [...tmp.children];
  cards.forEach((el) => frente.appendChild(el));
  const vHeroi = cards[0].querySelector("video");
  // широты карточек: пояс на уровне лица пропускаем, чтобы лицо всегда было открыто
  const faixas = [-0.97, -0.9, -0.02, 0.12, 0.26, 0.4, 0.54, 0.68, 0.8, 0.92];
  const pontos = cards.map((_, i) => {
    const y = faixas[i % faixas.length], r = Math.sqrt(1 - y * y), t = i * 2.399963 + (i % 3) * 0.7;
    return { x: r * Math.cos(t), y, z: r * Math.sin(t), voa: 0.6 + ((i * 7919) % 100) / 100, gira: ((i * 104729) % 200) / 100 - 1 };
  });

  let G = null, G0 = null, W = 0, H = 0;
  // центр шара и радиус — от положения человека в кадре (якоря: доли кадра)
  const geo = (a) => {
    const { l, t, cw, ch, cel } = G0, ph = (a.pes - a.topo) * ch;
    return { ox: l + a.cx * cw, oy: t + (a.topo + 0.42 * (a.pes - a.topo)) * ch, R: ph * (cel ? 0.5 : 0.52) };
  };
  const medir = () => {
    W = raiz.clientWidth; H = innerHeight;
    const cel = celular(), c = cel ? CENA.v : CENA.h;
    if (!G || G.c !== c) {
      video.poster = c.poster; video.src = c.src;
      carregarOrbita(c.orbita); ultimoQ = -1;
      tras.style.webkitMaskImage = tras.style.maskImage = `url(${c.mascara})`;
      if (!reduzir) video.play().catch(() => {});
    }
    // кадр «cover»: заполняет экран, человек остаётся по центру
    let cw = Math.max(W, H * c.ar), ch = cw / c.ar, l = (W - cw) / 2, t = (H - ch) / 2;
    if (cel) {
      // телефон: кадр крупнее и поднят — человек в верхней части, внизу место под текст
      const topoH = (document.querySelector(".topo") || {}).offsetHeight || 0;
      ch = Math.max(ch, H * 1.25); cw = ch * c.ar; l = (W - cw) / 2;
      t = Math.min(0, Math.max(H - ch, topoH + 26 - c.topo * ch));
    }
    video.style.cssText = `left:${l}px;top:${t}px;width:${cw}px;height:${ch}px`;
    tela.style.cssText = video.style.cssText;
    const dpr = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr); ultimoQ = -1;
    const mask = `${cw}px ${ch}px`;
    tras.style.webkitMaskSize = tras.style.maskSize = mask;
    tras.style.webkitMaskPosition = tras.style.maskPosition = `${l}px ${t}px`;
    G0 = { l, t, cw, ch, cel };
    const { ox, oy, R } = geo(c);
    const cardW = R * (cel ? 0.36 : 0.34);
    raiz.style.setProperty("--card-w", cardW + "px");
    // куда подлетает сайт крупным планом
    const bigW = cel ? W * 0.9 : Math.min(W * 0.46, 760);
    const alvo = cel ? { x: W / 2, y: H * 0.3 } : { x: W * 0.64, y: H * 0.46 };
    G = { c, ox, oy, R, cardW, bigW, alvo, D: R * 3.2, l, t, cw, ch };
  };

  // спереди карточки почти смотрят на зрителя, сзади разворачиваются спиной — без скачков
  const virar = (y) => { const a = Math.abs(y), s = Math.sign(y); return a <= 90 ? y * 0.55 : s * (49.5 + (a - 90) * 1.45); };
  const progresso = () => lim(-raiz.getBoundingClientRect().top / ((raiz.offsetHeight - innerHeight) || 1));
  let t0 = performance.now(), visivel = true, ultimoP = -1;

  const desenhar = (agora) => {
    const p = progresso();
    let { ox, oy, R, cardW, bigW, alvo, D } = G;
    const temOrb = quadros.length > 0, fimO = temOrb ? 0.2 : 0;
    // камера облетает человека: шар поворачивается на тот же угол (камера с полубока → во фронт)
    const ang = temOrb ? -0.7 * (1 - seg(p, 0, fimO)) : 0;
    const giro = (reduzir ? 0.6 : (agora - t0) / 1000 * 0.22 + p * 3) + ang;
    if (temOrb && p < fimO && ancoras) {
      const qa = Math.round(seg(p, 0, fimO) * (quadros.length - 1)), a = ancoras[qa];
      if (a) { const g = geo(a); ox = g.ox; oy = g.oy; R = g.R; }
      const url = mascaras[qa] && mascaras[qa].src;
      if (url && url !== ultimaM) { tras.style.webkitMaskImage = tras.style.maskImage = `url(${url})`; ultimaM = url; }
    } else if (ultimaM !== G.c.mascara) { tras.style.webkitMaskImage = tras.style.maskImage = `url(${G.c.mascara})`; ultimaM = G.c.mascara; }
    // 1) облёт камеры: кадры листаются прокруткой (как в бургерной), в конце — живое видео
    const temOrbita = quadros.length > 0;
    const fimOrb = temOrbita ? 0.2 : 0;
    if (temOrbita) {
      const q = Math.round(seg(p, 0, fimOrb) * (quadros.length - 1));
      const im = quadros[q];
      if (q !== ultimoQ && im.complete && im.naturalWidth) { ctx.drawImage(im, 0, 0, tela.width, tela.height); ultimoQ = q; }
      tela.style.opacity = (1 - seg(p, fimOrb - 0.015, fimOrb + 0.02)).toFixed(3);
    } else tela.style.opacity = "0";
    // 2) карточки слетаются в шар, когда камера вышла во фронт
    const chega = 1;
    const ex = reduzir ? 0 : ease(seg(p, 0.4, 0.52)) * (1 - ease(seg(p, 0.84, 0.95)));     // разлёт
    const f = ease(seg(p, 0.48, 0.62)) * (1 - ease(seg(p, 0.82, 0.94)));                    // сайт к экрану
    // камера «наезжает» на человека, фон уходит в размытие
    const zoom = 1 + 0.1 * f;
    mundo.style.transform = `translate(${ox}px,${oy}px) scale(${zoom.toFixed(4)}) translate(${-ox}px,${-oy}px)`;
    mundo.style.filter = f > 0.01 ? `blur(${(7 * f).toFixed(2)}px) brightness(${(1 - 0.22 * f).toFixed(3)})` : "";
    const ca = Math.cos(giro), sa = Math.sin(giro), inc = 0.2, ci = Math.cos(inc), si = Math.sin(inc);

    cards.forEach((el, i) => {
      const q = pontos[i];
      // вращение шара вокруг вертикали + лёгкий наклон к зрителю
      let X = q.x * ca + q.z * sa, Z = -q.x * sa + q.z * ca, Y = q.y;
      const Y2 = Y * ci - Z * si; Z = Y * si + Z * ci; Y = Y2;
      const rr = R * (1 + ex * 2.6 * q.voa + (1 - chega) * 2.2 * q.voa);
      const k = D / (D - Z * R);   // глубина — по обычному радиусу, при разлёте карточки уходят в стороны, а не за камеру
      let sx = ox + X * rr * k, sy = oy + Y * rr * k, esc_ = k;
      let yaw = virar(Math.atan2(X, Z) * 57.3) + ex * q.gira * 160, pitch = -Y * 38 + ex * q.gira * 90;
      let atras = Z < 0, op = (1 - ex * 0.15) * chega;
      if (i === 0 && f > 0.001) {
        // стартовая точка — с учётом наезда камеры
        const bx = ox + (sx - ox) * zoom, by = oy + (sy - oy) * zoom;
        sx = mix(bx, alvo.x, f); sy = mix(by, alvo.y, f);
        esc_ = mix(k * zoom, bigW / cardW, f);
        yaw = mix(((yaw + 540) % 360) - 180, 0, f); pitch = mix(pitch, 0, f);
        atras = false; op = 1;
        if (el.parentNode !== voo) voo.appendChild(el);
      } else {
        const alvoCam = atras ? tras : frente;
        if (el.parentNode !== alvoCam) alvoCam.appendChild(el);
      }
      el.style.transform = `translate(${(sx - cardW / 2).toFixed(1)}px,${(sy - cardW * 0.25).toFixed(1)}px) scale(${esc_.toFixed(4)}) perspective(900px) rotateY(${yaw.toFixed(1)}deg) rotateX(${pitch.toFixed(1)}deg)`;
      el.style.zIndex = String(500 + Math.round(Z * 100));
      el.style.opacity = op.toFixed(3);
      el.classList.toggle("esf-fundo", atras);
    });

    if (vHeroi && p !== ultimoP) {
      if (f > 0.5 && !reduzir) {
        if (vHeroi.preload === "none") { vHeroi.preload = "auto"; vHeroi.load(); }
        if (vHeroi.paused) vHeroi.play().catch(() => {});
        cards[0].classList.add("vivo");
      } else { if (!vHeroi.paused) vHeroi.pause(); cards[0].classList.remove("vivo"); }
    }
    momentos.forEach((m) => {
      const de = +m.dataset.de, ate = +m.dataset.ate;
      m.classList.toggle("ativo", p >= de && (p < ate || ate >= 1));
    });
    raiz.classList.toggle("andou", p > 0.02);
    ultimoP = p;
  };

  const tick = (agora) => {
    if (visivel) desenhar(agora);
    requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (!visivel) video.pause(); else if (!reduzir) video.play().catch(() => {});
  }).observe(raiz);
  addEventListener("resize", () => { medir(); desenhar(performance.now()); });
  medir();
  desenhar(performance.now());
  if (reduzir) addEventListener("scroll", () => desenhar(performance.now()), { passive: true });
  else requestAnimationFrame(tick);
})();
