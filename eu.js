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
  // РАССТАНОВКА ПО РЕФЕРЕНСУ (source/hero2/ref_orbita.mp4, кадр 1, 720×1280):
  // центр шара (362,628), радиус 305 px; [x, y, размер, сторона: 1 — к зрителю, −1 — за спиной]
  const REF = { cx: 362, cy: 628, r: 305 };
  const MAPA = [
    [318, 345, .8, 1], [428, 350, .8, 1], [250, 372, .6, -1], [500, 380, .6, -1], [560, 372, .6, 1],
    [195, 435, 1.4, 1], [130, 470, .7, 1], [258, 490, .7, -1], [180, 540, .6, -1], [215, 585, .8, 1],
    [85, 560, .8, 1], [125, 640, 1.3, 1], [65, 700, .7, 1], [150, 700, .6, -1],
    [190, 755, 1, 1], [130, 770, .7, 1], [165, 850, .8, 1], [220, 880, .7, 1],
    [275, 865, 1.1, 1], [355, 885, .9, 1], [430, 900, .9, 1], [510, 905, .8, 1], [300, 925, .6, 1],
    [455, 790, .8, -1], [505, 790, .9, 1], [565, 790, 1, 1], [610, 790, .7, 1], [560, 860, .7, 1],
    [545, 455, 1.1, 1], [590, 620, 1.2, 1], [625, 510, .7, 1], [655, 640, .9, 1], [665, 560, .6, 1],
    [640, 720, .7, 1], [485, 520, .7, -1], [525, 655, .7, -1], [600, 420, .6, 1],
    [330, 550, .8, -1], [400, 600, .8, -1], [360, 720, .8, -1],
  ];
  // задняя половина шара (в референсе видна сквозь просветы): зеркальные копии передних точек
  MAPA.filter((m) => m[3] > 0).forEach(([x, y, t]) => MAPA.push([2 * REF.cx - x, y + 14, t * 0.85, -1]));
  const N = MAPA.length;
  const HEROI = 9;   // карточка слева у груди — она потом и «приземляется» перед человеком
  const cartao = (c, heroi) => `
    <div class="esf-card${heroi ? " esf-card--heroi" : ""}">
      <div class="esf-f">
        <div class="esf-barra"><i></i><i></i><i></i></div>
        <div class="esf-tela"><img src="${esc(c.poster)}" alt="" decoding="async">${heroi ? `<video muted loop playsinline preload="none" poster="${esc(c.poster)}"><source src="${esc(c.video)}" type="video/mp4"></video>` : ""}</div>
      </div>
      <div class="esf-v"><img src="${esc(c.poster)}" alt="" decoding="async"></div>
    </div>`;
  const tmp = document.createElement("div");
  tmp.innerHTML = Array.from({ length: N }, (_, i) => cartao(casos[i === HEROI ? 0 : (i + 1) % casos.length], i === HEROI)).join("");
  const cards = [...tmp.children];
  cards.forEach((el) => frente.appendChild(el));
  // постоянные копии для слоя «за спиной» — карточки не переносятся между слоями (иначе на телефоне моргают)
  const tmpT = document.createElement("div");
  tmpT.innerHTML = Array.from({ length: N }, (_, i) => cartao(casos[i % casos.length], false)).join("");
  const cardsT = [...tmpT.children];
  cardsT.forEach((el) => { el.classList.add("esf-fundo"); el.style.opacity = "0"; tras.appendChild(el); });
  // силуэт поверх карточек «за спиной» во время облёта (рисуется вместе с кадром — без смены масок)
  const pessoa = raiz.querySelector("[data-pessoa]");
  const ctxP = pessoa.getContext("2d");
  const vHeroi = cards[HEROI].querySelector("video");
  // экранные точки референса → точки на сфере (глубина — по стороне: к зрителю или за спиной)
  const pontos = MAPA.map(([px, py, tam, lado], i) => {
    let x = (px - REF.cx) / REF.r, y = (py - REF.cy) / REF.r;
    const d = Math.hypot(x, y); if (d > 0.985) { x *= 0.985 / d; y *= 0.985 / d; }
    const z = lado * Math.sqrt(Math.max(0, 1 - x * x - y * y));
    const h = (n) => ((i * n) % 1000) / 1000;
    // разлёт (референс, кадр 54): облако в пределах ~2 радиусов, кувырок, часть карточек падает на пол
    return { x, y, z, tam, voa: 0.18 + 0.5 * h(7919), gira: h(104729) * 2 - 1, cai: h(6007) < 0.22 ? 1 : 0 };
  });

  let G = null, G0 = null, W = 0, H = 0;
  // центр шара и радиус — от положения человека в кадре (якоря: доли кадра)
  const geo = (a) => {
    const { l, t, cw, ch, cel } = G0, ph = (a.pes - a.topo) * ch;
    // референс: центр шара на 0.31 роста от макушки (грудь), радиус 0.445 роста
    return { ox: l + a.cx * cw, oy: t + (a.topo + 0.31 * (a.pes - a.topo)) * ch, R: ph * 0.445 };
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
      // как в референсе: человек ≈ половина высоты экрана, шар целиком помещается
      ch = Math.max(ch, H * 1.0); cw = ch * c.ar; l = (W - cw) / 2;
      t = Math.min(0, Math.max(H - ch, topoH + 26 - c.topo * ch));
    }
    video.style.cssText = `left:${l}px;top:${t}px;width:${cw}px;height:${ch}px`;
    tela.style.cssText = video.style.cssText;
    const dpr = Math.min(2, devicePixelRatio || 1);
    tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr); ultimoQ = -1;
    pessoa.style.cssText = tela.style.cssText; pessoa.width = tela.width; pessoa.height = tela.height;
    const mask = `${cw}px ${ch}px`;
    tras.style.webkitMaskSize = tras.style.maskSize = mask;
    tras.style.webkitMaskPosition = tras.style.maskPosition = `${l}px ${t}px`;
    G0 = { l, t, cw, ch, cel };
    const { ox, oy, R } = geo(c);
    const cardW = R * 0.4;
    raiz.style.setProperty("--card-w", cardW + "px");
    // куда подлетает сайт крупным планом
    const bigW = cel ? W * 0.9 : Math.min(W * 0.46, 760);
    const alvo = cel ? { x: W / 2, y: H * 0.3 } : { x: W * 0.64, y: H * 0.46 };
    G = { c, ox, oy, R, cardW, bigW, alvo, D: R * 3.2, l, t, cw, ch };
    // надпись «Сайт — первое, что видит клиент» — сразу под подлетевшим сайтом (телефон) / рядом по центру (компьютер)
    const mB = raiz.querySelector(".eu-m--b");
    if (mB) {
      const bigH = bigW * 562 / 1280 + 24;
      if (cel) {
        // сайт и надпись — одной группой по центру экрана под шапкой
        const topoH = (document.querySelector(".topo") || {}).offsetHeight || 0;
        const grupo = bigH + 18 + mB.offsetHeight;
        alvo.y = topoH + Math.max(12, (H - topoH - grupo) / 2) + bigH / 2;
        mB.style.top = Math.round(alvo.y + bigH / 2 + 18) + "px"; mB.style.bottom = "auto";
      }
      else { mB.style.top = Math.round(alvo.y - mB.offsetHeight / 2) + "px"; mB.style.bottom = "auto"; }
    }
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
    const giro = (reduzir ? 0.6 : Math.sin((agora - t0) / 1000 * 0.6) * 0.04 + seg(p, fimO, fimO + 0.42) * 0.35) + ang;   // как в референсе: за весь ролик шар поворачивается ≈20°, окно у лица остаётся открытым
    if (temOrb && p < fimO && ancoras) {
      const qa = Math.round(seg(p, 0, fimO) * (quadros.length - 1)), a = ancoras[qa];
      if (a) { const g = geo(a); ox = g.ox; oy = g.oy; R = g.R; }
      if (ultimaM !== "none") { tras.style.webkitMaskImage = tras.style.maskImage = "none"; ultimaM = "none"; }
    }
    pessoa.style.opacity = temOrb && p < fimO ? tela.style.opacity : "0";
    if ((!temOrb || p >= fimO) && ultimaM !== G.c.mascara) { tras.style.webkitMaskImage = tras.style.maskImage = `url(${G.c.mascara})`; ultimaM = G.c.mascara; }
    // 1) облёт камеры: кадры листаются прокруткой (как в бургерной), в конце — живое видео
    const temOrbita = quadros.length > 0;
    const fimOrb = temOrbita ? 0.2 : 0;
    if (temOrbita) {
      const q = Math.round(seg(p, 0, fimOrb) * (quadros.length - 1));
      const im = quadros[q];
      if (q !== ultimoQ && im.complete && im.naturalWidth) {
        ctx.drawImage(im, 0, 0, tela.width, tela.height); ultimoQ = q;
        const mk = mascaras[q];
        if (mk && mk.complete && mk.naturalWidth) {
          ctxP.globalCompositeOperation = "copy"; ctxP.drawImage(im, 0, 0, pessoa.width, pessoa.height);
          ctxP.globalCompositeOperation = "destination-out"; ctxP.drawImage(mk, 0, 0, pessoa.width, pessoa.height);
          ctxP.globalCompositeOperation = "source-over";
        }
      }
      tela.style.opacity = (1 - seg(p, fimOrb - 0.002, fimOrb + 0.002)).toFixed(3);   // почти мгновенная смена — без ореола от наложения
    } else tela.style.opacity = "0";
    // 2) карточки — покадрово по референсу (77 кадров): прокрутка после облёта = номер кадра
    //    0–34 шар стоит · 36–54 разлёт · 56–66 сборка, сайт ложится перед грудью · 66–76 шар чуть шире
    const fr = reduzir ? 76 : seg(p, fimO, fimO + 0.42) * 76;
    const ex = reduzir ? 0 : ease(seg(fr, 36, 54)) * (1 - ease(seg(fr, 56, 66)));
    const f = ease(seg(fr, 56, 68));                         // сайт ложится перед грудью
    const largo = 1 + 0.1 * ease(seg(fr, 58, 70));           // после сборки шар на 10% шире
    // затем — крупный подлёт сайта к экрану (как было), и обратно к груди
    const g = reduzir ? 0 : ease(seg(p, 0.6, 0.68)) * (1 - ease(seg(p, 0.84, 0.94)));
    // как в прошлой версии: камера «наезжает», фон уходит в размытие — в фокусе только сайт и подпись
    const zoom = 1 + 0.1 * g;
    mundo.style.transform = g > 0.001 ? `translate(${ox}px,${oy}px) scale(${zoom.toFixed(4)}) translate(${-ox}px,${-oy}px)` : "";
    mundo.style.filter = g > 0.01 ? `blur(${(7 * g).toFixed(2)}px) brightness(${(1 - 0.22 * g).toFixed(3)})` : "";
    const ca = Math.cos(giro), sa = Math.sin(giro), inc = 0.12, ci = Math.cos(inc), si = Math.sin(inc);

    cards.forEach((el, i) => {
      const q = pontos[i];
      // вращение шара вокруг вертикали + лёгкий наклон (камера чуть выше груди)
      let X = q.x * ca + q.z * sa, Z = -q.x * sa + q.z * ca, Y = q.y;
      const Y2 = Y * ci - Z * si; Z = Y * si + Z * ci; Y = Y2;
      const rr = R * largo * (1 + ex * q.voa);
      const k = D / (D - Z * R);
      let sx = ox + X * rr * k, sy = oy + Y * rr * k + q.cai * ex * R * 1.3, esc_ = k * q.tam;
      // карточки лежат по касательной к шару (как в референсе): на краях — ребром
      let yaw = Math.atan2(X, Z) * 57.3 + ex * q.gira * 170;
      let pitch = -Math.atan2(Y, Math.hypot(X, Z)) * 57.3 + ex * q.gira * 110;
      let roll = ex * q.gira * 130;
      let atras = Z < 0, op = 1;
      if (i === HEROI && f > 0.001) {
        // референс, кадр 74: карточка у груди слева, ширина 0.78 R, наклон −28°
        sx = mix(sx, ox - 0.19 * R, f); sy = mix(sy, oy - 0.06 * R, f);
        esc_ = mix(esc_, 0.78 / 0.4, f);
        yaw = mix(((yaw + 540) % 360) - 180, 12, f); pitch = mix(((pitch + 540) % 360) - 180, 0, f); roll = mix(roll, -28, f);
        if (g > 0.001) {   // от груди — крупно к экрану
          sx = mix(sx, alvo.x, g); sy = mix(sy, alvo.y, g); esc_ = mix(esc_, bigW / cardW, g);
          yaw = mix(yaw, 0, g); pitch = mix(pitch, 0, g); roll = mix(roll, 0, g);
        }
        atras = false;
        if (el.parentNode !== voo) voo.appendChild(el);
      } else if (el.parentNode !== frente) frente.appendChild(el);
      const tr = `translate(${(sx - cardW / 2).toFixed(1)}px,${(sy - cardW * 0.25).toFixed(1)}px) scale(${esc_.toFixed(4)}) perspective(900px) rotateZ(${roll.toFixed(1)}deg) rotateY(${yaw.toFixed(1)}deg) rotateX(${pitch.toFixed(1)}deg)`;
      const zi = String(500 + Math.round(Z * 100)), t2 = cardsT[i];
      el.style.transform = tr; el.style.zIndex = zi;
      el.style.opacity = atras ? "0" : op.toFixed(3);
      if (t2) { t2.style.transform = tr; t2.style.zIndex = zi; t2.style.opacity = atras ? op.toFixed(3) : "0"; }
    });

    if (vHeroi && p !== ultimoP) {
      if (f > 0.5 && !reduzir) {
        if (vHeroi.preload === "none") { vHeroi.preload = "auto"; vHeroi.load(); }
        if (vHeroi.paused) vHeroi.play().catch(() => {});
        cards[HEROI].classList.add("vivo");
      } else { if (!vHeroi.paused) vHeroi.pause(); cards[HEROI].classList.remove("vivo"); }
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
